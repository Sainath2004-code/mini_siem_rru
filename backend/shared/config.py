from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # App
    ENV: str = Field(default="development")
    LOG_LEVEL: str = Field(default="INFO")
    
    # Supabase
    SUPABASE_URL: str = Field(default="http://localhost:54321")
    SUPABASE_SERVICE_KEY: str = Field(default="")
    SUPABASE_JWT_SECRET: str = Field(default="")
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6479/0")
    
    # Kafka
    KAFKA_BROKERS: str = Field(default="localhost:29192")
    KAFKA_CONSUMER_GROUP_PARSER: str = Field(default="parser-group")
    KAFKA_CONSUMER_GROUP_DETECTION: str = Field(default="detection-group")
    
    # ClickHouse
    CLICKHOUSE_HOST: str = Field(default="localhost")
    CLICKHOUSE_PORT: int = Field(default=9123)
    CLICKHOUSE_USER: str = Field(default="default")
    CLICKHOUSE_PASSWORD: str = Field(default="")
    CLICKHOUSE_DB: str = Field(default="sentinelx")
    
    # AI
    OPENAI_API_KEY: str = Field(default="")
    OPENAI_MODEL: str = Field(default="gpt-4o")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
