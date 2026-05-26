'use client';

import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TransitionLink } from '@/components/TransitionLink';
import {
  LayoutDashboard, UploadCloud, LineChart as LineChartIcon, Settings,
  Calendar, Filter, Download, ArrowUpRight, Sparkles, AlertTriangle,
  TrendingUp, Send, Menu, ChevronLeft, BarChart2, Loader2, ChevronDown, MessageCircle, X,
  ArrowDownRight, Activity, DollarSign, Target
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { NavItem } from '@/components/NavItem';
import { CyberLoader } from '../components/ui/CyberLoader';

const ForecastingChart = dynamic(() => import('@/components/ForecastingChart').then(mod => mod.ForecastingChart), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] flex items-center justify-center text-slate-500 bg-obsidian-light/20 rounded-xl border border-glass-border/50 animate-pulse">
      Loading chart...
    </div>
  )
});

export default function Dashboard() {
  const router = useRouter();
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [noDataset, setNoDataset] = useState(false);
  const [userProfile, setUserProfile] = useState({ full_name: 'User', email: '' });
  const [kpis, setKpis] = useState({ total_revenue: "$0.00", average_order_value: "$0.00", peak_sales_day: "N/A", growth_rate: "+0.0%" });
  const [chartData, setChartData] = useState([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [dateRange, setDateRange] = useState('Lifetime Data');
  
  const [aiAnalysis, setAiAnalysis] = useState({
    summary: "Refining high-reasoning intelligence...",
    recommendation: "Analyzing performance markers...",
    insights: []
  });
  
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isChatOpen && !isChatProcessing && chatInputRef.current) {
      setTimeout(() => chatInputRef.current?.focus(), 50);
    }
  }, [isChatOpen, isChatProcessing]);

  const fetchData = useCallback(async (category?: string) => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const catParam = category && category !== 'All Categories' ? `?category=${encodeURIComponent(category)}` : '';

    try {
      if (userProfile.full_name === 'User') {
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) setUserProfile(await userRes.json());
      }

      const kpiRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analytics/kpis${catParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (kpiRes.status === 404) {
        setNoDataset(true);
        setIsLoading(false);
        return;
      }

      if (!kpiRes.ok) throw new Error('Failed to load dataset analytics.');
      setNoDataset(false);
      const kpiData = await kpiRes.json();
      setKpis(kpiData.kpis);
      setChartData(kpiData.chart_data);
      if (kpiData.categories) setCategories(kpiData.categories);
      if (kpiData.date_range) setDateRange(kpiData.date_range);

      const aiRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analytics/ai-analysis${catParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiAnalysis({
          summary: aiData.analysis,
          recommendation: aiData.recommendation,
          insights: aiData.insights
        });
      }

    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [router, userProfile.full_name]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatProcessing) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const newMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: newMessage }]);
    setIsChatProcessing(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analytics/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage,
          history: chatHistory,
          category: selectedCategory === 'All Categories' ? null : selectedCategory
        })
      });

      if (!res.ok) throw new Error('Failed to send message');
      
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again later.' }]);
    } finally {
      setIsChatProcessing(false);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setIsCategoryMenuOpen(false);
    fetchData(cat);
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => {
      const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const textLine = isListItem ? line.replace(/^[-*]\s/, '') : line;
      
      const parts = textLine.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      const formattedLine = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={j} className="italic text-slate-300">{part.slice(1, -1)}</em>;
        }
        return <span key={j}>{part}</span>;
      });

      return (
        <div key={i} className={isListItem ? "flex gap-2 mt-1" : (line.trim() === '' ? "h-2" : "mt-1.5 first:mt-0")}>
          {isListItem && <span className="text-electric-indigo shrink-0 mt-0.5">•</span>}
          <div className="flex-1">{formattedLine}</div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-obsidian flex overflow-hidden text-slate-200" suppressHydrationWarning>
      
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <aside className={`fixed md:relative z-50 md:z-20 flex flex-col h-screen transition-[width,transform] duration-300 ease-in-out border-r border-glass-border bg-obsidian-light shrink-0 ${isDesktopSidebarOpen ? 'w-64' : 'w-64 md:w-20'} ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-glass-border">
          <span className={`font-bold text-lg tracking-tight text-white transition-all duration-300 whitespace-nowrap overflow-hidden ${!isDesktopSidebarOpen ? 'md:max-w-0 md:opacity-0' : 'md:max-w-[150px] md:opacity-100'}`}>Forecast</span>
          <button onClick={() => setDesktopSidebarOpen(!isDesktopSidebarOpen)} className={`hidden md:block p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white cursor-pointer ${!isDesktopSidebarOpen ? 'mx-auto' : ''}`}>
            {isDesktopSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          <TransitionLink href="/dashboard" className="block"><NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active isDesktopOpen={isDesktopSidebarOpen} /></TransitionLink>
          <TransitionLink href="/analytics" className="block"><NavItem icon={<BarChart2 size={20} />} label="Analytics" isDesktopOpen={isDesktopSidebarOpen} /></TransitionLink>
          <TransitionLink href="/upload" className="block"><NavItem icon={<UploadCloud size={20} />} label="Data Upload" isDesktopOpen={isDesktopSidebarOpen} /></TransitionLink>
          <TransitionLink href="/forecasts" className="block"><NavItem icon={<LineChartIcon size={20} />} label="Forecasts" isDesktopOpen={isDesktopSidebarOpen} /></TransitionLink>
          <TransitionLink href="/settings" className="block"><NavItem icon={<Settings size={20} />} label="Settings" isDesktopOpen={isDesktopSidebarOpen} /></TransitionLink>
        </nav>

        <div className="p-4 border-t border-glass-border">
          <div className={`flex items-center gap-3 ${isDesktopSidebarOpen ? 'md:gap-3' : 'md:justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-ai p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-obsidian flex items-center justify-center text-sm font-bold">{getUserInitials(userProfile.full_name)}</div>
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 whitespace-nowrap ${!isDesktopSidebarOpen ? 'md:max-w-0 md:opacity-0' : 'md:max-w-[150px] md:opacity-100'}`}>
              <span className="text-sm font-medium text-white truncate">{userProfile.full_name}</span>
              <span className="text-xs text-slate-400 truncate">{userProfile.email}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.15)_0%,transparent_70%)] pointer-events-none" />
        
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-glass-border glass-panel z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white cursor-pointer"><Menu size={20} /></button>
            <h1 className="text-xl font-semibold text-white truncate max-w-[150px] sm:max-w-none">Forecast AI Dashboard</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:flex items-center gap-2 glass-panel px-3 py-1.5 rounded-lg text-sm text-slate-300">
              <Calendar size={16} className="text-electric-indigo" />
              <span>{dateRange}</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors cursor-pointer border border-white/10"
              >
                <Filter size={16} className="text-cyber-purple" />
                <span className="hidden sm:inline">{selectedCategory}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isCategoryMenuOpen && categories.length > 0 && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-obsidian-light border border-glass-border shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in duration-200">
                  <button onClick={() => handleCategorySelect('All Categories')} className="w-full text-left px-4 py-2 text-sm hover:bg-electric-indigo/20 transition-colors text-slate-300 hover:text-white">All Categories</button>
                  <div className="h-px bg-glass-border my-1" />
                  <div className="max-h-60 overflow-y-auto">
                    {categories.map((cat) => (
                      <button key={cat} onClick={() => handleCategorySelect(cat)} className="w-full text-left px-4 py-2 text-sm hover:bg-electric-indigo/20 transition-colors text-slate-400 hover:text-white truncate">
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-glass-border px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 z-10">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <CyberLoader text="REASONING WITH FORECAST AI..." />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 w-full">

              {noDataset && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-electric-indigo/5 border border-electric-indigo/20 text-sm">
                  <UploadCloud className="w-5 h-5 text-electric-indigo shrink-0" />
                  <span className="text-slate-300">No dataset found. The dashboard is showing placeholder values.</span>
                  <TransitionLink href="/upload" className="ml-auto shrink-0 text-electric-indigo font-semibold hover:underline">Upload Dataset →</TransitionLink>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard 
                  title="Segment Revenue" 
                  value={kpis.total_revenue} 
                  subtitle="Live filtering active" 
                  trend="up" 
                  icon={<DollarSign size={20} className="text-electric-indigo" />} 
                  colorClass="from-electric-indigo text-electric-indigo" 
                />
                <KpiCard 
                  title="Avg Transaction" 
                  value={kpis.average_order_value} 
                  subtitle="Normalized metrics" 
                  trend="neutral" 
                  icon={<BarChart2 size={20} className="text-neon-teal" />} 
                  colorClass="from-neon-teal text-neon-teal" 
                />
                <KpiCard 
                  title="Performance" 
                  value={kpis.growth_rate} 
                  subtitle="Momentum vector" 
                  trend="up" 
                  icon={<TrendingUp size={20} className="text-emerald-400" />} 
                  colorClass="from-emerald-400 text-emerald-400" 
                />
                <KpiCard 
                  title="Peak Day" 
                  value={kpis.peak_sales_day} 
                  subtitle="Highest volume detected" 
                  icon={<Target size={20} className="text-cyber-purple" />} 
                  colorClass="from-cyber-purple text-cyber-purple" 
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-6 flex flex-col min-h-[450px]">
                  <h2 className="text-lg font-semibold text-white mb-6">Strategic Forecast Projection</h2>
                  <div className="flex-1"><ForecastingChart data={chartData} noDataset={noDataset} /></div>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-4">
                  <div className="glass-panel-glow rounded-2xl p-5 sm:p-6 relative overflow-hidden shrink-0 border border-electric-indigo/20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-ai" />
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-cyber-purple" />
                      <h3 className="text-base font-semibold text-white italic">Forecast AI Insight</h3>
                    </div>
                    {noDataset ? (
                      <div className="text-center py-2">
                        <p className="text-sm text-slate-500 italic leading-relaxed">Upload a dataset to unlock AI-powered executive insights and strategic recommendations.</p>
                        <TransitionLink href="/upload" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-electric-indigo hover:underline">
                          <UploadCloud size={13} /> Go to Upload
                        </TransitionLink>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{aiAnalysis.summary}</p>
                        <div className="mt-4 p-3 rounded-lg bg-electric-indigo/10 border border-electric-indigo/20">
                          <p className="text-xs text-electric-indigo font-medium italic">{aiAnalysis.recommendation}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3 shrink-0">
                    {noDataset ? (
                      <p className="text-xs text-slate-600 text-center py-4 italic">Insights will appear after uploading a dataset.</p>
                    ) : aiAnalysis.insights.length > 0 ? (
                      aiAnalysis.insights.map((card: any, i: number) => (
                        <InsightCard key={i} title={card.title} impact={card.impact} type={card.type} />
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-4">Generating tactical cards...</p>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-glass-border">
                    <button 
                      onClick={() => setIsChatOpen(true)}
                      className="w-full relative group flex items-center justify-between bg-obsidian-light/80 border border-glass-border hover:border-cyber-purple/50 rounded-xl py-3 px-4 transition-all cursor-pointer"
                    >
                      <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Probe AI for segment deep-dives...</span>
                      <div className="p-1.5 bg-electric-indigo/20 text-electric-indigo rounded-lg group-hover:bg-electric-indigo group-hover:text-white transition-colors">
                        <MessageCircle size={14} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isChatOpen && (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 p-4 bg-electric-indigo hover:bg-electric-indigo/80 text-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all hover:scale-110 z-50 flex items-center justify-center cursor-pointer"
          >
            <MessageCircle size={24} />
          </button>
        )}

        {isChatOpen && (
          <div className="fixed bottom-24 right-4 lg:bottom-28 lg:right-8 w-[350px] sm:w-[400px] h-[550px] max-h-[75vh] bg-obsidian rounded-2xl border border-glass-border shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-14 bg-obsidian-light border-b border-glass-border flex items-center justify-between px-4 shrink-0 glass-panel">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-ai p-[2px]">
                    <div className="w-full h-full rounded-full bg-obsidian flex items-center justify-center"><Sparkles size={14} className="text-electric-indigo"/></div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Forecast AI</h3>
                  <p className="text-[10px] text-neon-teal font-medium tracking-wide">● LIVE</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {chatHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs text-center italic px-4">
                  Ask Forecast AI about sales drivers, anomalies, or strategy.
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-white/10 border border-white/20 text-white rounded-tr-sm' 
                        : 'glass-panel-glow border-electric-indigo/20 text-slate-200 rounded-tl-sm'
                    }`}>
                      <div className="leading-relaxed">
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          formatMessage(msg.content)
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isChatProcessing && (
                <div className="flex justify-start">
                  <div className="glass-panel-glow border-electric-indigo/20 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center h-10 w-16">
                    <span className="w-1.5 h-1.5 rounded-full bg-electric-indigo animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-electric-indigo animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-electric-indigo animate-bounce"></span>
                  </div>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSendChat} className="p-3 border-t border-glass-border bg-obsidian-light shrink-0 relative flex items-center gap-2">
              <input 
                ref={chatInputRef}
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message Forecast AI..." 
                className="flex-1 bg-obsidian/80 border border-glass-border rounded-xl py-2.5 pl-4 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyber-purple/50 transition-colors" 
                disabled={isChatProcessing}
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || isChatProcessing}
                className={`p-2.5 rounded-lg transition-colors shrink-0 cursor-pointer ${!chatInput.trim() || isChatProcessing ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-electric-indigo hover:bg-electric-indigo/80 text-white'}`}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}

