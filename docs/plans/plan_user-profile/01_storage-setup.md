# Фаза 1: Supabase Storage — bucket avatars

**Зависимости:** нет (выполняется первой, вне кода)
**Основание:** ADR-5, ADR-6 из `docs/design/design_user-profile.md`

---

## Что реализуется

Создание bucket `avatars` в Supabase Storage и RLS-политик для него.
Это инфраструктурная фаза — выполняется вручную в Supabase Dashboard + SQL Editor.

---

## Шаги

### 1. Создать bucket через Supabase Dashboard

- Dashboard → Storage → New bucket
- Имя: `avatars`
- Public: **включить** (аватары доступны по URL без авторизации)
- File size limit: **2 MB**
- Allowed MIME types: `image/jpeg, image/png, image/webp`

### 2. Добавить RLS-политики в SQL Editor

```sql
-- Загрузка своего аватара (имя файла = user_id)
CREATE POLICY "Аватар: загрузка своего"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = name
);

-- Перезапись своего аватара (upsert)
CREATE POLICY "Аватар: обновление своего"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = name
);

-- Публичное чтение аватаров
CREATE POLICY "Аватар: публичное чтение"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

---

## Файлы

| Файл | Действие |
|---|---|
| `supabase/migrations/002_storage_avatars.sql` | Создать — зафиксировать SQL политик |

Содержимое `002_storage_avatars.sql` — только SQL политик из шага 2 выше
(bucket создаётся через Dashboard, не через SQL).

---

## Критерии приёмки

- [ ] В Supabase Dashboard → Storage виден bucket `avatars` с флагом Public
- [ ] В Dashboard → Storage → Policies видны три политики на bucket `avatars`
- [ ] Ручная проверка: загрузить файл через Dashboard → файл появляется в bucket
- [ ] Публичный URL файла открывается в браузере без авторизации
