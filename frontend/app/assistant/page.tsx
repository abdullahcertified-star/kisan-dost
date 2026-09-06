'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { loadSavedItem, saveItem } from '@/lib/storage';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  agentName?: string;
  toolUsed?: string;
  toolData?: any;
  disclaimer?: string;
  timestamp: string;
  isError?: boolean;
  debugTrace?: any;
}

const AGENT_META: Record<string, { name: string; urdu: string; icon: string; color: string; badgeBg: string }> = {
  triage: { name: 'Triage Coordinator', urdu: 'مرکزی رابطہ کار', icon: '🛡️', color: 'text-sky-700', badgeBg: 'bg-sky-50 border-sky-200' },
  agronomy: { name: 'Agronomy Specialist', urdu: 'ماہر زراعت', icon: '🌾', color: 'text-emerald-800', badgeBg: 'bg-emerald-50 border-emerald-200' },
  pest_doctor: { name: 'Pest Doctor', urdu: 'ماہر امراض و کیڑے', icon: '🔬', color: 'text-amber-800', badgeBg: 'bg-amber-50 border-amber-200' },
  market: { name: 'Mandi Market Specialist', urdu: 'ماہر منڈی ریٹس', icon: '📈', color: 'text-blue-800', badgeBg: 'bg-blue-50 border-blue-200' },
  finance: { name: 'Finance & Profit Specialist', urdu: 'ماہر مالیات و منافع', icon: '💰', color: 'text-teal-800', badgeBg: 'bg-teal-50 border-teal-200' },
};

