'use client';

import { memo } from 'react';
import { motion } from 'motion/react';

export const CyberLoader = memo(function CyberLoader({ text = "PROCESSING..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-28 h-28 flex items-center justify-center mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-[2px] border-dashed border-cyber-purple/40"
        />
        
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-3 rounded-full border-t-2 border-l-2 border-neon-teal/80"
        />

        <motion.div
          animate={{ 
            rotate: [0, 90, 180, 270, 360],
            scale: [0.8, 1.1, 0.8, 1.1, 0.8],
            borderRadius: ["20%", "50%", "20%", "50%", "20%"]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-6 border-2 border-electric-indigo bg-electric-indigo/20 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.5)]"
        />

        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_15px_#fff,0_0_30px_#2dd4bf]"
        />
      </div>

      <div className="relative overflow-hidden px-4 py-1">
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-xs font-mono tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-neon-teal to-cyber-purple font-bold"
        >
          {text}
        </motion.div>
        
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
        />
      </div>
    </div>
  );
});
