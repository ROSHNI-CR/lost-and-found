import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  Loader2,
  Trash2,
  MapPin,
  Calendar,
  ChevronRight,
  HelpCircle,
  Tag
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { ChatMessage } from '../types';
import { Link } from 'react-router-dom';

const SUGGESTED_PROMPTS = [
  "I lost my college ID card near Central Block (CB). Has anyone turned it in?",
  "Has anyone found a scientific calculator in the ICT Block computer lab?",
  "Did someone turn in a black water bottle found near the Nescafe Kiosk?",
  "Where is the physical claim handover desk at Gate 1?",
  "How can I submit an ownership claim with proof?"
];

interface ChatItem {
  id: string;
  type: string;
  title: string;
  category: string;
  color: string | string[];
  location: string;
  date: string;
  status: string;
  image_urls?: string[];
}

interface MessageEntry {
  role: 'user' | 'assistant';
  content: string;
  items?: ChatItem[];
  suggestedActions?: string[];
}

export const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<MessageEntry[]>([
    {
      role: 'assistant',
      content:
        "Hello! I am your HITK FindIt AI Assistant. I can search active lost & found records across Heritage Institute of Technology (Central Block, ICT Block, Central Library, Canteens, Grounds), guide you through reporting belongings, and explain verification handovers at the Gate 1 Security Desk. How can I help you today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMessage: MessageEntry = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Build conversation history format
      const historyPayload: ChatMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await aiService.chatWithAssistant(query, historyPayload);

      const assistantMessage: MessageEntry = {
        role: 'assistant',
        content: res.reply,
        items: res.relevant_items,
        suggestedActions: res.suggested_actions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I encountered a network issue searching campus records. Please try again or check the listings board directly."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Conversation history cleared. What campus belonging can I help you search for?"
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-5rem)] flex flex-col space-y-4">
      {/* Chat Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              FindIt AI Assistant
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Grounded RAG Online
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Retrieval-grounded search across active campus records
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-y-auto p-6 space-y-6">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3.5 ${
              m.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${
                m.role === 'user'
                  ? 'bg-slate-900'
                  : 'bg-gradient-to-tr from-brand-700 to-indigo-600 shadow-sm'
              }`}
            >
              {m.role === 'user' ? (
                <UserIcon className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#4338ca] text-white rounded-tr-none'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none space-y-3'
              }`}
            >
              <p className="whitespace-pre-line">{m.content}</p>

              {/* Render Retrieved Item Cards if any */}
              {m.items && m.items.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Campus Records Found:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {m.items.map(it => (
                      <Link
                        key={it.id}
                        to={`/items/${it.type}/${it.id}`}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-brand-400 hover:shadow-sm transition-all block group"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="uppercase font-bold text-brand-700">
                            {it.type} item
                          </span>
                          <span>{it.category}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-700 truncate mt-0.5">
                          {it.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{it.location}</span>
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Searching active campus reports & synthesizing grounded response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
          Suggestions:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 whitespace-nowrap transition-colors border border-slate-200"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about a lost belonging or campus recovery procedure..."
          className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-6 py-3 rounded-2xl text-xs font-bold text-white bg-[#4338ca] hover:bg-[#3730a3] shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
