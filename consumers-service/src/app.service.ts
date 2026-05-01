import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { Telegraf } from 'telegraf';
import Redis from 'ioredis';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly bot: Telegraf;
  private readonly redis: Redis;

  constructor() {
		const token = process.env.TELEGRAM_BOT_TOKEN;
		if (!token) {
			throw new Error('TELEGRAM_BOT_TOKEN must be defined in .env');
		}
    this.bot = new Telegraf(token);
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  async handleNotification(data: SendNotificationDto) {
    const { messageId, text, targetId } = data;

    // 1. ПРОВЕРКА НА ДУБЛИКАТЫ (Идемпотентность через Redis)
    const isProcessed = await this.redis.set(
      `msg:${messageId}`, 
      'processed', 
      'EX', 
      86400,
			'NX' 
    );

    if (!isProcessed) {
      this.logger.warn(`Сообщение ${messageId} уже обрабатывалось. Пропускаем.`);
      return { status: 'duplicate' };
    }

    try {
      // 2. ОТПРАВКА В TELEGRAM
      await this.bot.telegram.sendMessage(targetId, text);
      this.logger.log(`Сообщение ${messageId} успешно отправлено в Telegram`);
      
      return { status: 'ok', id: messageId };
    } catch (error) {
      this.logger.error(`Ошибка Telegram API: ${error.message}`);
      // Если упало — удаляем из редиса, чтобы ретрай от Продусера мог пройти снова
      await this.redis.del(`msg:${messageId}`);
      throw error;
    }
  }
}
