import asyncio
import json
from confluent_kafka import Consumer, KafkaError
from typing import Callable, List
import structlog
from backend.shared.config import settings

logger = structlog.get_logger()

class AsyncKafkaConsumer:
    def __init__(self, group_id: str, topics: List[str]):
        conf = {
            'bootstrap.servers': settings.KAFKA_BROKERS,
            'group.id': group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False
        }
        self.consumer = Consumer(conf)
        self.consumer.subscribe(topics)
        self.topics = topics
        self._loop = asyncio.get_event_loop()
        self.running = False

    async def start(self, handler: Callable[[dict, str], None]):
        self.running = True
        logger.info(f"Starting consumer for topics {self.topics}")
        
        # Run in executor to not block event loop
        await self._loop.run_in_executor(None, self._consume_loop, handler)

    def _consume_loop(self, handler: Callable[[dict, str], None]):
        while self.running:
            msg = self.consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    logger.error(f"Consumer error: {msg.error()}")
                    continue

            try:
                value = json.loads(msg.value().decode('utf-8'))
                key = msg.key().decode('utf-8') if msg.key() else None
                # Call handler synchronously in the thread
                # To be purely async, handler should be async, and we'd call asyncio.run_coroutine_threadsafe
                # For simplicity in this scaffold, we assume handler is a normal function or we schedule it
                
                # Scheduling an async handler from sync loop:
                if asyncio.iscoroutinefunction(handler):
                    asyncio.run_coroutine_threadsafe(handler(value, key), self._loop)
                else:
                    handler(value, key)
                    
                self.consumer.commit(asynchronous=True)
            except Exception as e:
                logger.error(f"Error processing message: {e}")

    def stop(self):
        self.running = False
        self.consumer.close()
