import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisProvider } from './providers/redis.provider';
import { TelegramProvider } from './providers/telegram.provider';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { GrpcController } from './grpc.controller';

@Module({
	// Не нужен ClientsModule, он сам является "клиентом" для Кролика через main.ts
  imports: [
		PrometheusModule.register(), // Это создаст эндпоинт /metrics автоматически
	],
  controllers: [AppController, GrpcController],
  providers: [AppService, RedisProvider, TelegramProvider],
})
export class AppModule {}
