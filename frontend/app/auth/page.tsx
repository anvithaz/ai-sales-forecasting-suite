'use client';

import { useState, useCallback } from 'react';
import { TransitionLink } from '@/components/TransitionLink';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CyberLoader } from '../components/ui/CyberLoader';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  const toggleAuthMode = useCallback(() => {
    setAuthMode(prev => prev === 'login' ? 'register' : 'login');
  }, []);

  const handleForgotPassword = useCallback(() => setAuthMode('forgot'), []);
  const handleBackToLogin = useCallback(() => setAuthMode('login'), []);

  return (
    <div className="min-h-screen w-full flex bg-obsidian overflow-hidden">
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-ai opacity-20 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-obsidian/40 via-obsidian to-obsidian" />
        
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-electric-indigo/30 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-purple/30 rounded-full blur-[100px]"
        />

        <div className="relative z-10 text-center space-y-6 max-w-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass-panel-glow mb-8">
            <BrainCircuit className="w-10 h-10 text-neon-teal" />
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            The Future of <br/>
            <span className="bg-gradient-to-r from-electric-indigo via-cyber-purple to-neon-teal bg-clip-text text-transparent inline-block pb-1">Business Intelligence</span>
          </h2>
          <p className="text-slate-400 text-lg font-light leading-relaxed">
            Join the platform that transforms raw data into strategic foresight using zero-training LLM technology.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-32 relative z-10">
        <TransitionLink href="/" loaderText="RETURNING HOME..." className="absolute top-8 left-8 sm:left-16 lg:left-32 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </TransitionLink>

        <div className="w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={authMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">
                  {authMode === 'login' && 'Welcome back'}
                  {authMode === 'register' && 'Create an account'}
                  {authMode === 'forgot' && 'Reset Password'}
                </h1>
                <p className="text-slate-400 text-sm">
                  {authMode === 'login' && 'Enter your credentials to access your dashboard.'}
                  {authMode === 'register' && 'Sign up to start forecasting with AI.'}
                  {authMode === 'forgot' && 'Enter your email to receive a reset code.'}
                </p>
              </div>

              {authMode === 'login' && <LoginForm onForgotPassword={handleForgotPassword} />}
              {authMode === 'register' && <RegisterForm onSuccess={() => setAuthMode('login')} />}
              {authMode === 'forgot' && <ForgotPasswordForm onBackToLogin={handleBackToLogin} />}

              {authMode !== 'forgot' && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-400">
                    {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <button 
                      onClick={toggleAuthMode}
                      className="font-medium text-cyber-purple hover:text-cyber-purple/80 transition-colors focus:outline-none cursor-pointer"
                    >
                      {authMode === 'login' ? 'Sign up' : 'Log in'}
                    </button>
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
