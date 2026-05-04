import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class GrpcController {
  @GrpcMethod('NotificationService', 'CheckStatus')
  checkStatus(data: any) {
    // Тут можно проверить состояние бота, редиса и т.д.
    return { 
      status: true, 
      message: 'Consumer is healthy and ready to process messages' 
    };
  }
}