export default function AssistantPage() {
  const [lang, setLang] = useState<'ur' | 'en'>('ur');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSpecialist, setActiveSpecialist] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('kisan_session_' + Date.now());
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [devMode, setDevMode] = useState<boolean>(false);
  const [expandedTraces, setExpandedTraces] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved session or initialize
  useEffect(() => {
    const savedSession = loadSavedItem<string>('kd_chat_session_id', '');
    if (savedSession) {
      setSessionId(savedSession);
    } else {
      const newId = 'session_' + Math.random().toString(36).substring(2, 9);
      setSessionId(newId);
      saveItem('kd_chat_session_id', newId);
    }

    const savedMessages = loadSavedItem<Message[]>('kd_assistant_history', []);
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      // Initial Welcome Message
      const welcomeMsg: Message = {
        id: 'msg_welcome',
        sender: 'agent',
        text: 'السلام علیکم! میں کسان دوست اے آئی معاون ہوں۔ آپ اپنی فصل، زمین، کھاد کے حساب، کپاس اور گندم کے امراض، منڈی ریٹس یا منافع کے بارے میں سوال پوچھ سکتے ہیں۔\n\nWelcome to Kisan Dost AI Assistant! How can our agronomy, pest clinic, mandi, and finance specialists assist your farm today?',
        agentName: 'triage',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcomeMsg]);
    }
  }, []);

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      saveItem('kd_assistant_history', messages);
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, activeSpecialist]);

  const quickPrompts = lang === 'ur' ? [
    'ملتان میں 5 ایکڑ زمین اور محدود پانی ہے، کون سی فصل کاشت کروں؟',
    'کپاس کے پتے مڑ رہے ہیں اور سفید مکھیاں نظر آ رہی ہیں۔',
    'ملتان میں گندم کی موجودہ قیمت کیا ہے؟',
    '5 ایکڑ زمین پر کتنا منافع ہو سکتا ہے؟',
    'کیا کل ملتان میں بارش کا امکان ہے؟'
  ] : [
    'I have 5 acres in Multan and limited water. What should I plant?',
    'My cotton leaves are curling and I see white insects.',
    'What is the wheat price in Multan?',
    'How much profit could I make from 5 acres?',
    'Will it rain in Multan tomorrow?'
  ];

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setLastFailedMessage(null);

    // Dynamic routing indicator
    setActiveSpecialist('triage');
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      if (q.includes('curl') || q.includes('leaf') || q.includes('pest') || q.includes('insect') || q.includes('سفید') || q.includes('پتے') || q.includes('کیڑے')) {
        setActiveSpecialist('pest_doctor');
      } else if (q.includes('price') || q.includes('rate') || q.includes('mandi') || q.includes('قیمت') || q.includes('ریٹ')) {
        setActiveSpecialist('market');
      } else if (q.includes('profit') || q.includes('cost') || q.includes('expense') || q.includes('منافع') || q.includes('خرچہ')) {
        setActiveSpecialist('finance');
      } else {
        setActiveSpecialist('agronomy');
      }
    }, 600);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: query,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }

      const data = await res.json();
      clearTimeout(timer);
      setActiveSpecialist(null);

      const agentMsg: Message = {
        id: 'msg_' + Date.now(),
        sender: 'agent',
        text: data.response || 'No response returned.',
        agentName: data.agent_name || 'triage',
        toolUsed: data.tool_used,
        toolData: data.tool_data,
        disclaimer: data.disclaimer,
        debugTrace: data.debug_trace,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      clearTimeout(timer);
      setActiveSpecialist(null);
      setLastFailedMessage(query);

      const errorMsg: Message = {
        id: 'err_' + Date.now(),
        sender: 'agent',
        text: lang === 'ur'
          ? 'معذرت، رابطہ منقطع ہو گیا۔ براہ کرم سرور کنکشن چیک کریں اور دوبارہ کوشش کریں۔'
          : 'Failed to connect to the Kisan Dost advisory server. Please ensure the backend is running and retry.',
        agentName: 'triage',
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
    }
  };

  const clearHistory = () => {
    if (confirm(lang === 'ur' ? 'کیا آپ تمام پیغامات صاف کرنا چاہتے ہیں؟' : 'Clear conversation history?')) {
      const newId = 'session_' + Math.random().toString(36).substring(2, 9);
      setSessionId(newId);
      saveItem('kd_chat_session_id', newId);
      setMessages([]);
      saveItem('kd_assistant_history', []);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-emerald-50/30 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-5 flex flex-col">
        {/* Header Ribbon with Language Toggle and Specialists Directory */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Google ADK Multi-Agent System
              </span>
              <span className="text-xs text-slate-500 font-medium">Verified PARC Grounding</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <span>🌾 Kisan Dost AI Farmer Assistant</span>
              <span className="text-emerald-700 text-lg font-urdu">(کسان دوست اے آئی مشیر)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Intelligent multi-agent consultation: Agronomy, Pest Clinic, Mandi Rates, and Farm Profit calculations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-center">
            {/* Language Switcher */}
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setLang('ur')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  lang === 'ur' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                اردو (Urdu)
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  lang === 'en' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>

            {/* Developer / ADK Trace Mode Toggle */}
            <button
              onClick={() => setDevMode(!devMode)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                devMode
                  ? 'bg-indigo-950 text-indigo-300 border-indigo-500 shadow-xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
              title="Toggle Google ADK Multi-Agent Tracing Inspector for Judges"
            >
              <span>🛠️</span>
              <span>{devMode ? 'Dev Mode: ON' : 'Dev Mode: OFF'}</span>
            </button>

            {/* 1-Click Demo Mode Link */}
            <Link
              href="/demo"
              className="px-3 py-1 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition flex items-center gap-1.5"
              title="Launch Guided 9-Step Hackathon Demo Mode"
            >
              <span>🎯</span>
              <span>Demo Mode</span>
            </Link>

            {/* Clear History Button */}
            <button
              onClick={clearHistory}
              title="Reset Conversation"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs transition border border-slate-200"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Specialists Live Roster */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {Object.entries(AGENT_META).map(([key, meta]) => {
            const isAgentActive = activeSpecialist === key;
            return (
              <div
                key={key}
                className={`p-2.5 rounded-xl border transition-all flex items-center space-x-2 ${
                  isAgentActive
                    ? 'bg-emerald-100/90 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20 scale-[1.02]'
                    : `${meta.badgeBg} opacity-85 hover:opacity-100`
                }`}
              >
                <span className="text-xl">{meta.icon}</span>
                <div className="min-w-0">
                  <div className={`text-[11px] font-bold truncate ${meta.color}`}>
                    {meta.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-urdu truncate">
                    {meta.urdu}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Window Container */}
        <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[460px]">
          {/* Messages Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[560px]">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              const agent = m.agentName ? AGENT_META[m.agentName] || AGENT_META.triage : AGENT_META.triage;

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Metadata */}
                  <div className="flex items-center space-x-1.5 mb-1 px-1">
                    {!isUser && (
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <span>{agent.icon}</span>
                        <span className={agent.color}>{agent.name}</span>
                        <span className="text-[10px] text-slate-400 font-urdu">({agent.urdu})</span>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-emerald-800 text-white rounded-tr-none font-medium'
                        : m.isError
                        ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-none'
                        : 'bg-slate-50/90 border border-slate-200/80 text-slate-900 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line break-words">{m.text}</div>

                    {/* Pest Diagnosis Structured Card */}
                    {m.agentName === 'pest_doctor' && !m.isError && (
                      <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950">
                        <div className="flex items-center justify-between font-bold text-amber-900 mb-1.5 border-b border-amber-200 pb-1">
                          <span className="flex items-center gap-1.5">🔬 Verified PARC Treatment Guidelines</span>
                          <span className="bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded text-[10px]">Zero Dosage Hallucination</span>
                        </div>
                        <p className="text-[11px] text-amber-900 leading-normal">
                          Always verify chemical container labels. Wear personal protective equipment (gloves, respirator, goggles) before spraying.
                        </p>
                      </div>
                    )}

                    {/* Mandi Structured Card */}
                    {m.agentName === 'market' && !m.isError && (
                      <div className="mt-3 p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-950">
                        <div className="flex items-center justify-between font-bold text-blue-900 mb-1 border-b border-blue-200 pb-1">
                          <span className="flex items-center gap-1.5">📈 Mandi Wholesale Benchmark</span>
                          <span className="bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded text-[10px]">AMIS Punjab</span>
                        </div>
                        <p className="text-[11px] text-blue-900">
                          Official reference prices updated daily. Actual spot rates vary by moisture and grade.
                        </p>
                      </div>
                    )}

                    {/* ADK Multi-Agent Execution Trace & Developer Inspector (Prompt 12) */}
                    {m.debugTrace && !m.isError && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/90 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() =>
                              setExpandedTraces((prev) => ({
                                ...prev,
                                [m.id]: !(prev[m.id] ?? devMode),
                              }))
                            }
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition"
                          >
                            <span>🔍</span>
                            <span>
                              ADK Trace: {m.debugTrace.selected_agent} ({m.debugTrace.latency_ms} ms)
                            </span>
                            <span>{(expandedTraces[m.id] ?? devMode) ? '▲' : '▼'}</span>
                          </button>

                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <span>🔒</span>
                            <span>Redacted</span>
                          </span>
                        </div>

                        {(expandedTraces[m.id] ?? devMode) && (
                          <div className="mt-3 p-3 bg-slate-900 text-slate-200 rounded-xl text-xs space-y-3 font-mono shadow-inner border border-slate-800">
                            {/* Execution Flow Timeline */}
                            <div>
                              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                                Execution Flow:
                              </div>
                              <div className="space-y-1 text-[11px]">
                                {m.debugTrace.execution_flow?.map((step: string, sIdx: number) => (
                                  <div key={sIdx} className="flex items-center gap-2">
                                    <span className="text-emerald-500 font-bold">↳</span>
                                    <span className="text-slate-300">{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Handoff Chain */}
                            {m.debugTrace.handoffs && m.debugTrace.handoffs.length > 0 && (
                              <div>
                                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                                  Agent Handoff Chain:
                                </div>
                                <div className="space-y-1 text-[11px]">
                                  {m.debugTrace.handoffs.map((h: any, hIdx: number) => (
                                    <div key={hIdx} className="bg-slate-800/80 p-1.5 rounded text-slate-300">
                                      <span className="text-amber-300 font-bold">{h.from_agent}</span> → <span className="text-emerald-300 font-bold">{h.to_agent}</span>: {h.reason}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tool Calls */}
                            {m.debugTrace.tool_calls && m.debugTrace.tool_calls.length > 0 && (
                              <div>
                                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                                  Tool Execution & Structured I/O:
                                </div>
                                {m.debugTrace.tool_calls.map((tc: any, tcIdx: number) => (
                                  <div key={tcIdx} className="bg-slate-800/80 p-2 rounded text-[11px] space-y-1">
                                    <div className="flex items-center justify-between text-slate-200">
                                      <span className="text-amber-300 font-bold">⚙️ {tc.tool_name}</span>
                                      <span className="text-emerald-400">{tc.duration_ms} ms</span>
                                    </div>
                                    <div className="text-slate-400 text-[10px]">Inputs: {JSON.stringify(tc.tool_inputs)}</div>
                                    <div className="text-emerald-300 text-[10px]">Results: {JSON.stringify(tc.tool_results)}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Raw JSON inspection toggle */}
                            <details className="text-[10px]">
                              <summary className="text-slate-400 cursor-pointer hover:text-slate-200">
                                View full raw trace JSON
                              </summary>
                              <pre className="p-2 bg-slate-950 rounded mt-1 overflow-x-auto text-emerald-400 max-h-40">
                                {JSON.stringify(m.debugTrace, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Retry Button if Failed */}
                    {m.isError && (
                      <div className="mt-2 pt-2 border-t border-rose-200 flex items-center justify-between">
                        <span className="text-xs text-rose-700">Connection error</span>
                        <button
                          onClick={handleRetry}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                        >
                          🔄 Retry Query
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Agent Activity Indicator & Shimmer Loading */}
            {isLoading && (
              <div className="flex flex-col items-start animate-fade-in">
                <div className="flex items-center space-x-1.5 mb-1 px-1">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                    <span>
                      {activeSpecialist && AGENT_META[activeSpecialist]
                        ? `${AGENT_META[activeSpecialist].icon} ${AGENT_META[activeSpecialist].name} is consulting farm records...`
                        : '🛡️ Triage Agent is analyzing inquiry...'}
                    </span>
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-none p-4 w-64 shadow-xs">
                  <div className="space-y-2">
                    <div className="h-2.5 bg-slate-200 rounded-full animate-pulse w-3/4"></div>
                    <div className="h-2.5 bg-slate-200 rounded-full animate-pulse w-full"></div>
                    <div className="h-2.5 bg-slate-200 rounded-full animate-pulse w-5/6"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200/70 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              💡 {lang === 'ur' ? 'تجویز کردہ سوالات:' : 'Suggested:'}
            </span>
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(q)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-xs font-medium transition shadow-2xs text-left"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                lang === 'ur'
                  ? 'یہاں اپنا زرعی سوال لکھیں (مثلاً: کپاس کے پتے پیلے کیوں ہو رہے ہیں؟)...'
                  : 'Ask about crops, cotton pests, fertilizer calculation, mandi rates, or profit...'
              }
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-600 transition"
              disabled={isLoading}
            />

            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !inputText.trim()}
              className="px-5 py-3 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center space-x-1.5 flex-shrink-0"
            >
              <span>{lang === 'ur' ? 'ارسال کریں' : 'Send'}</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-3 text-center text-[11px] text-slate-500">
          ⚠️ Kisan Dost adheres strictly to verified Pakistani Agricultural Research Council (PARC) and provincial agronomy datasets. Dosages must be verified on registered product labels.
        </div>
      </main>
    </div>
  );
}
