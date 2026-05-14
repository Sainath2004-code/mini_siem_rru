import json
import asyncio
from confluent_kafka import Producer, KafkaException
from backend.shared.config import settings
import structlog
import time

logger = structlog.get_logger()

class AsyncKafkaProducer:
    def __init__(self):
        conf = {
            'bootstrap.servers': settings.KAFKA_BROKERS,
            'client.id': 'sentinelx-producer',
            'linger.ms': 10,
            'batch.num.messages': 10000,
            'queue.buffering.max.messages': 100000,
            'retries': 5,
            'retry.backoff.ms': 100,
            'acks': 'all'
        }
        self.producer = Producer(conf)
        self._loop = asyncio.get_event_loop()
    
    def _delivery_report(self, err, msg):
        if err is not None:
            logger.error("Message delivery failed", error=str(err), topic=msg.topic())
        else:
            logger.debug("Message delivered", topic=msg.topic(), partition=msg.partition(), offset=msg.offset())

    async def produce(self, topic: str, value: dict, key: str = None, headers: dict = None):
        """Async wrapper for producing messages with retries."""
        try:
            value_bytes = json.dumps(value).encode('utf-8')
            key_bytes = key.encode('utf-8') if key else None
            
            # headers must be a list of tuples
            kafka_headers = None
            if headers:
                kafka_headers = [(k, v.encode('utf-8') if isinstance(v, str) else v) for k, v in headers.items()]

            # Run in executor to not block event loop
            await self._loop.run_in_executor(
                None,
                self._produce_sync,
                topic,
                value_bytes,
                key_bytes,
                kafka_headers
            )
        except Exception as e:
            logger.error("Failed to produce message", error=str(e), topic=topic)
            raise
            
    def _produce_sync(self, topic: str, value: bytes, key: bytes, headers: list):
        self.producer.produce(
            topic=topic,
            value=value,
            key=key,
            headers=headers,
            callback=self._delivery_report
        )
        self.producer.poll(0)
        
    async def produce_dlq(self, original_topic: str, value: dict, error_msg: str, key: str = None):
        """Special method to route failed events to DLQ."""
        dlq_topic = f"{original_topic}-dlq"
        headers = {
            "error": error_msg,
            "original_topic": original_topic,
            "failed_at": str(time.time())
        }
        logger.warning(f"Routing event to DLQ", topic=dlq_topic, original_topic=original_topic)
        await self.produce(dlq_topic, value, key=key, headers=headers)

    def flush(self):
        self.producer.flush()

# Singleton instance
kafka_producer = AsyncKafkaProducer()
