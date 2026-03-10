-- ============================================================
-- TeaShop: Storage-политики для bucket avatars
-- Bucket создаётся вручную: Dashboard → Storage → New bucket
--   Имя: avatars | Public: true | Limit: 2 MB
--   MIME: image/jpeg, image/png, image/webp
-- После создания bucket — выполнить этот файл в SQL Editor
-- ============================================================

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
