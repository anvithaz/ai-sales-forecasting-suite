'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart 
} from 'recharts';
import { Sparkles, TrendingUp, ShieldCheck, Settings2, Calendar, BarChart2, Play, ArrowLeft, UploadCloud, TrendingDown, Minus } from 'lucide-react';
import { TransitionLink } from '@/components/TransitionLink';
import { CustomSelect } from '@/components/CustomSelect';

export function Forecast() {
  const [horizon, setHorizon] = useState(30);
  const [aggregation, setAggregation] = useState('Monthly');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [data, setData] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [aiNarrative, setAiNarrative] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  
  const [noDataset, setNoDataset] = useState(false);
  const [isForecasting, setIsForecasting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');


  const fetchInitialData = useCallback(async () => {
    setIsInitialLoading(true);
    setNoDataset(false);
    setError('');
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/forecasts/run?horizon=1&aggregation=Monthly`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 404) {
        setNoDataset(true);
        setIsInitialLoading(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to load historical data.');
      }

      const result = await res.json();
      
      const chartData = result.historical.map((d: any) => ({
        date: d.date,
        historical: d.historical,
        predicted: null,
        confidence: null
      }));
      
      setData(chartData);
      setCategories(result.categories || []);
      setSummaryStats(result.summary_stats);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleRunForecast = async () => {
    setIsForecasting(true);
    setShowResults(false);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) return;

    const catParam = selectedCategory !== 'all' ? `&category=${encodeURIComponent(selectedCategory)}` : '';


    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/forecasts/run?horizon=${horizon}&aggregation=${aggregation}${catParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Forecast failed.');
      }

      const result = await res.json();
      setSummaryStats(result.summary_stats);
      
      const combinedData = [];
      const histLen = result.historical.length;
      
      for (let i = 0; i < histLen; i++) {
        const d = result.historical[i];
        combinedData.push({
          date: d.date,
          historical: d.historical,
          predicted: i === histLen - 1 ? d.historical : null,
          confidence: null
        });
      }
      
      for (const f of result.forecast) {
        combinedData.push({
          date: f.date,
          historical: null,
          predicted: f.predicted,
          confidence: [f.lower, f.upper]
        });
      }

      setData(combinedData);

      const aiRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/forecasts/ai-narrative?horizon=${horizon}&aggregation=${aggregation}${catParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiNarrative(aiData.narrative);
      } else {
        setAiNarrative("AI narrative generation failed.");
      }

      setShowResults(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsForecasting(false);
    }
  };

  if (noDataset) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-obsidian text-slate-200 font-sans p-6 lg:p-10 justify-center items-center">
        <div className="glass-panel p-10 rounded-2xl max-w-md text-center border-electric-indigo/20 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-electric-indigo/10 mb-6">
            <UploadCloud className="w-8 h-8 text-electric-indigo/70" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Dataset Found</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Upload a CSV or Excel file to unlock AI-powered forecasting modeling and historical trend analysis.
          </p>
          <TransitionLink 
            href="/upload" 
            className="w-full inline-flex justify-center items-center gap-2 text-sm font-semibold text-white bg-gradient-ai shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] px-8 py-3 rounded-xl transition-all"
          >
            <UploadCloud size={16} /> Upload Dataset
          </TransitionLink>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-obsidian text-slate-200 font-sans overflow-x-hidden lg:overflow-hidden">
      <motion.aside 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full lg:w-80 glass-panel border-b lg:border-b-0 lg:border-r border-glass-border/50 flex flex-col p-4 md:p-6 z-20 relative shrink-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-electric-indigo/5 to-transparent pointer-events-none" />
        
        <TransitionLink 
          href="/dashboard" 
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8 w-fit"
          loaderText="RETURNING TO DASHBOARD..."
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </TransitionLink>

        <div className="flex items-center gap-3 mb-10 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-ai flex items-center justify-center shadow-[0_0_15px_rgba(45,212,191,0.5)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Analytics</h1>
            <p className="text-xs text-neon-teal font-mono uppercase tracking-widest">Forecast Module</p>
          </div>
        </div>

        <div className="space-y-8 relative">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Calendar className="w-4 h-4 text-cyber-purple" />
              Forecast Horizon ({aggregation === 'Daily' ? 'Days' : aggregation.replace('ly', 's')})
            </label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-electric-indigo to-cyber-purple rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
              <input 
                type="range" 
                min="1" 
                max="365" 
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="w-full h-2 bg-obsidian-light rounded-lg appearance-none cursor-pointer relative z-10 accent-neon-teal"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-mono">
              <span>1</span>
              <span className="text-neon-teal font-bold">{horizon}</span>
              <span>365</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <BarChart2 className="w-4 h-4 text-electric-indigo" />
              Aggregation Level
            </label>
            <CustomSelect
              value={aggregation}
              onChange={(val) => {
                setAggregation(val);
                setShowResults(false);
              }}
              options={[
                { value: 'Daily', label: 'Daily' },
                { value: 'Weekly', label: 'Weekly' },
                { value: 'Monthly', label: 'Monthly' }
              ]}
              icon={<Settings2 className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {categories.length > 0 && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <BarChart2 className="w-4 h-4 text-cyber-purple" />
                Category
              </label>
              <CustomSelect
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setShowResults(false);
                }}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map(c => ({ value: c, label: c }))
                ]}
                icon={<Settings2 className="w-4 h-4 text-slate-400" />}
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={handleRunForecast}
            disabled={isForecasting || isInitialLoading}
            className="w-full relative group overflow-hidden rounded-xl mt-4 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-ai opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            <div className="relative px-6 py-4 flex items-center justify-center gap-2 text-white font-semibold">
              {isForecasting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
              {isForecasting ? 'Analyzing Data...' : 'Run Forecast Engine'}
            </div>
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-10 relative overflow-y-auto min-w-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.1)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,transparent_60%)] pointer-events-none" />

        <header className="mb-6 md:mb-8 z-10 flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Sales Projection</h2>
          <p className="text-sm md:text-base text-slate-400">Interactive forecast modeling based on historical trends.</p>
        </header>

        {isInitialLoading ? (
          <div className="glass-panel-glow w-full h-[500px] flex items-center justify-center rounded-2xl animate-pulse">
            <span className="text-slate-500 font-mono text-sm tracking-widest">LOADING HISTORICAL DATA...</span>
          </div>
        ) : (
          <>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full h-[350px] md:h-[400px] lg:h-[500px] glass-panel-glow rounded-2xl p-4 md:p-6 mb-8 z-10 relative flex-shrink-0"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    minTickGap={30}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(10, 14, 23, 0.9)', 
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#e2e8f0' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  
                  {showResults && (
                    <Area 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="none" 
                      fill="var(--color-electric-indigo)" 
                      fillOpacity={0.15} 
                    />
                  )}

                  <Line 
                    type="monotone" 
                    dataKey="historical" 
                    stroke="var(--color-neon-teal)" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6, fill: 'var(--color-neon-teal)', strokeWidth: 0, className: "animate-pulse" }}
                  />
                  
                  {showResults && (
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="var(--color-electric-indigo)" 
                      strokeWidth={3} 
                      strokeDasharray="8 8"
                      dot={false}
                      activeDot={{ r: 6, fill: 'var(--color-electric-indigo)', strokeWidth: 0 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>

            <AnimatePresence>
              {showResults && summaryStats && (
                <motion.div 
                  initial={{ y: 20, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 20, opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="glass-panel rounded-2xl p-6 lg:p-8 z-10 relative overflow-hidden border-cyber-purple/30 shadow-[0_0_40px_rgba(168,85,247,0.1)]"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-ai" />
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-cyber-purple/20 flex items-center justify-center border border-cyber-purple/50">
                        <Sparkles className="w-4 h-4 text-cyber-purple" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Forecast AI Analysis</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 md:ml-auto">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs md:text-sm font-medium ${
                        summaryStats.trend === 'upward' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        summaryStats.trend === 'downward' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                        'bg-slate-500/10 border-slate-500/20 text-slate-400'
                      }`}>
                        {summaryStats.trend === 'upward' ? <TrendingUp className="w-3 h-3 md:w-4 md:h-4" /> :
                         summaryStats.trend === 'downward' ? <TrendingDown className="w-3 h-3 md:w-4 md:h-4" /> :
                         <Minus className="w-3 h-3 md:w-4 md:h-4" />}
                        Trend: {summaryStats.trend.charAt(0).toUpperCase() + summaryStats.trend.slice(1)}
                      </div>
                      
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-electric-indigo/10 border border-electric-indigo/20 text-electric-indigo text-xs md:text-sm font-medium">
                        <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" />
                        Confidence: {summaryStats.confidence_score}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-obsidian-light/50 rounded-xl p-5 border border-glass-border/50">
                    <p className="text-slate-300 leading-relaxed text-[15px] whitespace-pre-wrap">
                      <strong className="text-white font-semibold flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-neon-teal" /> Forecast AI Explanation:
                      </strong> 
                      {aiNarrative}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}
