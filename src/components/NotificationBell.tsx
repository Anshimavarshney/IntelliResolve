import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  complaint_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Fetch existing notifications
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data as AppNotification[]);
      });

    // Subscribe to new notifications
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          setNotifications(prev => [newNotif, ...prev]);

          // Show toast for new notification
          const toastType = newNotif.type === 'warning' || newNotif.type === 'sla_warning'
            ? toast.warning
            : newNotif.type === 'error' || newNotif.type === 'escalation'
              ? toast.error
              : newNotif.type === 'success' || newNotif.type === 'resolved'
                ? toast.success
                : toast.info;

          toastType(newNotif.title, { description: newNotif.message, duration: 5000 });
        }
      )
      .subscribe();

    // Subscribe to complaint status changes for real-time alerts
    const complaintChannel = supabase
      .channel('complaint-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
        },
        async (payload) => {
          const updated = payload.new as any;
          const old = payload.old as any;

          // If status changed, create a notification for the complaint owner
          if (updated.status !== old.status && updated.user_id === userId) {
            const statusLabels: Record<string, string> = {
              pending: 'Pending',
              assigned: 'Assigned',
              in_progress: 'In Progress',
              escalated: 'Escalated',
              resolved: 'Resolved',
              rejected: 'Rejected',
            };

            const type = updated.status === 'resolved' ? 'success'
              : updated.status === 'escalated' ? 'escalation'
                : updated.status === 'rejected' ? 'error'
                  : 'info';

            const notif = {
              user_id: userId,
              title: `Complaint ${updated.complaint_id} — ${statusLabels[updated.status] || updated.status}`,
              message: `Your complaint status changed to "${statusLabels[updated.status] || updated.status}".`,
              type,
              complaint_id: updated.id,
            };

            await supabase.from('notifications').insert(notif);
          }

          // SLA warning: check if approaching deadline
          if (updated.sla_deadline && updated.status !== 'resolved' && updated.status !== 'rejected') {
            const deadline = new Date(updated.sla_deadline);
            const now = new Date();
            const hoursLeft = (deadline.getTime() - now.getTime()) / 3600000;

            if (hoursLeft <= 4 && hoursLeft > 0 && updated.user_id === userId) {
              const existing = notifications.find(n =>
                n.complaint_id === updated.id && n.type === 'sla_warning' &&
                new Date(n.created_at).getTime() > Date.now() - 4 * 3600000
              );
              if (!existing) {
                await supabase.from('notifications').insert({
                  user_id: userId,
                  title: `⏰ SLA Warning — ${updated.complaint_id}`,
                  message: `Only ${Math.round(hoursLeft)} hours left before SLA deadline.`,
                  type: 'sla_warning',
                  complaint_id: updated.id,
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(complaintChannel);
    };
  }, [userId]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!userId) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, unreadCount, markAsRead, markAllRead };
}

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <Check className="h-4 w-4 text-green-500" />,
  resolved: <Check className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  sla_warning: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  error: <X className="h-4 w-4 text-red-500" />,
  escalation: <AlertTriangle className="h-4 w-4 text-red-500" />,
};

export function NotificationBell({ userId }: { userId: string | undefined }) {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] bg-card border rounded-xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[360px] divide-y">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No notifications yet</div>
            ) : (
              notifications.slice(0, 30).map(n => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {typeIcons[n.type] || typeIcons.info}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.is_read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatTimeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
