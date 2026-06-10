import type { ComplaintPriority, ComplaintStatus, ComplaintCategory, ComplaintSentiment, AuditEntry } from '@/lib/types';
import { Clock, AlertTriangle } from 'lucide-react';

export function PriorityBadge({ priority }: { priority: ComplaintPriority }) {
  const styles: Record<ComplaintPriority, string> = {
    high: 'bg-priority-high/10 text-priority-high border-priority-high/20',
    medium: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20',
    low: 'bg-priority-low/10 text-priority-low border-priority-low/20',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[priority]}`}>{priority.toUpperCase()}</span>;
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const styles: Record<ComplaintStatus, string> = {
    pending: 'bg-muted text-muted-foreground',
    assigned: 'bg-info/10 text-info',
    in_progress: 'bg-warning/10 text-warning',
    resolved: 'bg-success/10 text-success',
    escalated: 'bg-destructive/10 text-destructive',
    rejected: 'bg-destructive/10 text-destructive',
  };
  const labels: Record<ComplaintStatus, string> = { pending: 'Pending', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved', escalated: 'Escalated', rejected: 'Rejected' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>;
}

export function CategoryBadge({ category }: { category: ComplaintCategory }) {
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">{category.charAt(0).toUpperCase() + category.slice(1)}</span>;
}

export function SentimentBadge({ sentiment }: { sentiment: ComplaintSentiment }) {
  const styles: Record<ComplaintSentiment, string> = {
    angry: 'bg-destructive/10 text-destructive',
    frustrated: 'bg-warning/10 text-warning',
    neutral: 'bg-muted text-muted-foreground',
    positive: 'bg-success/10 text-success',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[sentiment]}`}>{sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}</span>;
}

