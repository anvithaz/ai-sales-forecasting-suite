'use client';

import { useState, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TransitionLink } from '@/components/TransitionLink';
import { NavItem } from '@/components/NavItem';
import { CustomSelect } from '@/components/CustomSelect';
import {
  LayoutDashboard, UploadCloud, LineChart as LineChartIcon, Settings,
  Menu, ChevronLeft, BarChart2, User, Key, Sliders, Database,
  Eye, EyeOff, CheckCircle2, Loader2, AlertTriangle, Trash2, RefreshCw, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InputField } from '@/app/auth/components/InputField';
import { useEffect } from 'react';

const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean, onChange: (checked: boolean) => void, label: string }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-sm font-medium text-slate-300 whitespace-nowrap">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-neon-teal focus:ring-offset-2 focus:ring-offset-obsidian cursor-pointer ${
        checked ? 'bg-neon-teal' : 'bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default function SettingsPage() {
  const router = useRouter();
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'preferences' | 'data'>('profile');

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    router.push('/auth');
  }, [router]);


  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('User');
  const [avatar, setAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isRemovingKey, setIsRemovingKey] = useState(false);
  const [connectDb, setConnectDb] = useState(false);

  const [currency, setCurrency] = useState('usd');
  const [dateFormat, setDateFormat] = useState('mm-dd-yyyy');
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isSavedPrefs, setIsSavedPrefs] = useState(false);

  const [isClearing, setIsClearing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchApiKeys = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings/api`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setApiKey(data.groq_api_key || '');
        }

        const prefRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings/preferences`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (prefRes.ok) {
          const prefData = await prefRes.json();
          setCurrency(prefData.currency || 'usd');
          setDateFormat(prefData.date_format || 'mm-dd-yyyy');
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchApiKeys();
  }, []);

  const handleVerifyKey = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsVerifying(true);
    setIsVerified(false);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings/api/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ api_key: apiKey })
      });
      if (res.ok) {
        setIsVerified(true);
        setTimeout(() => setIsVerified(false), 3000);
      } else {
        const err = await res.json();
        alert(`Verification failed: ${err.detail || 'Invalid Key'}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Network error verifying API key.`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!window.confirm("Are you sure you want to remove your API key? The AI features will be disabled.")) {
        return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsRemovingKey(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings/api`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setApiKey('');
        setIsVerified(false);
        alert('API Key removed successfully.');
      } else {
        alert('Failed to remove API key.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error removing API key.');
    } finally {
      setIsRemovingKey(false);
    }
  };

  const handleSavePreferences = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsSavingPrefs(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currency, date_format: dateFormat })
      });
      if (res.ok) {
        setIsSavedPrefs(true);
        setTimeout(() => setIsSavedPrefs(false), 3000);
      } else {
        const err = await res.text();
        alert(`Failed to save preferences: ${err}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Network error saving preferences.`);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleClearCache = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsClearing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings/clear-cache`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Cache and Temporary AI Contexts cleared successfully!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and ALL your data and uploaded files will be permanently wiped.')) {
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings/account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Account deleted successfully.');
        handleLogout();
      } else {
        const err = await res.text();
        alert(`Failed to delete account: ${err}`);
        setIsDeleting(false);
      }
    } catch (e) {
      console.error(e);
      alert('Network error deleting account.');
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFullName(data.full_name || '');
          setEmail(data.email || 'Error: Email empty from server');
          setRole(data.role || 'User');
          setLocation(data.location || '');
          setAvatar(data.avatar || '');
        } else {
          const txt = await res.text();
          alert(`Failed to load profile data: ${res.statusText} - ${txt}`);
        }
      } catch (e) {
        console.error(e);
        alert(`Network error fetching profile: ${e}`);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: fullName,
          location: location,
          avatar: avatar
        })
      });
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        const err = await res.text();
        alert(`Failed to save profile: ${err}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Network error saving profile: ${e}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Account', icon: <User size={18} /> },
    { id: 'api', label: 'API & Integrations', icon: <Key size={18} /> },
    { id: 'preferences', label: 'Application Preferences', icon: <Sliders size={18} /> },
    { id: 'data', label: 'Data Management', icon: <Database size={18} /> },
  ] as const;

  return (
    <div className="min-h-screen bg-obsidian flex overflow-hidden text-slate-200">
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:relative z-50 md:z-20 flex flex-col h-screen transition-[width,transform] duration-300 ease-in-out will-change-[width,transform] border-r border-glass-border bg-obsidian-light shrink-0 ${isDesktopSidebarOpen ? 'w-64' : 'w-64 md:w-20'} ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-glass-border">
          <span className={`font-bold text-lg tracking-tight text-white transition-all duration-300 whitespace-nowrap overflow-hidden ${!isDesktopSidebarOpen ? 'md:max-w-0 md:opacity-0' : 'md:max-w-[150px] md:opacity-100'}`}>Forecast</span>
          
          <button onClick={() => setMobileSidebarOpen(false)} className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white cursor-pointer">
            <ChevronLeft size={20} />
          </button>

          <button onClick={() => setDesktopSidebarOpen(!isDesktopSidebarOpen)} className={`hidden md:block p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white cursor-pointer ${!isDesktopSidebarOpen ? 'mx-auto' : ''}`}>
            {isDesktopSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          <TransitionLink href="/dashboard" className="block" loaderText="LOADING DASHBOARD...">
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" isDesktopOpen={isDesktopSidebarOpen} />
          </TransitionLink>
          <TransitionLink href="/analytics" className="block" loaderText="LOADING ANALYTICS...">
            <NavItem icon={<BarChart2 size={20} />} label="Analytics" isDesktopOpen={isDesktopSidebarOpen} />
          </TransitionLink>
          <TransitionLink href="/upload" className="block" loaderText="LOADING DATA UPLOAD...">
            <NavItem icon={<UploadCloud size={20} />} label="Data Upload" isDesktopOpen={isDesktopSidebarOpen} />
          </TransitionLink>
          <TransitionLink href="/forecasts" className="block" loaderText="LOADING FORECASTS...">
            <NavItem icon={<LineChartIcon size={20} />} label="Forecasts" isDesktopOpen={isDesktopSidebarOpen} />
          </TransitionLink>
          <TransitionLink href="/settings" className="block" loaderText="LOADING SETTINGS...">
            <NavItem icon={<Settings size={20} />} label="Settings" active isDesktopOpen={isDesktopSidebarOpen} />
          </TransitionLink>
        </nav>

        <div className="p-3 border-t border-glass-border space-y-2">
          <div className={`flex items-center gap-3 px-2 py-1 ${isDesktopSidebarOpen ? 'md:gap-3' : 'md:justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-ai p-[2px] shrink-0 overflow-hidden text-white flex items-center justify-center font-bold text-xs bg-obsidian">
              {avatar ? (
                <img src={avatar} className="w-full h-full object-cover rounded-full" alt="DP" />
              ) : (
                fullName ? fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'
              )}
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 whitespace-nowrap ${!isDesktopSidebarOpen ? 'md:max-w-0 md:opacity-0' : 'md:max-w-[150px] md:opacity-100'}`}>
              <span className="text-sm font-medium text-white truncate">{fullName || 'User'}</span>
              <span className="text-xs text-slate-400 truncate">{role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors duration-200 cursor-pointer ${!isDesktopSidebarOpen ? 'md:justify-center' : ''}`}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${!isDesktopSidebarOpen ? 'md:max-w-0 md:opacity-0' : 'md:max-w-[150px] md:opacity-100'}`}>Log Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.15)_0%,transparent_70%)] pointer-events-none" />

        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-glass-border glass-panel z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)} 
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold text-white">Settings & Preferences</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 z-10">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
            
            <div className="w-full lg:w-64 shrink-0 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-electric-indigo/20 to-transparent text-white border-l-2 border-electric-indigo shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-electric-indigo' : 'text-slate-500'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right Panel: Active Settings Views */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {activeTab === 'profile' && (
                    <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-8 border border-glass-border/50 relative">
                      <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-neon-teal to-electric-indigo" />
                      
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Profile & Account</h2>
                        <p className="text-sm text-slate-400">Manage your personal information and account security.</p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="relative group shrink-0">
                          <label className="cursor-pointer block">
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            <div className="w-24 h-24 rounded-full bg-obsidian border-2 border-neon-teal shadow-[0_0_20px_rgba(45,212,191,0.3)] flex items-center justify-center text-3xl font-bold text-white overflow-hidden relative">
                              {avatar ? (
                                <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
                              ) : (
                                fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'
                              )}
                              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <UploadCloud className="w-5 h-5 text-white mb-1" />
                                <span className="text-[10px] font-medium text-white">Upload</span>
                              </div>
                            </div>
                          </label>
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple text-xs font-bold uppercase tracking-widest mb-2">
                            Role: {role}
                          </div>
                          <p className="text-sm text-slate-400">Update your photo and personal details.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                          label="Full Name"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          icon={<User className="h-5 w-5 text-slate-500 group-focus-within:text-neon-teal transition-colors" />}
                        />
                        <InputField
                          label="Email Address (Read Only)"
                          type="text"
                          value={email || 'Loading your email...'}
                          onChange={() => {}}
                          disabled
                          icon={<User className="h-5 w-5 text-slate-300" />}
                          className="!text-slate-100 !opacity-100"
                        />
                        <div className="md:col-span-2">
                          <InputField
                            label="Location"
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            icon={<User className="h-5 w-5 text-slate-500 group-focus-within:text-neon-teal transition-colors" />}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-glass-border/50">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 text-sm font-medium transition-all cursor-pointer"
                        >
                          <LogOut size={16} />
                          Log Out
                        </button>
                        <button 
                          onClick={handleSaveProfile} 
                          disabled={isSaving || isSaved} 
                          className={`px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-all shadow-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${
                            isSaved 
                              ? 'bg-emerald-500/80 shadow-emerald-500/20 ring-1 ring-emerald-400' 
                              : 'bg-gradient-ai hover:opacity-90 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                          }`}
                        >
                          {isSaving ? 'Saving...' : isSaved ? '✓ Saved Successfully' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'api' && (
                    <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-8 border border-glass-border/50 relative">
                      <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-electric-indigo to-cyber-purple" />
                      
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">API & Integrations</h2>
                        <p className="text-sm text-slate-400">Manage external connections crucial for the AI Engine.</p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Groq API Key</h3>
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                            <div className="flex-1 w-full">
                              <InputField
                                label="Secret Key"
                                type={showApiKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                icon={<Key className="h-5 w-5 text-slate-500 group-focus-within:text-electric-indigo transition-colors" />}
                                rightIcon={
                                  <button 
                                    type="button" 
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                }
                              />
                            </div>
                            <button 
                              onClick={handleVerifyKey}
                              disabled={isVerifying || !apiKey}
                              className="w-full sm:w-auto px-6 py-3.5 mb-4 rounded-xl bg-obsidian-light border border-glass-border text-white font-medium text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {isVerifying ? (
                                <Loader2 className="w-4 h-4 animate-spin text-electric-indigo" />
                              ) : isVerified ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <RefreshCw className="w-4 h-4 text-slate-400" />
                              )}
                              {isVerifying ? 'Verifying...' : isVerified ? 'Verified' : 'Verify Key'}
                            </button>
                            <button 
                              onClick={handleRemoveKey}
                              disabled={isRemovingKey || !apiKey}
                              className="w-full sm:w-auto px-6 py-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium text-sm hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {isRemovingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              Remove Key
                            </button>
                          </div>
                        </div>

                        <div className="hidden pt-6 border-t border-glass-border/50 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">Database Connection</h3>
                              <p className="text-xs text-slate-400">Phase 3 Preview: Connect directly to your PostgreSQL instance.</p>
                            </div>
                            <ToggleSwitch 
                              checked={connectDb} 
                              onChange={setConnectDb} 
                              label={connectDb ? "Enabled" : "Disabled"} 
                            />
                          </div>

                          <AnimatePresence>
                            {connectDb && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2"
                              >
                                <InputField
                                  label="Host"
                                  type="text"
                                  placeholder="db.example.com"
                                  disabled
                                  icon={<Database className="h-5 w-5 text-slate-600" />}
                                  className="opacity-50 cursor-not-allowed"
                                />
                                <InputField
                                  label="Port"
                                  type="text"
                                  placeholder="5432"
                                  disabled
                                  icon={<Database className="h-5 w-5 text-slate-600" />}
                                  className="opacity-50 cursor-not-allowed"
                                />
                                <InputField
                                  label="User"
                                  type="text"
                                  placeholder="postgres_user"
                                  disabled
                                  icon={<User className="h-5 w-5 text-slate-600" />}
                                  className="opacity-50 cursor-not-allowed"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'preferences' && (
                    <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-8 border border-glass-border/50 relative">
                      <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-cyber-purple to-neon-teal" />
                      
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Application Preferences</h2>
                        <p className="text-sm text-slate-400">Customize your regional and display settings.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest ml-1 block">
                            Default Currency
                          </label>
                          <CustomSelect
                            value={currency}
                            onChange={setCurrency}
                            options={[
                              { value: 'usd', label: 'USD ($)' },
                              { value: 'eur', label: 'EUR (€)' },
                              { value: 'inr', label: 'INR (₹)' },
                              { value: 'gbp', label: 'GBP (£)' }
                            ]}
                            className="w-full"
                            buttonClassName="py-3.5 bg-obsidian-light/40 border-glass-border/50 backdrop-blur-xl shadow-inner"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest ml-1 block">
                            Date Format
                          </label>
                          <CustomSelect
                            value={dateFormat}
                            onChange={setDateFormat}
                            options={[
                              { value: 'mm-dd-yyyy', label: 'MM/DD/YYYY' },
                              { value: 'dd-mm-yyyy', label: 'DD/MM/YYYY' }
                            ]}
                            className="w-full"
                            buttonClassName="py-3.5 bg-obsidian-light/40 border-glass-border/50 backdrop-blur-xl shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-glass-border/50 flex justify-end">
                        <button 
                          onClick={handleSavePreferences} 
                          disabled={isSavingPrefs || isSavedPrefs} 
                          className={`px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-all shadow-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${
                            isSavedPrefs 
                              ? 'bg-emerald-500/80 shadow-emerald-500/20 ring-1 ring-emerald-400' 
                              : 'bg-gradient-ai hover:opacity-90 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                          }`}
                        >
                          {isSavingPrefs ? 'Saving...' : isSavedPrefs ? '✓ Saved Successfully' : 'Save Preferences'}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'data' && (
                    <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-8 border border-rose-500/30 relative bg-rose-500/5">
                      <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-rose-500 to-red-600" />
                      
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                          <AlertTriangle className="text-rose-500" />
                          Danger Zone
                        </h2>
                        <p className="text-sm text-slate-400">Destructive actions that cannot be undone.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-rose-500/20 bg-obsidian/50 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-white">Clear All Cached AI Contexts</h4>
                            <p className="text-xs text-slate-400 mt-1">Removes all temporary data used by the forecasting engine.</p>
                          </div>
                          <button 
                            onClick={handleClearCache}
                            disabled={isClearing}
                            className="px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                          >
                            {isClearing ? 'Clearing...' : 'Clear Cache'}
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-rose-500/20 bg-obsidian/50 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-white">Delete Account</h4>
                            <p className="text-xs text-slate-400 mt-1">Permanently delete your account and all associated data.</p>
                          </div>
                          <button 
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.3)] cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                          >
                            {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                            {isDeleting ? 'Deleting...' : 'Delete Account'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
