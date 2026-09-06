'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SaaSLayout from '@/components/SaaSLayout';
import { loadSavedItem, saveItem } from '@/lib/storage';
import { API_BASE_URL } from '@/lib/api';
import {
  Bot,
  User,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Sprout,
  Scale,
  Bug,
  TrendingUp,
  Landmark,
  Plus,
  Trash2,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  Info,
  Key,
  X
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  agentName?: string;
  specialistTitle?: string;
  specialistIcon?: string;
  modelUsed?: string;
  suggestedFollowups?: string[];
  feedback?: 'up' | 'down' | null;
  timestamp: string;
  isError?: boolean;
}

const STARTER_PROMPTS = [
  {
    icon: '🌾',
    title: 'Crop Planning (فصل کا انتخاب)',
    desc: '5 acres in Multan with limited water: what crop yields maximum profit?',
    urdu: 'ملتان میں 5 ایکڑ محدود پانی کے لیے منافع بخش فصل کونسی ہے؟',
    prompt: 'I have 5 acres in Multan with limited water access. What crop gives the highest net profit in Kharif/Rabi?',
  },
  {
    icon: '⚖️',
    title: 'Fertilizer Dosage (کھاد کا حساب)',
    desc: 'Exact DAP & Urea bag requirements for 5 acres of wheat',
    urdu: '5 ایکڑ گندم کے لیے ڈی اے پی اور یوریا کی کتنی بوریاں درکار ہیں؟',
    prompt: 'How many bags of DAP and Urea should I apply for 5 acres of wheat, and when is the best application time?',
  },
  {
    icon: '🐛',
    title: 'Pest Doctor (کیڑوں کا علاج)',
    desc: 'Cotton leaf curl virus & whitefly safe chemical treatment',
    urdu: 'کپاس میں سفید مکھی اور مروڑیا روگ کا تصدیق شدہ اسپرے',
    prompt: 'My cotton leaves are turning yellow and curling from whitefly. What verified pesticide and dosage should I use?',
  },
  {
    icon: '📈',
    title: 'Mandi Rates (منڈی کے ریٹس)',
    desc: 'Today\'s wholesale prices for Wheat & Cotton in Punjab mandis',
    urdu: 'ملتان اور فیصل آباد غلہ منڈی کے آج کے تازہ ترین ریٹس',
    prompt: 'What are today\'s wholesale market rates for wheat and cotton in Multan and Faisalabad mandis?',
  },
  {
    icon: '🚜',
    title: 'Govt Subsidies (سرکاری اسکیمیں)',
    desc: 'How to register for CM Punjab Kisan Card & Green Tractor subsidy',
    urdu: 'وزیر اعلیٰ کسان کارڈ اور گرین ٹریکٹر سبسڈی کے لیے کیسے اپلائی کریں؟',
    prompt: 'How can I apply for the CM Punjab Kisan Card and the Green Tractor subsidy scheme?',
  },
  {
    icon: '🌦️',
    title: 'Weather & Irrigation (موسم و پانی)',
    desc: 'Rain radar forecast and tubewell irrigation scheduling advice',
    urdu: 'اگلے 7 دن میں بارش کی کیا پیشگوئی ہے اور آبپاشی کب کروں؟',
    prompt: 'What is the rainfall forecast for Multan this week and when is it safe to irrigate my fields?',
  },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('session_' + Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [keySavedToast, setKeySavedToast] = useState(false);
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const hasAutoSentParam = useRef(false);

  // Initialize session, load chat history, custom Gemini Key, and language preference
  useEffect(() => {
    const savedLang = (localStorage.getItem('kd_lang') as 'en' | 'ur') || 'en';
    setLang(savedLang);

    const onLangChange = (e: any) => {
      if (e.detail === 'en' || e.detail === 'ur') {
        setLang(e.detail);
      }
    };
    window.addEventListener('kd_language_change', onLangChange);

    const savedKey = localStorage.getItem('kd_custom_gemini_key') || '';
    setCustomApiKey(savedKey);
    setInputKey(savedKey);

    const savedSession = loadSavedItem<string>('kd_chat_session_id', '');
    if (savedSession) {
      setSessionId(savedSession);
    } else {
      const newId = 'session_' + Math.random().toString(36).substring(2, 9);
      setSessionId(newId);
      saveItem('kd_chat_session_id', newId);
    }

    const savedHistory = loadSavedItem<Message[]>('kd_chat_history_v2', []);
    if (savedHistory && savedHistory.length > 0) {
      setMessages(savedHistory);
    }

    return () => {
      window.removeEventListener('kd_language_change', onLangChange);
    };
  }, []);

  const toggleAssistantLanguage = (newLang: 'en' | 'ur') => {
    setLang(newLang);
    localStorage.setItem('kd_lang', newLang);
    document.documentElement.setAttribute('dir', newLang === 'ur' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', newLang);
    window.dispatchEvent(new CustomEvent('kd_language_change', { detail: newLang }));
  };

  // Auto-send query passed via URL e.g. /assistant?q=hi
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasAutoSentParam.current) {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q && q.trim()) {
        hasAutoSentParam.current = true;
        window.history.replaceState({}, '', window.location.pathname);
        handleSendMessage(q.trim());
      }
    }
  }, []);

  // Save history on changes
  useEffect(() => {
    if (messages.length > 0) {
      saveItem('kd_chat_history_v2', messages);
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-grow textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const startNewChat = () => {
    if (speakingMessageId) {
      window.speechSynthesis?.cancel();
      setSpeakingMessageId(null);
    }
    const newId = 'session_' + Math.random().toString(36).substring(2, 9);
    setSessionId(newId);
    saveItem('kd_chat_session_id', newId);
    setMessages([]);
    saveItem('kd_chat_history_v2', []);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const query = (customPrompt || inputText).trim();
    if (!query || isLoading) return;

    if (speakingMessageId) {
      window.speechSynthesis?.cancel();
      setSpeakingMessageId(null);
    }

    const userMessage: Message = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      // Build conversation history for multi-turn conversational memory
      const historyPayload = newMessages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const userGeminiKey = localStorage.getItem('kd_custom_gemini_key') || customApiKey || '';
      const currentLang = localStorage.getItem('kd_lang') || lang || 'en';

      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-language': currentLang,
          ...(userGeminiKey ? { 'x-gemini-api-key': userGeminiKey } : {})
        },
        body: JSON.stringify({
          message: query,
          session_id: sessionId,
          history: historyPayload,
          custom_gemini_key: userGeminiKey,
          language: currentLang,
          lang: currentLang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMessage: Message = {
          id: 'msg_agent_' + Date.now(),
          sender: 'agent',
          text: data.response || 'No response received.',
          agentName: data.agent_name || 'agronomy',
          specialistTitle: data.specialist_title || 'Agronomy Specialist',
          specialistIcon: data.specialist_icon || '🌾',
          modelUsed: data.model_used || 'Gemini Multi-Agent',
          suggestedFollowups: data.suggested_followups || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: 'msg_err_' + Date.now(),
        sender: 'agent',
        text: `⚠️ **Connection Error**: Could not reach Kisan Dost AI server (${err.message}). Please check your connection and tap Regenerate.`,
        isError: true,
        agentName: 'triage',
        specialistTitle: 'System Guardrail',
        specialistIcon: '⚠️',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy message text to clipboard
  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text-To-Speech (Audio Voice Readout in Urdu / English)
  const toggleSpeech = (id: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(id);

    // Strip markdown characters for clean speech synthesis
    const cleanText = text
      .replace(/[#*_`~•]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\n+/g, ' ');

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Pick Urdu voice if available, else standard fallback
    const voices = window.speechSynthesis.getVoices();
    const urduVoice = voices.find((v) => v.lang.includes('ur') || v.lang.includes('pa'));
    if (urduVoice) {
      utterance.voice = urduVoice;
      utterance.lang = urduVoice.lang;
    } else {
      utterance.rate = 0.95;
    }

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Speech-To-Text Voice Input via Microphone
  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice dictation is supported in Chrome, Edge, and modern Android/iOS browsers.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ur-PK'; // Supports Urdu & English accents seamlessly
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, feedback: m.feedback === type ? null : type } : m))
    );
  };

  const renderMarkdownText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;

          // Heading 3 / bold title
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-base font-bold text-slate-900 mt-2 mb-1">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          // Bullet points
          if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            return (
              <div key={idx} className="flex items-start space-x-2 my-0.5">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span className="flex-1">{formatInline(content)}</span>
              </div>
            );
          }

          // Numbered lists
          const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start space-x-2 my-1">
                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-md text-xs border border-emerald-200 shrink-0">
                  {numMatch[1]}
                </span>
                <span className="flex-1">{formatInline(numMatch[2])}</span>
              </div>
            );
          }

          return <p key={idx}>{formatInline(line)}</p>;
        })}
      </div>
    );
  };

  const formatInline = (text: string) => {
    // Basic bold **text** replacement
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <SaaSLayout
      title={lang === 'ur' ? 'کسان دوست اے آئی ماہر زراعت' : 'AI Agronomist Chat'}
      subtitle={
        lang === 'ur'
          ? 'گوگل جیمنائی سے لیس کسان دوست زرعی چیٹ باٹ (جوابات: اردو)'
          : 'Real-time multi-agent agricultural assistant powered by Google Gemini'
      }
      badge={lang === 'ur' ? 'اردو موڈ فعال ہے' : 'Gemini Flash Multi-Agent'}
      actions={
        <div className="flex items-center space-x-2">
          {/* Agent Reply Language Toggle Button (EN / اردو) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/90 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => toggleAssistantLanguage('en')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                lang === 'en'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Reply in English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => toggleAssistantLanguage('ur')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                lang === 'ur'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="اردو میں جواب دیں"
            >
              اردو
            </button>
          </div>

          {/* Google AI Studio Key Button */}
          <button
            onClick={() => setShowKeyModal(true)}
            title="Configure Google AI Studio Gemini API Key"
            className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition"
          >
            <Key className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">
              {customApiKey ? 'Google AI Studio: Connected' : 'Google AI Studio Key'}
            </span>
            <span className="md:hidden">API Key</span>
            {customApiKey && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          </button>

          <button
            onClick={startNewChat}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>New Chat</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto w-full">
        {/* Google AI Studio API Key Configuration Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Google AI Studio Gemini Key</h3>
                    <p className="text-[11px] text-slate-500">Direct integration for AI Agronomist chatbot</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Enter your personal Google Gemini API Key from Google AI Studio. When set, all your agronomic and multi-agent inquiries will be sent directly through your API quota.
                </p>

                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:underline"
                >
                  <span>Get your free Gemini Key from Google AI Studio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="space-y-1 pt-1">
                  <label className="font-semibold text-slate-700">Gemini API Key</label>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Enter your Gemini key (e.g. AIzaSy...)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 text-xs font-mono text-slate-800"
                  />
                </div>

                {keySavedToast && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center space-x-1.5 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Gemini API Key saved and activated!</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setInputKey('');
                    localStorage.removeItem('kd_custom_gemini_key');
                    setCustomApiKey('');
                    setShowKeyModal(false);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                >
                  Clear Key
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = inputKey.trim();
                    if (trimmed) {
                      localStorage.setItem('kd_custom_gemini_key', trimmed);
                      setCustomApiKey(trimmed);
                    } else {
                      localStorage.removeItem('kd_custom_gemini_key');
                      setCustomApiKey('');
                    }
                    setKeySavedToast(true);
                    setTimeout(() => {
                      setKeySavedToast(false);
                      setShowKeyModal(false);
                    }, 800);
                  }}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                >
                  Save &amp; Connect Key
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Chat Message Scroll Area */}
        <div className="flex-1 overflow-y-auto pr-1 sm:pr-3 space-y-6 pb-4">
          {/* Empty State / Welcome Starter Grid */}
          {messages.length === 0 && (
            <div className="py-6 sm:py-10 space-y-8 animate-in fade-in duration-500">
              <div className="text-center space-y-3 max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                  <Sprout className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Kisan Dost AI Agronomist
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Ask any question about crop selection, fertilizer dosages (DAP/Urea), pest diagnosis, wholesale mandi rates, or Punjab government schemes in Urdu, Roman Urdu, or English.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Powered by Google Gemini Multi-Agent Routing</span>
                </div>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-4xl mx-auto">
                {STARTER_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all text-left group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">{item.icon}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-medium text-emerald-700 truncate">
                      {item.urdu}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Conversation Messages */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeaking = speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
              >
                {/* Bot Avatar */}
                {!isUser && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
                    <Sprout className="w-5 h-5" />
                  </div>
                )}

                {/* Message Body Container */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[92%] sm:max-w-[85%]`}>
                  {/* User Message Bubble */}
                  {isUser ? (
                    <div className="bg-emerald-600 text-white rounded-3xl rounded-br-xs px-5 py-3.5 shadow-sm text-sm sm:text-base leading-relaxed break-words">
                      {msg.text}
                    </div>
                  ) : (
                    /* Assistant Message Card (ChatGPT / Gemini Style) */
                    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 w-full">
                      {/* Specialist Meta Bar */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{msg.specialistIcon || '🌾'}</span>
                          <span className="font-bold text-slate-900">{msg.specialistTitle || 'Agronomy Specialist'}</span>
                          {msg.modelUsed && (
                            <span className="hidden sm:inline-block text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                              {msg.modelUsed}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">{msg.timestamp}</span>
                      </div>

                      {/* Message Content */}
                      <div className="text-slate-800">
                        {renderMarkdownText(msg.text)}
                      </div>

                      {/* Contextual Follow-up Chips (Like ChatGPT/Gemini) */}
                      {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                            Suggested Follow-ups (اگلے ممکنہ سوالات)
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {msg.suggestedFollowups.map((chip, cIdx) => (
                              <button
                                key={cIdx}
                                onClick={() => handleSendMessage(chip)}
                                className="text-xs bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 font-medium px-3 py-1.5 rounded-xl border border-emerald-200/80 transition-all flex items-center space-x-1.5 text-left"
                              >
                                <span>{chip}</span>
                                <ChevronRight className="w-3 h-3 opacity-60" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive Action Bar (Copy, TTS Audio, Regenerate, Thumbs) */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          {/* Copy Button */}
                          <button
                            onClick={() => copyToClipboard(msg.id, msg.text)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition flex items-center space-x-1"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px] text-emerald-600 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px] hidden sm:inline">Copy</span>
                              </>
                            )}
                          </button>

                          {/* Voice Readout (TTS) */}
                          <button
                            onClick={() => toggleSpeech(msg.id, msg.text)}
                            className={`p-1.5 rounded-lg transition flex items-center space-x-1 ${
                              isSpeaking
                                ? 'bg-emerald-100 text-emerald-800 font-semibold'
                                : 'hover:bg-slate-100 hover:text-slate-700'
                            }`}
                            title={isSpeaking ? 'Stop voice' : 'Listen audio'}
                          >
                            {isSpeaking ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                                <span className="text-[11px] text-emerald-800">Stop Audio</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span className="text-[11px] hidden sm:inline">Listen</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Thumbs Feedback */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleFeedback(msg.id, 'up')}
                            className={`p-1.5 rounded-lg transition ${
                              msg.feedback === 'up' ? 'text-emerald-600 bg-emerald-50' : 'hover:bg-slate-100 hover:text-slate-700'
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'down')}
                            className={`p-1.5 rounded-lg transition ${
                              msg.feedback === 'down' ? 'text-rose-600 bg-rose-50' : 'hover:bg-slate-100 hover:text-slate-700'
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
                    <User className="w-5 h-5 text-slate-200" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator (Pulsating Gemini Dots) */}
          {isLoading && (
            <div className="flex gap-3 sm:gap-4 items-start animate-in fade-in">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Sprout className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Kisan Dost is analyzing agronomic benchmarks...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Floating Input Bar (ChatGPT / Gemini Style) */}
        <div className="pt-2 sticky bottom-0 bg-[#f4f6f8]/90 backdrop-blur-md">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-md p-2 sm:p-2.5 flex items-end gap-2 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
            {/* Microphone Button (Voice Speech-to-Text) */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'text-slate-400 hover:text-emerald-700 hover:bg-slate-100'
              }`}
              title={isListening ? 'Listening... Speak in Urdu or English' : 'Voice typing (Urdu/English)'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Expanding Textarea Input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? (lang === 'ur' ? 'آپ بولیں، خودکار لکھائی ہو جائے گی...' : 'Listening... Bolain (Speak now)...')
                  : (lang === 'ur' ? 'کسان دوست سے فصلوں، کھاد، اسپرے یا غلہ منڈی کے بارے میں کچھ بھی پوچھیں...' : 'Ask Kisan Dost anything about your crops, fertilizer, mandi rates, or pests...')
              }
              className="flex-1 max-h-36 py-2 px-1 sm:px-2 text-xs sm:text-sm bg-transparent border-0 focus:outline-hidden resize-none text-slate-900 placeholder:text-slate-400"
            />

            {/* Clear Button if text present */}
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 text-xs"
              >
                ✕
              </button>
            )}

            {/* Send Button */}
            <button
              type="button"
              disabled={!inputText.trim() || isLoading}
              onClick={() => handleSendMessage()}
              className="p-2.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-300 text-white transition-all shadow-xs disabled:shadow-none flex items-center justify-center"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Footer Subtext Disclaimer */}
          <div className="text-center py-2 text-[11px] text-slate-400 flex items-center justify-center space-x-2">
            <span>Kisan Dost is grounded in PARC & Punjab Agri research benchmarks.</span>
            <span>•</span>
            <Link href="/observability" className="text-emerald-700 hover:underline inline-flex items-center space-x-0.5">
              <span>View Multi-Agent Traces</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </div>
    </SaaSLayout>
  );
}
