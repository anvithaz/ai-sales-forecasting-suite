'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TransitionLink } from '@/components/TransitionLink';
import { 
  UploadCloud, FileSpreadsheet, CheckCircle2, ArrowRight, 
  LayoutDashboard, LineChart as LineChartIcon, Settings, Menu, ChevronLeft,
  BarChart2, AlertCircle, X, Layers, Database, Trash2, Clock, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavItem } from '@/components/NavItem';

interface Dataset {
  id: number;
  original_filename: string;
  upload_date: string | null;
  file_path: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Unknown date';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function UploadPage() {
  const router = useRouter();
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isDatasetsLoading, setIsDatasetsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchDatasets = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth'); return; }
    setIsDatasetsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/datasets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDatasets(await res.json());
    } catch { /* silent */ }
    finally { setIsDatasetsLoading(false); }
  }, [router]);

  useEffect(() => { fetchDatasets(); }, [fetchDatasets]);

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setConfirmDeleteId(null);
    setDeletingId(id);

    const snapshot = [...datasets];
    setDatasets(prev => prev.filter(d => d.id !== id));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/datasets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        setDatasets(snapshot);
        setError('Failed to delete dataset. Please try again.');
      }
    } catch {
      setDatasets(snapshot);
      setError('Network error during deletion.');
    } finally {
      setDeletingId(null);
    }
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0) { setError('Please select at least one file.'); return; }
    setStatus('processing');
    setError('');
    const token = localStorage.getItem('token');
    if (!token) { setError('Authentication error. Please log in again.'); setStatus('idle'); return; }

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Upload failed');
      setStatus('success');
      fetchDatasets();
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    setError('');
  };

  const removeFile = (index: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  const handleFileAction = (e: React.ChangeEvent<HTMLInputElement>) => addFiles(e.target.files);
  const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }, []);
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const activeDataset = datasets[0] ?? null;

  return (
    <div className="min-h-screen bg-obsidian flex overflow-hidden text-slate-200">
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <aside className={`fixed md:relative z-50 md:z-20 flex flex-col h-screen transition-[width,transform] duration-300 ease-in-out border-r border-glass-border bg-obsidian-light shrink-0 ${isDesktopSidebarOpen ? 'w-64' : 'w-64 md:w-20'} ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
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
          <TransitionLink href="/dashboard" className="block"><NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" isDesktopOpen={isDesktopSidebarOpen} /></TransitionLink>
          <TransitionLink href="/analytics" className="block"><NavItem icon={<BarChart2 size={20} />} label="Analytics" isDesktopOpen={isDesktopSidebarOpen} /></TransitionLink>
          <TransitionLink href="/upload" className="block"><NavItem icon={<UploadCloud size={20} />} label="Data Upload" active isDesktopOpen={isDesktopSidebarOpen} /></TransitionLink>
          <TransitionLink href="/forecasts" className="block"><NavItem icon={<LineChartIcon size={20} />} label="Forecasts" isDesktopOpen={isDesktopSidebarOpen} /></TransitionLink>
          <TransitionLink href="/settings" className="block"><NavItem icon={<Settings size={20} />} label="Settings" isDesktopOpen={isDesktopSidebarOpen} /></TransitionLink>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.10)_0%,transparent_70%)] pointer-events-none" />

        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-glass-border glass-panel z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white cursor-pointer">
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold text-white">Universal Data Concierge</h1>
          </div>
          <button onClick={fetchDatasets} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white glass-panel px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-glass-border">
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 z-10">
          <div className="max-w-5xl mx-auto space-y-8">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{error}</span>
                <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-300 cursor-pointer"><X size={16} /></button>
              </motion.div>
            )}

            <AnimatePresence>
              {!isDatasetsLoading && activeDataset && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-neon-teal/5 border border-neon-teal/20 text-neon-teal"
                >
                  <div className="p-2 rounded-lg bg-neon-teal/10">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neon-teal/70 mb-0.5">Active Dataset</p>
                    <p className="text-sm font-medium text-white truncate">{activeDataset.original_filename}</p>
                  </div>
                  <TransitionLink href="/dashboard" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-neon-teal/10 hover:bg-neon-teal/20 border border-neon-teal/30 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                    Go to Dashboard <ArrowRight size={12} />
                  </TransitionLink>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {status === 'idle' && (
                <motion.div key="idle" className="space-y-6">
                  <div
                    className={`relative group rounded-3xl border-2 border-dashed transition-all duration-300 p-12 md:p-16 text-center flex flex-col items-center justify-center glass-panel ${isDragging ? 'border-neon-teal bg-neon-teal/5' : 'border-glass-border hover:border-electric-indigo/40'}`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                  >
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isDragging ? 'bg-neon-teal/10' : 'bg-electric-indigo/10'}`}>
                      <UploadCloud className={`w-10 h-10 transition-colors ${isDragging ? 'text-neon-teal' : 'text-electric-indigo'}`} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Drop your dataset here</h2>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                      Upload CSV or Excel files. Upload multiple files together and our AI will automatically merge them using shared IDs.
                    </p>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileAction} multiple accept=".csv, .xlsx, .xls" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-8 py-3 rounded-xl font-medium text-white bg-obsidian-light border border-glass-border hover:border-electric-indigo/50 hover:bg-electric-indigo/10 transition-all cursor-pointer"
                    >
                      Browse Files
                    </button>
                    <p className="text-xs text-slate-600 mt-4">CSV, XLSX, XLS — max 50 MB per file</p>
                  </div>

                  {selectedFiles.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-6 border border-electric-indigo/20 bg-electric-indigo/5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Layers className="w-5 h-5 text-neon-teal" />
                          <h3 className="text-lg font-semibold text-white">Staged for Processing ({selectedFiles.length})</h3>
                        </div>
                        <button onClick={() => setSelectedFiles([])} className="text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer">Clear All</button>
                      </div>
                      <div className="space-y-3">
                        {selectedFiles.map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-obsidian border border-glass-border">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <FileSpreadsheet className="w-5 h-5 text-cyber-purple shrink-0" />
                              <span className="text-sm font-medium text-slate-200 truncate">{file.name}</span>
                              <span className="text-[10px] text-slate-500 shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button onClick={() => removeFile(i)} className="p-1 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={startUpload}
                        className="w-full mt-6 py-4 rounded-xl font-bold text-white bg-gradient-ai hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                      >
                        {selectedFiles.length > 1 ? 'Merge & Analyze' : 'Analyze Dataset'}
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {status === 'processing' && (
                <motion.div key="processing" className="glass-panel-glow rounded-3xl p-12 md:p-20 text-center flex flex-col items-center justify-center">
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-electric-indigo/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-neon-teal rounded-full border-t-transparent animate-spin" />
                    <Layers className="absolute inset-0 m-auto w-10 h-10 text-neon-teal" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">Relational Smart-Joining...</h2>
                  <p className="text-slate-400 max-w-sm mx-auto">Our AI is mapping IDs across your files to create a unified forecasting master-file.</p>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-3xl p-12 md:p-20 text-center flex flex-col items-center justify-center border border-neon-teal/30">
                  <div className="w-20 h-20 bg-neon-teal/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-neon-teal" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Data Unified Successfully</h2>
                  <p className="text-slate-400 mb-10">Your dataset is ready for AI analysis and forecasting.</p>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <TransitionLink href="/dashboard" className="px-10 py-4 font-bold text-white rounded-2xl bg-gradient-ai hover:opacity-90 shadow-[0_10px_30px_rgba(99,102,241,0.3)] transition-all">
                      Open Dashboard →
                    </TransitionLink>
                    <button
                      onClick={() => { setStatus('idle'); setSelectedFiles([]); }}
                      className="px-8 py-4 font-medium text-slate-300 rounded-2xl border border-glass-border hover:bg-white/5 transition-all cursor-pointer"
                    >
                      Upload Another
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-glass-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-electric-indigo" />
                  <h3 className="text-base font-semibold text-white">Your Datasets</h3>
                  {datasets.length > 0 && (
                    <span className="text-xs bg-electric-indigo/20 text-electric-indigo px-2 py-0.5 rounded-full font-mono">{datasets.length}</span>
                  )}
                </div>
              </div>

              {isDatasetsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : datasets.length === 0 ? (
                <div className="p-12 text-center">
                  <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No datasets uploaded yet.</p>
                  <p className="text-slate-600 text-xs mt-1">Upload a file above to get started.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {datasets.map((dataset, index) => (
                    <motion.div
                      key={dataset.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, x: -20 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-colors group border-b border-glass-border/30 last:border-b-0">
                        <div className={`p-2 rounded-xl shrink-0 ${index === 0 ? 'bg-neon-teal/10' : 'bg-slate-800/50'}`}>
                          <FileSpreadsheet className={`w-8 h-8 ${index === 0 ? 'text-neon-teal' : 'text-slate-500'}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium text-white truncate">{dataset.original_filename}</p>
                            {index === 0 && (
                              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider bg-neon-teal/15 text-neon-teal border border-neon-teal/20 px-1.5 py-0.5 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock size={11} />
                            <span>{formatDate(dataset.upload_date)}</span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {deletingId === dataset.id ? (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <RefreshCw size={12} className="animate-spin text-rose-400" />
                              <span className="text-rose-400">Deleting…</span>
                            </div>
                          ) : confirmDeleteId === dataset.id ? (
                            <div className="flex items-center gap-2 animate-in fade-in duration-150">
                              <span className="text-xs text-slate-400">Are you sure?</span>
                              <button
                                onClick={() => handleDelete(dataset.id)}
                                className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Yes, Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(dataset.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              title="Delete dataset"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
