import { Injectable, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramProvider {
  private readonly bot: Telegraf;
  private readonly logger = new Logger(TelegramProvider.name);

  constructor() {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
  }

  async sendMessage(targetId: string, text: string): Promise<void> {
    await this.bot.telegram.sendMessage(targetId, text);
  }
}
