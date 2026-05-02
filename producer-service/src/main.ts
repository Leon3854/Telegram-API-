import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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
