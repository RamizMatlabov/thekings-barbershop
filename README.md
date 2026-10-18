# The King's Barbershop

Сайт премиум-барбершопа в Самарканде: витрина услуг, онлайн-запись к барберу и админ-панель для записей и блокировок слотов.

## Стек

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + shadcn / Base UI
- **PostgreSQL** (Neon) + **Drizzle ORM**
- Уведомления о новых записях в **Telegram**
- Аналитика Vercel (только в production)

## Возможности

### Публичный сайт (`/`)

- Главная, о салоне, преимущества, запись, контакты
- Каталог услуг с ценами в сумах; у барбера Далера свои цены на часть услуг
- Онлайн-запись: барбер → услуга → дата → слот → имя и телефон
- Слоты с 09:00, шаг 45 минут; запись не дальше чем на 2 месяца
- Карта, телефон, Instagram, Telegram

Барберы: Пардакулов Амир, Хамидов Далер.

Режим работы на сайте: 09:00–22:00 ежедневно. Телефон: +998 87 713 79 79.

### Админка (`/admin`)

- Вход по паролю (`ADMIN_PASSWORD`), сессия в httpOnly cookie (7 дней)
- Список записей, создание записи вручную
- Блокировки: весь день или интервал времени у конкретного барбера
- Страница закрыта от индексации (`robots: noindex`)

## Быстрый старт

Нужны **Node.js** и **pnpm**.

```bash
pnpm install
```

Создайте `.env.local`:

```env
DATABASE_URL=postgresql://...
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...          # опционально, но лучше задать
TELEGRAM_BOT_TOKEN=...            # для уведомлений о записи
TELEGRAM_ADMIN_CHAT_ID=...
```

Примените схему БД и запустите dev-сервер:

```bash
pnpm db:push
pnpm dev
```

Сайт: [http://localhost:3000](http://localhost:3000)  
Админка: [http://localhost:3000/admin](http://localhost:3000/admin)

Сборка production:

```bash
pnpm build
pnpm start
```

## Переменные окружения

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | PostgreSQL (Neon). Без неё запись и занятость не работают |
| `ADMIN_PASSWORD` | Пароль входа в `/admin` |
| `ADMIN_SESSION_SECRET` | Дополнительный секрет подписи сессии (рекомендуется) |
| `TELEGRAM_BOT_TOKEN` | Бот для уведомлений о новой записи |
| `TELEGRAM_ADMIN_CHAT_ID` | Чат, куда уходит уведомление |

Публичная запись (`POST /api/bookings`) требует настроенный Telegram. Запись из админки может обходиться без него.

## API

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/api/bookings` | Публичный список записей (без имени и телефона) |
| `GET` | `/api/bookings?barberId=&date=` | Занятость барбера на дату |
| `GET` | `/api/bookings?mode=blocks&barberId=&from=&to=` | Полностью закрытые дни |
| `POST` | `/api/bookings` | Создать запись (клиент) |
| `POST` | `/api/admin/login` | Вход в админку |
| `POST` | `/api/admin/logout` | Выход |
| `GET` | `/api/admin/me` | Текущая сессия |
| `GET` / `POST` / `DELETE` | `/api/admin/bookings` | Записи (только авторизованный админ) |
| `GET` / `POST` / `DELETE` | `/api/admin/availability` | Блокировки слотов |

## Структура

```
app/                 страницы и API
  page.tsx           лендинг
  admin/page.tsx     админка
  api/bookings/      публичная запись
  api/admin/         логин, записи, доступность
components/site/     секции лендинга
components/admin/    админ-панель
lib/
  data.ts            услуги, барберы, цены
  booking.ts         слоты, валидация дат
  booking-service.ts запись в БД + Telegram
  availability.ts    блокировки
  admin-auth.ts      сессия админа
  db/schema.ts       таблицы Drizzle
public/images/       фото и логотип
```

## База данных

Две таблицы PostgreSQL:

- **bookings** — барбер, дата, время, длительность, услуга, имя, телефон
- **availability_blocks** — недоступность: весь день (`start_time` / `end_time` = null) или интервал

Схема: `lib/db/schema.ts`. Конфиг Drizzle: `drizzle.config.ts` (читает `.env.local`).
