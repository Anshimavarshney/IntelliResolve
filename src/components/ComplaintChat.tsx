import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/lib/supabase-store';
import { useI18n } from '@/lib/i18n';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  complaint_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  message: string;
  created_at: string;
}

interface Props {
  complaintId: string; // uuid
  currentUserId: string;
  currentUserName: string;
  currentUserRole: UserRole;
}

export function ComplaintChat({ complaintId, currentUserId, currentUserName, currentUserRole }: Props) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial fetch
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('complaint_messages')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });
      if (mounted) {
        if (!error && data) setMessages(data as ChatMessage[]);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [complaintId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`complaint-chat-${complaintId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'complaint_messages', filter: `complaint_id=eq.${complaintId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [complaintId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const msg = text.trim();
    if (!msg) return;
    setSending(true);
    const { error } = await supabase.from('complaint_messages').insert({
      complaint_id: complaintId,
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_role: currentUserRole,
      message: msg,
    });
    setSending(false);
    if (error) {
      toast.error(error.message || 'Failed to send message');
      return;
    }
    setText('');
  };

  return (
    <div className="bg-card rounded-xl border p-4 md:p-6 space-y-3">
      <h3 className="font-bold">{t('detail.chat')}</h3>
      <div ref={scrollRef} className="max-h-80 overflow-y-auto space-y-2 pr-1">
        {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('detail.chat.empty')}</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          const isStaff = m.sender_role !== 'student';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-2.5 ${mine ? 'bg-primary text-primary-foreground' : isStaff ? 'bg-info/10' : 'bg-muted'}`}>
                <p className="text-[10px] font-semibold opacity-80 mb-0.5">
                  {m.sender_name} · <span className="uppercase">{m.sender_role}</span>
                </p>
                <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                <p className={`text-[10px] mt-0.5 ${mine ? 'opacity-80' : 'text-muted-foreground'}`}>
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={t('detail.chat.placeholder')}
          className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {t('detail.chat.send')}
        </button>
      </div>
    </div>
  );
}
