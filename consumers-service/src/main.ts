import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // Создаем НЕ обычное приложение, а Микросервис
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
      queue: 'telegram_queue', // Должно СТРОГО совпадать с Producer
      noAck: false,           // ВАЖНО для ручного подтверждения (ack)
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.listen();
  console.log('Consumer (Telegram Worker) запущен и слушает RabbitMQ...');
}
bootstrap();
