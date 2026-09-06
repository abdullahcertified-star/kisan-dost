'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, X, ArrowRight, MessageSquare, Send, ChevronRight, HelpCircle } from 'lucide-react';

export default function FloatingBot() {
  const router = useRouter();
  const [unwrapped, setUnwrapped] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setUnwrapped(false);
      }
    }
    if (unwrapped) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [unwrapped]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    router.push(`/assistant?q=${encodeURIComponent(quickQuery.trim())}`);
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Unwrapped Expanded Card */}
      {unwrapped ? (
        <div className="w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-3xl border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 p-5 space-y-4 animate-in zoom-in-95 fade-in duration-200 text-slate-800 relative overflow-hidden">
          {/* Top Decorative Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-400/20 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-bold text-slate-900">AI Agronomist</h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-urdu">ماہر زراعت کسان دوست</p>
              </div>
            </div>
            <button
              onClick={() => setUnwrapped(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Wrap bot icon"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt description */}
          <p className="text-xs text-slate-600 leading-relaxed">
            Ask any farming question about fertilizer dosage (DAP/Urea), whitefly & pest control, live weather, or Punjab mandi rates.
          </p>

          {/* Quick Starter Chips */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Inquiries</p>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => router.push('/assistant?q=Wheat%20fertilizer%20plan%20in%20bags')}
                className="text-left px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-[11px] text-slate-700 hover:text-emerald-800 border border-slate-200/60 hover:border-emerald-300 transition flex items-center justify-between group"
              >
                <span>🌾 Wheat DAP & Urea Fertilizer Plan</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => router.push('/assistant?q=what%20is%20the%20current%20temperature%20in%20faisalabad')}
                className="text-left px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-[11px] text-slate-700 hover:text-emerald-800 border border-slate-200/60 hover:border-emerald-300 transition flex items-center justify-between group"
              >
                <span>🌦️ Live Weather & Irrigation Suitability</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => router.push('/assistant?q=Today%20AMIS%20wholesale%20mandi%20rates')}
                className="text-left px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-[11px] text-slate-700 hover:text-emerald-800 border border-slate-200/60 hover:border-emerald-300 transition flex items-center justify-between group"
              >
                <span>📈 Official Mandi Wholesale Prices</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform" />
              </button>
            </div>
          </div>

          {/* Quick Input Form */}
          <form onSubmit={handleQuickSubmit} className="relative">
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Ask anything (اردو / Roman / EN)..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Full Chat Link */}
          <Link
            href="/assistant"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/30 transition"
          >
            <span>Open Full AI Chatbot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        /* Wrapped Default State: Pure Compact Floating Bot Icon */
        <button
          onClick={() => setUnwrapped(true)}
          aria-label="Open AI Agronomist Bot"
          id="floating-ai-agronomist-bot"
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-green-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-700/50 hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/40 group"
          title="Click to unwrap AI Agronomist Bot"
        >
          {/* Bot Icon */}
          <Bot className="w-7 h-7 text-white group-hover:rotate-6 transition-transform" />

          {/* Glowing Green Radar Ring */}
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-300 border-2 border-white animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-xs" />
        </button>
      )}
    </div>
  );
}
