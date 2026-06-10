import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { analyzeComplaint, checkDuplicates } from './ai-engine';
import type { AIAnalysis, ComplaintCategory, ComplaintPriority, ComplaintSentiment, ComplaintNote, TimelineEvent, AuditEntry } from './types';
import { SLA_HOURS } from './types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'student' | 'staff' | 'admin' | 'superadmin';

export interface AppUser {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  institution_id?: string;
  department_id?: string;
}

export interface AppComplaint {
  id: string;
  complaint_id: string;
  user_id: string;
  user_name: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  sentiment: ComplaintSentiment;
  status: string;
  department_id: string | null;
  department_name: string;
  institution_id: string | null;
  assigned_to: string | null;
  is_anonymous: boolean;
  ai_analysis: AIAnalysis;
  sla_deadline: string;
  cluster_id: string | null;
  similarity_score: number;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  notes: ComplaintNote[];
  timeline: TimelineEvent[];
  audit_log: AuditEntry[];
  feedback?: { rating: number; comment: string };
}

export interface Department {
  id: string;
  name: string;
  category: string;
}

export interface Institution {
  id: string;
  name: string;
  type: string;
  state: string | null;
  city: string | null;
}

export interface ManagedUser {
  user_id: string;
  display_name: string;
  email: string | null;
  role: UserRole;
  created_at: string;
}

