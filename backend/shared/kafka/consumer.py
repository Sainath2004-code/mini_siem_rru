import asyncio
import json
from confluent_kafka import Consumer, KafkaError
from typing import Callable, List, Any, Coroutine
import structlog
from backend.shared.config import settings
from backend.shared.kafka.producer import kafka_producer

logger = structlog.get_logger()

class AsyncKafkaConsumer:
    def __init__(self, group_id: str, topics: List[str]):
        conf = {
            'bootstrap.servers': settings.KAFKA_BROKERS,
            'group.id': group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False,
            'session.timeout.ms': 45000,
            'max.poll.interval.ms': 300000,
        }
        self.consumer = Consumer(conf)
        self.consumer.subscribe(topics)
        self.topics = topics
        self._loop = asyncio.get_event_loop()
        self.running = False

    async def start(self, handler: Callable[[dict, str], Coroutine[Any, Any, None]]):
        """Starts the consumption loop. Handler should be an async function."""
        self.running = True
        logger.info("Starting consumer", topics=self.topics, group_id=self.consumer.member_id())
        
        # Run in executor to not block event loop
        await self._loop.run_in_executor(None, self._consume_loop, handler)

    def _consume_loop(self, handler: Callable[[dict, str], Coroutine[Any, Any, None]]):
        while self.running:
            msg = self.consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    logger.error("Consumer error", error=str(msg.error()))
                    continue

            try:
                topic = msg.topic()
                value = json.loads(msg.value().decode('utf-8'))
                key = msg.key().decode('utf-8') if msg.key() else None
                
                # Execute async handler
                future = asyncio.run_coroutine_threadsafe(handler(value, key), self._loop)
                
                # Wait for result with timeout
                try:
                    future.result(timeout=60)
                    self.consumer.commit(asynchronous=True)
                except Exception as handler_err:
                    logger.error("Handler failed, routing to DLQ", error=str(handler_err), topic=topic)
                    # Route to DLQ (using the same topic + -dlq suffix)
                    asyncio.run_coroutine_threadsafe(
                        kafka_producer.produce_dlq(topic, value, str(handler_err), key=key),
                        self._loop
                    )
                    # We still commit because we moved it to DLQ
                    self.consumer.commit(asynchronous=True)
                    
            except Exception as e:
                logger.error("Error in consumption loop", error=str(e))

    def stop(self):
        self.running = False
        self.consumer.close()
