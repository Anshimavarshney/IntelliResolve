import { useState, useEffect, useCallback } from 'react';
import type { User, Complaint, UserRole, ComplaintStatus, AuditEntry } from './types';
import { DEPARTMENTS, SLA_HOURS } from './types';
import { analyzeComplaint } from './ai-engine';

const STORAGE_KEY = 'intelliresolve_system';

interface AppState {
  currentUser: User | null;
  users: User[];
  complaints: Complaint[];
}

const DEFAULT_USERS: User[] = [
  { id: 'u1', name: 'Rahul Sharma', email: 'rahul@student.edu', role: 'student', institution_id: 'inst-1' },
  { id: 'u2', name: 'Priya Patel', email: 'priya@student.edu', role: 'student', institution_id: 'inst-1' },
  { id: 'u3', name: 'Dr. Anil Kumar', email: 'anil@staff.edu', role: 'staff', department_id: 'dept-1', institution_id: 'inst-1' },
  { id: 'u4', name: 'Sunita Verma', email: 'sunita@staff.edu', role: 'staff', department_id: 'dept-3', institution_id: 'inst-1' },
  { id: 'u5', name: 'Ravi Mehta', email: 'ravi@staff.edu', role: 'staff', department_id: 'dept-2', institution_id: 'inst-1' },
  { id: 'u6', name: 'Neha Singh', email: 'neha@staff.edu', role: 'staff', department_id: 'dept-4', institution_id: 'inst-1' },
  { id: 'u7', name: 'Prof. Rajesh Gupta', email: 'rajesh@admin.edu', role: 'admin', institution_id: 'inst-1' },
  { id: 'u8', name: 'System Admin', email: 'sysadmin@edu', role: 'superadmin', institution_id: 'inst-1' },
];

function getStaffWorkload(users: User[], complaints: Complaint[], deptId: string): User | null {
  const deptStaff = users.filter(u => u.role === 'staff' && u.department_id === deptId);
  if (deptStaff.length === 0) return null;
  let minLoad = Infinity;
  let best: User = deptStaff[0];
  for (const s of deptStaff) {
    const load = complaints.filter(c => c.department_id === s.department_id && c.status !== 'resolved').length;
    if (load < minLoad) { minLoad = load; best = s; }
  }
  return best;
}

function generateSampleComplaints(): Complaint[] {
  const samples = [
    { title: 'Exam results not published', desc: 'The results for the final semester exam have not been published yet. It has been 3 weeks and this is causing a lot of stress. This is urgent!', userId: 'u1' },
    { title: 'Hostel water supply issue', desc: 'There is no water supply in hostel block B since yesterday. The bathroom and toilets are unusable. Multiple complaints from roommates.', userId: 'u2' },
    { title: 'Fee payment portal error', desc: 'The fee payment portal keeps showing an error when I try to pay. I have tried multiple times with different browsers. Login works but payment fails.', userId: 'u1' },
    { title: 'Poor mess food quality', desc: 'The mess food quality has been terrible this week. Found insects in the food yesterday. This is disgusting and unacceptable!', userId: 'u2' },
    { title: 'Library access issue', desc: 'I would like to suggest extending library hours during exam season. It would be nice if we could access it until midnight.', userId: 'u1' },
    { title: 'WiFi not working in hostel', desc: 'The WiFi internet connection in hostel block C has been down for 3 days. We cannot attend online classes or submit assignments. This is very frustrating!', userId: 'u2' },
    { title: 'Scholarship disbursement delayed', desc: 'My scholarship amount for last semester has not been credited yet. The office keeps giving different dates. Need immediate resolution.', userId: 'u1' },
    { title: 'Lab equipment not working', desc: 'Multiple computers in the computer lab are broken. The projector does not work properly. This affects our practical sessions.', userId: 'u2' },
  ];

  const statuses: ComplaintStatus[] = ['pending', 'assigned', 'in_progress', 'resolved', 'pending', 'escalated', 'assigned', 'in_progress'];
  return samples.map((s, i) => {
    const ai = analyzeComplaint(s.desc);
    const dept = DEPARTMENTS.find(d => d.category === ai.category) || DEPARTMENTS[0];
    const created = new Date(Date.now() - (i + 1) * 86400000 * Math.ceil((i + 1) / 2));
    const slaDeadline = new Date(created.getTime() + SLA_HOURS[ai.priority] * 3600000);
    const status = statuses[i];
    return {
      id: `GRV-${1001 + i}`,
      user_id: s.userId,
      user_name: DEFAULT_USERS.find(u => u.id === s.userId)!.name,
      title: s.title,
      description: s.desc,
      category: ai.category,
      priority: ai.priority,
      sentiment: ai.sentiment,
      status,
      department_id: dept.id,
      department_name: dept.name,
      ai_analysis: ai,
      sla_deadline: slaDeadline.toISOString(),
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
      is_anonymous: false,
      institution_id: 'inst-1',
      notes: i === 2 ? [{ id: 'n1', user_id: 'u3', user_name: 'Dr. Anil Kumar', content: 'Looking into the portal issue.', created_at: new Date().toISOString() }] : [],
      timeline: [
        { id: `t${i}-1`, status: 'pending', description: 'Complaint submitted', user_name: 'System', created_at: created.toISOString() },
        ...(status !== 'pending' ? [{ id: `t${i}-2`, status: 'assigned' as ComplaintStatus, description: `Assigned to ${dept.name}`, user_name: 'AI System', created_at: new Date(created.getTime() + 3600000).toISOString() }] : []),
        ...(status === 'in_progress' || status === 'resolved' ? [{ id: `t${i}-3`, status: 'in_progress' as ComplaintStatus, description: 'Staff is working on this', user_name: dept.name, created_at: new Date(created.getTime() + 7200000).toISOString() }] : []),
        ...(status === 'resolved' ? [{ id: `t${i}-4`, status: 'resolved' as ComplaintStatus, description: 'Issue has been resolved', user_name: dept.name, created_at: new Date(created.getTime() + 86400000).toISOString() }] : []),
        ...(status === 'escalated' ? [{ id: `t${i}-5`, status: 'escalated' as ComplaintStatus, description: 'Escalated: SLA deadline exceeded', user_name: 'System', created_at: new Date(created.getTime() + 86400000 * 2).toISOString() }] : []),
      ],
      audit_log: [
        { id: `a${i}-1`, action: 'created', user_name: 'System', details: 'Complaint created', created_at: created.toISOString() },
        { id: `a${i}-2`, action: 'ai_classified', user_name: 'AI Engine', details: `Category: ${ai.category}, Priority: ${ai.priority}, Sentiment: ${ai.sentiment}`, created_at: created.toISOString() },
      ],
      feedback: status === 'resolved' ? { rating: 4, comment: 'Issue was resolved quickly.' } : undefined,
    };
  });
}

