import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  AlertOctagon, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

export const AutomationRules: React.FC = () => {
  const [linkedinLimit, setLinkedinLimit] = useState(25);
  const [naukriLimit, setNaukriLimit] = useState(50);
  const [delayMin, setDelayMin] = useState(8);
  const [delayMax, setDelayMax] = useState(25);
  const [scoreThreshold, setScoreThreshold] = useState(4.0);

  // Platform Toggles: Co-Pilot (pause before submit) vs Auto-Pilot (auto submit)
  const [toggles, setToggles] = useState({
    linkedin: 'co_pilot', // 'auto_pilot' | 'co_pilot'
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
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
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
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Automation Rules & Safety Controls
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Anti-Ban Protection Active
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Human-Mimicking Jitter • Rate-Limiting Sliders • Company Blacklists • Auto-Pilot vs Co-Pilot Toggles
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saveSuccess ? 'Rules Persisted!' : 'Save Rules'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Safety & Rate Limiting Sliders */}
        <div className="p-5 rounded-xl glass-panel border border-white/[0.08] space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Human Emulation & Daily Quotas
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              Stealth Active
            </span>
          </div>

          {/* LinkedIn Daily Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 font-medium">LinkedIn Daily Apply Limit</span>
              <span className="font-mono text-purple-300 font-semibold">{linkedinLimit} applies/day</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              value={linkedinLimit}
              onChange={(e) => setLinkedinLimit(parseInt(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="text-[11px] text-zinc-500 font-mono">
              Recommended: 20-30 to avoid LinkedIn anti-bot session flags.
            </div>
          </div>

          {/* Naukri Daily Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 font-medium">Naukri.com Daily Apply Limit</span>
              <span className="font-mono text-cyan-300 font-semibold">{naukriLimit} applies/day</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={naukriLimit}
              onChange={(e) => setNaukriLimit(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="text-[11px] text-zinc-500 font-mono">
              Naukri accounts can safely absorb 40-60 applications daily.
            </div>
          </div>

          {/* Random Delay Slider */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 font-medium">Random Human Jitter Between Actions</span>
              <span className="font-mono text-amber-300 font-semibold">{delayMin}s – {delayMax}s</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <span className="text-[10px] text-zinc-400 font-mono block">Min Delay ({delayMin}s)</span>
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
                <span className="text-[10px] text-zinc-400 font-mono block">Max Delay ({delayMax}s)</span>
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
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 font-medium">Auto-Filter career-ops Score Gate</span>
              <span className="font-mono text-purple-300 font-bold">&gt;= {scoreThreshold.toFixed(1)} / 5.0</span>
            </div>
            <input
              type="range"
              min={3.0}
              max={4.8}
              step={0.1}
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="text-[11px] text-zinc-500 font-mono">
              Jobs scoring below {scoreThreshold.toFixed(1)} are automatically archived to protect focus.
            </div>
          </div>
        </div>

        {/* Platform Execution Modes: Co-Pilot vs Auto-Pilot */}
        <div className="p-5 rounded-xl glass-panel border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Platform Execution Modes
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300">
              Co-Pilot vs Auto-Pilot
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            <span className="text-purple-300 font-semibold">Co-Pilot:</span> Playwright fills all fields, uploads tailored CV, and pauses on final step for your 1-click review.<br />
            <span className="text-emerald-300 font-semibold">Auto-Pilot:</span> Automatically fills and submits applications unattended.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { id: 'linkedin', label: 'LinkedIn Easy Apply', desc: 'Modal traversal, custom question filling' },
              { id: 'naukri', label: 'Naukri.com 1-Click & Drawer', desc: 'Chatbot drawer questionnaire & notice period' },
              { id: 'workday', label: 'Workday Enterprise ATS', desc: 'Multi-page account login & dynamic work history' },
              { id: 'greenhouse', label: 'Greenhouse.io', desc: 'Form field injection & PDF upload' },
              { id: 'lever', label: 'Lever.co', desc: 'Auto-fill resume & custom Q&A' },
              { id: 'ashby', label: 'AshbyHQ', desc: 'Embed iframe and direct form submission' }
            ].map((p) => {
              const currentMode = (toggles as any)[p.id] || 'co_pilot';
              return (
                <div key={p.id} className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">{p.label}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{p.desc}</div>
                  </div>

                  <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.06] text-[11px] font-mono">
                    <button
                      onClick={() => setToggles({ ...toggles, [p.id]: 'co_pilot' })}
                      className={`px-2.5 py-1 rounded ${currentMode === 'co_pilot' ? 'bg-purple-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Co-Pilot
                    </button>
                    <button
                      onClick={() => setToggles({ ...toggles, [p.id]: 'auto_pilot' })}
                      className={`px-2.5 py-1 rounded ${currentMode === 'auto_pilot' ? 'bg-emerald-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
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
        <div className="p-5 rounded-xl glass-panel border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Company Blacklist
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">{blacklistedCompanies.length} blocked</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add company name or staffing agency to block..."
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCompany()}
              className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-zinc-200 focus:border-purple-500/50 outline-none"
            />
            <button
              onClick={addCompany}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-zinc-200 border border-white/[0.08]"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {blacklistedCompanies.map((c, idx) => (
              <span key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-950/20 border border-rose-900/30 text-rose-300 text-xs font-mono">
                <span>{c}</span>
                <button
                  onClick={() => setBlacklistedCompanies(blacklistedCompanies.filter((_, i) => i !== idx))}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Keyword Blacklist */}
        <div className="p-5 rounded-xl glass-panel border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              JD Keyword Blacklist
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">{blacklistedKeywords.length} blocked</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add keyword phrase (e.g. 'unpaid internship')..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
              className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-zinc-200 focus:border-purple-500/50 outline-none"
            />
            <button
              onClick={addKeyword}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-zinc-200 border border-white/[0.08]"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {blacklistedKeywords.map((k, idx) => (
              <span key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-950/20 border border-amber-900/30 text-amber-300 text-xs font-mono">
                <span>{k}</span>
                <button
                  onClick={() => setBlacklistedKeywords(blacklistedKeywords.filter((_, i) => i !== idx))}
                  className="hover:text-white"
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
