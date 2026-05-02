import { IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationDto {
	
  @IsUUID()
  messageId: string; // Тот самый UUID для идемпотентности

	@ApiProperty({ example: 'Привет, Система работает.', description: 'Текст уведомления' })
  @IsString()
  @IsNotEmpty()
  text: string;

	@ApiProperty({ example: '357249227', description: 'Telegram ID получателя' })
  @IsString()
  @IsNotEmpty()@ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Уникальный ID сообщения для идемпотентности' })
  targetId: string; // Твой Telegram ID
}
