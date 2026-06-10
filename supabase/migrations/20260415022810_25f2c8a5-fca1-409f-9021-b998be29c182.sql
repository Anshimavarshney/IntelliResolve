
-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-attachments', 'complaint-attachments', true);

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload complaint attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'complaint-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to view attachments
CREATE POLICY "Attachments are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaint-attachments');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'complaint-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