export function StatCard({ title, value, icon, variant = 'default', subtitle }: { title: string; value: string | number; icon: React.ReactNode; variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info'; subtitle?: string }) {
  const styles: Record<string, string> = {
    default: 'bg-card',
    primary: 'bg-primary/5 border-primary/20',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20',
    destructive: 'bg-destructive/5 border-destructive/20',
    info: 'bg-info/5 border-info/20',
  };
  return (
    <div className={`rounded-xl border p-4 md:p-5 shadow-sm transition-shadow hover:shadow-md ${styles[variant]}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs md:text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">{icon}</div>
      </div>
    </div>
  );
}

export function SLAIndicator({ deadline, status }: { deadline: string; status: ComplaintStatus }) {
  if (status === 'resolved') return null;
  const now = new Date();
  const dl = new Date(deadline);
  const hoursLeft = (dl.getTime() - now.getTime()) / 3600000;
  const expired = hoursLeft < 0;
  const warning = hoursLeft > 0 && hoursLeft < 12;

  if (expired) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold animate-pulse">
        <AlertTriangle className="h-3.5 w-3.5" /> SLA Breached ({Math.abs(Math.round(hoursLeft))}h overdue)
      </div>
    );
  }
  if (warning) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning/10 text-warning text-xs font-semibold">
        <Clock className="h-3.5 w-3.5" /> ⚠️ {Math.round(hoursLeft)}h remaining
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 text-success text-xs font-medium">
      <Clock className="h-3.5 w-3.5" /> {Math.round(hoursLeft)}h remaining
    </div>
  );
}

export function AIExplanationBox({ analysis }: { analysis: import('@/lib/types').AIAnalysis }) {
  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 md:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">⚡</span>
        <h3 className="font-bold text-primary">AI Analysis — IntelliResolve Engine</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Category:</span> <CategoryBadge category={analysis.category} /></div>
        <div><span className="text-muted-foreground">Priority:</span> <PriorityBadge priority={analysis.priority} /></div>
        <div><span className="text-muted-foreground">Sentiment:</span> <SentimentBadge sentiment={analysis.sentiment} /></div>
        <div><span className="text-muted-foreground">Urgency Score:</span> <span className="font-bold text-primary">{analysis.priority_score}%</span></div>
      </div>
      {(analysis.category_confidence || analysis.priority_confidence) && (
        <div className="grid grid-cols-2 gap-3 text-sm bg-card rounded-lg p-3">
          {analysis.category_confidence && (
            <div>
              <span className="text-muted-foreground">Classification Confidence:</span>{' '}
              <span className={`font-bold ${analysis.category_confidence >= 70 ? 'text-success' : analysis.category_confidence >= 50 ? 'text-warning' : 'text-destructive'}`}>{analysis.category_confidence}%</span>
            </div>
          )}
          {analysis.priority_confidence && (
            <div>
              <span className="text-muted-foreground">Priority Confidence:</span>{' '}
              <span className={`font-bold ${analysis.priority_confidence >= 70 ? 'text-success' : analysis.priority_confidence >= 50 ? 'text-warning' : 'text-destructive'}`}>{analysis.priority_confidence}%</span>
            </div>
          )}
        </div>
      )}
      {analysis.sentiment_score !== 0 && (
        <div className="text-sm">
          <span className="text-muted-foreground">Sentiment Score:</span>{' '}
          <span className={`font-bold ${analysis.sentiment_score < 0 ? 'text-destructive' : 'text-success'}`}>{analysis.sentiment_score}</span>
        </div>
      )}
      <div className="bg-card rounded-lg p-3 text-sm space-y-1">
        <p><span className="font-medium">📌 Priority Reason:</span> {analysis.reason_for_priority}</p>
        <p><span className="font-medium">📂 Category Reason:</span> {analysis.reason_for_category}</p>
      </div>
      {analysis.suggested_resolution && (
        <div className="bg-success/5 border border-success/20 rounded-lg p-3 text-sm">
          <p className="font-medium text-success">💡 AI Suggested Resolution:</p>
          <p className="text-muted-foreground mt-1">{analysis.suggested_resolution}</p>
        </div>
      )}
      {analysis.tags && analysis.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {analysis.tags.map(t => <span key={t} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{t}</span>)}
        </div>
      )}
    </div>
  );
}

export function ComplaintTimeline({ events }: { events: import('@/lib/types').TimelineEvent[] }) {
  return (
    <div className="space-y-0">
      {events.map((e, i) => (
        <div key={e.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`h-3 w-3 rounded-full mt-1.5 ${i === events.length - 1 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            {i < events.length - 1 && <div className="w-0.5 h-full bg-border min-h-[24px]" />}
          </div>
          <div className="pb-4">
            <p className="text-sm font-medium">{e.description}</p>
            <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()} · {e.user_name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditLog({ entries }: { entries: AuditEntry[] }) {
  if (!entries || entries.length === 0) return <p className="text-sm text-muted-foreground">No audit entries.</p>;
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {entries.map(e => (
        <div key={e.id} className="flex items-start gap-2 text-xs border-b border-border/50 pb-2">
          <span className="font-mono text-muted-foreground whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</span>
          <span className="px-1.5 py-0.5 bg-muted rounded font-medium shrink-0">{e.action}</span>
          <span className="text-muted-foreground">{e.details}</span>
          <span className="text-muted-foreground/50 ml-auto shrink-0">by {e.user_name}</span>
        </div>
      ))}
    </div>
  );
}

export function Pagination({ total, page, perPage, onPageChange }: { total: number; page: number; perPage: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-xs text-muted-foreground">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}</p>
      <div className="flex gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs rounded-lg border bg-card disabled:opacity-30 hover:bg-accent transition-colors">Prev</button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = i + 1;
          return <button key={p} onClick={() => onPageChange(p)} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent'}`}>{p}</button>;
        })}
        {totalPages > 5 && <span className="px-2 py-1.5 text-xs text-muted-foreground">...</span>}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-xs rounded-lg border bg-card disabled:opacity-30 hover:bg-accent transition-colors">Next</button>
      </div>
    </div>
  );
}
