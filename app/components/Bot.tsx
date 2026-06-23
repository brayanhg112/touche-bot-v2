'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from './ui/ChatBubble';
import type { BotAnswers } from '../lib/types';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

const SUGGESTIONS = [
  "Busco algo cítrico y fresco",
  "Cita romántica nocturna",
  "Fragancia de alto impacto",
  "¿Cómo saber cuál me queda mejor?"
];

export default function Bot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'bot',
      text: 'Bienvenido al atelier digital de Touche Essencielle. Soy Aria, su sommelier de fragancias de lujo. 🌹'
    },
    {
      id: 'init-2',
      role: 'bot',
      text: 'Puede usar nuestras sugerencias rápidas o describirme exactamente qué esencia está buscando.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add user message
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Formatted for the Anthropic endpoint in route.ts
      const apiMessages = [...messages, userMsg].map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      const data = await response.json();
      
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'bot', text: data.message || "Lo siento, ha ocurrido un error en mi intuición olfativa." };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'bot', text: "Hubo un pequeño contratiempo en el atelier. Por favor, intente nuevamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative w-full h-full">
      {/* ── Chat History ── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-6 custom-scrollbar pb-[140px] pt-4">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ChatBubble role={m.role} text={m.text} />
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-start">
              <div className="glass-chat-ai px-6 py-4 rounded-2xl rounded-tl-sm text-sm obsidian-glow font-body text-on-surface/80">
                <span className="animate-pulse">Aria está consultando la colección... ✨</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* ── Input Area & Suggestions ── */}
      <div className="fixed bottom-[80px] w-full max-w-2xl left-1/2 -translate-x-1/2 px-4 z-40 bg-gradient-to-t from-background via-background/90 to-transparent pt-10 pb-2">
        
        {/* Quick Actions (Suggestions Bar) */}
        <div className="flex overflow-x-auto gap-2 pb-3 custom-scrollbar mb-2">
          {SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(sug)}
              disabled={isLoading}
              className="flex-shrink-0 px-4 py-2 rounded-full border border-primary/30 bg-surface-container/80 backdrop-blur-md text-xs font-label text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <div className="relative group flex items-center">
          <input
            id="chat-input"
            className="w-full bg-surface-container-high/90 backdrop-blur-xl border border-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/50 text-on-surface py-4 pl-6 pr-14 rounded-2xl transition-all duration-300 placeholder:text-on-surface/40 font-body text-sm"
            placeholder="Conversa libremente con Aria..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            disabled={isLoading}
            autoFocus
          />
          <button 
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full purple-gradient flex items-center justify-center text-white shadow-[0_0_15px_rgba(126,34,206,0.5)] hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="material-symbols-outlined font-bold text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
