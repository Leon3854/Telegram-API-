import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { AppService } from './app.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller()
export class AppController {
	private readonly logger = new Logger(AppController.name)
  constructor(private readonly appService: AppService) {}

  @MessagePattern('notification_sent') // Должно совпадать с тем, что в Producer
  async getNotifications(@Payload() data: SendNotificationDto, @Ctx() context: RmqContext) {
		this.logger.log(`Получено сообщение из очереди: ${data.messageId}`); 
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const result = await this.appService.handleNotification(data);
      // РУЧНОЕ ПОДТВЕРЖДЕНИЕ (как просил Игорь!)
      channel.ack(originalMsg);
      return result;
    } catch (error) {
      // Если ошибка — не подтверждаем, RabbitMQ переотправит позже
      this.logger.error('Ошибка обработки, сообщение остается в очереди');
      // channel.nack(originalMsg); // Можно использовать nack для ретрая очередью
    }
  }
}