function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old data: add audit_log if missing
      if (parsed.complaints) {
        parsed.complaints = parsed.complaints.map((c: any) => ({
          ...c,
          audit_log: c.audit_log || [],
        }));
      }
      return parsed;
    }
  } catch {}
  return { currentUser: null, users: DEFAULT_USERS, complaints: generateSampleComplaints() };
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => { saveState(state); }, [state]);

  // Auto-escalation check
  useEffect(() => {
    const now = new Date();
    const needsEscalation = state.complaints.filter(
      c => c.status !== 'resolved' && c.status !== 'escalated' && new Date(c.sla_deadline) < now
    );
    if (needsEscalation.length > 0) {
      setState(s => ({
        ...s,
        complaints: s.complaints.map(c => {
          if (c.status === 'resolved' || c.status === 'escalated') return c;
          if (new Date(c.sla_deadline) >= now) return c;
          return {
            ...c,
            status: 'escalated' as ComplaintStatus,
            updated_at: now.toISOString(),
            timeline: [...c.timeline, { id: `esc-${c.id}`, status: 'escalated' as ComplaintStatus, description: 'Auto-escalated: SLA deadline exceeded', user_name: 'System', created_at: now.toISOString() }],
            audit_log: [...(c.audit_log || []), { id: `audit-esc-${c.id}`, action: 'escalated', user_name: 'System', details: 'Auto-escalated due to SLA breach', created_at: now.toISOString() }],
          };
        }),
      }));
    }
  }, []);

  const login = useCallback((email: string, _password: string, role?: UserRole) => {
    const user = state.users.find(u => u.email === email) ||
      (role ? { id: `u-${Date.now()}`, name: email.split('@')[0], email, role, department_id: undefined, institution_id: 'inst-1' } : null);
    if (user) {
      const updatedUsers = state.users.some(u => u.id === user.id) ? state.users : [...state.users, user];
      setState(s => ({ ...s, currentUser: user, users: updatedUsers }));
      return true;
    }
    return false;
  }, [state.users]);

  const loginAs = useCallback((role: UserRole) => {
    const user = state.users.find(u => u.role === role);
    if (user) setState(s => ({ ...s, currentUser: user }));
  }, [state.users]);

  const logout = useCallback(() => {
    setState(s => ({ ...s, currentUser: null }));
  }, []);

  const submitComplaint = useCallback((title: string, description: string, isAnonymous: boolean) => {
    if (!state.currentUser) return;
    const ai = analyzeComplaint(description);
    const dept = DEPARTMENTS.find(d => d.category === ai.category) || DEPARTMENTS[0];
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + SLA_HOURS[ai.priority] * 3600000);
    const id = `GRV-${1000 + state.complaints.length + 1}`;
    const assignedStaff = getStaffWorkload(state.users, state.complaints, dept.id);

    const complaint: Complaint = {
      id, user_id: state.currentUser.id, user_name: isAnonymous ? 'Anonymous' : state.currentUser.name,
      title: title || ai.suggested_title || 'Untitled', description, category: ai.category, priority: ai.priority,
      sentiment: ai.sentiment, status: assignedStaff ? 'assigned' : 'pending', department_id: dept.id, department_name: dept.name,
      ai_analysis: ai, sla_deadline: slaDeadline.toISOString(), created_at: now.toISOString(),
      updated_at: now.toISOString(), is_anonymous: isAnonymous, institution_id: state.currentUser.institution_id, notes: [],
      timeline: [
        { id: `t-${Date.now()}`, status: 'pending', description: 'Complaint submitted', user_name: 'System', created_at: now.toISOString() },
        ...(assignedStaff ? [{ id: `t-${Date.now()}-a`, status: 'assigned' as ComplaintStatus, description: `Auto-assigned to ${dept.name} (${assignedStaff.name}) based on workload`, user_name: 'AI System', created_at: now.toISOString() }] : []),
      ],
      audit_log: [
        { id: `a-${Date.now()}-1`, action: 'created', user_name: state.currentUser.name, details: `Complaint submitted${isAnonymous ? ' (anonymous)' : ''}`, created_at: now.toISOString() },
        { id: `a-${Date.now()}-2`, action: 'ai_classified', user_name: 'AI Engine', details: `Category: ${ai.category}, Priority: ${ai.priority} (score: ${ai.priority_score}%), Sentiment: ${ai.sentiment}`, created_at: now.toISOString() },
        { id: `a-${Date.now()}-3`, action: 'routed', user_name: 'AI Engine', details: `Routed to ${dept.name}${assignedStaff ? ` (assigned to ${assignedStaff.name})` : ''}`, created_at: now.toISOString() },
      ],
    };
    setState(s => ({ ...s, complaints: [complaint, ...s.complaints] }));
    return complaint;
  }, [state.currentUser, state.complaints.length, state.users]);

  const updateComplaintStatus = useCallback((complaintId: string, newStatus: ComplaintStatus) => {
    setState(s => ({
      ...s,
      complaints: s.complaints.map(c => {
        if (c.id !== complaintId) return c;
        const now = new Date().toISOString();
        return {
          ...c, status: newStatus, updated_at: now,
          timeline: [...c.timeline, { id: `t-${Date.now()}`, status: newStatus, description: `Status changed to ${newStatus}`, user_name: s.currentUser?.name || 'System', created_at: now }],
          audit_log: [...(c.audit_log || []), { id: `audit-${Date.now()}`, action: 'status_change', user_name: s.currentUser?.name || 'System', details: `Status changed from ${c.status} to ${newStatus}`, created_at: now }],
        };
      }),
    }));
  }, []);

  const addNote = useCallback((complaintId: string, content: string) => {
    if (!state.currentUser) return;
    setState(s => ({
      ...s,
      complaints: s.complaints.map(c => {
        if (c.id !== complaintId) return c;
        const now = new Date().toISOString();
        return {
          ...c,
          notes: [...c.notes, { id: `n-${Date.now()}`, user_id: s.currentUser!.id, user_name: s.currentUser!.name, content, created_at: now }],
          audit_log: [...(c.audit_log || []), { id: `audit-n-${Date.now()}`, action: 'note_added', user_name: s.currentUser!.name, details: `Note added: "${content.substring(0, 50)}..."`, created_at: now }],
        };
      }),
    }));
  }, [state.currentUser]);

  const addFeedback = useCallback((complaintId: string, rating: number, comment: string) => {
    setState(s => ({
      ...s,
      complaints: s.complaints.map(c => {
        if (c.id !== complaintId) return { ...c };
        const now = new Date().toISOString();
        return {
          ...c,
          feedback: { rating, comment },
          audit_log: [...(c.audit_log || []), { id: `audit-fb-${Date.now()}`, action: 'feedback', user_name: 'Student', details: `Rated ${rating}/5 stars`, created_at: now }],
        };
      }),
    }));
  }, []);

  const resetData = useCallback(() => {
    const freshState: AppState = { currentUser: state.currentUser, users: DEFAULT_USERS, complaints: generateSampleComplaints() };
    setState(freshState);
  }, [state.currentUser]);

  return { ...state, login, loginAs, logout, submitComplaint, updateComplaintStatus, addNote, addFeedback, resetData };
}
