import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import * as winston from 'winston';
import LokiTransport from 'winston-loki';
import { WinstonModule } from 'nest-winston';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new LokiTransport({
          host: 'http://loki:3100',
          labels: { app: 'producer-service' }, // В консьюмере напиши 'consumers-service'
          json: true,
          format: winston.format.json(),
          replaceTimestamp: true,
          onConnectionError: (err) => console.error(err)
        }),
      ],
    }),
  });
  // 2. Подключаем к нему микросервис RabbitMQ
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672'],
      queue: 'telegram_queue',
      noAck: false,
      queueOptions: { durable: true },
    },
  });

	// Микросервис gRPC (добавляем)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'notification',
      protoPath: join(process.cwd(), 'proto/notification.proto'),
      url: '0.0.0.0:50051',
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000); // Теперь консьюмер тоже слушает 3000 порт для метрик
  console.log('🤖 Consumer is hybrid: RMQ + HTTP (metrics) on port 3000');
}

bootstrap();
