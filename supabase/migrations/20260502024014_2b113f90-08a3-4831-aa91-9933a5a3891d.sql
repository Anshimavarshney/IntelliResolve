
CREATE TABLE public.complaint_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role app_role NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaint_messages_complaint_id ON public.complaint_messages(complaint_id, created_at);

ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;

-- Read: complaint owner OR any staff/admin/superadmin
CREATE POLICY "Chat readable by owner or staff"
ON public.complaint_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = complaint_messages.complaint_id
      AND (
        c.user_id = auth.uid()
        OR has_role(auth.uid(), 'staff'::app_role)
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
      )
  )
);

-- Insert: must be the sender; must be owner or staff/admin/superadmin on that complaint
CREATE POLICY "Chat insert by owner or staff"
ON public.complaint_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = complaint_messages.complaint_id
      AND (
        c.user_id = auth.uid()
        OR has_role(auth.uid(), 'staff'::app_role)
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
      )
  )
);

-- Enable realtime
ALTER TABLE public.complaint_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_messages;
