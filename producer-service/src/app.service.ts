import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices'; // ← import type
import type { ClientProxy } from '@nestjs/microservices'; // ← import type
import { SendNotificationDto } from './dto/send-notification.dto';
import { firstValueFrom } from 'rxjs';

// Описываем интерфейс сервиса, как в .proto файле
interface NotificationServiceClient {
  checkStatus(data: {}): any;
}


@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);
	private gRpcService: NotificationServiceClient;

  constructor(
    @Inject('RMQ_SERVICE') private readonly client: ClientProxy,
		@Inject('NOTIFY_PACKAGE') private readonly grpcClient: ClientGrpc,
  ) {}

	onModuleInit() {
    // Инициализируем gRPC сервис
    this.gRpcService = this.grpcClient.getService<NotificationServiceClient>('NotificationService');
  }
  
  async sendToQueue(data: SendNotificationDto) {
		this.logger.log(`Отправка сообщения в очередь: ${data.messageId}`);
		
		// 1. Проверяем здоровье консьюмера через gRPC
    try {
      const health = await firstValueFrom(this.gRpcService.checkStatus({}));
      this.logger.log(`📡 gRPC Health Check: ${JSON.stringify(health)}`);
    } catch (e) {
      this.logger.error(`⚠️ gRPC Health Check Failed: ${e.message}`);
      // Можно либо прервать отправку, либо продолжить с предупреждением
      // throw new Error('Consumer is not available');
    }

    // 2. Отправляем в очередь (без ожидания ответа)
    this.client.emit('notification_sent', data);

    return { success: true, messageId: data.messageId };
  }
}

