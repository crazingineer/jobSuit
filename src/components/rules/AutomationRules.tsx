import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  Save,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { clientApi } from '@/lib/api';

export const AutomationRules: React.FC = () => {
  const [linkedinLimit, setLinkedinLimit] = useState(25);
  const [naukriLimit, setNaukriLimit] = useState(50);
  const [delayMin, setDelayMin] = useState(8);
  const [delayMax, setDelayMax] = useState(25);
  const [scoreThreshold, setScoreThreshold] = useState(4.0);

  const [toggles, setToggles] = useState({
    linkedin: 'co_pilot',
    naukri: 'co_pilot',
    workday: 'co_pilot',
    greenhouse: 'auto_pilot',
    lever: 'auto_pilot',
    ashby: 'auto_pilot',
  });

  const [blacklistedCompanies, setBlacklistedCompanies] = useState([
    'Staffing Solutions Inc',
    'Generic Outsourcing Ltd',
    'Unverified Tech Recruiter Corp',
    'Wipro Technologies (Legacy Support)'
  ]);

  const [blacklistedKeywords, setBlacklistedKeywords] = useState([
    'unpaid internship',
    'commission only',
    'crypto token pump',
    'sales target based',
    'no salary disclosed'
  ]);

  const [newCompany, setNewCompany] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadRules() {
      try {
        const res = await clientApi.getRules();
        if (res && res.rules) {
          const r = res.rules;
          if (r.linkedin_daily_limit !== undefined) setLinkedinLimit(r.linkedin_daily_limit);
          if (r.naukri_daily_limit !== undefined) setNaukriLimit(r.naukri_daily_limit);
          if (r.delay_min_sec !== undefined) setDelayMin(r.delay_min_sec);
          if (r.delay_max_sec !== undefined) setDelayMax(r.delay_max_sec);
          if (r.min_score_threshold !== undefined) setScoreThreshold(r.min_score_threshold);
          if (r.blacklistCompanies && Array.isArray(r.blacklistCompanies) && r.blacklistCompanies.length > 0) {
            setBlacklistedCompanies(r.blacklistCompanies);
          }
          if (r.blacklistKeywords && Array.isArray(r.blacklistKeywords) && r.blacklistKeywords.length > 0) {
            setBlacklistedKeywords(r.blacklistKeywords);
          }
          setToggles(prev => ({
            ...prev,
            linkedin: r.auto_pilot_linkedin ? 'auto_pilot' : 'co_pilot',
            naukri: r.auto_pilot_naukri ? 'auto_pilot' : 'co_pilot',
            workday: r.auto_pilot_workday ? 'auto_pilot' : 'co_pilot',
            greenhouse: r.auto_pilot_greenhouse ? 'auto_pilot' : 'co_pilot',
          }));
        }
      } catch (err) {
        console.warn('Could not fetch rules from API', err);
      }
    }
    loadRules();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await clientApi.saveRules({
        linkedinLimit,
        naukriLimit,
        delayMin,
        delayMax,
        scoreThreshold,
        blacklistedCompanies,
        blacklistedKeywords,
        toggles
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const addCompany = () => {
    if (newCompany.trim()) {
      setBlacklistedCompanies([...blacklistedCompanies, newCompany.trim()]);
      setNewCompany('');
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setBlacklistedKeywords([...blacklistedKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header — Uniform h-9 Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Automation Rules & Anti-Rate-Limit Controls
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            SQLite Pre-Deduplication • Human Delay Jitter • Daily Quotas • Co-Pilot vs. Auto-Pilot Toggles
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {saveSuccess && (
            <span className="h-9 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-mono inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Rules saved to SQLite</span>
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 inline-flex items-center justify-center gap-2 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs border border-indigo-500/40 shadow-sm transition-all whitespace-nowrap shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Rules'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Safety & Rate Limiting Sliders */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Anti-Ban Quotas & Human Jitter
            </h3>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">SQLite Pre-Dedup Active</span>
          </div>

          {/* LinkedIn Daily Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-200 font-medium">LinkedIn Daily Apply Limit</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-300 font-semibold tabular-nums">{linkedinLimit} applies/day</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              value={linkedinLimit}
              onChange={(e) => setLinkedinLimit(parseInt(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Skips Voyager API detail calls for job IDs already indexed in SQLite.
            </div>
          </div>

          {/* Naukri Daily Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-200 font-medium">Naukri.com Daily Apply Limit</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-300 font-semibold tabular-nums">{naukriLimit} applies/day</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={naukriLimit}
              onChange={(e) => setNaukriLimit(parseInt(e.target.value))}
              className="w-full accent-cyan-600"
            />
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Pre-deduplicates data-job-id before opening secondary JD tabs.
            </div>
          </div>

          {/* Random Delay Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-200 font-medium">Randomized Human Jitter Between Actions</span>
              <span className="font-mono text-amber-600 dark:text-amber-300 font-semibold tabular-nums">{delayMin}s – {delayMax}s</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">Min Delay ({delayMin}s)</span>
                <input
                  type="range"
                  min={3}
                  max={15}
                  value={delayMin}
                  onChange={(e) => setDelayMin(parseInt(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">Max Delay ({delayMax}s)</span>
                <input
                  type="range"
                  min={16}
                  max={45}
                  value={delayMax}
                  onChange={(e) => setDelayMax(parseInt(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Score Threshold */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-200 font-medium">Auto-Queue career-ops Score Gate</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-300 font-bold tabular-nums">≥ {scoreThreshold.toFixed(1)} / 5.0</span>
            </div>
            <input
              type="range"
              min={3.0}
              max={4.8}
              step={0.1}
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        {/* Platform Execution Modes: Co-Pilot vs Auto-Pilot */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Platform Execution Modes & CAPTCHA Handling
            </h3>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-300 font-medium">Co-Pilot vs Auto-Pilot</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-indigo-600 dark:text-indigo-300">Co-Pilot:</strong> Fills all fields, resolves ATS login/signup, attaches tailored PDF, and pauses if a CAPTCHA challenge or final submit review appears.<br />
            <strong className="text-emerald-600 dark:text-emerald-300">Auto-Pilot:</strong> Submits verified single-page forms unattended.
          </p>

          <div className="space-y-2.5 pt-1">
            {[
              { id: 'linkedin', label: 'LinkedIn (External ATS ↗ & Easy Apply ⚡)', desc: 'Pivots normal jobs to employer ATS; onsite modal only when verified' },
              { id: 'naukri', label: 'Naukri.com 1-Click & Drawer', desc: 'Chatbot drawer questionnaire & notice period' },
              { id: 'workday', label: 'Workday Enterprise ATS', desc: 'SQLite ats_accounts login/signup & dynamic work history' },
              { id: 'greenhouse', label: 'Greenhouse.io (Direct Public ATS)', desc: 'Zero-login native HTML form auto-fill & PDF upload' },
              { id: 'lever', label: 'Lever.co', desc: 'Auto-fill resume & custom Q&A' },
              { id: 'ashby', label: 'AshbyHQ', desc: 'Direct ATS form submission' }
            ].map((p) => {
              const currentMode = (toggles as any)[p.id] || 'co_pilot';
              return (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141722] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{p.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{p.desc}</div>
                  </div>

                  <div className="h-8 inline-flex items-center gap-1 bg-white dark:bg-black/40 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono shrink-0">
                    <button
                      onClick={() => setToggles({ ...toggles, [p.id]: 'co_pilot' })}
                      className={`h-6 px-2.5 rounded transition-colors ${
                        currentMode === 'co_pilot'
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Co-Pilot
                    </button>
                    <button
                      onClick={() => setToggles({ ...toggles, [p.id]: 'auto_pilot' })}
                      className={`h-6 px-2.5 rounded transition-colors ${
                        currentMode === 'auto_pilot'
                          ? 'bg-emerald-600 text-white font-medium'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Auto-Pilot
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Blacklists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Blacklist */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              Company Blacklist
            </h3>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{blacklistedCompanies.length} blocked</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add company name or agency to block..."
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCompany()}
              className="flex-1 h-9 px-3 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 outline-none"
            />
            <button
              onClick={addCompany}
              className="h-9 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#141722] dark:hover:bg-[#1c2030] text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shrink-0"
            >
              Add Company
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {blacklistedCompanies.map((c, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-mono">
                <span>{c}</span>
                <button
                  onClick={() => setBlacklistedCompanies(blacklistedCompanies.filter((_, i) => i !== idx))}
                  className="hover:text-rose-950 dark:hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Keyword Blacklist */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              JD Keyword Blacklist
            </h3>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{blacklistedKeywords.length} blocked</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add keyword phrase (e.g. 'unpaid internship')..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
              className="flex-1 h-9 px-3 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 outline-none"
            />
            <button
              onClick={addKeyword}
              className="h-9 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#141722] dark:hover:bg-[#1c2030] text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shrink-0"
            >
              Add Keyword
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {blacklistedKeywords.map((k, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-mono">
                <span>{k}</span>
                <button
                  onClick={() => setBlacklistedKeywords(blacklistedKeywords.filter((_, i) => i !== idx))}
                  className="hover:text-amber-950 dark:hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
