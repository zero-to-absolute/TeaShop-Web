# План объединения БД сайта и WPF-приложения

> Этот файл — заметка на будущее. Объединение происходит ПОСЛЕ того,
> как сайт полностью готов и работает на своей схеме в Supabase.

---

## Текущее состояние

### Сайт (Supabase PostgreSQL)
12 таблиц: categories, characteristics, teas, ingredients,
tea_characteristics, ingredient_characteristics, tea_ingredient_compat,
ingredient_compat, recipes, recipe_ingredients, profiles, cart_items.

### WPF (SQL Server, складской учёт)
13 таблиц:

| Таблица | Назначение |
|---------|------------|
| PRODUCTS | Товары (единая таблица для всех типов) |
| CATEGORY | Категории товаров |
| ORDERS | Заказы |
| ORDER_DETAILS | Состав заказа (товар, кол-во, цена) |
| STATUS_ORDER | Статусы заказов |
| USERS | Персонал (логин, пароль, роль) |
| ROLE | Роли (админ, бухгалтер, продавец, менеджер) |
| SUPPLIES | Поставки |
| SUPPLIES_DETAILS | Состав поставки (товар, кол-во, цена, дата произв.) |
| SUPPLIERS | Поставщики |
| STATUS_SUPPLIES | Статусы поставок |
| NOTIFICATIONS | Уведомления для персонала |
| LOSSES | Списания товаров |

---

## Ключевые расхождения, которые нужно будет разрешить

### 1. PRODUCTS (WPF) vs teas + ingredients (сайт)

WPF хранит всё в одной таблице PRODUCTS.
Сайт разделяет на `teas` и `ingredients` (разная логика конструктора).

**Варианты при объединении:**
- A) Оставить teas/ingredients на сайте, создать VIEW `products_view`
  объединяющий обе таблицы для WPF
- B) Перейти на единую таблицу `products` с полем `product_type`
  ('tea'/'ingredient'), адаптировать JS-код сайта
- C) WPF работает с teas и ingredients напрямую как с двумя таблицами

> Вариант A наименее инвазивный — сайт не меняется, WPF работает через VIEW.

### 2. USERS (WPF) vs auth.users + profiles (сайт)

WPF: своя таблица USERS с логинами, паролями, ролями (персонал).
Сайт: Supabase Auth (auth.users) + profiles (покупатели).

**Это разные группы пользователей:**
- Персонал (WPF) — админ, бухгалтер, продавец, менеджер
- Покупатели (сайт) — регистрация через email

**Варианты:**
- A) WPF переходит на Supabase Auth, роли через `profiles.role`
  или отдельную таблицу `staff_roles`
- B) Параллельные системы: auth.users для покупателей,
  отдельная таблица `staff` для персонала

### 3. ORDERS (WPF) vs cart_items (сайт)

Сайт: корзина без оформления (кнопка неактивна).
WPF: полноценные заказы со статусами.

**При объединении:**
- Добавить таблицы `orders`, `order_details`, `status_order` в Supabase
- cart_items сайта -> создание записи в orders при оформлении
- WPF видит и обрабатывает эти заказы (меняет статусы)
- RLS: покупатель видит только свои заказы, персонал — все

### 4. Складские таблицы (только WPF)

SUPPLIES, SUPPLIES_DETAILS, SUPPLIERS, STATUS_SUPPLIES, LOSSES —
чисто складская логика, сайт их не трогает.

**При объединении:**
- Перенести как есть в Supabase (адаптировать типы SQL Server -> PostgreSQL)
- RLS: доступ только для персонала (по роли)
- Сайту эти таблицы не нужны, JS-код их не видит

### 5. NOTIFICATIONS (WPF)

Уведомления для персонала (привязаны к товару и пользователю).

**При объединении:**
- Перенести в Supabase
- RLS: каждый видит только свои уведомления
- Можно подключить Supabase Realtime для push-уведомлений в WPF

### 6. CATEGORY (WPF) vs categories (сайт)

Практически идентичны. При объединении — одна таблица `categories`.
Переименование полей: ID_CATEGORY -> id, CATEGORY_NAME -> name.

---

## Адаптация типов SQL Server -> PostgreSQL

| SQL Server | PostgreSQL |
|------------|------------|
| INT IDENTITY | int GENERATED ALWAYS AS IDENTITY |
| VARCHAR(MAX) | text |
| NVARCHAR(MAX) | text |
| DECIMAL(8,2) | numeric(8,2) |
| DATETIME2(0) | timestamptz |
| BIT | boolean |
| SMALLINT | smallint |

---

## Порядок объединения (когда придёт время)

```
1. Перенести складские таблицы (supplies, suppliers, losses) — сайт не затрагивается
2. Унифицировать categories
3. Решить вопрос с PRODUCTS vs teas/ingredients (VIEW или рефакторинг)
4. Решить вопрос с USERS/Auth (персонал vs покупатели)
5. Добавить orders/order_details — связать корзину сайта с заказами WPF
6. Перенести notifications
7. Настроить RLS для новых таблиц (разделение персонал/покупатели)
```

---

## Что учтено в текущей схеме сайта для упрощения будущего объединения

- `categories` — аналогична CATEGORY в WPF, легко объединить
- `teas.price` и `ingredients.price` — тип `numeric(10,2)`, совместим с DECIMAL(8,2)
- `teas.in_stock` — аналог MIN_STOCK_QUANTITY (упрощённо, булево)
- `cart_items` — структура позволяет легко создать orders на её основе
- UUID для пользовательских сущностей — совместимо с Supabase Auth