const KpiCard = memo(function KpiCard({ title, value, subtitle, trend, icon, colorClass }: { title: string, value: string, subtitle: string, trend?: 'up' | 'down' | 'neutral', icon: React.ReactNode, colorClass: string }) {
  return (
    <div className="glass-panel rounded-xl p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-opacity group-hover:opacity-20`} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className={`p-2 rounded-lg bg-obsidian-light/50 border border-glass-border/50 ${colorClass.split(' ')[1]}`}>
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="flex items-center gap-2">
          {trend === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
          {trend === 'down' && <ArrowDownRight className="w-4 h-4 text-rose-400" />}
          {trend === 'neutral' && <Activity className="w-4 h-4 text-amber-400" />}
          <span className={`text-xs ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : trend === 'neutral' ? 'text-amber-400' : 'text-slate-400'}`}>
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
});

const InsightCard = memo(function InsightCard({ title, impact, type }: { title: string, impact: string, type: 'info' | 'warning' | 'success' }) {
  const impactColors = {
    High: type === 'warning' ? 'bg-rose-500/20 text-rose-400' : 'bg-electric-indigo/20 text-electric-indigo',
    Medium: 'bg-amber-500/20 text-amber-400',
    Low: 'bg-slate-500/20 text-slate-300'
  };

  return (
    <div className={`glass-panel rounded-xl p-4 border-l-2 ${type === 'warning' ? 'border-l-rose-500' : type === 'success' ? 'border-l-neon-teal' : 'border-l-electric-indigo'} flex items-start justify-between gap-4 border border-white/5 shadow-lg`}>
      <div className="flex items-start gap-3">
        {type === 'warning' ? <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" /> : <Sparkles size={16} className={type === 'success' ? 'text-neon-teal mt-0.5 shrink-0' : 'text-electric-indigo mt-0.5 shrink-0'} />}
        <p className="text-xs text-slate-300 font-medium">{title}</p>
      </div>
      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-md shrink-0 ${impactColors[impact as keyof typeof impactColors] || impactColors.Low}`}>
        {impact}
      </span>
    </div>
  );
});
