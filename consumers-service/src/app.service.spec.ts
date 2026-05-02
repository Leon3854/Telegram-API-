/**
 * @fileoverview Интеграционные тесты для проверки идемпотентности сервиса уведомлений (Consumer Idempotency).
 *
 * Основная цель — гарантировать, что сервис `AppService` корректно обрабатывает дубликаты сообщений,
 * полученных из очереди (например, RabbitMQ/Kafka), предотвращая повторную отправку уведомлений в Telegram.
 *
 * Тесты проверяют сценарий "exactly-once delivery", полагаясь на `RedisProvider` как на распределенный
 * механизм дедупликации.
 *
 * @requires @nestjs/testing
 * @requires ./app.service
 * @requires ./providers/redis.provider
 * @requires ./providers/telegram.provider
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { RedisProvider } from './providers/redis.provider';
import { TelegramProvider } from './providers/telegram.provider';

/**
 * Группа тестов, фокусирующаяся на потребителе сообщений и гарантии идемпотентности.
 *
 * @describe AppService (Consumer Idempotency)
 */
describe('AppService (Consumer Idempotency)', () => {
	/** @type {AppService} Инстанс тестируемого сервиса-обработчика */
  let service: AppService;
	/** @type {RedisProvider} Мок провайдера Redis для контроля ключей идемпотентности */
  let redis: RedisProvider;
	/** @type {TelegramProvider} Мок провайдера Telegram для перехвата попыток отправки */
  let telegram: TelegramProvider;

	/**
   * Подготовка тестового модуля перед каждым тестом.
   * Заменяет реальные зависимости на моки Jest, изолируя юнит `AppService`.
   *
   * Мокируемые методы:
   * - `RedisProvider.isDuplicate` — определяет, было ли сообщение обработано ранее.
   * - `TelegramProvider.sendMessage` — выполняет отправку сообщения (вызов отслеживается).
  */
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

	/**
   * Сценарий: Успешная обработка нового сообщения.
   *
   * Проверяет, что если сообщение с идентификатором `messageId` поступает в систему впервые
   * (`isDuplicate` возвращает `false`), то оно должно быть доставлено получателю через Telegram.
   *
   * @test Успешная отправка для не-дубликата
   * @outcome `telegram.sendMessage` вызывается ровно один раз с корректными параметрами.
   */

  it('должен отправить сообщение, если это НЕ дубликат', async () => {
    (redis.isDuplicate as jest.Mock).mockResolvedValue(false);
    const data = { messageId: '123', text: 'test', targetId: '1' };

    await service.handleNotification(data);

    expect(telegram.sendMessage).toHaveBeenCalled();
  });

	/**
   * Сценарий: Отклонение дубликата.
   *
   * Проверяет защитный механизм: если сообщение уже было успешно обработано ранее
   * (`isDuplicate` возвращает `true`), сервис должен прервать выполнение и вернуть
   * объект со статусом `'duplicate'`.
   *
   * При этом критически важно, чтобы метод `telegram.sendMessage` не был вызван,
   * чтобы избежать спама пользователю.
   *
   * @test Игнорирование дубликата
   * @outcome Результат равен `{ status: 'duplicate' }`
   * @outcome `telegram.sendMessage` не вызывается (0 вызовов).
  */

  it('НЕ должен отправлять сообщение, если это ДУБЛИКАТ', async () => {
    (redis.isDuplicate as jest.Mock).mockResolvedValue(true);
    const data = { messageId: '123', text: 'test', targetId: '1' };

    const result = await service.handleNotification(data);

    expect(result).toEqual({ status: 'duplicate' });
    expect(telegram.sendMessage).not.toHaveBeenCalled();
  });
});
