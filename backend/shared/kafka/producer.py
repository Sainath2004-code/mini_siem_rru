import json
import asyncio
from confluent_kafka import Producer
from backend.shared.config import settings
import structlog

logger = structlog.get_logger()

class AsyncKafkaProducer:
    def __init__(self):
        conf = {
            'bootstrap.servers': settings.KAFKA_BROKERS,
            'client.id': 'sentinelx-producer',
            'linger.ms': 10,
            'batch.num.messages': 10000,
            'queue.buffering.max.messages': 100000
        }
        self.producer = Producer(conf)
        self._loop = asyncio.get_event_loop()
    
    def _delivery_report(self, err, msg):
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}]")

    async def produce(self, topic: str, value: dict, key: str = None):
        try:
            value_bytes = json.dumps(value).encode('utf-8')
            key_bytes = key.encode('utf-8') if key else None
            
            # Run in executor to not block event loop
            await self._loop.run_in_executor(
                None,
                self._produce_sync,
                topic,
                value_bytes,
                key_bytes
            )
        except Exception as e:
            logger.error(f"Failed to produce message: {e}")
            raise
            
    def _produce_sync(self, topic: str, value: bytes, key: bytes):
        self.producer.produce(
            topic=topic,
            value=value,
            key=key,
            callback=self._delivery_report
        )
        self.producer.poll(0)
        
    def flush(self):
        self.producer.flush()

# Singleton instance
kafka_producer = AsyncKafkaProducer()
