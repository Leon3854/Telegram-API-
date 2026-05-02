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
		
		// emit не ждет ответа, поэтому lastValueFrom и таймауты не нужны
		this.client.emit('notification_sent', data); 
		
		return { success: true, messageId: data.messageId };
	}
}
