# Домашний Дашборд

Веб-приложение для управления домашними сервисами и ресурсами. Проект разработан с использованием современного стека технологий и предоставляет удобный интерфейс для доступа к различным домашним сервисам.

## Технологии

- React 19
- TypeScript
- Vite
- Tailwind CSS
- DaisyUI

## Функциональность

- Отображение списка доступных сервисов и ресурсов
- Фильтрация по категориям (AI, мониторинг, умный дом и др.)
- Адаптивный дизайн для различных устройств
- Современный и минималистичный интерфейс

## Структура проекта

```
dashboard/
├── src/                    # Исходный код
│   ├── components/         # React компоненты
│   ├── data/              # Данные (JSON)
│   └── types/             # TypeScript типы
├── public/                # Статические файлы
├── scripts/               # Вспомогательные скрипты
└── package.json           # Зависимости и скрипты
```

## Запуск проекта

1. Установка зависимостей:
```bash
pnpm install
```

2. Запуск в режиме разработки:
```bash
pnpm dev
```

3. Сборка для продакшена:
```bash
pnpm build
```

## Категории сервисов

- AI (Искусственный интеллект)
- Мониторинг (Grafana, Glances)
- Умный дом (Home Assistant)
- Администрирование (Portainer, pgAdmin)
- Другие утилиты

## Лицензия

Проект является частным и предназначен для использования в домашней сети.
