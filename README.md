# MacBook Watch — Самара

Статический GitHub Pages-дашборд по рынку MacBook M5 / M5 Pro, 24+ GB RAM, 1+ TB internal SSD. Самостоятельная ветка публикации gh-pages в Web-Usov/dashboard, не затрагивает исходники main.

## Обновление
Ежечасная автоматизация ChatGPT читает текущий `data.json`, собирает цены и дополняет JSON (с сохранением истории), затем обновляет `data.json` в ветке `gh-pages` через GitHub update_file. Каждое обновление GitHub Pages публикует автоматически, если включить Settings → Pages → Deploy from a branch → gh-pages / (root). Интерфейс сам повторно загружает JSON каждые 5 минут. Запланировано 26.10–01.11.2026, раз в час, Europe/Samara.

## Схема
`listings`: актуальные карточки с постоянными id и URL; `status: preliminary` — исходная неподтверждённая стоимость, `status: gone` — исчезло. `checks`: только реальные попытки проверок; `minAirM5`, `minProM5Pro` — минимум по **достоверно проверенным ценам**, null если нет проверки. `events`: только события новых объявлений, ценовых изменений, исчезновения; `sources`: итоги доступности каждого сервиса. Не добавлять фиктивные временные ряды.

Issue с текстовым отчётом: https://github.com/Web-Usov/dashboard/issues/1
