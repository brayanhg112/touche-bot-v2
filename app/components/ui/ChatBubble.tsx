import { motion } from 'framer-motion';

interface ChatBubbleProps {
  role: 'bot' | 'user';
  text: React.ReactNode;
}

export default function ChatBubble({ role, text }: ChatBubbleProps) {
  if (role === 'bot') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end gap-3 max-w-[90%]"
      >
        <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="material-symbols-outlined text-on-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            storm
          </span>
        </div>
        <div className="glass-chat-ai p-4 rounded-t-2xl rounded-r-2xl text-on-surface">
          <div className="font-body text-[14px] leading-relaxed break-words whitespace-pre-wrap">{text}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end gap-3 ml-auto max-w-[90%]"
    >
      <div className="glass-chat-user p-4 rounded-t-2xl rounded-l-2xl text-on-surface text-right">
        <div className="font-body text-[14px] leading-relaxed break-words whitespace-pre-wrap">{text}</div>
      </div>
    </motion.div>
  );
}
