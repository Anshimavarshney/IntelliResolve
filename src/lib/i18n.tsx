import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'hi';

type Dict = Record<string, string>;

const EN: Dict = {
  'app.language': 'Language',
  'lang.en': 'English',
  'lang.hi': 'हिन्दी',

  'submit.title': 'Submit New Complaint',
  'submit.back': 'Back',
  'submit.field.title': 'Title',
  'submit.field.title.placeholder': 'Brief title (or let AI suggest one)',
  'submit.field.description': 'Description',
  'submit.field.description.placeholder': 'Describe your complaint in detail...',
  'submit.field.attachment': 'Attachment (optional)',
  'submit.attach': 'Attach File',
  'submit.change': 'Change File',
  'submit.charsHint': 'characters · Min 10 required',
  'submit.aiPreview': 'AI Preview',
  'submit.cta': 'Submit Complaint',
  'submit.uploading': 'Uploading...',
  'submit.routing': 'Auto-routing: This complaint will be sent to',
  'submit.duplicates': '⚠️ Similar complaints already exist — please review before submitting:',
  'submit.duplicates.hint': 'If your issue is the same, consider tracking the existing complaint instead of filing a duplicate.',
  'submit.voice.start': 'Speak',
  'submit.voice.stop': 'Stop',
  'submit.voice.listening': 'Listening…',
  'submit.voice.unsupported': 'Voice input is not supported in this browser. Try Chrome or Edge.',

  'detail.back': 'Back',
  'detail.notes': '💬 Notes & Communication',
  'detail.chat': '💬 Chat (Student ↔ Staff)',
  'detail.chat.empty': 'No messages yet. Start the conversation.',
  'detail.chat.placeholder': 'Type a message…',
  'detail.chat.send': 'Send',
  'detail.translate': 'Translate',
  'detail.translating': 'Translating…',
  'detail.translate.original': 'Show original',
};

const HI: Dict = {
  'app.language': 'भाषा',
  'lang.en': 'English',
  'lang.hi': 'हिन्दी',

  'submit.title': 'नई शिकायत दर्ज करें',
  'submit.back': 'वापस',
  'submit.field.title': 'शीर्षक',
  'submit.field.title.placeholder': 'संक्षिप्त शीर्षक (या AI सुझाव लें)',
  'submit.field.description': 'विवरण',
  'submit.field.description.placeholder': 'अपनी शिकायत विस्तार से लिखें...',
  'submit.field.attachment': 'अनुलग्नक (वैकल्पिक)',
  'submit.attach': 'फ़ाइल जोड़ें',
  'submit.change': 'फ़ाइल बदलें',
  'submit.charsHint': 'अक्षर · न्यूनतम 10 आवश्यक',
  'submit.aiPreview': 'AI पूर्वावलोकन',
  'submit.cta': 'शिकायत भेजें',
  'submit.uploading': 'अपलोड हो रहा है...',
  'submit.routing': 'स्वचालित रूटिंग: यह शिकायत भेजी जाएगी',
  'submit.duplicates': '⚠️ मिलती-जुलती शिकायतें पहले से मौजूद हैं — कृपया भेजने से पहले देखें:',
  'submit.duplicates.hint': 'यदि आपकी समस्या वही है, तो नई शिकायत के बजाय मौजूदा शिकायत को ट्रैक करें।',
  'submit.voice.start': 'बोलें',
  'submit.voice.stop': 'रोकें',
  'submit.voice.listening': 'सुन रहा है…',
  'submit.voice.unsupported': 'इस ब्राउज़र में वॉइस इनपुट समर्थित नहीं है। Chrome या Edge आज़माएँ।',

  'detail.back': 'वापस',
  'detail.notes': '💬 नोट्स और संवाद',
  'detail.chat': '💬 चैट (छात्र ↔ स्टाफ)',
  'detail.chat.empty': 'अभी कोई संदेश नहीं। बातचीत शुरू करें।',
  'detail.chat.placeholder': 'संदेश लिखें…',
  'detail.chat.send': 'भेजें',
  'detail.translate': 'अनुवाद',
  'detail.translating': 'अनुवाद हो रहा है…',
  'detail.translate.original': 'मूल दिखाएँ',
};

const DICTS: Record<Lang, Dict> = { en: EN, hi: HI };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem('ir.lang') : null) as Lang | null;
    if (saved === 'en' || saved === 'hi') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem('ir.lang', l);
  };

  const t = (key: string) => DICTS[lang][key] ?? DICTS.en[key] ?? key;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fallback so components don't crash if provider is missing
    return { lang: 'en', setLang: () => {}, t: (k) => DICTS.en[k] ?? k };
  }
  return ctx;
}

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      className={`px-2 py-1 rounded-md border bg-background text-xs ${className}`}
      aria-label="Language"
    >
      <option value="en">EN</option>
      <option value="hi">हिन्दी</option>
    </select>
  );
}
