'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessageProps {
  role: 'bot' | 'user';
  text: string;
}

export default function ChatMessage({ role, text }: ChatMessageProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        {role === 'bot' && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1"
            style={{ background: 'linear-gradient(135deg, #f2ca50, #d4af37)', fontSize: 12, color: '#1a1200', fontWeight: 700, fontFamily: 'Noto Serif, serif' }}>
            A
          </div>
        )}
        <div className={role === 'bot' ? 'bubble-bot' : 'bubble-user'}>
          {text}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
