import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store-context';
import { useSupabaseStore, type AppComplaint, type ManagedUser, type UserRole } from '@/lib/supabase-store';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppSidebar } from '@/components/AppSidebar';
import { StatCard, PriorityBadge, StatusBadge, CategoryBadge, AIExplanationBox, ComplaintTimeline, SentimentBadge, SLAIndicator, AuditLog, Pagination } from '@/components/UIComponents';
import { FileText, Clock, AlertTriangle, CheckCircle, PlusCircle, Search, Star, Send, ArrowLeft, Brain, BarChart3, Users, TrendingUp, Zap, Shield, Activity, Timer, Target, ChevronDown, ClipboardList, Loader2, Download, Paperclip, Eye, EyeOff, Settings, RefreshCw, Upload, X, Mic, MicOff, Languages } from 'lucide-react';
import { analyzeComplaint, checkDuplicates } from '@/lib/ai-engine';
import { AIChatbot } from '@/components/AIChatbot';
import { NotificationBell } from '@/components/NotificationBell';
import type { ComplaintCategory, ComplaintStatus } from '@/lib/types';
import { CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { I18nProvider, useI18n, LanguageSwitcher } from '@/lib/i18n';
import { useVoiceInput, isVoiceSupported } from '@/lib/voice';
import { ComplaintChat } from '@/components/ComplaintChat';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoute,
  head: () => ({
    meta: [
      { title: 'Dashboard — IntelliResolve' },
      { name: 'description', content: 'Manage and track complaints with AI-powered analytics.' },
    ],
  }),
});

function DashboardRoute() {
  const store = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!store.authLoading && !store.currentUser) {
      navigate({ to: '/login', search: {} });
    }
  }, [store.authLoading, store.currentUser, navigate]);

  if (store.authLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading IntelliResolve...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!store.currentUser) return null;

  return (
    <ThemeProvider>
      <I18nProvider>
        <div className="flex min-h-screen">
          <AppContent store={store} />
          <AIChatbot />
        </div>
      </I18nProvider>
    </ThemeProvider>
  );
}

function AppContent({ store }: { store: ReturnType<typeof useSupabaseStore> }) {
  const [view, setView] = useState('dashboard');
  return (
    <>
      <AppSidebar role={store.currentUser!.role} userName={store.currentUser!.display_name} onLogout={store.logout} activeView={view} onNavigate={setView} />
      <MainContent store={store} view={view} setView={setView} />
    </>
  );
}

