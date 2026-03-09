# Фаза 3: Страница регистрации

**Зависимости:** Фаза 1 (auth-state.js), Фаза 2 (auth.css создан)
**Основание:** ADR-1 (email-подтверждение отключено), ADR-4 (redirect)

---

## Что реализуется

Рабочая страница регистрации. После этой фазы полный цикл создания аккаунта
работает: пользователь регистрируется, Supabase создаёт `auth.users` и через
триггер — `profiles`, пользователь автоматически входит и попадает на главную.

---

## Создаваемые файлы

| Файл | Действие |
|---|---|
| `src/pages/register.html` | Создать |
| `src/js/auth/register.js` | Создать |

## Изменяемые файлы

| Файл | Что меняется |
|---|---|
| `src/css/auth.css` | Добавить стили для поля `full_name` и сообщения об успехе |

---

## HTML-структура `register.html`

Ключевые элементы (именно эти `id` использует `register.js`):

| Элемент | id/class | Назначение |
|---|---|---|
| `<header>` | `id="site-header"` | Контейнер навигации (для header.js в фазе 4) |
| `<form>` | `id="register-form"` | Форма регистрации |
| `<input type="text">` | `id="full-name"` | Поле имени |
| `<input type="email">` | `id="email"` | Поле email |
| `<input type="password">` | `id="password"` | Поле пароля |
| `<input type="password">` | `id="password-confirm"` | Подтверждение пароля |
| `<button type="submit">` | — | Кнопка «Зарегистрироваться» |
| `<p>` (ошибка) | `id="error-message"` | Ошибки, скрыт по умолчанию |
| Ссылка | `href="login.html"` | «Уже есть аккаунт? Войдите» |

Подключаемые скрипты в `<head>`:
- Supabase CDN: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
- `<link rel="stylesheet" href="../css/auth.css">`
- `<script type="module" src="../js/auth/register.js"></script>`

---

## Логика `register.js`

### Инициализация
- Импортирует `supabase` из `../shared/supabase.js`
- Импортирует `getCurrentUser` из `./auth-state.js`
- При загрузке: если уже залогинен → редирект на `/`

### Обработчик формы `register-form` (событие `submit`)
1. `event.preventDefault()`
2. Читает `fullName`, `email`, `password`, `passwordConfirm`
3. Клиентская валидация:
   - `fullName` не пустой (после trim)
   - email не пустой
   - `password` длиной ≥ 6 символов
   - `password === passwordConfirm` (иначе: «Пароли не совпадают»)
4. Блокирует кнопку submit
5. Вызывает:
   ```
   supabase.auth.signUp({
     email,
     password,
     options: { data: { full_name: fullName } }
   })
   ```
6. При ошибке: `showError(error.message)`, разблокирует кнопку
7. При успехе:
   - Триггер в БД уже создал запись в `profiles` автоматически
   - Сессия создана (email-подтверждение отключено)
   - Редирект на `/`

### Функции `showError(message)` / `hideError()`
Аналогичны `login.js` — показывают/скрывают `#error-message`.

---

## Изменения в `auth.css`

Дополнить существующий файл:
- Стили для поля `full-name` (аналогично email/password — уже есть общий стиль)
- Если общий стиль `input` уже покрывает все поля — дополнительных стилей не нужно

---

## Пре-условие: Настройка Supabase Dashboard

**Обязательно до тестирования:** отключить email-подтверждение.

Путь: Supabase Dashboard → Project → Authentication → Settings →
раздел «Email Auth» → снять галочку «Enable email confirmations» → Save.

Без этого `signUp` вернёт `user`, но `session` будет `null` — редирект не сработает.

---

## Критерии приёмки

- [ ] `register.html` открывается в браузере без ошибок в консоли
- [ ] Форма отображается корректно на 375px и 1280px
- [ ] Пустое поле имени → ошибка валидации
- [ ] Пароль < 6 символов → ошибка валидации
- [ ] Несовпадающие пароли → ошибка «Пароли не совпадают»
- [ ] Уже занятый email → ошибка от Supabase
- [ ] Успешная регистрация → редирект на `/`
- [ ] В Supabase Dashboard (Authentication → Users) появился новый пользователь
- [ ] В таблице `profiles` появилась запись с правильным `full_name`
- [ ] Если уже залогинен и открывает `/register.html` → редирект на `/`
- [ ] Ссылка «Войдите» ведёт на `login.html`

## Как проверить руками

1. Открыть `src/pages/register.html`
2. Проверить все ошибки валидации
3. Зарегистрировать нового пользователя с уникальным email
4. Проверить редирект
5. Открыть Supabase Dashboard → Authentication → Users → убедиться, что пользователь создан
6. Открыть Supabase Dashboard → Table Editor → profiles → убедиться, что запись создана с правильным `full_name`
7. Попробовать зарегистрировать тот же email повторно → увидеть ошибку