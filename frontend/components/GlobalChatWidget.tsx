'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Sparkles, Send } from 'lucide-react';

function formatMessage(content: string) {
  return content.split('\n').map((line, i) => {
    const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const textLine = isListItem ? line.replace(/^[-*]\s/, '') : line;
    const parts = textLine.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    const formattedLine = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
        return <em key={j} className="italic text-slate-300">{part.slice(1, -1)}</em>;
      return <span key={j}>{part}</span>;
    });
    return (
      <div key={i} className={isListItem ? 'flex gap-2 mt-1' : (line.trim() === '' ? 'h-2' : 'mt-1.5 first:mt-0')}>
        {isListItem && <span className="text-electric-indigo shrink-0 mt-0.5">•</span>}
        <div className="flex-1">{formattedLine}</div>
      </div>
    );
  });
}

const EXCLUDED_PATHS = ['/auth', '/'];

export function GlobalChatWidget() {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen && !isChatProcessing) {
      setTimeout(() => chatInputRef.current?.focus(), 50);
    }
  }, [isChatOpen, isChatProcessing]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatProcessing]);

  const handleSendChat = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatProcessing) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const newMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: newMessage }]);
    setIsChatProcessing(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analytics/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage, history: chatHistory }),
      });

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try your question again shortly.' },
      ]);
    } finally {
      setIsChatProcessing(false);
    }
  }, [chatInput, chatHistory, isChatProcessing]);

  if (!pathname || EXCLUDED_PATHS.some(p => pathname === p) || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <>
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          title="Open Forecast AI Chat"
          className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 p-4 bg-electric-indigo hover:bg-electric-indigo/80 text-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all hover:scale-110 z-[200] flex items-center justify-center cursor-pointer"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isChatOpen && (
        <div className="fixed bottom-6 right-4 lg:bottom-8 lg:right-8 w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] bg-obsidian rounded-2xl border border-glass-border shadow-2xl z-[200] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="h-14 bg-obsidian-light border-b border-glass-border flex items-center justify-between px-4 shrink-0 glass-panel">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-ai p-[2px]">
                <div className="w-full h-full rounded-full bg-obsidian flex items-center justify-center">
                  <Sparkles size={14} className="text-electric-indigo" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Forecast AI</h3>
                <p className="text-[10px] text-neon-teal font-medium tracking-wide">● LIVE</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-electric-indigo/10 border border-electric-indigo/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-electric-indigo" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">Forecast AI Assistant</p>
                  <p className="text-slate-500 text-xs italic leading-relaxed">
                    Ask me about your sales trends, revenue drivers, or any anomalies in your data.
                  </p>
                </div>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-white/10 border border-white/20 text-white rounded-tr-sm'
                        : 'glass-panel-glow border-electric-indigo/20 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    <div className="leading-relaxed">
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        formatMessage(msg.content)
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isChatProcessing && (
              <div className="flex justify-start">
                <div className="glass-panel-glow border-electric-indigo/20 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center h-10 w-16">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-indigo animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-indigo animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-indigo animate-bounce" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={handleSendChat}
            className="p-3 border-t border-glass-border bg-obsidian-light shrink-0 flex items-center gap-2"
          >
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Message Forecast AI..."
              className="flex-1 bg-obsidian/80 border border-glass-border rounded-xl py-2.5 pl-4 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyber-purple/50 transition-colors"
              disabled={isChatProcessing}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isChatProcessing}
              className={`p-2.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                !chatInput.trim() || isChatProcessing
                  ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                  : 'bg-electric-indigo hover:bg-electric-indigo/80 text-white'
              }`}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
