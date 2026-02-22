# Опора — Telegram Mini App для людей с зависимостями

Минимальный Telegram Mini App (React + Vite + `@tma.js/sdk`) с фокусом на поддержку людей, работающих с зависимостью.

## Функции

- Счётчик трезвых дней (в `localStorage`)
- Быстрый выбор триггера и предложение безопасного действия
- Краткий anti-relapse план
- Поддержка Telegram темы через `@tma.js/sdk`
- Backend API на Express с серверной валидацией Telegram `initData`

## Быстрый запуск (full-stack)

1. Установи зависимости:

   ```bash
   npm install
   cd backend && npm install
   ```

2. Создай `.env` на основе примера:

   ```bash
   cp .env.example .env
   ```

   Где:
   - `BOT_TOKEN` — токен Telegram-бота (используется только сервером для HMAC-проверки).
   - `API_URL` — URL фронтенда для CORS (например `http://localhost:5173`).
   - `VITE_API_URL` — URL backend API для фронтенда (например `http://localhost:3001`).

3. Запусти backend (терминал 1):

   ```bash
   cd backend
   npm run dev
   ```

4. Запусти frontend (терминал 2):

   ```bash
   npm run dev
   ```

## Безопасность Telegram авторизации

- Фронтенд отправляет `Authorization: tma <initDataRaw>` в защищённые API-запросы.
- Бэкенд валидирует `initData` через HMAC-SHA256 с `BOT_TOKEN` в `POST /api/session/validate`.
- Данные пользователя извлекаются **только после успешной серверной проверки**.
- Авторизация по `window.Telegram.WebApp.initDataUnsafe` без серверной валидации не используется.

## Подключение к Telegram

1. Создай бота через **@BotFather**.
2. Подними HTTPS URL (например, через ngrok).
3. В BotFather: `/newapp` и укажи URL Mini App.
4. Открой приложение через кнопку бота в Telegram.
