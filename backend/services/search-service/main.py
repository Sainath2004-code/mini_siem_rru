from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import structlog
import time
from typing import List, Dict, Any, Optional
import clickhouse_connect

from backend.shared.config import settings
from backend.shared.search.parser import sxql_parser

logger = structlog.get_logger()

app = FastAPI(title="SentinelX Search Service")

# ClickHouse Client
ch_client = clickhouse_connect.get_client(
    host=settings.CLICKHOUSE_HOST,
    port=settings.CLICKHOUSE_PORT,
    username=settings.CLICKHOUSE_USER,
    password=settings.CLICKHOUSE_PASSWORD,
    database=settings.CLICKHOUSE_DB
)

class SearchQuery(BaseModel):
    query: str
    time_range_start: Optional[str] = None
    time_range_end: Optional[str] = None
    limit: int = 100
    offset: int = 0

@app.post("/search/logs")
async def search_logs(query_payload: SearchQuery, x_tenant_id: str = Header(...)):
    """Executes a SIEM search query against ClickHouse."""
    start_time = time.time()
    
    # 1. Translate Query
    where_clause = sxql_parser.translate_to_sql(query_payload.query, x_tenant_id)
    
    # 2. Add time constraints
    if query_payload.time_range_start:
        where_clause += f" AND timestamp >= '{query_payload.time_range_start}'"
    if query_payload.time_range_end:
        where_clause += f" AND timestamp <= '{query_payload.time_range_end}'"

    # 3. Execute in ClickHouse
    sql = f"""
        SELECT * FROM logs 
        WHERE {where_clause} 
        ORDER BY timestamp DESC 
        LIMIT {query_payload.limit} 
        OFFSET {query_payload.offset}
    """
    
    try:
        res = ch_client.query(sql)
        results = [dict(zip(res.column_names, row)) for row in res.result_rows]
        
        return {
            "results": results,
            "total": len(results), # In production, we'd do a separate COUNT(*) or estimate
            "query_sql": sql,
            "latency_ms": int((time.time() - start_time) * 1000)
        }
    except Exception as e:
        logger.error("Search failed", error=str(e), sql=sql)
        raise HTTPException(status_code=400, detail=f"Query failed: {str(e)}")

@app.post("/search/aggregate")
async def aggregate_logs(query_payload: SearchQuery, x_tenant_id: str = Header(...)):
    """Provides time-series aggregations for visualizations."""
    where_clause = sxql_parser.translate_to_sql(query_payload.query, x_tenant_id)
    
    # 10-minute buckets (configurable)
    sql = f"""
        SELECT 
            toStartOfInterval(timestamp, INTERVAL 10 MINUTE) as bucket,
            count(*) as count,
            severity
        FROM logs 
        WHERE {where_clause}
        GROUP BY bucket, severity
        ORDER BY bucket ASC
    """
    
    try:
        res = ch_client.query(sql)
        buckets = [dict(zip(res.column_names, row)) for row in res.result_rows]
        return {
            "buckets": buckets,
            "latency_ms": 10
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok", "clickhouse": "connected"}
