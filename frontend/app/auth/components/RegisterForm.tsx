'use client';

import { useState } from 'react';
import { Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { InputField } from './InputField';
import { FullScreenLoader } from './FullScreenLoader';

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const registerRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email, password }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(registerData.detail || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1800);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-neon-teal/10 border border-neon-teal/30 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-neon-teal" />
        </div>
        <h3 className="text-lg font-semibold text-white">Account Created!</h3>
        <p className="text-sm text-slate-400">Redirecting you to sign in...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <FullScreenLoader isLoading={isLoading} text="CREATING ACCOUNT..." />
      <form className="space-y-6" onSubmit={handleSubmit}>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <InputField
          label="Full Name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          icon={<User className="h-5 w-5 text-slate-500 group-focus-within:text-cyber-purple transition-colors" />}
          disabled={isLoading}
        />

        <InputField
          label="Email Address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          icon={<Mail className="h-5 w-5 text-slate-500 group-focus-within:text-electric-indigo transition-colors" />}
          disabled={isLoading}
        />

        <InputField
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={<Lock className="h-5 w-5 text-slate-500 group-focus-within:text-neon-teal transition-colors" />}
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-ai hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyber-purple focus:ring-offset-obsidian transition-all duration-300 mt-8 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
