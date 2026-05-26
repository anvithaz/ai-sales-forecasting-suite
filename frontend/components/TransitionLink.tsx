'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CyberLoader } from '@/app/components/ui/CyberLoader';

export function TransitionLink({ 
  href, 
  children, 
  className,
  loaderText = "LOADING..."
}: { 
  href: string; 
  children: React.ReactNode; 
  className?: string;
  loaderText?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    router.push(href);
  };

  return (
    <>
      {mounted && createPortal(
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-obsidian/80 backdrop-blur-md"
            >
              <CyberLoader text={loaderText} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
      <Link href={href} onClick={handleClick} className={className}>
        {children}
      </Link>
    </>
  );
}
