-- Create the party-media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('party-media', 'party-media', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'party-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to read all party media
CREATE POLICY "Authenticated can read media" ON storage.objects FOR SELECT
  USING (bucket_id = 'party-media' AND auth.role() = 'authenticated');

-- Allow users to delete their own media
CREATE POLICY "Users can delete own media" ON storage.objects FOR DELETE
  USING (bucket_id = 'party-media' AND auth.uid()::text = (storage.foldername(name))[1]);
