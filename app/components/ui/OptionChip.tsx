import { motion } from 'framer-motion';

interface OptionChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function OptionChip({ label, selected, onClick }: OptionChipProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
        selected
          ? 'bg-primary text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
          : 'border border-outline-variant/30 bg-surface-container-high text-on-surface hover:border-primary/50'
      }`}
    >
      {label}
    </motion.button>
  );
}