function MainContent({ store, view, setView }: { store: ReturnType<typeof useSupabaseStore>; view: string; setView: (v: string) => void }) {
  const [selectedComplaint, setSelectedComplaint] = useState<AppComplaint | null>(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const user = store.currentUser!;
  const role = user.role;

  const complaints = store.complaints.filter(c => {
    if (role === 'student') return c.user_id === user.id;
    if (role === 'staff') {
      // If staff has a department, scope to that dept + assigned-to-me;
      // otherwise show all (so unassigned staff can still triage).
      if (user.department_id) {
        return c.department_id === user.department_id || c.assigned_to === user.id;
      }
      return true;
    }
    return true;
  });

  const filtered = complaints.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase()) && !c.complaint_id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  if (selectedComplaint) {
    return <ComplaintDetail complaint={selectedComplaint} store={store} onBack={() => { setSelectedComplaint(null); store.refreshComplaints(); }} />;
  }
  if (view === 'submit') {
    return <SubmitComplaint store={store} onBack={() => setView('dashboard')} />;
  }
  if (view === 'analytics') {
    return <AnalyticsView complaints={store.complaints} role={role} />;
  }
  if (view === 'users') {
    return <UsersManagement store={store} />;
  }
  if (view === 'settings') {
    return <ProfileSettings store={store} />;
  }
  const isListOnly = view === 'complaints';

  const pending = complaints.filter(c => c.status === 'pending').length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;
  const high = complaints.filter(c => c.priority === 'high').length;
  const escalated = complaints.filter(c => c.status === 'escalated').length;
  const slaBreached = complaints.filter(c => c.status !== 'resolved' && c.status !== 'rejected' && c.sla_deadline && new Date(c.sla_deadline) < new Date()).length;
  const avgResolution = (() => {
    const resolvedC = complaints.filter(c => c.status === 'resolved');
    if (resolvedC.length === 0) return '—';
    const avg = resolvedC.reduce((sum, c) => sum + (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()), 0) / resolvedC.length;
    const hours = Math.round(avg / 3600000);
    return hours > 24 ? `${Math.round(hours / 24)}d` : `${hours}h`;
  })();

  return (
    <main className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-8 md:pt-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{isListOnly ? (role === 'student' ? 'My Complaints' : role === 'staff' ? 'Assigned Complaints' : 'All Complaints') : `Welcome, ${user.display_name}`}</h1>
            <p className="text-sm text-muted-foreground capitalize">{role} Dashboard · IntelliResolve</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <NotificationBell userId={user.id} />
            {role === 'student' && (
              <button onClick={() => setView('submit')} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                <PlusCircle className="h-4 w-4" /> New Complaint
              </button>
            )}
            {(role === 'admin' || role === 'superadmin') && (
              <button onClick={store.exportComplaintsCSV} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                <Download className="h-4 w-4" /> Export CSV
              </button>
            )}
          </div>
        </div>

        {/* SLA Breach Alerts */}
        {slaBreached > 0 && (role === 'admin' || role === 'superadmin' || role === 'staff') && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-bold text-destructive">⚠️ {slaBreached} complaint(s) have breached SLA deadline!</p>
              <p className="text-xs text-muted-foreground">Immediate attention required. These should be escalated.</p>
            </div>
          </div>
        )}

        {store.loading ? (
          <div className="text-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading complaints...</p>
          </div>
        ) : (
          <>
            {!isListOnly && (
              <div className={`grid grid-cols-2 ${role === 'superadmin' ? 'lg:grid-cols-6' : 'lg:grid-cols-4'} gap-3 md:gap-4`}>
                <StatCard title="Total" value={complaints.length} icon={<FileText className="h-5 w-5 md:h-6 md:w-6" />} variant="primary" />
                <StatCard title="Pending" value={pending} icon={<Clock className="h-5 w-5 md:h-6 md:w-6" />} variant="warning" />
                <StatCard title="Resolved" value={resolved} icon={<CheckCircle className="h-5 w-5 md:h-6 md:w-6" />} variant="success" />
                <StatCard title="High Priority" value={high} icon={<AlertTriangle className="h-5 w-5 md:h-6 md:w-6" />} variant="destructive" />
                {role === 'superadmin' && (
                  <>
                    <StatCard title="Escalated" value={escalated} icon={<Shield className="h-5 w-5 md:h-6 md:w-6" />} variant="destructive" subtitle={`${slaBreached} SLA breached`} />
                    <StatCard title="Avg Resolution" value={avgResolution} icon={<Timer className="h-5 w-5 md:h-6 md:w-6" />} variant="info" />
                  </>
                )}
              </div>
            )}

            {!isListOnly && (role === 'admin' || role === 'superadmin') && <DashboardCharts complaints={store.complaints} isSuperAdmin={role === 'superadmin'} />}
            {!isListOnly && (role === 'admin' || role === 'superadmin') && <ComplaintClusters complaints={store.complaints} />}

            <div className="flex flex-col md:flex-row flex-wrap gap-3 items-stretch md:items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search complaints..." className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card text-sm" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border bg-card text-sm">
                  <option value="all">All Priorities</option>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border bg-card text-sm">
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border bg-card text-sm">
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border">
                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No complaints found</p>
                {role === 'student' && <button onClick={() => setView('submit')} className="mt-3 text-sm text-primary font-medium">Submit your first complaint →</button>}
              </div>
            ) : (
              <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="md:hidden divide-y">
                  {paginated.map(c => (
                    <button key={c.id} onClick={() => setSelectedComplaint(c)} className="w-full p-4 text-left hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-medium text-sm">{c.title}</span>
                        <PriorityBadge priority={c.priority} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">{c.complaint_id}</span>
                        <StatusBadge status={c.status as ComplaintStatus} />
                        <CategoryBadge category={c.category} />
                        <SLAIndicator deadline={c.sla_deadline} status={c.status as ComplaintStatus} />
                      </div>
                    </button>
                  ))}
                </div>
                <table className="w-full hidden md:table">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Priority</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">SLA</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  </tr></thead>
                  <tbody>
                    {paginated.map(c => (
                      <tr key={c.id} onClick={() => setSelectedComplaint(c)} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{c.complaint_id}</td>
                        <td className="px-4 py-3 text-sm font-medium max-w-[200px] truncate">{c.title}</td>
                        <td className="px-4 py-3"><CategoryBadge category={c.category} /></td>
                        <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={c.status as ComplaintStatus} /></td>
                        <td className="px-4 py-3"><SLAIndicator deadline={c.sla_deadline} status={c.status as ComplaintStatus} /></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* ─── Submit Complaint ─── */
function SubmitComplaint({ store, onBack }: { store: ReturnType<typeof useSupabaseStore>; onBack: () => void }) {
  const { t, lang } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiPreview, setAiPreview] = useState<ReturnType<typeof analyzeComplaint> | null>(null);
  const [duplicates, setDuplicates] = useState<ReturnType<typeof checkDuplicates>>([]);
  const [submitted, setSubmitted] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const baseDescRef = useRef('');

  const voice = useVoiceInput({
    lang,
    onTranscript: (txt, isFinal) => {
      if (isFinal) {
        const next = (baseDescRef.current ? baseDescRef.current + ' ' : '') + txt.trim();
        baseDescRef.current = next;
        setDescription(next);
      } else {
        setDescription((baseDescRef.current ? baseDescRef.current + ' ' : '') + txt);
      }
    },
    onError: (err) => toast.error(err === 'not-allowed' ? 'Microphone permission denied.' : `Voice error: ${err}`),
  });

  const toggleVoice = () => {
    if (!isVoiceSupported()) {
      toast.error(t('submit.voice.unsupported'));
      return;
    }
    if (voice.listening) {
      voice.stop();
    } else {
      baseDescRef.current = description;
      voice.start();
    }
  };

  const handlePreview = () => {
    if (description.length < 10) return;
    const resolved = store.complaints.filter(c => c.status === 'resolved').map(c => ({ description: c.description, title: c.title, category: c.category }));
    const analysis = analyzeComplaint(description, resolved);
    setAiPreview(analysis);
    if (!title && analysis.suggested_title) setTitle(analysis.suggested_title);
  };

  // Live duplicate detection (debounced) — show similar complaints BEFORE submission
  useEffect(() => {
    if (description.trim().length < 15) { setDuplicates([]); return; }
    const t = setTimeout(() => {
      const dups = checkDuplicates(description, store.complaints.map(c => ({ id: c.complaint_id, title: c.title, description: c.description })));
      setDuplicates(dups);
    }, 500);
    return () => clearTimeout(t);
  }, [description, store.complaints]);

  // Auto-routing hint based on current AI preview (or quick analysis)
  const routingHint = useMemo(() => {
    if (description.trim().length < 10) return null;
    const cat = aiPreview?.category || analyzeComplaint(description).category;
    const dept = store.departments.find(d => d.category === cat);
    return dept ? { dept: dept.name, category: cat } : null;
  }, [description, aiPreview, store.departments]);

  const submitLockRef = useRef(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Hard client-side lock — guards against double-clicks, Enter-key repeats,
    // and React StrictMode double invocations creating duplicate inserts.
    if (submitLockRef.current || submitting) return;
    if (description.trim().length < 10) {
      toast.error('Please add a more detailed description (min 10 characters).');
      return;
    }
    submitLockRef.current = true;
    setSubmitting(true);
    try {
      let attachmentUrl: string | undefined;
      if (file) {
        setUploading(true);
        attachmentUrl = (await store.uploadAttachment(file)) || undefined;
        setUploading(false);
        if (!attachmentUrl) toast.warning('Attachment upload failed — submitting without it.');
      }
      const result = await store.submitComplaint(title, description, false, attachmentUrl);
      if (result) {
        toast.success(`Complaint ${result.complaint_id} submitted successfully!`);
        setSubmitted(result);
      } else {
        toast.error('Failed to submit complaint. Please try again.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
      setUploading(false);
      // Release lock slightly after state flush so rapid re-clicks during the
      // same tick are still ignored.
      setTimeout(() => { submitLockRef.current = false; }, 300);
    }
  };

  if (submitted) {
    return (
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-2xl mx-auto text-center py-16 pt-12 md:pt-16">
          <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Complaint Submitted!</h2>
          <p className="text-muted-foreground mb-4">Your complaint ID: <span className="font-mono font-bold text-primary">{submitted.complaint_id}</span></p>
          <p className="text-sm text-muted-foreground mb-6">Routed to <span className="font-medium">{submitted.department_name}</span> with {submitted.priority?.toUpperCase()} priority</p>
          {submitted.ai_analysis && <AIExplanationBox analysis={submitted.ai_analysis} />}
          <button onClick={onBack} className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Back to Dashboard</button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-3xl mx-auto space-y-6 pt-10 md:pt-0">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('submit.back')}
        </button>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t('submit.title')}</h1>
          <LanguageSwitcher />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-card rounded-xl border p-4 md:p-6 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{t('submit.field.title')}</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('submit.field.title.placeholder')} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">{t('submit.field.description')} <span className="text-destructive">*</span></label>
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${voice.listening ? 'bg-destructive text-destructive-foreground border-destructive animate-pulse' : 'bg-background hover:bg-accent'}`}
                  title={voice.supported ? '' : t('submit.voice.unsupported')}
                >
                  {voice.listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {voice.listening ? t('submit.voice.listening') : t('submit.voice.start')}
                </button>
              </div>
              <textarea value={description} onChange={e => { setDescription(e.target.value); baseDescRef.current = e.target.value; }} placeholder={t('submit.field.description.placeholder')} rows={5} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm resize-none" required />
              <p className="text-xs text-muted-foreground mt-1">{description.length} {t('submit.charsHint')}</p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{t('submit.field.attachment')}</label>
              <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-accent transition-colors">
                  <Paperclip className="h-4 w-4" /> {file ? t('submit.change') : t('submit.attach')}
                </button>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs">({(file.size / 1024).toFixed(0)} KB)</span>
                    <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-destructive hover:text-destructive/80">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button type="button" onClick={handlePreview} disabled={description.length < 10} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
              <Zap className="h-4 w-4" /> {t('submit.aiPreview')}
            </button>
            <button type="submit" disabled={description.length < 10 || submitting} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {uploading ? t('submit.uploading') : t('submit.cta')}
            </button>
          </div>
        </form>

        {routingHint && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-primary shrink-0" />
            <span>{t('submit.routing')} <span className="font-medium text-primary">{routingHint.dept}</span> <span className="text-muted-foreground">({CATEGORY_LABELS[routingHint.category]})</span></span>
          </div>
        )}

        {duplicates.length > 0 && (
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 space-y-2">
            <p className="font-medium text-warning text-sm">{t('submit.duplicates')}</p>
            {duplicates.map(d => (
              <p key={d.id} className="text-sm text-muted-foreground">• <span className="font-mono">{d.id}</span> — {d.title} (<span className="font-bold">{d.score}%</span> similarity)</p>
            ))}
            <p className="text-xs text-muted-foreground pt-1">{t('submit.duplicates.hint')}</p>
          </div>
        )}

        {aiPreview && <AIExplanationBox analysis={aiPreview} />}
      </div>
    </main>
  );
}

/* ─── Complaint Detail ─── */
function ComplaintDetail({ complaint, store, onBack }: { complaint: AppComplaint; store: ReturnType<typeof useSupabaseStore>; onBack: () => void }) {
  const { t, lang } = useI18n();
  const [noteText, setNoteText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [newStatus, setNewStatus] = useState(complaint.status);
  const [showAudit, setShowAudit] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const role = store.currentUser!.role;
  const isOwner = store.currentUser!.id === complaint.user_id;
  const slaExpired = complaint.sla_deadline && new Date(complaint.sla_deadline) < new Date() && complaint.status !== 'resolved' && complaint.status !== 'rejected';

  const handleReopen = async () => {
    await store.updateComplaintStatus(complaint.id, 'pending');
    onBack();
  };

  const handleTranslate = async () => {
    if (translated) { setTranslated(null); return; }
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { text: complaint.description, target: lang },
      });
      if (error) throw error;
      const out = (data as any)?.translated;
      if (!out) throw new Error('Empty translation');
      setTranslated(out);
    } catch (e: any) {
      toast.error(e?.message || 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  const canChat = isOwner || role === 'staff' || role === 'admin' || role === 'superadmin';

  return (
    <main className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-6 pt-10 md:pt-0">
        <div className="flex items-center justify-between gap-3">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> {t('detail.back')}
          </button>
          <LanguageSwitcher />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border p-4 md:p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-lg md:text-xl font-bold">{complaint.title}</h1>
                <SLAIndicator deadline={complaint.sla_deadline} status={complaint.status as ComplaintStatus} />
              </div>
              <p className="text-sm text-muted-foreground mb-4">{complaint.complaint_id} · {complaint.is_anonymous ? 'Anonymous' : complaint.user_name} · {new Date(complaint.created_at).toLocaleString()}</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{translated ?? complaint.description}</p>
              <button
                type="button"
                onClick={handleTranslate}
                disabled={translating}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                <Languages className="h-3.5 w-3.5" />
                {translating ? t('detail.translating') : translated ? t('detail.translate.original') : `${t('detail.translate')} → ${lang === 'hi' ? 'हिन्दी' : 'English'}`}
              </button>
              {complaint.attachment_url && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium mb-2">📎 Attachment</p>
                  {complaint.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={complaint.attachment_url} alt="Attachment" className="max-w-full max-h-64 rounded-lg border" />
                  ) : (
                    <a href={complaint.attachment_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">View Attachment →</a>
                  )}
                </div>
              )}
            </div>

            <AIExplanationBox analysis={complaint.ai_analysis} />

            {canChat && (
              <ComplaintChat
                complaintId={complaint.id}
                currentUserId={store.currentUser!.id}
                currentUserName={store.currentUser!.display_name}
                currentUserRole={role}
              />
            )}

            <div className="bg-card rounded-xl border p-4 md:p-6 space-y-4">
              <h3 className="font-bold">💬 Notes & Communication</h3>
              {complaint.notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
              {complaint.notes.map(n => (
                <div key={n.id} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm">{n.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.user_name} · {new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
              {(role === 'staff' || role === 'admin' || role === 'superadmin') && (
                <div className="flex gap-2">
                  <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm" />
                  <button onClick={async () => { if (noteText.trim()) { await store.addNote(complaint.id, noteText); setNoteText(''); } }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Add</button>
                </div>
              )}
            </div>

            {/* Student Feedback */}
            {role === 'student' && isOwner && complaint.status === 'resolved' && !complaint.feedback && (
              <div className="bg-card rounded-xl border p-4 md:p-6 space-y-3">
                <h3 className="font-bold">⭐ Rate the Resolution</h3>
                <p className="text-xs text-muted-foreground">How satisfied are you with how this complaint was resolved?</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setFeedbackRating(s)} className="hover:scale-110 transition-transform">
                      <Star className={`h-7 w-7 ${s <= feedbackRating ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
                    </button>
                  ))}
                  {feedbackRating > 0 && <span className="ml-2 self-center text-sm font-medium">{feedbackRating}/5</span>}
                </div>
                <textarea value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} placeholder="Share your experience (optional)" rows={2} className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none" />
                <button
                  onClick={async () => {
                    if (feedbackRating === 0) { toast.error('Please select a star rating before submitting.'); return; }
                    await store.addFeedback(complaint.id, feedbackRating, feedbackComment);
                    toast.success(`Thanks for your feedback! You rated ${feedbackRating}/5 stars.`);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Submit Feedback
                </button>
              </div>
            )}
            {complaint.feedback && (
              <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                <p className="text-sm font-medium">✅ Your feedback: {'⭐'.repeat(complaint.feedback.rating)} ({complaint.feedback.rating}/5)</p>
                {complaint.feedback.comment && <p className="text-xs text-muted-foreground mt-1">"{complaint.feedback.comment}"</p>}
              </div>
            )}

            {/* Reopen Complaint */}
            {role === 'student' && isOwner && (complaint.status === 'resolved' || complaint.status === 'rejected') && (
              <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Not satisfied with the resolution?</p>
                  <p className="text-xs text-muted-foreground">You can reopen this complaint for further review.</p>
                </div>
                <button onClick={handleReopen} className="flex items-center gap-2 px-4 py-2 bg-warning text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                  <RefreshCw className="h-4 w-4" /> Reopen
                </button>
              </div>
            )}

            {/* Audit Trail */}
            {(role === 'admin' || role === 'superadmin') && (
              <div className="bg-card rounded-xl border p-4 md:p-6">
                <button onClick={() => setShowAudit(!showAudit)} className="flex items-center gap-2 w-full">
                  <ClipboardList className="h-4 w-4" />
                  <h3 className="font-bold text-sm">Audit Trail</h3>
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${showAudit ? 'rotate-180' : ''}`} />
                </button>
                {showAudit && <div className="mt-4"><AuditLog entries={complaint.audit_log || []} /></div>}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-xl border p-4 md:p-5 space-y-3">
              <h3 className="font-bold text-sm">📋 Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><CategoryBadge category={complaint.category} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><PriorityBadge priority={complaint.priority} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={complaint.status as ComplaintStatus} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sentiment</span><SentimentBadge sentiment={complaint.sentiment} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="font-medium text-xs">{complaint.department_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Urgency</span><span className="font-bold text-primary">{complaint.ai_analysis?.priority_score || 0}%</span></div>
                {complaint.ai_analysis?.category_confidence && (
                  <div className="flex justify-between"><span className="text-muted-foreground">AI Confidence</span><span className="font-bold text-primary">{complaint.ai_analysis.category_confidence}%</span></div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">SLA Deadline</span>
                  <span className={`text-xs font-medium ${slaExpired ? 'text-destructive' : ''}`}>
                    {slaExpired && '⚠️ '}{complaint.sla_deadline ? new Date(complaint.sla_deadline).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            </div>

            {(role === 'staff' || role === 'admin' || role === 'superadmin') && (
              <div className="bg-card rounded-xl border p-4 md:p-5 space-y-3">
                <h3 className="font-bold text-sm">🔄 Update Status</h3>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button onClick={async () => { await store.updateComplaintStatus(complaint.id, newStatus); toast.success(`Status updated to "${STATUS_LABELS[newStatus as ComplaintStatus] || newStatus}".`); }} className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Update</button>
                {slaExpired && complaint.status !== 'escalated' && (
                  <button onClick={async () => { await store.updateComplaintStatus(complaint.id, 'escalated'); toast.warning('Complaint escalated due to SLA breach.'); }} className="w-full py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium">🚨 Escalate (SLA Breached)</button>
                )}
              </div>
            )}

            <div className="bg-card rounded-xl border p-4 md:p-5">
              <h3 className="font-bold text-sm mb-3">📍 Timeline</h3>
              <ComplaintTimeline events={complaint.timeline} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─── Complaint Clusters (keyword-based) ─── */
const STOPWORDS = new Set(['the','a','an','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','can','this','that','these','those','i','we','they','he','she','it','you','my','our','their','his','her','its','for','to','of','in','on','at','by','with','from','as','and','or','but','not','no','so','if','then','than','about','very','too','also','just','only','more','some','any','all','because','due','need','please','sir','madam','here','there']);

function tokens(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOPWORDS.has(w));
}

function ComplaintClusters({ complaints }: { complaints: AppComplaint[] }) {
  const clusters = useMemo(() => {
    const active = complaints.filter(c => c.status !== 'resolved' && c.status !== 'rejected');
    const items = active.map(c => ({ c, set: new Set(tokens(`${c.title} ${c.description}`)) }));
    const visited = new Set<string>();
    const groups: { members: AppComplaint[]; sharedKeywords: string[]; category: ComplaintCategory }[] = [];

    for (let i = 0; i < items.length; i++) {
      if (visited.has(items[i].c.id)) continue;
      const seed = items[i];
      const members = [seed.c];
      visited.add(seed.c.id);
      let shared = new Set(seed.set);

      for (let j = i + 1; j < items.length; j++) {
        if (visited.has(items[j].c.id)) continue;
        if (items[j].c.category !== seed.c.category) continue;
        const cand = items[j];
        const intersection = new Set([...seed.set].filter(w => cand.set.has(w)));
        const union = new Set([...seed.set, ...cand.set]);
        const score = union.size > 0 ? intersection.size / union.size : 0;
        if (score >= 0.25 && intersection.size >= 2) {
          members.push(cand.c);
          visited.add(cand.c.id);
          shared = new Set([...shared].filter(w => cand.set.has(w)));
        }
      }

      if (members.length >= 2) {
        groups.push({
          members,
          sharedKeywords: [...shared].slice(0, 5),
          category: seed.c.category as ComplaintCategory,
        });
      }
    }

    return groups.sort((a, b) => b.members.length - a.members.length).slice(0, 6);
  }, [complaints]);

  if (clusters.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border p-4 md:p-5">
      <h3 className="font-bold text-sm mb-1">🧩 Trending Issue Clusters</h3>
      <p className="text-xs text-muted-foreground mb-3">Complaints grouped by shared keywords — one issue affecting many students.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {clusters.map((cl, idx) => {
          const high = cl.members.filter(m => m.priority === 'high').length;
          const summary = cl.sharedKeywords.length > 0
            ? `${cl.sharedKeywords.slice(0, 3).join(', ')} issue affecting ${cl.members.length} students`
            : `${cl.members.length} similar ${cl.category} complaints`;

          // Cluster-level status: resolved if all resolved; in-progress if any in_progress/assigned; else open
          const sortedMembers = [...cl.members].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          const resolvedCount = cl.members.filter(m => m.status === 'resolved').length;
          const activeCount = cl.members.filter(m => m.status === 'in_progress' || m.status === 'assigned').length;
          const clusterStatus: 'open' | 'in_progress' | 'resolved' =
            resolvedCount === cl.members.length ? 'resolved' : activeCount > 0 ? 'in_progress' : 'open';
          const statusStyle = clusterStatus === 'resolved'
            ? 'bg-success/10 text-success'
            : clusterStatus === 'in_progress'
            ? 'bg-warning/10 text-warning'
            : 'bg-info/10 text-info';
          const statusLabel = clusterStatus === 'in_progress' ? 'In Progress' : clusterStatus === 'resolved' ? 'Resolved' : 'Open';

          return (
            <div key={idx} className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CategoryBadge category={cl.category} />
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyle}`}>{statusLabel}</span>
                  <span className="text-sm font-bold">{cl.members.length} students</span>
                </div>
              </div>
              <p className="text-sm font-medium capitalize">{summary}</p>
              {cl.sharedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {cl.sharedKeywords.map(k => (
                    <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">#{k}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>✅ {resolvedCount} resolved · 🔧 {activeCount} active</span>
                {high > 0 && <span className="text-destructive font-medium">⚠ {high} high priority</span>}
              </div>
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground font-medium">📅 View cluster timeline</summary>
                <div className="mt-2 pl-1 space-y-0">
                  {sortedMembers.map((m, i) => {
                    const isDuplicate = i > 0;
                    const dotColor = m.status === 'resolved'
                      ? 'bg-success'
                      : m.status === 'in_progress' || m.status === 'assigned'
                      ? 'bg-warning'
                      : isDuplicate
                      ? 'bg-destructive'
                      : 'bg-primary';
                    return (
                      <div key={m.id} className="flex gap-2">
                        <div className="flex flex-col items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mt-1 ${dotColor}`} />
                          {i < sortedMembers.length - 1 && <div className="w-0.5 flex-1 bg-border min-h-[20px]" />}
                        </div>
                        <div className="pb-2 flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-foreground truncate">
                            {isDuplicate && <span className="text-destructive">🔁 Duplicate · </span>}
                            <span className="font-mono">{m.complaint_id}</span> {m.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(m.created_at).toLocaleString()} · <StatusBadge status={m.status as ComplaintStatus} />
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <div className={`h-2.5 w-2.5 rounded-full mt-1 ring-2 ring-offset-1 ring-offset-muted/50 ${clusterStatus === 'resolved' ? 'bg-success ring-success' : clusterStatus === 'in_progress' ? 'bg-warning ring-warning' : 'bg-info ring-info'}`} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-foreground">Cluster status: {statusLabel}</p>
                      <p className="text-[10px] text-muted-foreground">{resolvedCount}/{cl.members.length} complaints resolved</p>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Charts ─── */
const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function DashboardCharts({ complaints, isSuperAdmin }: { complaints: AppComplaint[]; isSuperAdmin: boolean }) {
  const categoryData = Object.entries(CATEGORY_LABELS).map(([k, v]) => ({
    name: v, value: complaints.filter(c => c.category === k).length,
  }));

  const deptData = [...new Set(complaints.map(c => c.department_name))].map(d => ({
    name: d.replace(' Department', '').replace(' Office', '').replace(' Management', ''),
    total: complaints.filter(c => c.department_name === d).length,
    resolved: complaints.filter(c => c.department_name === d && c.status === 'resolved').length,
  }));

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    return { name: key, count: complaints.filter(c => new Date(c.created_at).toDateString() === d.toDateString()).length };
  });

  const priorityData = Object.entries(PRIORITY_LABELS).map(([k, v]) => ({
    name: v, value: complaints.filter(c => c.priority === k).length,
  }));

  const sentimentData = [
    { name: 'Angry', value: complaints.filter(c => c.sentiment === 'angry').length },
    { name: 'Frustrated', value: complaints.filter(c => c.sentiment === 'frustrated').length },
    { name: 'Neutral', value: complaints.filter(c => c.sentiment === 'neutral').length },
    { name: 'Positive', value: complaints.filter(c => c.sentiment === 'positive').length },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-4 md:p-5">
          <h3 className="text-sm font-bold mb-3">📊 Category Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => value > 0 ? name : ''}>
              {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border p-4 md:p-5">
          <h3 className="text-sm font-bold mb-3">🏢 Department Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis /><Tooltip />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border p-4 md:p-5">
          <h3 className="text-sm font-bold mb-3">📈 Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={last7}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} /></LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border p-4 md:p-5">
            <h3 className="text-sm font-bold mb-3">🔴 Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart><Pie data={priorityData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                {priorityData.map((_, i) => <Cell key={i} fill={['#ef4444', '#f59e0b', '#10b981'][i]} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-xl border p-4 md:p-5">
            <h3 className="text-sm font-bold mb-3">😤 Sentiment Heatmap</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {sentimentData.map(s => (
                <div key={s.name} className="rounded-lg p-3 text-center" style={{ backgroundColor: s.name === 'Angry' ? 'rgba(239,68,68,0.1)' : s.name === 'Frustrated' ? 'rgba(245,158,11,0.1)' : s.name === 'Positive' ? 'rgba(16,185,129,0.1)' : 'rgba(100,100,100,0.05)' }}>
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl border p-4 md:p-5">
            <h3 className="text-sm font-bold mb-3">🎯 SLA Compliance</h3>
            {(() => {
              const total = complaints.filter(c => c.status === 'resolved').length;
              const withinSLA = complaints.filter(c => c.status === 'resolved' && c.sla_deadline && new Date(c.updated_at) <= new Date(c.sla_deadline)).length;
              const rate = total > 0 ? Math.round((withinSLA / total) * 100) : 0;
              return (
                <div className="text-center py-4">
                  <p className={`text-4xl font-bold ${rate >= 80 ? 'text-success' : rate >= 50 ? 'text-warning' : 'text-destructive'}`}>{rate}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Resolved within SLA</p>
                  <p className="text-xs text-muted-foreground">{withinSLA} of {total} resolved on time</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Analytics View ─── */
function AnalyticsView({ complaints, role }: { complaints: AppComplaint[]; role: string }) {
  const deptPerformance = useMemo(() => {
    const depts = [...new Set(complaints.map(c => c.department_name))];
    return depts.map(d => {
      const deptComplaints = complaints.filter(c => c.department_name === d);
      const resolved = deptComplaints.filter(c => c.status === 'resolved');
      const avgTime = resolved.length > 0 ? resolved.reduce((sum, c) => sum + (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()), 0) / resolved.length : 0;
      return {
        name: d.replace(' Department', '').replace(' Office', '').replace(' Management', ''),
        total: deptComplaints.length,
        resolved: resolved.length,
        pending: deptComplaints.filter(c => c.status === 'pending').length,
        avgHours: Math.round(avgTime / 3600000),
        slaCompliance: resolved.length > 0 ? Math.round(resolved.filter(c => c.sla_deadline && new Date(c.updated_at) <= new Date(c.sla_deadline)).length / resolved.length * 100) : 0,
      };
    });
  }, [complaints]);

  const topIssues = useMemo(() => {
    const keywords: Record<string, number> = {};
    for (const c of complaints) {
      for (const kw of (c.ai_analysis?.keywords || [])) {
        keywords[kw] = (keywords[kw] || 0) + 1;
      }
    }
    return Object.entries(keywords).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [complaints]);

  // Predictive: which department likely gets more complaints
  const predictions = useMemo(() => {
    const last30 = complaints.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 86400000));
    const last7 = complaints.filter(c => new Date(c.created_at) > new Date(Date.now() - 7 * 86400000));
    const depts = [...new Set(complaints.map(c => c.department_name))];
    return depts.map(d => {
      const monthly = last30.filter(c => c.department_name === d).length;
      const weekly = last7.filter(c => c.department_name === d).length;
      const trend = weekly > 0 && monthly > 0 ? Math.round((weekly / (monthly / 4)) * 100 - 100) : 0;
      return { name: d.replace(' Department', '').replace(' Office', '').replace(' Management', ''), weekly, monthly, trend };
    }).filter(d => d.monthly > 0).sort((a, b) => b.trend - a.trend);
  }, [complaints]);

  return (
    <main className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6 pt-10 md:pt-0">
        <h1 className="text-xl md:text-2xl font-bold">📊 Analytics & Insights</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="Total Complaints" value={complaints.length} icon={<FileText className="h-5 w-5" />} variant="primary" />
          <StatCard title="Resolution Rate" value={`${complaints.length > 0 ? Math.round(complaints.filter(c => c.status === 'resolved').length / complaints.length * 100) : 0}%`} icon={<Target className="h-5 w-5" />} variant="success" />
          <StatCard title="Active Escalations" value={complaints.filter(c => c.status === 'escalated').length} icon={<AlertTriangle className="h-5 w-5" />} variant="destructive" />
          <StatCard title="Avg Satisfaction" value={(() => {
            const fb = complaints.filter(c => c.feedback);
            return fb.length > 0 ? `${(fb.reduce((s, c) => s + c.feedback!.rating, 0) / fb.length).toFixed(1)}⭐` : '—';
          })()} icon={<Star className="h-5 w-5" />} variant="warning" />
        </div>

        <DashboardCharts complaints={complaints} isSuperAdmin={role === 'superadmin'} />

        <div className="bg-card rounded-xl border p-4 md:p-5">
          <h3 className="font-bold mb-4">🏢 Department Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Department</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Total</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Resolved</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Pending</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Avg Time</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">SLA %</th>
              </tr></thead>
              <tbody>
                {deptPerformance.map(d => (
                  <tr key={d.name} className="border-b last:border-0">
                    <td className="py-2 px-3 font-medium">{d.name}</td>
                    <td className="py-2 px-3 text-center">{d.total}</td>
                    <td className="py-2 px-3 text-center text-success">{d.resolved}</td>
                    <td className="py-2 px-3 text-center text-warning">{d.pending}</td>
                    <td className="py-2 px-3 text-center">{d.avgHours > 24 ? `${Math.round(d.avgHours / 24)}d` : `${d.avgHours}h`}</td>
                    <td className="py-2 px-3 text-center"><span className={`font-bold ${d.slaCompliance >= 80 ? 'text-success' : d.slaCompliance >= 50 ? 'text-warning' : 'text-destructive'}`}>{d.slaCompliance}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Predictive Analytics */}
        {predictions.length > 0 && (
          <div className="bg-card rounded-xl border p-4 md:p-5">
            <h3 className="font-bold mb-4">🔮 Predictive Insights — Complaint Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {predictions.slice(0, 6).map(p => (
                <div key={p.name} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{p.weekly} this week / {p.monthly} this month</span>
                    <span className={`text-xs font-bold ${p.trend > 0 ? 'text-destructive' : p.trend < 0 ? 'text-success' : 'text-muted-foreground'}`}>
                      {p.trend > 0 ? `↑${p.trend}%` : p.trend < 0 ? `↓${Math.abs(p.trend)}%` : '→ Stable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl border p-4 md:p-5">
          <h3 className="font-bold mb-4">🔍 Root Cause Analysis — Most Frequent Issues</h3>
          <div className="flex flex-wrap gap-2">
            {topIssues.map(([kw, count]) => (
              <div key={kw} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                #{kw} <span className="text-xs text-muted-foreground ml-1">({count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─── Users Management (SuperAdmin) ─── */
function UsersManagement({ store }: { store: ReturnType<typeof useSupabaseStore> }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const filteredUsers = store.managedUsers.filter(u =>
    u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUser(userId);
    await store.updateUserRole(userId, newRole);
    setUpdatingUser(null);
  };

  const roleCounts = {
    student: store.managedUsers.filter(u => u.role === 'student').length,
    staff: store.managedUsers.filter(u => u.role === 'staff').length,
    admin: store.managedUsers.filter(u => u.role === 'admin').length,
    superadmin: store.managedUsers.filter(u => u.role === 'superadmin').length,
  };

  return (
    <main className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-6 pt-10 md:pt-0">
        <h1 className="text-xl md:text-2xl font-bold">👥 User Management</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Students" value={roleCounts.student} icon={<Users className="h-5 w-5" />} variant="primary" />
          <StatCard title="Staff" value={roleCounts.staff} icon={<Users className="h-5 w-5" />} variant="info" />
          <StatCard title="Admins" value={roleCounts.admin} icon={<Shield className="h-5 w-5" />} variant="warning" />
          <StatCard title="Super Admins" value={roleCounts.superadmin} icon={<Brain className="h-5 w-5" />} variant="destructive" />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card text-sm" />
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Joined</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.user_id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{u.display_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email || '—'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">{u.role}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.user_id, e.target.value as UserRole)}
                      disabled={updatingUser === u.user_id || u.user_id === store.currentUser?.id}
                      className="px-2 py-1 rounded border bg-background text-xs disabled:opacity-50"
                    >
                      <option value="student">Student</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">No users found.</div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ─── Profile Settings ─── */
function ProfileSettings({ store }: { store: ReturnType<typeof useSupabaseStore> }) {
  const user = store.currentUser!;
  const [displayName, setDisplayName] = useState(user.display_name);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await store.updateProfile(displayName);
    setMessage(result.error || 'Profile updated successfully!');
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match.');
      return;
    }
    setSaving(true);
    const result = await store.changePassword(newPassword);
    setPasswordMessage(result.error || 'Password changed successfully!');
    setNewPassword('');
    setConfirmPassword('');
    setSaving(false);
  };

  return (
    <main className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-2xl mx-auto space-y-6 pt-10 md:pt-0">
        <h1 className="text-xl md:text-2xl font-bold">⚙️ Profile Settings</h1>

        <div className="bg-card rounded-xl border p-4 md:p-6 space-y-4">
          <h3 className="font-bold">Profile Information</h3>
          <div>
            <label className="text-sm font-medium block mb-1.5">Display Name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Email</label>
            <input value={user.email} disabled className="w-full px-4 py-2.5 rounded-lg border bg-muted text-sm text-muted-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Role</label>
            <input value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} disabled className="w-full px-4 py-2.5 rounded-lg border bg-muted text-sm text-muted-foreground" />
          </div>
          {message && <p className={`text-sm ${message.includes('error') || message.includes('Error') ? 'text-destructive' : 'text-success'}`}>{message}</p>}
          <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="bg-card rounded-xl border p-4 md:p-6 space-y-4">
          <h3 className="font-bold">🔒 Change Password</h3>
          <div>
            <label className="text-sm font-medium block mb-1.5">New Password</label>
            <div className="relative">
              <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" className="w-full px-4 py-2.5 pr-10 rounded-lg border bg-background text-sm" minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Confirm Password</label>
            <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="Re-enter password" className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" />
          </div>
          {passwordMessage && <p className={`text-sm ${passwordMessage.includes('success') ? 'text-success' : 'text-destructive'}`}>{passwordMessage}</p>}
          <button onClick={handleChangePassword} disabled={saving || !newPassword} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Updating...' : 'Change Password'}
          </button>
        </div>
      </div>
    </main>
  );
}