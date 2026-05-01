import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
	// Не нужен ClientsModule, он сам является "клиентом" для Кролика через main.ts
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
