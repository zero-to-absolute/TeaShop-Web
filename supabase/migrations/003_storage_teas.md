# Storage: bucket `teas`

Bucket для хранения изображений чаёв каталога. Создаётся вручную через Supabase Dashboard.

## Создание bucket

Dashboard → Storage → New bucket

| Параметр | Значение |
|---|---|
| Name | `teas` |
| Public | `true` |
| File size limit | 5 MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |

## Структура файлов

Файлы именуются по `slug` чая из таблицы `teas`:

```
teas/
├── tanyang-congou.jpg
├── india-nilgiri.jpg
├── ceylon-ruhuna.jpg
├── golden-monkey.png
├── english-breakfast.jpg
├── mao-jian.jpg
├── green-snail.png
├── white-fluff.jpg
├── tai-ping-hou-kui.jpg
├── bio-japan-sencha.jpg
├── da-hong-pao.jpg
├── fire-flower.jpg
├── royal-puerh.jpg
├── mandarin-puerh.jpg
├── silver-needles.png
├── ivan-chay.jpg
└── rooibos-classic.jpg
```

## Привязка к БД

После загрузки файлов выполнить в SQL Editor (заменить `YOUR_PROJECT_ID`):

```sql
UPDATE teas SET image_url = image_url || '?v=2' WHERE image_url IS NOT NULL;
```

Полный скрипт обновления `image_url` — в файле `003_update_image_urls.sql`.

## Политики доступа

Bucket публичный — RLS-политики на `storage.objects` не требуются.
Чтение изображений доступно всем без авторизации.
Загрузка и удаление файлов — только через Supabase Dashboard (service_role).