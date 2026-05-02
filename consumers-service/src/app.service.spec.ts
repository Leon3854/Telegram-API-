import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { RedisProvider } from './providers/redis.provider';
import { TelegramProvider } from './providers/telegram.provider';

describe('AppService (Consumer Idempotency)', () => {
  let service: AppService;
  let redis: RedisProvider;
  let telegram: TelegramProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: RedisProvider,
          useValue: { isDuplicate: jest.fn(), removeLock: jest.fn() },
        },
        {
          provide: TelegramProvider,
          useValue: { sendMessage: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    redis = module.get<RedisProvider>(RedisProvider);
    telegram = module.get<TelegramProvider>(TelegramProvider);
  });

  it('должен отправить сообщение, если это НЕ дубликат', async () => {
    (redis.isDuplicate as jest.Mock).mockResolvedValue(false);
    const data = { messageId: '123', text: 'test', targetId: '1' };

    await service.handleNotification(data);

    expect(telegram.sendMessage).toHaveBeenCalled();
  });

  it('НЕ должен отправлять сообщение, если это ДУБЛИКАТ', async () => {
    (redis.isDuplicate as jest.Mock).mockResolvedValue(true);
    const data = { messageId: '123', text: 'test', targetId: '1' };

    const result = await service.handleNotification(data);

    expect(result).toEqual({ status: 'duplicate' });
    expect(telegram.sendMessage).not.toHaveBeenCalled();
  });
});
