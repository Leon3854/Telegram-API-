import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { Telegraf } from 'telegraf';
import Redis from 'ioredis';
import { RedisProvider } from './providers/redis.provider';
import { TelegramProvider } from './providers/telegram.provider';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly bot: Telegraf;
  private readonly redis: Redis;

  constructor(
		private readonly redisProvider: RedisProvider,
  	private readonly telegramProvider: TelegramProvider,
	) {}

	async handleNotification(data: SendNotificationDto) {
    const { messageId, text, targetId } = data;

    // ИСПОЛЬЗУЕМ ПРОВАЙДЕР (было this.redis.set)
    const isDuplicate = await this.redisProvider.isDuplicate(messageId);

    if (isDuplicate) {
      this.logger.warn(`⚠️ Сообщение ${messageId} — дубликат. Пропускаем.`);
      return { status: 'duplicate' };
    }

    try {
      // ИСПОЛЬЗУЕМ ПРОВАЙДЕР (было this.bot.telegram.sendMessage)
      await this.telegramProvider.sendMessage(targetId, text);
      this.logger.log(`🚀 Сообщение ${messageId} доставлено в Telegram`);
      
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки: ${error.message}`);
      await this.redisProvider.removeLock(messageId);
      throw error; 
    }
  }
}