function generateComplaintId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GRV-${timestamp}-${random}`;
}

export function useSupabaseStore() {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [complaints, setComplaints] = useState<AppComplaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchUserProfile(session.user.id), 0);
      } else {
        setAppUser(null);
        setComplaints([]);
      }
      setAuthLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchInstitutions();
  }, []);

  useEffect(() => {
    if (appUser) {
      fetchComplaints();
      if (appUser.role === 'superadmin') fetchUsers();
    }
  }, [appUser?.id, appUser?.role]);

  const fetchUserProfile = async (userId: string) => {
    const [profileResult, roleResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId).limit(1).single(),
    ]);

    if (profileResult.data) {
      setAppUser({
        id: userId,
        email: profileResult.data.email || '',
        display_name: profileResult.data.display_name || '',
        role: (roleResult.data?.role as UserRole) || 'student',
        institution_id: profileResult.data.institution_id || undefined,
        department_id: profileResult.data.department_id || undefined,
      });
    }
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*');
    if (data) setDepartments(data as Department[]);
  };

  const fetchInstitutions = async () => {
    const { data } = await supabase.from('institutions').select('*').order('name');
    if (data) setInstitutions(data as Institution[]);
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, email, created_at');
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');
    if (profiles && roles) {
      const roleMap = new Map(roles.map(r => [r.user_id, r.role as UserRole]));
      setManagedUsers(profiles.map(p => ({
        user_id: p.user_id,
        display_name: p.display_name,
        email: p.email,
        role: roleMap.get(p.user_id) || 'student',
        created_at: p.created_at,
      })));
    }
  };

  const fetchComplaints = async () => {
    if (!appUser) return;
    setLoading(true);

    const query = supabase.from('complaints').select('*').order('created_at', { ascending: false });
    const { data: complaintsData } = await query;
    if (!complaintsData) { setLoading(false); return; }

    const complaintIds = complaintsData.map(c => c.id);

    const [logsResult, notesResult, auditResult, feedbackResult] = await Promise.all([
      supabase.from('complaint_logs').select('*').in('complaint_id', complaintIds).order('created_at'),
      supabase.from('complaint_notes').select('*').in('complaint_id', complaintIds).order('created_at'),
      (appUser.role === 'admin' || appUser.role === 'superadmin')
        ? supabase.from('audit_logs').select('*').in('complaint_id', complaintIds).order('created_at')
        : Promise.resolve({ data: [] }),
      supabase.from('feedback').select('*').in('complaint_id', complaintIds),
    ]);

    const logs = logsResult.data || [];
    const notes = notesResult.data || [];
    const audits = auditResult.data || [];
    const feedbacks = feedbackResult.data || [];

    const mapped: AppComplaint[] = complaintsData.map(c => {
      const dept = departments.find(d => d.id === c.department_id);
      const complaintLogs = logs.filter(l => l.complaint_id === c.id);
      const complaintNotes = notes.filter(n => n.complaint_id === c.id);
      const complaintAudits = audits.filter(a => a.complaint_id === c.id);
      const fb = feedbacks.find(f => f.complaint_id === c.id);

      return {
        id: c.id,
        complaint_id: c.complaint_id,
        user_id: c.user_id,
        user_name: c.is_anonymous ? 'Anonymous' : (c.ai_analysis as any)?.user_name || 'Student',
        title: c.title,
        description: c.description,
        category: c.category as ComplaintCategory,
        priority: c.priority as ComplaintPriority,
        sentiment: c.sentiment as ComplaintSentiment,
        status: c.status,
        department_id: c.department_id,
        department_name: dept?.name || 'Unassigned',
        institution_id: c.institution_id,
        assigned_to: c.assigned_to,
        is_anonymous: c.is_anonymous,
        ai_analysis: (c.ai_analysis as unknown as AIAnalysis) || {},
        sla_deadline: c.sla_deadline || '',
        cluster_id: c.cluster_id,
        similarity_score: Number(c.similarity_score) || 0,
        attachment_url: c.attachment_url,
        created_at: c.created_at,
        updated_at: c.updated_at,
        notes: complaintNotes.map(n => ({
          id: n.id,
          user_id: n.user_id,
          user_name: n.user_name,
          content: n.content,
          created_at: n.created_at,
        })),
        timeline: complaintLogs.map(l => ({
          id: l.id,
          status: l.status as any,
          description: l.description || '',
          user_name: l.user_name,
          created_at: l.created_at,
        })),
        audit_log: complaintAudits.map(a => ({
          id: a.id,
          action: a.action,
          user_name: a.user_name,
          details: a.details || '',
          created_at: a.created_at,
        })),
        feedback: fb ? { rating: fb.rating, comment: fb.comment || '' } : undefined,
      };
    });

    setComplaints(mapped);
    setLoading(false);
  };

  const signup = useCallback(async (email: string, password: string, displayName: string, role: UserRole, institutionId?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };

    if (data.user) {
      if (institutionId) {
        await supabase.from('profiles').update({ institution_id: institutionId, display_name: displayName }).eq('user_id', data.user.id);
      }
      if (role !== 'student') {
        await supabase.from('user_roles').update({ role }).eq('user_id', data.user.id);
      }
    }
    return { error: null };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAppUser(null);
    setComplaints([]);
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const updateProfile = useCallback(async (displayName: string, phone?: string) => {
    if (!appUser) return { error: 'Not authenticated' };
    const { error } = await supabase.from('profiles').update({ display_name: displayName, phone: phone || null }).eq('user_id', appUser.id);
    if (error) return { error: error.message };
    setAppUser(prev => prev ? { ...prev, display_name: displayName } : null);
    return { error: null };
  }, [appUser]);

  const uploadAttachment = useCallback(async (file: File): Promise<string | null> => {
    if (!appUser) return null;
    const ext = file.name.split('.').pop();
    const path = `${appUser.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('complaint-attachments').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('complaint-attachments').getPublicUrl(path);
    return data.publicUrl;
  }, [appUser]);

  const submitComplaint = useCallback(async (title: string, description: string, isAnonymous: boolean, attachmentUrl?: string) => {
    if (!appUser) return null;

    const resolvedComplaints = complaints
      .filter(c => c.status === 'resolved')
      .map(c => ({ description: c.description, title: c.title, category: c.category }));

    const ai = analyzeComplaint(description, resolvedComplaints);
    const dept = departments.find(d => d.category === ai.category) || departments[0];
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + SLA_HOURS[ai.priority] * 3600000);

    const aiAnalysisWithName = { ...ai, user_name: appUser.display_name };
    let inserted: any = null;
    let complaintId = '';
    let lastError: any = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      complaintId = generateComplaintId();
      const { data, error } = await supabase.from('complaints').insert({
        complaint_id: complaintId,
        user_id: appUser.id,
        title: title || ai.suggested_title || 'Untitled',
        description,
        category: ai.category as any,
        priority: ai.priority as any,
        sentiment: ai.sentiment as any,
        status: 'pending' as any,
        department_id: dept?.id || null,
        institution_id: appUser.institution_id || null,
        is_anonymous: isAnonymous,
        ai_analysis: aiAnalysisWithName as any,
        sla_deadline: slaDeadline.toISOString(),
        attachment_url: attachmentUrl || null,
      }).select().single();

      if (data && !error) {
        inserted = data;
        break;
      }

      lastError = error;
      if (error?.code !== '23505') break;
    }

    if (!inserted) {
      throw new Error(lastError?.message || 'Complaint could not be submitted.');
    }

    await supabase.from('complaint_logs').insert({
      complaint_id: inserted.id,
      status: 'pending' as any,
      description: 'Complaint submitted',
      user_name: 'System',
    });

    await supabase.from('audit_logs').insert([
      {
        complaint_id: inserted.id,
        action: 'created',
        user_name: isAnonymous ? 'Anonymous' : appUser.display_name,
        details: `Complaint submitted${isAnonymous ? ' (anonymous)' : ''}`,
      },
      {
        complaint_id: inserted.id,
        action: 'ai_classified',
        user_name: 'AI Engine',
        details: `Category: ${ai.category} (${ai.category_confidence}% conf), Priority: ${ai.priority} (${ai.priority_confidence}% conf), Sentiment: ${ai.sentiment}`,
      },
      {
        complaint_id: inserted.id,
        action: 'routed',
        user_name: 'AI Engine',
        details: `Routed to ${dept?.name || 'Unknown'}`,
      },
    ]);

    await fetchComplaints();
    return { ...inserted, complaint_id: complaintId, ai_analysis: ai, department_name: dept?.name || '' };
  }, [appUser, departments, complaints]);

  const updateComplaintStatus = useCallback(async (complaintUuid: string, newStatus: string) => {
    if (!appUser) return;

    const complaint = complaints.find(c => c.id === complaintUuid);
    const { error } = await supabase.from('complaints').update({ status: newStatus as any }).eq('id', complaintUuid);
    if (error) return;

    await supabase.from('complaint_logs').insert({
      complaint_id: complaintUuid,
      status: newStatus as any,
      description: `Status changed to ${newStatus}`,
      user_name: appUser.display_name,
    });

    await supabase.from('audit_logs').insert({
      complaint_id: complaintUuid,
      action: 'status_change',
      user_name: appUser.display_name,
      details: `Status changed to ${newStatus}`,
    });

    // Create notification for complaint owner (if not self)
    if (complaint && complaint.user_id !== appUser.id) {
      const statusLabels: Record<string, string> = {
        pending: 'Pending', assigned: 'Assigned', in_progress: 'In Progress',
        escalated: 'Escalated', resolved: 'Resolved', rejected: 'Rejected',
      };
      await supabase.from('notifications').insert({
        user_id: complaint.user_id,
        title: `Complaint ${complaint.complaint_id} — ${statusLabels[newStatus] || newStatus}`,
        message: `Your complaint status was updated to "${statusLabels[newStatus] || newStatus}" by ${appUser.display_name}.`,
        type: newStatus === 'resolved' ? 'success' : newStatus === 'escalated' ? 'escalation' : newStatus === 'rejected' ? 'error' : 'info',
        complaint_id: complaintUuid,
      });
    }

    await fetchComplaints();
  }, [appUser, complaints]);

  const addNote = useCallback(async (complaintUuid: string, content: string) => {
    if (!appUser) return;

    await supabase.from('complaint_notes').insert({
      complaint_id: complaintUuid,
      user_id: appUser.id,
      user_name: appUser.display_name,
      content,
    });

    await supabase.from('audit_logs').insert({
      complaint_id: complaintUuid,
      action: 'note_added',
      user_name: appUser.display_name,
      details: `Note added: "${content.substring(0, 50)}..."`,
    });

    await fetchComplaints();
  }, [appUser]);

  const addFeedback = useCallback(async (complaintUuid: string, rating: number, comment: string) => {
    if (!appUser) return;

    await supabase.from('feedback').insert({
      complaint_id: complaintUuid,
      user_id: appUser.id,
      rating,
      comment,
    });

    await supabase.from('audit_logs').insert({
      complaint_id: complaintUuid,
      action: 'feedback',
      user_name: appUser.display_name,
      details: `Rated ${rating}/5 stars`,
    });

    await fetchComplaints();
  }, [appUser]);

  const updateUserRole = useCallback(async (userId: string, newRole: UserRole) => {
    if (!appUser || appUser.role !== 'superadmin') return { error: 'Unauthorized' };
    const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('user_id', userId);
    if (error) return { error: error.message };
    await fetchUsers();
    return { error: null };
  }, [appUser]);

  const exportComplaintsCSV = useCallback(() => {
    const headers = ['Complaint ID', 'Title', 'Category', 'Priority', 'Status', 'Sentiment', 'Department', 'Created At', 'SLA Deadline'];
    const rows = complaints.map(c => [
      c.complaint_id, c.title, c.category, c.priority, c.status, c.sentiment, c.department_name,
      new Date(c.created_at).toLocaleString(), c.sla_deadline ? new Date(c.sla_deadline).toLocaleString() : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intelliresolve-complaints-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [complaints]);

  return {
    authUser,
    currentUser: appUser,
    complaints,
    departments,
    institutions,
    managedUsers,
    loading,
    authLoading,
    signup,
    login,
    logout,
    changePassword,
    updateProfile,
    uploadAttachment,
    submitComplaint,
    updateComplaintStatus,
    addNote,
    addFeedback,
    updateUserRole,
    exportComplaintsCSV,
    refreshComplaints: fetchComplaints,
  };
}