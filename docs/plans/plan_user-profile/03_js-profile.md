# Фаза 3: JS — полная логика profile.js

**Зависимости:** Фазы 1 и 2 (bucket создан, HTML/CSS готовы)
**Основание:** Sequence-диаграммы 3.1–3.4, ADR-5–8 из `docs/design/design_user-profile.md`

---

## Что реализуется

Полная перезапись `src/js/auth/profile.js`:
- Загрузка `full_name`, `avatar_url`, `created_at` из таблицы `profiles`
- Отображение аватара или заглушки с инициалом
- Загрузка нового аватара в Storage + обновление `profiles.avatar_url`
- Смена пароля через `supabase.auth.updateUser()`
- Унифицированные статус-сообщения для каждой секции
- Все существующие функции сохраняются (guard, `full_name`, `showStatus`)

---

## Файлы

| Файл | Действие |
|---|---|
| `src/js/auth/profile.js` | Изменить — полная перезапись |

---

## Функции модуля

### Утилиты статус-сообщений

```
showSectionStatus(elementId, message, isError)
  — показывает .status-msg по id с классом .success / .error

hideSectionStatus(elementId)
  — скрывает .status-msg по id
```

### Загрузка профиля (`loadProfile(user)`)

```
1. supabase.from('profiles')
     .select('full_name, avatar_url, created_at')
     .eq('id', user.id).single()
2. Заполнить #user-email (из user.email)
3. Заполнить #user-created-at (created_at — форматировать: 'дд.мм.гггг')
4. Заполнить #full-name (full_name)
5. Вызвать renderAvatar(profile.avatar_url, user)
```

### Отображение аватара (`renderAvatar(avatarUrl, user)`)

```
Если avatarUrl не пустой:
  — supabase.storage.from('avatars').getPublicUrl(avatarUrl)
  — вставить <img id="avatar-preview" src="{url}?t={Date.now()}">
    в #avatar-preview-wrapper
Иначе:
  — взять первую букву full_name, или первую букву email
  — вставить <div class="avatar-placeholder">{буква}</div>
    в #avatar-preview-wrapper
```

### Загрузка аватара (`handleAvatarChange(event, user)`)

```
Обработчик: change на #avatar-input

1. file = event.target.files[0]
2. Валидация:
   — тип: file.type.startsWith('image/') → ошибка 'Выберите изображение'
   — размер: file.size > 2 * 1024 * 1024 → ошибка 'Файл не должен превышать 2 МБ'
3. Показать индикатор (заблокировать #avatar-change-btn)
4. supabase.storage.from('avatars').upload(user.id, file, { upsert: true })
5. При ошибке: показать ошибку в #avatar-status
6. При успехе:
   — supabase.from('profiles').update({ avatar_url: user.id, updated_at }).eq('id', user.id)
   — renderAvatar(user.id, user)
   — showSectionStatus('avatar-status', 'Фото обновлено')
7. Разблокировать кнопку
```

### Сохранение имени (существующая логика, адаптировать)

```
Обработчик: submit на #profile-form

Та же логика, что и сейчас, но:
— использовать hideSectionStatus('profile-status') вместо hideStatus()
— использовать showSectionStatus('profile-status', ...) вместо showStatus()
```

### Смена пароля (`handlePasswordChange(event)`)

```
Обработчик: submit на #password-form

1. newPassword = #new-password value (trim нет — пробелы в пароле допустимы)
2. newPasswordConfirm = #new-password-confirm value
3. Валидация:
   — newPassword.length < 6 → 'Пароль должен содержать минимум 6 символов'
   — newPassword !== newPasswordConfirm → 'Пароли не совпадают'
4. Заблокировать кнопку submit формы
5. supabase.auth.updateUser({ password: newPassword })
6. При ошибке: showSectionStatus('password-status', error.message, true)
7. При успехе:
   — showSectionStatus('password-status', 'Пароль изменён')
   — очистить #new-password и #new-password-confirm
8. Разблокировать кнопку
```

### Инициализация (`DOMContentLoaded`)

```
1. user = await getCurrentUser()
2. Если null → редирект на login.html?redirect=...
3. await loadProfile(user)
4. Подписать #avatar-change-btn → клик → #avatar-input.click()
5. Подписать #avatar-input → change → handleAvatarChange(event, user)
6. Подписать #profile-form → submit → handleProfileSave(event, user)
7. Подписать #password-form → submit → handlePasswordChange(event)
```

---

## Критерии приёмки

- [ ] Страница загружается: email, имя, дата регистрации отображаются корректно
- [ ] Если avatar_url пустой — виден круглый placeholder с инициалом
- [ ] Если avatar_url заполнен — виден аватар из Storage
- [ ] Клик «Изменить фото» → открывается диалог выбора файла
- [ ] Загрузка файла > 2 МБ → сообщение об ошибке, загрузки не происходит
- [ ] Загрузка файла не-картинки → сообщение об ошибке
- [ ] Успешная загрузка аватара → аватар обновляется на странице без перезагрузки
- [ ] В Supabase Storage → avatars: файл с именем равным user_id
- [ ] В Supabase Table Editor → profiles: поле avatar_url обновилось
- [ ] Сохранение пустого имени → ошибка валидации
- [ ] Успешное сохранение имени → 'Сохранено' в секции личных данных
- [ ] Пароль < 6 символов → ошибка валидации
- [ ] Несовпадающие пароли → ошибка валидации
- [ ] Успешная смена пароля → 'Пароль изменён', поля очищены
- [ ] Гость → редирект на login.html
- [ ] Кнопки блокируются во время запроса, разблокируются после
