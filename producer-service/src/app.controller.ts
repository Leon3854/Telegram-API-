import { Body, Controller, Get, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('notifications')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @UsePipes(new ValidationPipe()) // Валидация DTO (SOLID в действии!)
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.appService.sendToQueue(dto);
  }
}
