import React, { useState, useEffect } from 'react';
import { 
  Kanban, 
  Table as TableIcon, 
  Search, 
  Filter, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Send,
  Building2,
  MapPin,
  Clock,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  FileText,
  RefreshCw
} from 'lucide-react';
import { JobListing, JobStatus } from '@/types/job';
import { INITIAL_JOBS, clientApi } from '@/lib/api';
import { EvaluationDrawer } from './EvaluationDrawer';

const COLUMNS: { id: JobStatus; title: string; color: string }[] = [
  { id: 'discovered', title: 'Discovered', color: 'border-zinc-500/30' },
  { id: 'evaluated', title: 'Evaluated (A-H)', color: 'border-blue-500/30' },
  { id: 'tailored', title: 'CV Tailored', color: 'border-cyan-500/30' },
  { id: 'queued', title: 'Ready to Apply', color: 'border-purple-500/30' },
  { id: 'applied', title: 'Applied', color: 'border-emerald-500/30' },
  { id: 'interview', title: 'Interviews', color: 'border-amber-500/30' },
];

export const JobPipeline: React.FC = () => {
  const [jobs, setJobs] = useState<JobListing[]>(INITIAL_JOBS);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [portalFilter, setPortalFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadJobs = async () => {
    setIsRefreshing(true);
    try {
      const liveJobs = await clientApi.getJobs();
      if (liveJobs && liveJobs.length > 0) {
        setJobs(liveJobs);
      }
    } catch {
      // keep fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPortal = portalFilter === 'all' || job.portal === portalFilter;
    return matchesSearch && matchesPortal;
  });

  return (
    <div className="space-y-5 max-w-full">
      {/* Top Bar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Job Pipeline & Application Tracker
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {jobs.length} Active Jobs
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            career-ops Multi-Stage Funnel • Grounded CV Customization • Co-Pilot Form Auto-Filler
          </p>
        </div>

        {/* View Switcher, Filter & Refresh */}
        <div className="flex items-center gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={loadJobs}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300"
            title="Refresh jobs from SQLite"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Portal Filter */}
          <select
            value={portalFilter}
            onChange={(e) => setPortalFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300 font-mono focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">All Portals</option>
            <option value="linkedin">LinkedIn</option>
            <option value="naukri">Naukri.com</option>
            <option value="greenhouse">Greenhouse</option>
            <option value="workday">Workday</option>
          </select>

          {/* Toggle View Mode */}
          <div className="flex items-center p-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              title="Kanban Board"
            >
              <Kanban className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              title="Data Table"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 items-start">
          {COLUMNS.map((col) => {
            const colJobs = filteredJobs.filter(j => j.status === col.id);
            return (
              <div 
                key={col.id} 
                className="rounded-xl glass-panel border border-white/[0.06] p-3 flex flex-col min-h-[650px] space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-300">{col.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.06] text-zinc-400">
                    {colJobs.length}
                  </span>
                </div>

                {/* Job Cards */}
                <div className="space-y-2.5 flex-1">
                  {colJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="p-3 rounded-lg glass-card border border-white/[0.06] hover:border-purple-500/40 cursor-pointer space-y-2 transition-all relative group"
                    >
                      {/* Top tags */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 uppercase font-semibold">
                          {job.portal}
                        </span>
                        {job.score ? (
                          <span className={`text-[11px] font-mono font-bold ${
                            job.score >= 4.0 ? 'text-purple-300' : 'text-zinc-400'
                          }`}>
                            ★ {job.score}
                          </span>
                        ) : null}
                      </div>

                      {/* Title & Company */}
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-purple-300 transition-colors">
                          {job.title}
                        </h4>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </div>
                      </div>

                      {/* Location & Comp */}
                      <div className="text-[10px] text-zinc-400 font-mono space-y-0.5 pt-1 border-t border-white/[0.04]">
                        <div className="truncate text-zinc-400">{job.location}</div>
                        {job.advertisedComp && (
                          <div className="text-emerald-400 font-semibold truncate">{job.advertisedComp}</div>
                        )}
                      </div>

                      {/* Footer info */}
                      {job.legitimacyTier && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{job.legitimacyTier}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {colJobs.length === 0 && (
                    <div className="h-28 border border-dashed border-white/[0.06] rounded-lg flex items-center justify-center text-zinc-400 text-xs font-mono">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="rounded-xl glass-panel border border-white/[0.08] overflow-hidden">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-white/[0.02] border-b border-white/[0.06] text-zinc-400 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Role Title</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Portal</th>
                <th className="py-3 px-4">A–H Score</th>
                <th className="py-3 px-4">Legitimacy</th>
                <th className="py-3 px-4">Advertised Comp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredJobs.map((job) => (
                <tr 
                  key={job.id} 
                  onClick={() => setSelectedJob(job)}
                  className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-white">
                    {job.title}
                  </td>
                  <td className="py-3 px-4 text-zinc-300 font-mono">{job.company}</td>
                  <td className="py-3 px-4">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/10 text-purple-300">
                      {job.portal}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-purple-300">
                    {job.score ? `${job.score}/5.0` : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-emerald-400">
                    {job.legitimacyTier || 'Unverified'}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-300">{job.advertisedComp || 'Unstated'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono capitalize bg-white/[0.05] text-zinc-300">
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJob(job);
                      }}
                      className="px-2.5 py-1 rounded bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-mono"
                    >
                      Inspect A-H
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Side-Drawer with full A-H report & CV diff */}
      <EvaluationDrawer 
        job={selectedJob} 
        onClose={() => setSelectedJob(null)} 
        onApplySuccess={loadJobs}
      />
    </div>
  );
};
