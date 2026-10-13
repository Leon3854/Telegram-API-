# Telegram API — микросервисы уведомлений

Надёжная доставка уведомлений в Telegram через микросервисы NestJS + RabbitMQ + Redis + gRPC с полным observability-стеком.

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-FF6600?style=for-the-badge&logo=rabbitmq)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)
![gRPC](https://img.shields.io/badge/gRPC-244C5A?style=for-the-badge)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)

## Что это

Два изолированных микросервиса с гарантированной доставкой событий в Telegram:

- **Producer** (API-шлюз) — принимает HTTP-запросы (Swagger), проверяет доступность воркера по gRPC и кладёт событие в RabbitMQ.
- **Consumer** (воркер) — гибридный сервис (RMQ + gRPC + HTTP-метрики): дедупликация через Redis и отправка в Telegram Bot API.

## Поток данных

```
HTTP (Swagger) → gRPC health-check → RabbitMQ → Redis (идемпотентность) → Telegram API
                       ↓
              Prometheus / Loki / Grafana (контроль на каждом этапе)
```

## Ключевые свойства

- **Идемпотентность** — UUID каждого сообщения проверяется через Redis, дубликаты отсекаются.
- **Manual Ack** — подтверждение только после успешной обработки; `at-least-once` доставка без явных ретраев.
- **gRPC health-check** — продюсер синхронно проверяет готовность воркера до постановки в очередь.
- **Observability** — Prometheus (RPS, CPU, event loop lag) + Loki (структурированные логи) в Grafana.
- **CI/CD** — GitHub Actions: build-check и unit-тесты на каждый push в `main`.

## Быстрый старт

```bash
# Поднять весь стек (RabbitMQ + Redis + producer + consumer + мониторинг)
docker-compose up --build -d

# Тестовое уведомление
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -d '{"messageId":"550e8400-e29b-41d4-a716-446655440000","text":"Привет!","targetId":"357249227"}'
```

- Swagger: http://localhost:3000/api
- Grafana: http://localhost:3001 (admin/admin)
- Повторный запрос с тем же `messageId` → предупреждение о дубликате в логах consumer, второе сообщение не уйдёт.

## Тесты

```bash
cd consumers-service
npm run test
```

## Структура

```text
Telegram-API-/
├── producer-service/          # NestJS API-шлюз (Swagger, gRPC-клиент, RabbitMQ emit)
├── consumers-service/         # NestJS hybrid-воркер (RMQ + gRPC + Redis + Telegram)
├── proto/notification.proto   # gRPC-контракт
├── infra/                     # Prometheus / Loki / Grafana
└── docker-compose.yml
```

## Примечания по продакшену

База готова к масштабированию: shared library для DTO, ConfigModule для секретов, Quorum Queues в RabbitMQ, защита DTO от инъекций.
