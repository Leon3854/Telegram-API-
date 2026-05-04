import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672'],
          queue: 'telegram_queue',
          queueOptions: {
            durable: true, // Чтобы сообщения не пропадали при рестарте Rabbit
          },
        },
      },
    ]),
		PrometheusModule.register(), // Это создаст эндпоинт /metrics автоматически
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
