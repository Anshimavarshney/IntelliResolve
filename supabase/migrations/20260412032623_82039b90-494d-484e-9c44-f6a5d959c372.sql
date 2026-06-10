
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'staff', 'admin', 'superadmin');

-- Create status enum
CREATE TYPE public.complaint_status AS ENUM ('pending', 'assigned', 'in_progress', 'escalated', 'resolved', 'rejected');

-- Create priority enum
CREATE TYPE public.complaint_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create category enum
CREATE TYPE public.complaint_category AS ENUM ('academic', 'hostel', 'administrative', 'technical', 'infrastructure', 'other');

-- Create sentiment enum
CREATE TYPE public.complaint_sentiment AS ENUM ('angry', 'frustrated', 'neutral', 'positive');

-- Institutions table
CREATE TABLE public.institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'University',
  state TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Institutions are viewable by everyone" ON public.institutions FOR SELECT USING (true);

-- Departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category public.complaint_category NOT NULL DEFAULT 'other',
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Departments are viewable by everyone" ON public.departments FOR SELECT USING (true);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  institution_id UUID REFERENCES public.institutions(id),
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Superadmins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));

-- Complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.complaint_category NOT NULL DEFAULT 'other',
  priority public.complaint_priority NOT NULL DEFAULT 'medium',
  sentiment public.complaint_sentiment NOT NULL DEFAULT 'neutral',
  status public.complaint_status NOT NULL DEFAULT 'pending',
  department_id UUID REFERENCES public.departments(id),
  institution_id UUID REFERENCES public.institutions(id),
  assigned_to UUID REFERENCES auth.users(id),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  ai_analysis JSONB DEFAULT '{}',
  sla_deadline TIMESTAMP WITH TIME ZONE,
  cluster_id TEXT,
  similarity_score NUMERIC DEFAULT 0,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Students see their own complaints; staff/admin/superadmin see institution complaints
CREATE POLICY "Students can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view assigned complaints" ON public.complaints FOR SELECT USING (
  public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Students can create complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can update complaints" ON public.complaints FOR UPDATE USING (
  public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Admin can delete complaints" ON public.complaints FOR DELETE USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')
);

-- Complaint logs (timeline)
CREATE TABLE public.complaint_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  status public.complaint_status NOT NULL,
  description TEXT,
  user_name TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.complaint_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logs viewable by authenticated users" ON public.complaint_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert logs" ON public.complaint_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Complaint notes
CREATE TABLE public.complaint_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.complaint_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notes viewable by authenticated users" ON public.complaint_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can add notes" ON public.complaint_notes FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'System',
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit logs viewable by admin" ON public.audit_logs FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL UNIQUE REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view feedback" ON public.feedback FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can submit feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_priority ON public.complaints(priority);
CREATE INDEX idx_complaints_category ON public.complaints(category);
CREATE INDEX idx_complaints_institution ON public.complaints(institution_id);
CREATE INDEX idx_complaints_department ON public.complaints(department_id);
CREATE INDEX idx_complaints_sla ON public.complaints(sla_deadline);
CREATE INDEX idx_complaint_logs_complaint ON public.complaint_logs(complaint_id);
CREATE INDEX idx_audit_logs_complaint ON public.audit_logs(complaint_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
