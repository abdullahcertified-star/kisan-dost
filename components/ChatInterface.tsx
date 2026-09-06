'use client';

import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '@/lib/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  agentName?: string;
  toolUsed?: string;
  toolData?: any;
  timestamp: string;
}

interface ChatInterfaceProps {
  district: string;
  acres: number;
  crop: string;
  soil: string;
}

const QUICK_PROMPTS = [
  "5 ایکڑ گندم کے لیے کھاد کا حساب (Fertilizer Plan)",
  "کپاس پر سفید مکھی کا علاج اور محفوظ سپرے (Whitefly Treatment)",
  "ملتان منڈی میں اجناس کے ریٹس کیا ہیں؟ (Mandi Rates)",
  "پنجاب کسان کارڈ اور سبسڈی کے لیے کیا طریقہ ہے؟ (Kisan Card)",
  "5 ایکڑ گندم پر کل کتنا منافع اور خرچہ آئے گا؟ (Profit Budget)",
  "موسم کیسا ہے اور کیا مجھے آج پانی لگانا چاہیے؟ (Irrigation)",
];

export default function ChatInterface({ district, acres, crop, soil }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `السلام علیکم کسان بھائی! میں ہوں آپ کا **کسان دوست (Kisan Dost)** زرعی مشیر۔ 🌾\n\nآپ مجھ سے فصل کے انتخاب، کھاد کے حساب، بیماریوں کے علاج، منڈی کے ریٹس، موسم، یا کسان کارڈ کے بارے میں کچھ بھی پوچھ سکتے ہیں۔`,
      agentName: 'Kisan Dost AI',
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customText?: string) => {
    const messageToSend = customText || input.trim();
    if (!messageToSend || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage({
        session_id: sessionId,
        message: messageToSend,
        district,
        land_acres: acres,
        current_crop: crop,
        soil_type: soil,
        language: 'urdu',
      });

      if (res.session_id) {
        setSessionId(res.session_id);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.response,
        agentName: res.agent_name || 'Agronomy Specialist',
        toolUsed: res.tool_used,
        toolData: res.tool_data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ معذرت، سرور سے رابطہ منقطع ہوا: ${err.message || 'Error'}`,
          agentName: 'System Warning',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Browser Audio Speech
  const speakText = (id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#•_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ur-PK';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Chat Top Header */}
      <div className="bg-emerald-800 text-white p-4 flex items-center justify-between shadow">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-xl shadow">
            🌾
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-emerald-800 rounded-full" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base">Kisan Dost Agronomy Helpline</h3>
            <p className="text-xs text-emerald-200">
              Live Multi-Agent System (Google Gemini + Open-Meteo)
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <span className="bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-600/40">
            {district} • {acres} Acres
          </span>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8faf9]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {m.sender === 'assistant' && m.agentName && (
              <span className="text-[11px] font-semibold text-emerald-800 mb-1 ml-1 flex items-center space-x-1">
                <span>🤖 {m.agentName}</span>
                {m.toolUsed && (
                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px]">
                    Tool: {m.toolUsed}
                  </span>
                )}
              </span>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-sm shadow-sm relative ${
                m.sender === 'user'
                  ? 'bg-emerald-700 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

              {/* Structured Tool Card Visualization */}
              {m.toolData && m.toolUsed === 'Fertilizer Calculator' && (
                <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-slate-800">
                  <div className="font-bold text-emerald-900 mb-1">📋 Calculated Fertilizer Breakdown:</div>
                  <div className="grid grid-cols-3 gap-1.5 text-center font-semibold">
                    <div className="bg-white p-1.5 rounded border border-emerald-100">
                      Urea: {m.toolData.urea_bags} bags
                    </div>
                    <div className="bg-white p-1.5 rounded border border-emerald-100">
                      DAP: {m.toolData.dap_bags} bags
                    </div>
                    <div className="bg-white p-1.5 rounded border border-emerald-100">
                      SOP: {m.toolData.sop_bags} bags
                    </div>
                  </div>
                  <div className="mt-1.5 text-right font-extrabold text-emerald-900">
                    Total: PKR {m.toolData.total_cost_pkr?.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Footer row: timestamp + speech toggle */}
              <div
                className={`mt-2 flex items-center justify-between text-[11px] ${
                  m.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                }`}
              >
                <span>{m.timestamp}</span>
                {m.sender === 'assistant' && (
                  <button
                    onClick={() => speakText(m.id, m.text)}
                    className="ml-2 hover:text-emerald-700 flex items-center space-x-1 text-slate-500 font-medium"
                    title="Listen in Urdu"
                  >
                    <span>{speakingId === m.id ? '🔊 Stop' : '🔈 بولیں'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-slate-500 text-xs p-2 bg-white rounded-xl w-fit shadow-sm border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span>Kisan Dost ایجنٹ سوچ رہا ہے اور تصدیق کر رہا ہے...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="p-2 bg-slate-100/80 border-t border-slate-200 overflow-x-auto flex space-x-2 no-scrollbar">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="whitespace-nowrap text-xs bg-white text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-2xs font-medium transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اپنا سوال اردو یا انگلش میں لکھیں (مثلاً: 5 ایکڑ گندم کھاد پلان)..."
          className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl shadow text-sm transition flex items-center space-x-1"
        >
          <span>بھیجیں</span>
          <span>✈️</span>
        </button>
      </form>
    </div>
  );
}
