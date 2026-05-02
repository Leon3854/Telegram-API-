import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisProvider } from './providers/redis.provider';
import { TelegramProvider } from './providers/telegram.provider';

@Module({
	// Не нужен ClientsModule, он сам является "клиентом" для Кролика через main.ts
  imports: [],
  controllers: [AppController],
  providers: [AppService, RedisProvider, TelegramProvider],
})
export class AppModule {}
