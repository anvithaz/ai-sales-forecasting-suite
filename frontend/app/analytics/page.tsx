'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TransitionLink } from '@/components/TransitionLink';
import { NavItem } from '@/components/NavItem';
import { CustomSelect } from '@/components/CustomSelect';
import { CyberLoader } from '../components/ui/CyberLoader';
import {
  LayoutDashboard, UploadCloud, LineChart as LineChartIcon, Settings,
  Calendar, Filter, Download, ArrowUpRight, Sparkles, AlertTriangle,
  TrendingUp, Activity, DollarSign, ShoppingCart, BarChart2, Menu, ChevronLeft,
  ArrowDownRight, Zap, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


interface KpiData {
  total_revenue: string;
  average_order_value: string;
  peak_sales_day: string;
  growth_rate: string;
  sales_variance: string;
}

interface InsightData {
  title: string;
  description: string;
  impact: string;
  type: 'opportunity' | 'anomaly' | 'risk';
}

interface AiAnalysis {
  summary: string;
  recommendation: string;
  insights: InsightData[];
}

interface TopProduct {
  name: string;
  category: string;
  units: number;
  revenue: string;
  revenue_raw: number;
  note: string;
  icon: string;
}


const KpiCard = memo(function KpiCard({ title, value, subtitle, trend, icon, colorClass }: {
  title: string; value: string; subtitle: string; trend?: 'up' | 'down' | 'neutral'; icon: React.ReactNode; colorClass: string;
}) {
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
        <div className="text-2xl font-bold text-white mb-1 truncate">{value}</div>
        <div className="flex items-center gap-2">
          {trend === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />}
          {trend === 'down' && <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0" />}
          {trend === 'neutral' && <Activity className="w-4 h-4 text-amber-400 shrink-0" />}
          <span className={`text-xs ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : trend === 'neutral' ? 'text-amber-400' : 'text-slate-400'}`}>
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
});

const InsightCard = memo(function InsightCard({ title, description, impact, type }: {
  title: string; description: string; impact: string; type: 'opportunity' | 'anomaly' | 'risk';
}) {
  const styles = {
    opportunity: {
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />
    },
    anomaly: {
      border: 'border-amber-500/30 hover:border-amber-500/60',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      icon: <Activity className="w-5 h-5 text-amber-400" />
    },
    risk: {
      border: 'border-rose-500/50 hover:border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />
    }
  };

  const style = styles[type] ?? styles.anomaly;

  return (
    <div className={`glass-panel rounded-xl p-6 border transition-all duration-300 ${style.border}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${style.bg}`}>
          {style.icon}
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
          {impact} Impact
        </span>
      </div>
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
});

const ProductNoteIcon = ({ icon }: { icon: string }) => {
  if (icon === 'zap') return <Zap className="w-4 h-4 text-amber-400" />;
  if (icon === 'trending_up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (icon === 'activity') return <Activity className="w-4 h-4 text-amber-400" />;
  return <ArrowUpRight className="w-4 h-4 text-electric-indigo" />;
};


const DEFAULT_KPIS: KpiData = {
  total_revenue: '$0.00',
  average_order_value: '$0.00',
  peak_sales_day: 'N/A',
  growth_rate: '+0.0%',
  sales_variance: '0.0%',
};

const DEFAULT_AI: AiAnalysis = {
  summary: 'Upload a dataset and select a timeframe to generate AI-powered executive insights.',
  recommendation: 'No recommendation available yet.',
  insights: [],
};


export default function AnalyticsPage() {
  const router = useRouter();

  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [dateRange, setDateRange] = useState('all');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  const [kpis, setKpis] = useState<KpiData>(DEFAULT_KPIS);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis>(DEFAULT_AI);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dataDateRange, setDataDateRange] = useState<string>('N/A');

  const [isKpiLoading, setIsKpiLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [noDataset, setNoDataset] = useState(false);

  const [userProfile, setUserProfile] = useState({ full_name: 'User', email: '' });

  const getUserInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const fetchData = useCallback(async (selectedCategory: string, selectedDateRange: string) => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth'); return; }

    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedDateRange && selectedDateRange !== 'all') params.set('date_range', selectedDateRange);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    setIsKpiLoading(true);
    setIsAiLoading(true);
    setNoDataset(false);

    try {
      if (userProfile.full_name === 'User') {
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) setUserProfile(await userRes.json());
      }

      const kpiRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analytics/kpis${queryString}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (kpiRes.status === 404) {
        setNoDataset(true);
        setIsKpiLoading(false);
        setIsAiLoading(false);
        return;
      }

      if (!kpiRes.ok) {
        console.error('Analytics KPI fetch failed:', kpiRes.status);
        setIsKpiLoading(false);
        setIsAiLoading(false);
        return;
      }

      const kpiData = await kpiRes.json();
      setKpis(kpiData.kpis);
      setTopProducts(kpiData.top_products ?? []);
      if (kpiData.categories?.length) setCategories(kpiData.categories);
      if (kpiData.date_range) setDataDateRange(kpiData.date_range);
      setIsKpiLoading(false);

      const aiRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analytics/ai-analysis${queryString}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiAnalysis({
          summary: aiData.analysis ?? DEFAULT_AI.summary,
          recommendation: aiData.recommendation ?? DEFAULT_AI.recommendation,
          insights: aiData.insights ?? [],
        });
      }

    } catch (err: any) {
      console.error(err);
      setIsKpiLoading(false);
    } finally {
      setIsAiLoading(false);
    }
  }, [router, userProfile.full_name]);

  useEffect(() => {
    fetchData(category, dateRange);
  }, []);

  const handleDateRangeChange = (val: string) => {
    setDateRange(val);
    fetchData(category, val);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    fetchData(val, dateRange);
  };

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(c => ({ value: c, label: c })),
  ];

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
            <NavItem icon={<BarChart2 size={20} />} label="Analytics" active isDesktopOpen={isDesktopSidebarOpen} />
          </TransitionLink>
          <TransitionLink href="/upload" className="block" loaderText="LOADING DATA UPLOAD...">
            <NavItem icon={<UploadCloud size={20} />} label="Data Upload" isDesktopOpen={isDesktopSidebarOpen} />
          </TransitionLink>
          <TransitionLink href="/forecasts" className="block" loaderText="LOADING FORECASTS...">
            <NavItem icon={<LineChartIcon size={20} />} label="Forecasts" isDesktopOpen={isDesktopSidebarOpen} />
          </TransitionLink>
          <TransitionLink href="/settings" className="block" loaderText="LOADING SETTINGS...">
            <NavItem icon={<Settings size={20} />} label="Settings" isDesktopOpen={isDesktopSidebarOpen} />
          </TransitionLink>
        </nav>

        <div className="p-4 border-t border-glass-border">
          <div className={`flex items-center gap-3 ${isDesktopSidebarOpen ? 'md:gap-3' : 'md:justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-ai p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-obsidian flex items-center justify-center text-sm font-bold">{getUserInitials(userProfile.full_name)}</div>
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 whitespace-nowrap ${!isDesktopSidebarOpen ? 'md:max-w-0 md:opacity-0' : 'md:max-w-[150px] md:opacity-100'}`}>
              <span className="text-sm font-medium text-white truncate">{userProfile.full_name}</span>
              <span className="text-xs text-slate-400 truncate">{userProfile.email || 'Analyst'}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.15)_0%,transparent_70%)] pointer-events-none" />

        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-glass-border glass-panel z-50 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold text-white">Business Analytics &amp; AI Insights</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 glass-panel px-1 py-1 rounded-lg text-sm text-slate-300">
              <CustomSelect
                value={dateRange}
                onChange={handleDateRangeChange}
                options={[
                  { value: 'all', label: dataDateRange !== 'N/A' ? dataDateRange : 'All Time' },
                  { value: 'ytd', label: 'Year to Date' },
                  { value: '6m', label: 'Last 6 Months' },
                  { value: '30d', label: 'Last 30 Days' }
                ]}
                icon={<Calendar size={16} className="text-electric-indigo" />}
                className="w-44"
                buttonClassName="border-none bg-transparent py-1.5 px-3 hover:bg-white/5"
              />
            </div>
            <div className="hidden lg:flex items-center gap-2 glass-panel px-1 py-1 rounded-lg text-sm text-slate-300">
              <CustomSelect
                value={category}
                onChange={handleCategoryChange}
                options={categoryOptions.length > 1 ? categoryOptions : [{ value: 'all', label: 'All Categories' }]}
                icon={<Filter size={16} className="text-cyber-purple" />}
                className="w-44"
                buttonClassName="border-none bg-transparent py-1.5 px-3 hover:bg-white/5"
              />
            </div>
            <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-glass-border px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
              <Download size={16} />
              <span className="hidden sm:inline">Export PDF Report</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 z-10">
          {isKpiLoading ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <CyberLoader text="LOADING ANALYTICS ENGINE..." />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8">

              {noDataset && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-electric-indigo/5 border border-electric-indigo/20 text-sm"
                >
                  <UploadCloud className="w-5 h-5 text-electric-indigo shrink-0" />
                  <span className="text-slate-300">No dataset uploaded. All values are placeholders.</span>
                  <TransitionLink href="/upload" className="ml-auto shrink-0 text-electric-indigo font-semibold hover:underline" loaderText="LOADING DATA UPLOAD...">
                    Upload Dataset →
                  </TransitionLink>
                </motion.div>
              )}
              {/* KPI Grid */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
              >
                <KpiCard
                  title="Total Revenue"
                  value={kpis.total_revenue}
                  subtitle="vs previous period"
                  trend="up"
                  icon={<DollarSign size={20} className="text-electric-indigo" />}
                  colorClass="from-electric-indigo text-electric-indigo"
                />
                <KpiCard
                  title="Avg Sales/Period"
                  value={kpis.average_order_value}
                  subtitle="Consistent baseline"
                  trend="neutral"
                  icon={<BarChart2 size={20} className="text-neon-teal" />}
                  colorClass="from-neon-teal text-neon-teal"
                />
                <KpiCard
                  title="Growth Rate"
                  value={kpis.growth_rate}
                  subtitle={parseFloat(kpis.growth_rate) >= 0 ? 'Accelerating' : 'Declining'}
                  trend={parseFloat(kpis.growth_rate) >= 0 ? 'up' : 'down'}
                  icon={<TrendingUp size={20} className="text-emerald-400" />}
                  colorClass="from-emerald-400 text-emerald-400"
                />
                <KpiCard
                  title="Peak Sales Date"
                  value={kpis.peak_sales_day}
                  subtitle="Historical max"
                  icon={<Target size={20} className="text-cyber-purple" />}
                  colorClass="from-cyber-purple text-cyber-purple"
                />
                <KpiCard
                  title="Sales Variance"
                  value={kpis.sales_variance}
                  subtitle={parseFloat(kpis.sales_variance) > 20 ? 'High volatility' : 'Stable'}
                  trend={parseFloat(kpis.sales_variance) > 20 ? 'down' : 'neutral'}
                  icon={<Activity size={20} className="text-rose-400" />}
                  colorClass="from-rose-400 text-rose-400"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel-glow rounded-2xl p-6 sm:p-8 relative overflow-hidden border-electric-indigo/30 shadow-[0_0_30px_rgba(99,102,241,0.1)]"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-ai" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-electric-indigo/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-ai p-[1px] flex items-center justify-center">
                    <div className="w-full h-full bg-obsidian rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-neon-teal" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Executive Summary</h2>
                  <div className="ml-auto px-3 py-1 rounded-full bg-electric-indigo/10 border border-electric-indigo/20 text-electric-indigo text-xs font-bold uppercase tracking-widest">
                    AI Generated
                  </div>
                </div>

                {isAiLoading ? (
                  <div className="relative z-10 space-y-3 animate-pulse">
                    <div className="h-4 bg-white/5 rounded-full w-full" />
                    <div className="h-4 bg-white/5 rounded-full w-4/5" />
                    <div className="h-4 bg-white/5 rounded-full w-3/5" />
                  </div>
                ) : noDataset ? (
                  <div className="relative z-10 text-center py-4">
                    <p className="text-slate-500 italic text-base leading-relaxed">
                      Upload a dataset to generate an AI-powered executive narrative on your business performance.
                    </p>
                    <TransitionLink
                      href="/upload"
                      loaderText="LOADING DATA UPLOAD..."
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-electric-indigo hover:underline"
                    >
                      <UploadCloud size={14} /> Upload Dataset
                    </TransitionLink>
                  </div>
                ) : (
                  <p className="text-slate-300 text-lg leading-relaxed relative z-10 font-light">
                    {aiAnalysis.summary}
                  </p>
                )}
              </motion.div>

              <AnimatePresence mode="wait">
                {noDataset ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30 pointer-events-none select-none">
                    <InsightCard type="opportunity" impact="High" title="Upload to unlock" description="AI-generated opportunities will appear here once a dataset is uploaded." />
                    <InsightCard type="anomaly" impact="Medium" title="Awaiting data" description="Anomaly detection requires historical sales data to function." />
                    <InsightCard type="risk" impact="Critical" title="No risk data" description="Upload a dataset to enable risk probability analysis." />
                  </div>
                ) : isAiLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="glass-panel rounded-xl p-6 border border-glass-border/30 animate-pulse space-y-4">
                        <div className="h-10 w-10 bg-white/5 rounded-lg" />
                        <div className="h-5 bg-white/5 rounded w-3/4" />
                        <div className="h-3 bg-white/5 rounded w-full" />
                        <div className="h-3 bg-white/5 rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : aiAnalysis.insights.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    {aiAnalysis.insights.map((insight, i) => (
                      <InsightCard
                        key={i}
                        type={insight.type}
                        impact={insight.impact}
                        title={insight.title}
                        description={insight.description}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40 pointer-events-none">
                    <InsightCard type="opportunity" impact="High" title="Opportunity Insight" description="AI analysis will appear here once data is loaded." />
                    <InsightCard type="anomaly" impact="Medium" title="Anomaly Detection" description="Correlating historical patterns for anomaly signals." />
                    <InsightCard type="risk" impact="Critical" title="Risk Assessment" description="Risk probability engine is initializing." />
                  </div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-glass-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-cyber-purple" />
                    <h3 className="text-lg font-semibold text-white">Top Products Leaderboard</h3>
                  </div>
                  {topProducts.length > 0 && (
                    <span className="text-xs text-slate-500 font-mono">Top {topProducts.length} by Revenue</span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-obsidian-light/30 border-b border-glass-border/50">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Name</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Units Sold</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Total Revenue</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Performance Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border/30">
                      {topProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                            No product data found in dataset
                          </td>
                        </tr>
                      ) : (
                        topProducts.map((product, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-white group-hover:text-neon-teal transition-colors">{product.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700">{product.category}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-slate-300">{product.units.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-emerald-400 font-medium">{product.revenue}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <ProductNoteIcon icon={product.icon} />
                                {product.note}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
