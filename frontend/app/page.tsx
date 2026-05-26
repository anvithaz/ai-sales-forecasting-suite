'use client';

import { useState } from 'react';
import { TransitionLink } from '@/components/TransitionLink';
import { ArrowRight, BarChart3, BrainCircuit, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { CustomSelect } from '@/components/CustomSelect';

const SalesChart = dynamic(() => import('@/components/SalesChart').then(mod => mod.SalesChart), {
  loading: () => (
    <div className="h-[250px] w-full mt-4 flex items-center justify-center text-slate-500 bg-obsidian-light/20 rounded-xl border border-glass-border/50 animate-pulse">
      Loading chart...
    </div>
  )
});

export default function LandingPage() {
  const [trendRange, setTrendRange] = useState('6m');

  return (
    <main className="flex-1 flex flex-col items-center justify-center w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-24 overflow-hidden relative min-h-screen">
      <div className="absolute top-[-10%] left-[-20%] md:top-[-10%] md:left-[-10%] w-[80vw] md:w-[40vw] aspect-square rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.2)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] md:bottom-[-10%] md:right-[-10%] w-[80vw] md:w-[40vw] aspect-square rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.2)_0%,transparent_70%)] pointer-events-none" />


      <div className="max-w-4xl mx-auto text-center z-10 space-y-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Forecast the Future <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-electric-indigo via-cyber-purple to-neon-teal bg-clip-text text-transparent inline-block pb-1">with AI</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light">
          Unlock the zero-training LLM advantage. Instantly analyze sales data, generate actionable insights, and predict trends without complex ML pipelines.
        </p>
        <div className="flex justify-center pt-4">
          <TransitionLink 
            href="/auth" 
            loaderText="INITIALIZING..."
            className="group relative inline-flex items-center justify-center px-8 py-4 font-medium text-white transition-all duration-300 ease-in-out rounded-full bg-obsidian-light border border-glass-border hover:border-cyber-purple/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-cyber-purple"></span>
            <span className="relative flex items-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </TransitionLink>
        </div>
      </div>


      <div className="w-full max-w-5xl mx-auto mt-20 z-10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-electric-indigo/10 to-transparent rounded-2xl blur-xl" />
        <div className="glass-panel-glow rounded-2xl p-6 md:p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 border-b border-glass-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div className="text-sm text-slate-400 font-mono">Forecast</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-panel rounded-xl p-6 transition-transform hover:scale-[1.02] duration-300">
                <h3 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Projected Revenue</h3>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-white">$1.24M</span>
                  <span className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md mb-1">
                    +14.2% Growth
                  </span>
                </div>
              </div>


              <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-ai" />
                <div className="flex items-center gap-2 mb-3">
                  <BrainCircuit className="w-5 h-5 text-cyber-purple" />
                  <h3 className="text-sm font-semibold text-white">Claude AI Analysis</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Sales are projected to increase by <span className="text-neon-teal font-medium">12% next month</span> due to upcoming seasonal demand in the Q3 electronics category.
                </p>
              </div>
            </div>


            <div className="lg:col-span-2 glass-panel rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Revenue Trend</h3>
                <CustomSelect
                  value={trendRange}
                  onChange={setTrendRange}
                  options={[
                    { value: '6m', label: 'Last 6 Months' },
                    { value: 'ytd', label: 'Year to Date' }
                  ]}
                  className="w-40"
                  buttonClassName="px-3 py-1.5 text-xs bg-obsidian"
                />
              </div>
              <SalesChart />
            </div>
          </div>
        </div>
      </div>


      <div className="w-full max-w-5xl mx-auto mt-24 z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-xl p-8 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(99,102,241,0.1)]">
          <div className="w-12 h-12 rounded-lg bg-electric-indigo/20 flex items-center justify-center mb-6 border border-electric-indigo/30">
            <Zap className="w-6 h-6 text-electric-indigo" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">Zero Model Training</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Skip the months of data engineering. Our LLM engine understands your raw CSVs and databases instantly.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-8 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(168,85,247,0.1)]">
          <div className="w-12 h-12 rounded-lg bg-cyber-purple/20 flex items-center justify-center mb-6 border border-cyber-purple/30">
            <BrainCircuit className="w-6 h-6 text-cyber-purple" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">Human-Readable Explanations</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Don&apos;t just get a number. Get the &quot;why&quot; behind every forecast in plain, understandable English.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-8 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(45,212,191,0.1)]">
          <div className="w-12 h-12 rounded-lg bg-neon-teal/20 flex items-center justify-center mb-6 border border-neon-teal/30">
            <BarChart3 className="w-6 h-6 text-neon-teal" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">Instant KPI Generation</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Automatically extract and visualize the metrics that matter most to your business context.
          </p>
        </div>
      </div>
    </main>
  );
}
