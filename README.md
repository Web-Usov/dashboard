# MacBook Pro Watch — Самара

Дашборд GitHub Pages, **только MacBook Pro с чипами Apple M5 или M5 Pro**, с ≥24 ГБ RAM и ≥1 ТБ встроенного SSD. MacBook Air и M5 Max исключены. Новые предложения самарских магазинов и б/у объявления Avito (встреча в Самаре).

Публикуемая ветка — `gh-pages` в `Web-Usov/dashboard`; `main` с оригинальным домашним dashboard не изменяется.

## Публикация

Сайт: https://web-usov.github.io/dashboard/

GitHub Pages: Settings → Pages → Deploy from a branch → `gh-pages` / `(root)`. Каждый коммит в ветку автоматически публикуется GitHub. HTML читает `data.json` и повторно загружает его каждые 5 минут.

## Ежечасная задача

26.10–01.11.2026 по Europe/Samara, раз в час. Автоматизация ChatGPT читает `data.json` из `gh-pages` (с актуальным SHA), проверяет местные магазины и Avito, дополняет достоверные карточки/события/`checks`, обновляет `data.json` через GitHub update_file, затем синхронизирует issue #1.

Только модели, соответствующие `modelFilter` в `data.json` (семейство MacBook Pro, chips M5/M5 Pro, minRamGb 24, minSsdGb 1024). В интерфейсе дополнительно реализован защитный фильтр: Air никогда не отображается даже если попадёт в JSON.

`listings` — карточки с постоянными ID и ссылками. `status: preliminary` означает исходные неподтверждённые цены, `active` — актуальное подтверждение, `gone` — снятые предложения. `checks` — реальные фактические проверки; `minProM5` и `minProM5Pro` — минимумы по подтверждённым за конкретный запуск предложениям. `events` — только новые объявления, ценовые изменения и снятие. `sources` — доступность. Отсутствующие значения — `null`, не подставлять старые данные.

Текстовый отчёт: https://github.com/Web-Usov/dashboard/issues/1
