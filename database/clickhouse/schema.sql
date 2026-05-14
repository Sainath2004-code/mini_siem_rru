-- ClickHouse Schema for SentinelX SIEM Logs

CREATE TABLE IF NOT EXISTS sentinelx.logs (
    id              UUID,
    tenant_id       LowCardinality(String),
    timestamp       DateTime64(3, 'UTC'),
    ingested_at     DateTime64(3, 'UTC') DEFAULT now64(3, 'UTC'),
    
    event_type      LowCardinality(String),
    event_category  LowCardinality(String),
    severity        LowCardinality(String),
    severity_score  UInt8,
    
    source          LowCardinality(String),
    source_type     LowCardinality(String),
    
    host_name       String,
    source_ip       String, -- Store as string to handle IPv4/IPv6 easily or use IPv6 type
    destination_ip  String,
    user_name       String,
    
    raw             String CODEC(ZSTD(19)),
    normalized      String CODEC(ZSTD(19)),
    geoip           String CODEC(ZSTD(19)), -- JSON string
    
    tags            Array(String),
    mitre_tactics   Array(String)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, timestamp, severity, event_type)
TTL timestamp + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;
