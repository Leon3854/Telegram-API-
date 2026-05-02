import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SendNotificationDto } from './dto/send-notification.dto';
import { timeout, retry, lastValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @Inject('RMQ_SERVICE') private readonly client: ClientProxy,
  ) {}

  async sendToQueue(data: SendNotificationDto) {
    this.logger.log(`Отправка сообщения в очередь: ${data.messageId}`);

    try {
      // Используем RxJS для ретраев и таймаута (то, что просил Игорь!)
      const result = await lastValueFrom(
        this.client.send('notification_sent', data).pipe(
          timeout(5000), // Ждем подтверждения 5 секунд
          retry(3),      // Если ошибка — пробуем еще 3 раза
        ),
      );
      
      return { success: true, messageId: data.messageId };
    } catch (error) {
      this.logger.error(`Не удалось отправить сообщение: ${error.message}`);
      return { success: false, error: 'Queue connection error' };
    }
  }
}
