'use client';

import { motion } from 'framer-motion';
import OptionChip from './ui/OptionChip';

interface Option {
  value: string;
  label: string;
  emoji: string;
}

interface QuestionCardProps {
  options: Option[];
  selected: string[];
  multi?: boolean;
  alwaysShowConfirm?: boolean;
  onSelect: (value: string) => void;
  onConfirm?: () => void;
}

export default function QuestionCard({ options, selected, multi, alwaysShowConfirm, onSelect, onConfirm }: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-end gap-3 mt-2"
    >
      <div className="flex flex-wrap gap-2 justify-end">
        {options.map((opt) => (
          <OptionChip
            key={opt.value}
            label={`${opt.emoji} ${opt.label}`.trim()}
            selected={selected.includes(opt.value)}
            onClick={() => onSelect(opt.value)}
          />
        ))}
      </div>
      
      {multi && (selected.length > 0 || alwaysShowConfirm) && onConfirm && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onConfirm}
          className="btn-gold mt-2 py-2 px-6 shadow-[0_0_15px_rgba(168,85,247,0.3)] font-semibold"
        >
          Confirmar
        </motion.button>
      )}
    </motion.div>
  );
}
