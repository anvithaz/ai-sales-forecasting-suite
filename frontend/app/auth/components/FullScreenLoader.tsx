'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CyberLoader } from '../../components/ui/CyberLoader';

interface FullScreenLoaderProps {
  isLoading: boolean;
  text: string;
}

export function FullScreenLoader({ isLoading, text }: FullScreenLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-obsidian/80 backdrop-blur-md"
        >
          <CyberLoader text={text} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
