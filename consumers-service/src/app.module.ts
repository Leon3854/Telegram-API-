import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisProvider } from './providers/redis.provider';
import { TelegramProvider } from './providers/telegram.provider';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
	// Не нужен ClientsModule, он сам является "клиентом" для Кролика через main.ts
  imports: [
		PrometheusModule.register(), // Это создаст эндпоинт /metrics автоматически
	],
  controllers: [AppController],
  providers: [AppService, RedisProvider, TelegramProvider],
})
export class AppModule {}
