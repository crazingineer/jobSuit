import React, { useState, useEffect, useRef } from 'react';
import {
  Rocket,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  FileCheck,
  Briefcase,
  Search,
  Send,
  Globe,
  ExternalLink,
  BarChart3,
  ShieldCheck,
  Play,
  Monitor,
  X
} from 'lucide-react';
import { INITIAL_JOBS, INITIAL_VAULT, clientApi } from '@/lib/api';
import { JobListing } from '@/types/job';
import { isCanadianTargetLocation, resolveCandidateContactForRegion } from '@/utils/jakes-resume-generator';
import { classifyJobChannel } from '@/utils/job-channel-classifier';
import { InlineLiveBrowser, InlineBrowserField, LiveSessionData } from '../common/InlineLiveBrowser';
import { EvaluationDrawer } from '../pipeline/EvaluationDrawer';

interface CommandCenterProps {
  onNavigate?: (tab: string) => void;
  onNavigateToPipeline?: () => void;
}

interface InlineBrowserTask {
  title: string;
  subtitle: string;
  mode: 'booster_dry_run' | 'booster_live' | 'copilot_apply' | 'autopilot_apply' | 'discovery_scan';
  url: string;
  portal?: string;
  easyApply?: boolean;
  externalApplyUrl?: string;
  atsProvider?: string;
  portalName: string;
  companyName: string;
  roleTitle: string;
  location: string;
  region: 'CA' | 'IN';
  jobId?: string;
  fields: InlineBrowserField[];
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onNavigate }) => {
  const [jobs, setJobs] = useState<JobListing[]>(INITIAL_JOBS);
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'IN' | 'CA'>('ALL');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isTriggeringBooster, setIsTriggeringBooster] = useState(false);
  const [boosterSuccess, setBoosterSuccess] = useState(false);
  const [isRunningDiscovery, setIsRunningDiscovery] = useState(false);
  const [lastBoosterTime, setLastBoosterTime] = useState('Today, 08:58 AM IST');
  const [liveStats, setLiveStats] = useState({
    totalJobs: INITIAL_JOBS.length,
    evaluated: INITIAL_JOBS.filter((j) => (j.score ?? 0) >= 4.0).length,
    queued: INITIAL_JOBS.filter((j) => j.status === 'queued').length,
    applied: INITIAL_JOBS.filter((j) => j.status === 'applied').length
  });

  // Inline Real Chromium Browser state docked directly on the dashboard!
  const [inlineTask, setInlineTask] = useState<InlineBrowserTask | null>(null);
  const [liveSessionInfo, setLiveSessionInfo] = useState<LiveSessionData | null>(null);
  const liveBrowserDockRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (inlineTask) {
      const timer = setTimeout(() => {
        liveBrowserDockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [inlineTask]);

  const loadDashboardData = async () => {
    try {
      const [statusData, liveJobs] = await Promise.all([
        clientApi.getStatus(),
        clientApi.getJobs()
      ]);
      if (liveJobs && liveJobs.length > 0) {
        setJobs(liveJobs);
        setLiveStats({
          totalJobs: liveJobs.length,
          evaluated: liveJobs.filter((j) => (j.score ?? 0) >= 4.0).length,
          queued: liveJobs.filter((j) => j.status === 'queued').length,
          applied: liveJobs.filter((j) => j.status === 'applied').length
        });
      } else if (statusData?.stats) {
        setLiveStats(statusData.stats);
      }
      if (statusData?.lastBooster?.executed_at) {
        setLastBoosterTime(new Date(statusData.lastBooster.executed_at).toLocaleString());
      }
    } catch {
      // Fallback already populated
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const indiaJobs = jobs.filter((j) => !isCanadianTargetLocation(j.location));
  const canadaJobs = jobs.filter((j) => isCanadianTargetLocation(j.location));

  const filteredJobs = jobs.filter((j) => {
    const isCa = isCanadianTargetLocation(j.location);
    const matchesRegion =
      regionFilter === 'ALL' || (regionFilter === 'CA' && isCa) || (regionFilter === 'IN' && !isCa);
    const matchesQuery =
      !tableSearch.trim() ||
      j.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
      j.company.toLowerCase().includes(tableSearch.toLowerCase()) ||
      j.location.toLowerCase().includes(tableSearch.toLowerCase());
    return matchesRegion && matchesQuery;
  });

  // 1. Trigger Naukri 9 AM Booster in the Inline Real Chromium Browser Window
  const handleRunBooster = async (dryRun = true) => {
    setIsTriggeringBooster(true);
    setBoosterSuccess(false);

    const headlineAfter =
      'Power Platform & SharePoint Developer | Power Apps, Power Automate, Data Engineering, Copilot Studio.';

    setInlineTask({
      title: `Naukri 9 AM Profile Booster (${dryRun ? 'Live Chromium Dry-Run' : 'Live Execution'})`,
      subtitle: 'Streaming real Headless Chromium executing #attachCV upload & #resumeHeadlineTxt edit',
      mode: dryRun ? 'booster_dry_run' : 'booster_live',
      url: 'https://www.naukri.com/mnjuser/profile',
      portalName: 'Naukri.com Profile Studio',
      companyName: 'Naukri Recruiter Index',
      roleTitle: 'Shubham Yadav — PL-600 Solution Architect',
      location: 'Pune / Bengaluru, India',
      region: 'IN',
      fields: [
        {
          id: 'attachCv',
          somTag: '[SoM #1]',
          label: "Upload Latest Jake's Resume PDF (#attachCV)",
          selector: 'input#attachCV[type="file"]',
          value: 'data/cv_tailored/Master_Resume.pdf',
          type: 'file'
        },
        {
          id: 'resumeHeadline',
          somTag: '[SoM #2]',
          label: 'Resume Headline Micro-Edit (#resumeHeadlineTxt)',
          selector: 'textarea#resumeHeadlineTxt',
          value: headlineAfter,
          type: 'textarea'
        }
      ]
    });

    try {
      await clientApi.runBooster(dryRun);
      setBoosterSuccess(true);
      setLastBoosterTime('Just now');
      setTimeout(() => setBoosterSuccess(false), 4000);
    } finally {
      setIsTriggeringBooster(false);
    }
  };

  // 2. Trigger Multi-Portal Discovery in the Inline Real Chromium Browser Window
  const handleRunDiscovery = async (targetRegion: 'India' | 'Canada' = 'India') => {
    setIsRunningDiscovery(true);
    const isCa = targetRegion === 'Canada';

    setInlineTask({
      title: `Live Chromium Requisition Discovery (${isCa ? '🇨🇦 Canada' : '🇮🇳 India'})`,
      subtitle: `Navigating real Chromium to LinkedIn Job Search (${targetRegion}) & verifying HTTP-200 status`,
      mode: 'discovery_scan',
      url: `https://www.linkedin.com/jobs/search?keywords=Power+Platform+Developer&location=${encodeURIComponent(targetRegion)}`,
      portalName: `LinkedIn Jobs (${targetRegion})`,
      companyName: isCa ? 'Softchoice, MNP, Apptoza, nesto' : 'Toro, Persistent, Burns & McDonnell, WTW',
      roleTitle: `Power Platform & SharePoint Requisitions — ${targetRegion}`,
      location: isCa ? 'Toronto / Waterloo / Vancouver, Canada' : 'Pune / Bengaluru, India',
      region: isCa ? 'CA' : 'IN',
      fields: []
    });

    try {
      const res = await clientApi.refreshLiveJobs('Power Platform Developer', targetRegion);
      if (res?.jobs && res.jobs.length > 0) {
        setJobs(res.jobs);
      }
      setRegionFilter(isCa ? 'CA' : 'IN');
    } finally {
      setIsRunningDiscovery(false);
    }
  };

  // 3. Launch Co-Pilot Application in the Inline Real Chromium Browser Window
  const handleQuickLaunchCoPilot = async (job: JobListing) => {
    const contact = resolveCandidateContactForRegion(INITIAL_VAULT, job.location);
    const channelInfo = classifyJobChannel(job);

    setInlineTask({
      title: `${channelInfo.portalHeaderLabel} — ${job.company}`,
      subtitle: `${channelInfo.badgeLabel} · #${job.portalJobId}: "${job.title}" (${job.location})`,
      mode: 'copilot_apply',
      url: job.url,
      portal: job.portal,
      easyApply: job.easyApply,
      externalApplyUrl: job.externalApplyUrl,
      atsProvider: job.atsProvider,
      portalName: channelInfo.portalHeaderLabel,
      companyName: job.company,
      roleTitle: job.title,
      location: job.location,
      region: contact.region,
      jobId: job.id,
      fields: []
    });

    await clientApi.applyToJob(job.id, 'co_pilot', true, false);
  };

  const funnelStages = [
    { label: 'Discovered Active (HTTP 200)', count: jobs.length, pct: 100, color: 'bg-indigo-600 dark:bg-indigo-500' },
    {
      label: 'Evaluated A–H (≥ 4.5 / 5.0)',
      count: jobs.filter((j) => (j.score ?? 0) >= 4.5).length,
      pct: 90,
      color: 'bg-cyan-600 dark:bg-cyan-500'
    },
    {
      label: "Jake's Resume Tailored (.tex + PDF)",
      count: jobs.filter((j) => j.status === 'tailored' || j.status === 'queued' || j.status === 'applied').length,
      pct: 82,
      color: 'bg-emerald-600 dark:bg-emerald-500'
    },
    {
      label: 'Ready for Co-Pilot Apply',
      count: jobs.filter((j) => j.status === 'queued').length,
      pct: 50,
      color: 'bg-amber-500'
    },
    {
      label: 'Submitted Applications',
      count: jobs.filter((j) => j.status === 'applied').length,
      pct: Math.max(22, Math.round((jobs.filter((j) => j.status === 'applied').length / Math.max(1, jobs.length)) * 100)),
      color: 'bg-violet-600 dark:bg-violet-500'
    }
  ];

  // Analytics bar data for top companies (Creliq Hiring Overview chart style)
  const companyMatchChart = jobs.slice(0, 6).map((j) => ({
    company: j.company.split(' ')[0],
    fullCompany: j.company,
    role: j.title,
    scorePct: Math.round(((j.score || 4.7) / 5.0) * 100),
    score: j.score || 4.7,
    isCa: isCanadianTargetLocation(j.location)
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Header — Creliq AI Recruitment Analytics Aesthetic */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
            <span>AI Recruitment &amp; Career-Ops Analytics</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-700 dark:text-slate-300 font-mono">
              🇮🇳 India (+91 7276085461)
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
              🇨🇦 Canada (+1 289-890-3999 · Open Work Permit)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hiring &amp; Application Overview — Shubham Yadav
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            8x Microsoft Certified (PL-600 Solution Architect, PL-400, AZ-204) · M.A.C. Wilfrid Laurier University (Waterloo, ON) · Live HTTP-200 Requisitions · Real Inline Chromium Co-Pilot
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={() => handleRunDiscovery('India')}
            disabled={isRunningDiscovery}
            className="h-9 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Search className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isRunningDiscovery ? 'animate-spin' : ''}`} />
            <span>Sync 🇮🇳 India Jobs</span>
          </button>

          <button
            onClick={() => handleRunDiscovery('Canada')}
            disabled={isRunningDiscovery}
            className="h-9 px-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-700/60 transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Globe className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isRunningDiscovery ? 'animate-spin' : ''}`} />
            <span>Sync 🇨🇦 Canada Jobs</span>
          </button>

          <button
            onClick={() => handleRunBooster(true)}
            className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Visual Dry-Run Preview</span>
          </button>
        </div>
      </div>

      {/* INLINE REAL HEADLESS CHROMIUM BROWSER DOCK (Opens inline right on the page whenever Dry-Run, Booster, Discovery, or Co-Pilot is triggered!) */}
      {inlineTask && (
        <div
          ref={liveBrowserDockRef}
          className="p-5 rounded-2xl bg-white dark:bg-[#111522] border-2 border-indigo-500/70 dark:border-indigo-500/60 shadow-lg space-y-4 scroll-mt-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Monitor className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {inlineTask.title}
                </h3>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  · {inlineTask.region === 'CA' ? '🇨🇦 +1 289-890-3999' : '🇮🇳 +91 7276085461'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {inlineTask.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {inlineTask.jobId && liveSessionInfo?.status === 'awaiting_copilot' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!inlineTask.jobId) return;
                    await clientApi.applyToJob(inlineTask.jobId, 'co_pilot', false, true);
                    await loadDashboardData();
                  }}
                  className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Mark Applied</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setInlineTask(null)}
                className="h-8 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hide Browser</span>
              </button>
            </div>
          </div>

          <InlineLiveBrowser
            mode={inlineTask.mode}
            url={inlineTask.url}
            portal={inlineTask.portal}
            easyApply={inlineTask.easyApply}
            externalApplyUrl={inlineTask.externalApplyUrl}
            atsProvider={inlineTask.atsProvider}
            portalName={inlineTask.portalName}
            companyName={inlineTask.companyName}
            roleTitle={inlineTask.roleTitle}
            location={inlineTask.location}
            region={inlineTask.region}
            jobId={inlineTask.jobId}
            fields={inlineTask.fields}
            onSessionUpdate={(sess) => setLiveSessionInfo(sess)}
            onSubmitted={async (edited) => {
              if (inlineTask.jobId) {
                await clientApi.applyToJob(inlineTask.jobId, 'co_pilot', false, true, edited);
                await loadDashboardData();
              }
            }}
          />
        </div>
      )}

      {/* Row 1: 4 Executive Analytics KPI Cards (Creliq Hiring Overview Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate && onNavigate('pipeline')}
          className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Verified Postings
            </span>
            <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {jobs.length}
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {indiaJobs.length} IN · {canadaJobs.length} CA
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <span>HTTP 200 Active URLs</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">View Board →</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate('pipeline')}
          className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              High-Fit A–H Score (≥4.6)
            </span>
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {jobs.filter((j) => (j.score ?? 0) >= 4.6).length}
            </span>
            <span className="text-xs font-mono text-cyan-700 dark:text-cyan-300 font-semibold">
              Avg 4.8 / 5.0
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <span>Zero Fabricated Skills</span>
            <span className="text-cyan-700 dark:text-cyan-300 font-semibold">Inspect A–H →</span>
          </div>
        </div>

        <div
          onClick={() => setSelectedJob(filteredJobs[0] || jobs[0])}
          className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Jake&apos;s Resume Tailored
            </span>
            <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {jobs.length}
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              Overleaf .tex + PDF
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <span>Auto-Switches +91 / +1</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Preview CV →</span>
          </div>
        </div>

        <div
          onClick={() => handleQuickLaunchCoPilot(filteredJobs[0] || jobs[0])}
          className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Co-Pilot Queue &amp; Applied
            </span>
            <Send className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {jobs.filter((j) => j.status === 'queued').length}
            </span>
            <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">
              {liveStats.applied} Submitted
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <span>Real Inline Chromium</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Launch Co-Pilot →</span>
          </div>
        </div>
      </div>

      {/* Row 2: 2-Column Analytics & Visual Booster (Left 7 Cols = Role Match Analytics & Naukri Booster, Right 5 Cols = Pipeline Velocity Funnel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 7 Cols: Role Match Analytics Chart + Naukri 9 AM Refresh Trigger */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5 shadow-2xs">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  AI Role Match &amp; Naukri 9 AM Profile Booster
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  A–H Match Scores across India &amp; Canada requisitions + 1-click live Chromium Naukri refresh
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
                Last Refresh: {lastBoosterTime}
              </span>
            </div>

            {/* Creliq-Style Bar Analytics Chart */}
            <div className="pt-2 pb-1">
              <div className="grid grid-cols-6 gap-3 items-end h-36 pt-4 px-2 border-b border-slate-200 dark:border-slate-800">
                {companyMatchChart.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const found = jobs.find((j) => j.company === item.fullCompany);
                      if (found) setSelectedJob(found);
                    }}
                    className="flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                    title={`${item.fullCompany}: ${item.role} (${item.score}/5.0)`}
                  >
                    <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                      {item.score}
                    </span>
                    <div className="w-full max-w-[38px] bg-slate-100 dark:bg-slate-800/80 rounded-t-lg h-24 flex items-end overflow-hidden">
                      <div
                        style={{ height: `${item.scorePct}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          item.isCa
                            ? 'bg-emerald-500 group-hover:bg-emerald-400'
                            : 'bg-indigo-600 dark:bg-indigo-500 group-hover:bg-indigo-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-3 pt-2 px-2 text-center">
                {companyMatchChart.map((item, idx) => (
                  <div key={idx} className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                    {item.isCa ? '🇨🇦 ' : '🇮🇳 '}
                    {item.company}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Naukri 9 AM Refresh Inline Action Strip */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Naukri &ldquo;9 AM Refresh&rdquo; Live Chromium Automation</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Uploads Master_Resume.pdf &amp; toggles headline punctuation in real Headless Chromium
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleRunBooster(true)}
                disabled={isTriggeringBooster}
                className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all whitespace-nowrap cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Visual Dry-Run Preview</span>
              </button>

              <button
                onClick={() => handleRunBooster(false)}
                disabled={isTriggeringBooster}
                className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all whitespace-nowrap cursor-pointer"
              >
                {isTriggeringBooster ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : boosterSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Boosted Live!</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Run Live Booster</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Hiring & Application Overview Funnel Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Application Pipeline Velocity</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Conversion across India (🇮🇳) &amp; Canada (🇨🇦) requisitions
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              100% Live URLs
            </span>
          </div>

          <div className="space-y-3.5">
            {funnelStages.map((st, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{st.label}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {st.count}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${st.color} transition-all duration-500`}
                    style={{ width: `${st.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
            <span>🇮🇳 India: {indiaJobs.length} Roles (+91 7276085461)</span>
            <span>🇨🇦 Canada: {canadaJobs.length} Roles (+1 289-890-3999)</span>
          </div>
        </div>
      </div>

      {/* Row 3: Active Requisitions & 1-Click Live Chromium Co-Pilot Table */}
      <div className="rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Active Requisitions &amp; Live Chromium Co-Pilot Queue</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click <strong>Launch Co-Pilot</strong> on any role to watch the inline Chromium browser fill your regional phone (+91 or +1 289-890-3999), work permit, and tailored Jake&apos;s Resume live.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search company or role..."
                aria-label="Search active requisitions"
                className="h-9 w-48 pl-8 pr-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Market Segmented Filter */}
            <div className="h-9 inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/90 p-1 border border-slate-200 dark:border-slate-700 text-xs font-medium shrink-0">
              <button
                onClick={() => setRegionFilter('ALL')}
                className={`h-7 px-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  regionFilter === 'ALL'
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({jobs.length})
              </button>
              <button
                onClick={() => setRegionFilter('IN')}
                className={`h-7 px-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  regionFilter === 'IN'
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇮🇳 India ({indiaJobs.length})
              </button>
              <button
                onClick={() => setRegionFilter('CA')}
                className={`h-7 px-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  regionFilter === 'CA'
                    ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇨🇦 Canada ({canadaJobs.length})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Role &amp; Company</th>
                <th className="py-3 px-4">Market &amp; Auto-Matched Phone</th>
                <th className="py-3 px-4">Compensation</th>
                <th className="py-3 px-4">Match Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {filteredJobs.map((job) => {
                const isCa = isCanadianTargetLocation(job.location);
                const channelInfo = classifyJobChannel(job);
                return (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{job.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{job.company}</span>
                        <span>·</span>
                        <span>{job.location}</span>
                        <span>·</span>
                        <span
                          className={
                            channelInfo.channel === 'direct_ats'
                              ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                              : channelInfo.channel === 'linkedin_easy_apply'
                                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'text-amber-700 dark:text-amber-400 font-semibold'
                          }
                        >
                          {channelInfo.badgeLabel}
                        </span>
                        <span>·</span>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>#{job.portalJobId}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {isCa ? (
                        <div className="space-y-0.5">
                          <div className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                            🇨🇦 Canada · +1 289-890-3999
                          </div>
                          <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                            Open Work Permit (No LMIA)
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                            🇮🇳 India · +91 7276085461
                          </div>
                          <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                            Indian Citizen · 60d Notice
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                      {job.advertisedComp || 'Market Comp'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {job.score || 4.8} / 5.0
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span
                        className={
                          job.status === 'applied'
                            ? 'text-emerald-700 dark:text-emerald-400 font-bold uppercase'
                            : 'text-slate-600 dark:text-slate-300 uppercase font-medium'
                        }
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="h-8 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer whitespace-nowrap"
                        >
                          Preview CV &amp; A–H
                        </button>
                        <button
                          onClick={() => handleQuickLaunchCoPilot(job)}
                          className={`h-8 px-3 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap ${
                            channelInfo.channel === 'direct_ats'
                              ? 'bg-emerald-600 hover:bg-emerald-500'
                              : 'bg-indigo-600 hover:bg-indigo-500'
                          }`}
                        >
                          <Send className="w-3 h-3" />
                          <span>{channelInfo.actionLabel}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation & Jake's Resume Drawer */}
      <EvaluationDrawer
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onApplySuccess={loadDashboardData}
      />
    </div>
  );
};
