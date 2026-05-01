import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class SendNotificationDto {
  @IsUUID()
  messageId: string; // Тот самый UUID для идемпотентности

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  targetId: string; // Твой Telegram ID
}
