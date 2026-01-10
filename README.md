# Booze Accounting (Telegram Mini App)

Мини-приложение Telegram для учёта выпитого алкоголя в небольшой компании. Пиво в приоритете, но поддерживаются и другие напитки. Деплой: Cloudflare Pages + Pages Functions + KV.

## Стек
- Frontend: React + TypeScript + Vite
- Backend: Cloudflare Pages Functions (TypeScript)
- Storage: Cloudflare KV

## Быстрый старт

```bash
npm install
npm run dev
```

Для локальной проверки функций можно использовать `wrangler pages dev`.

## Cloudflare Pages деплой

1. Создайте два KV namespace (prod + preview).
2. В `wrangler.toml` пропишите:
   ```toml
   kv_namespaces = [
     { binding = "APP_KV", id = "<PROD_ID>", preview_id = "<PREVIEW_ID>" }
   ]
   ```
3. Добавьте секрет `TELEGRAM_BOT_TOKEN` в Cloudflare Pages (Environment Variables / Secrets).
4. Настройте сборку Pages:
   - Build command: `npm run build`
   - Output directory: `dist`

## Telegram WebApp

1. В BotFather создайте бота и настройте Mini App (WebApp) с URL на ваш Cloudflare Pages.
2. Откройте WebApp из меню бота.

## Авторизация

Все запросы должны отправлять заголовок:

```
X-Telegram-InitData: <initData>
```

Сервер проверяет `initData` через `verifyTelegramInitData` (HMAC-SHA256 по WebAppData).

## KV ключи

- `user:tg:<telegram_user_id>` -> User JSON
- `profile:tg:<telegram_user_id>` -> UserProfile JSON
- `crew:<crew_id>` -> Crew JSON
- `crew:invite:<invite_code>` -> crew_id
- `crew:<crew_id>:members` -> JSON массив CrewMember
- `crew:<crew_id>:products:<product_id>` -> DrinkProduct JSON
- `crew:<crew_id>:products:index` -> JSON массив product_id
- `crew:<crew_id>:suggestions:<suggestion_id>` -> DrinkSuggestion JSON
- `crew:<crew_id>:suggestions:index` -> JSON массив suggestion_id
- `crew:<crew_id>:suggestions:pending` -> JSON массив pending
- `crew:<crew_id>:sessions:<session_id>` -> Session JSON
- `crew:<crew_id>:sessions:index` -> JSON массив session_id
- `crew:<crew_id>:sessions:active` -> JSON массив активных session_id
- `crew:<crew_id>:entries:<entry_id>` -> DrinkEntry JSON
- `crew:<crew_id>:entries:index` -> JSON массив entry_id
- `crew:<crew_id>:entries:index:<YYYY-MM-DD>` -> JSON массив entry_id
- `crew:<crew_id>:entries:byUser:<user_id>:<YYYY-MM-DD>` -> JSON массив entry_id

## Промилле (eBAC)

Используется упрощённая модель:

```
ethanol_grams = serving_ml * (abv / 100) * 0.789 * qty
```

TBW по Watson:
- male: `2.447 - 0.09516*age + 0.1074*height + 0.3362*weight`
- female: `-2.097 + 0.1069*height + 0.2466*weight`

Промилле с метаболизмом:

```
promille = max(0, promille_raw - beta * hours_since_first_drink)
```

`beta = 0.15‰/час`. Если активна сессия — учитывается её окно, иначе последние 12 часов. Это не медицинский прибор и не доказательство трезвости.

## Год назад в этот день

Эндпоинт `/api/crew/:crewId/stats/onthisday?date=YYYY-MM-DD` показывает статистику за дату год назад. Для 29 февраля используется 28 февраля.

## API примеры

```bash
curl -X POST /api/auth \
  -H 'Content-Type: application/json' \
  -d '{"initData":"..."}'
```

```bash
curl -X PUT /api/profile \
  -H 'X-Telegram-InitData: ...' \
  -d '{"height_cm":180,"weight_kg":80,"age_years":30,"sex":"male"}'
```

```bash
curl -X POST /api/crew/CREW_ID/entries \
  -H 'X-Telegram-InitData: ...' \
  -d '{"product_id":"...","qty":1}'
```

## Что менять

- `TELEGRAM_BOT_TOKEN` — секрет для проверки initData.
- `wrangler.toml` — KV namespace ID.
- Invite link: код `crew.invite_code`.

## Список файлов

- `src/` — React приложение
- `functions/` — Cloudflare Pages Functions
- `shared/` — общие типы и формулы
- `wrangler.toml` — конфиг Cloudflare
- `test/` — unit tests
