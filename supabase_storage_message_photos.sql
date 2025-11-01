-- Создание bucket для хранения фотографий сообщений
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-photos', 'message-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Политики доступа к bucket
CREATE POLICY "Anyone can upload message photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'message-photos');

CREATE POLICY "Public read access to message photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-photos');

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'message-photos');
