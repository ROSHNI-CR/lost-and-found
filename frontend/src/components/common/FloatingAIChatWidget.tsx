import React, { useState, useRef, useEffect } from 'react';
import { Headphones, X, Send, Bot, ArrowUpRight, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiService } from '../../services/aiService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const FloatingAIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your HITK FindIt AI Assistant. You can ask me about lost items, where to deposit found belongings, or Gate 1 security desk procedures.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await aiService.chatWithAssistant(text.trim());
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: res.reply || 'I checked the campus records for that description.' }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I checked our HITK records. Please also report it online or visit Gate 1 Security Desk.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Popover Window */}
      {isOpen && (
        <div className="mb-3 w-[340px] sm:w-[380px] h-[490px] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 text-slate-800">
          {/* Header */}
          <div className="bg-[#0e1726] text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <img
                src="/hitk_logo.png"
                alt="HITK Logo"
                className="w-8 h-8 rounded-full bg-white p-0.5 border border-amber-400"
              />
              <div>
                <h4 className="text-xs font-bold flex items-center gap-1.5 text-white">
                  HITK AI Campus Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h4>
                <p className="text-[10px] text-slate-400">Heritage Institute of Technology</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/chatbot"
                onClick={() => setIsOpen(false)}
                title="Open fullscreen assistant"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              onClick={() => handleSend('Lost calculator in ICT Block')}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 whitespace-nowrap transition flex-shrink-0 font-medium"
            >
              Calculator in ICT?
            </button>
            <button
              onClick={() => handleSend('Lost ID card in Central Block')}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 whitespace-nowrap transition flex-shrink-0 font-medium"
            >
              ID card in CB?
            </button>
            <button
              onClick={() => handleSend('Where is Gate 1 Handover Desk?')}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 whitespace-nowrap transition flex-shrink-0 font-medium"
            >
              Gate 1 Desk?
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs bg-slate-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[#0e1726] text-amber-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-[#4338ca] text-white font-medium rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs leading-relaxed shadow-xs'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Searching HITK campus records...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5"
          >
            <input
              type="text"
              placeholder="Ask about lost items on campus..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold disabled:opacity-40 transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button (Matching Inspiration UI Bottom Right Headset Button) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group p-4 rounded-full bg-[#1e1b4b] hover:bg-[#312e81] text-white shadow-xl shadow-indigo-950/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-white ring-4 ring-indigo-200"
        aria-label="Ask Campus AI Assistant"
      >
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></span>
        <Headphones className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
      </button>
    </div>
  );
};
