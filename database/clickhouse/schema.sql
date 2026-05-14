-- ClickHouse Schema for SentinelX SIEM Logs

CREATE TABLE IF NOT EXISTS default.logs (
    tenant_id       String,
    id              UUID,
    timestamp       DateTime64(3, 'UTC'),
    source          LowCardinality(String),
    event_type      LowCardinality(String),
    severity        LowCardinality(String),
    hostname        String,
    user_field      String,
    source_ip       IPv4,
    destination_ip  IPv4,
    action          String,
    raw             String,    -- JSON string for raw event
    normalized      String,    -- JSON string for normalized event
    ingested_at     DateTime64(3, 'UTC') DEFAULT now64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, timestamp, source)
TTL timestamp + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;
