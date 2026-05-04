import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import LokiTransport from 'winston-loki';

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
  
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('OmniStream Notify API')
    .setDescription('Микросервис для отправки уведомлений через RabbitMQ')
    .setVersion('1.0')
    .addTag('notifications')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Документация будет по адресу /api

  await app.listen(3000);
  console.log(`API запущен на: http://localhost:3000/api`); }
bootstrap();
