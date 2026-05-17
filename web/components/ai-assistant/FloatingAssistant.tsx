import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatWindow from './AIChatWindow';

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            className="mb-4 h-[min(600px,80vh)] w-[min(400px,90vw)]"
          >
            <AIChatWindow onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-shadow ${
          isOpen
            ? 'bg-zinc-800 text-white shadow-zinc-900/25'
            : 'bg-primary text-white shadow-primary/30 hover:shadow-primary/40'
        }`}
        aria-label={isOpen ? 'Close assistant' : 'Open shopping assistant'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
