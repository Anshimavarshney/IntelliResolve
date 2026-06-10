
-- Drop overly permissive policies
DROP POLICY IF EXISTS "System can insert logs" ON public.complaint_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Recreate with proper checks
CREATE POLICY "Authenticated users can insert logs" ON public.complaint_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.complaints c 
      WHERE c.id = complaint_logs.complaint_id 
      AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role))
    )
  );

CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (
    audit_logs.complaint_id IS NULL OR EXISTS (
      SELECT 1 FROM public.complaints c 
      WHERE c.id = audit_logs.complaint_id 
      AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role))
    )
  );
