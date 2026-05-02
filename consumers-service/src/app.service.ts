import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { Telegraf } from 'telegraf';
import Redis from 'ioredis';
import { RedisProvider } from './providers/redis.provider';
import { TelegramProvider } from './providers/telegram.provider';

/**
 * Сервис обработки уведомлений.
 * Отвечает за координацию между хранилищем идемпотентности и транспортом доставки.
 */
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly bot: Telegraf;
  private readonly redis: Redis;

  constructor(
		private readonly redisProvider: RedisProvider,
  	private readonly telegramProvider: TelegramProvider,
	) {}

	/**
   * Основной бизнес-метод обработки события из очереди RabbitMQ.
   * 
   * Архитектурные особенности:
   * 1. Идемпотентность: Проверка UUID через Redis (NX lock).
   * 2. Отказоустойчивость: Очистка лока при ошибке внешнего API для обеспечения ретраев.
   * 
   * @param {SendNotificationDto} data - Объект события с messageId, текстом и ID чата.
   * @returns {Promise<{status: string}>} Результат обработки (ok / duplicate).
   * @throws {Error} Выбрасывает ошибку при сбое Telegram API для запуска механизма ретраев в RMQ.
   */
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
