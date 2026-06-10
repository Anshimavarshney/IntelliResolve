import { useEffect, useRef, useState, useCallback } from 'react';

type SR = any;

declare global {
  interface Window {
    SpeechRecognition?: SR;
    webkitSpeechRecognition?: SR;
  }
}

export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export interface UseVoiceInputOptions {
  lang?: 'en' | 'hi';
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (err: string) => void;
}

export function useVoiceInput({ lang = 'en', onTranscript, onError }: UseVoiceInputOptions) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  const start = useCallback(() => {
    if (!isVoiceSupported()) {
      onError?.('Voice input not supported');
      return;
    }
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Ctor();
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      if (final) onTranscript(final, true);
      else if (interim) onTranscript(interim, false);
    };

    rec.onerror = (e: any) => {
      onError?.(e.error || 'voice error');
      setListening(false);
    };

    rec.onend = () => setListening(false);

    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch (err: any) {
      onError?.(err?.message || 'Could not start voice input');
    }
  }, [lang, onTranscript, onError]);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {}
    setListening(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { listening, start, stop, supported: isVoiceSupported() };
}
