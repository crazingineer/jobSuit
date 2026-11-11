import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Sparkles,
  Play,
  Copy,
  CheckCircle2,
  Terminal,
  Target,
  Briefcase,
  Monitor,
  Award,
  Send
} from 'lucide-react';
import { clientApi, INITIAL_VAULT, INITIAL_MASTER_CV, INITIAL_JOBS } from '@/lib/api';
import {
  getHpAm0238TxHardwareConfig,
  generateOutreachMessages,
  analyzeAtsKeywordGap
} from '@/utils/ai-agent-engine';
import { PersonalVault, MasterCV } from '@/types/vault';
import { JobListing } from '@/types/job';
import { isCanadianTargetLocation, resolveCandidateContactForRegion } from '@/utils/jakes-resume-generator';
import { classifyJobChannel } from '@/utils/job-channel-classifier';
import { InlineLiveBrowser, LiveSessionData } from '../common/InlineLiveBrowser';

export const AiFormAgentCenter: React.FC = () => {
  const [subMode, setSubMode] = useState<'vision_agent' | 'career_hub'>('vision_agent');

  // Data state
  const [vault, setVault] = useState<PersonalVault>(INITIAL_VAULT);
  const [masterCv, setMasterCv] = useState<MasterCV>(INITIAL_MASTER_CV);
  const [jobs, setJobs] = useState<JobListing[]>(INITIAL_JOBS);
  const [selectedJobId, setSelectedJobId] = useState<string>(INITIAL_JOBS[0]?.id || 'job-201');
  const [browserMode, setBrowserMode] = useState<'copilot_apply' | 'booster_dry_run' | 'discovery_scan'>('copilot_apply');
  const [liveSession, setLiveSession] = useState<LiveSessionData | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [runCounter, setRunCounter] = useState<number>(0);

  // Hardware & Multimodal VLM state
  const hw = useMemo(() => getHpAm0238TxHardwareConfig(), []);
  const primaryVlm = hw.recommendedModels[0];
  const altVlm = hw.recommendedModels[1];
  const embedModel = hw.recommendedModels[2];

  useEffect(() => {
    clientApi.getVault().then((res) => {
      if (res.vault) setVault(res.vault);
      if (res.masterCv) setMasterCv(res.masterCv);
    });
    clientApi.getJobs().then((list) => {
      if (list && list.length > 0) {
        setJobs(list);
        setSelectedJobId(list[0].id);
      }
    });
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) || jobs[0] || INITIAL_JOBS[0],
    [jobs, selectedJobId]
  );

  const isCa = isCanadianTargetLocation(selectedJob.location);
  const contact = resolveCandidateContactForRegion(vault, selectedJob.location);
  const selectedChannel = classifyJobChannel(selectedJob);

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const powershellSnippet = `# HP OMEN 16-am0238TX (RTX 5060 8GB GDDR7 + Core Ultra 7 255H) Multimodal Vision Setup
$env:OLLAMA_FLASH_ATTENTION="1"
$env:OLLAMA_KV_CACHE_TYPE="q8_0"
$env:OLLAMA_NUM_PARALLEL="1"
$env:OLLAMA_MAX_LOADED_MODELS="1"
ollama pull ${primaryVlm.ollamaTag}
ollama pull ${altVlm.ollamaTag}
ollama serve`;

  const outreachPack = useMemo(
    () => generateOutreachMessages(selectedJob || INITIAL_JOBS[0], vault, masterCv),
    [selectedJob, vault, masterCv]
  );

  const keywordGapAnalysis = useMemo(
    () => analyzeAtsKeywordGap((selectedJob || INITIAL_JOBS[0]).rawJdText, masterCv, vault),
    [selectedJob, masterCv, vault]
  );

  const recommendedBulletsText = useMemo(() => {
    const allBullets = masterCv.workExperience.flatMap((w) => w.bullets);
    return keywordGapAnalysis.recommendedBulletIds.map((id) => {
      const found = allBullets.find((b) => b.id === id);
      return found ? found.text : id;
    });
  }, [masterCv, keywordGapAnalysis]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Sub-Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Live Inline Chromium Browser Studio &amp; Career Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real Playwright Headless Chromium (1280×760) streaming live · Click directly on the browser viewport to interact · Tuned for HP OMEN 16-am0238TX
          </p>
        </div>

        {/* Sub-Mode Switcher */}
        <div className="h-9 inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs shrink-0">
          <button
            onClick={() => setSubMode('vision_agent')}
            className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subMode === 'vision_agent'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Live Inline Chromium Browser</span>
          </button>

          <button
            onClick={() => setSubMode('career_hub')}
            className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subMode === 'career_hub'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Outreach, ATS Gap &amp; Comp Hub</span>
          </button>
        </div>
      </div>

      {subMode === 'vision_agent' ? (
        <>
          {/* Target Requisition & Workflow Toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
                  Target Requisition Loaded in Real Headless Chromium
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => {
                    setSelectedJobId(e.target.value);
                    setBrowserMode('copilot_apply');
                  }}
                  aria-label="Select target job for live browser session"
                  className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  {jobs.map((j) => {
                    const ch = classifyJobChannel(j);
                    return (
                      <option key={j.id} value={j.id}>
                        {isCanadianTargetLocation(j.location) ? '🇨🇦 ' : '🇮🇳 '}
                        [{ch.shortBadge}] {j.company} — {j.title} ({j.location})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
                  Browser Workflow Mode
                </label>
                <div className="h-9 inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setBrowserMode('copilot_apply')}
                    className={`h-7 px-2.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      browserMode === 'copilot_apply'
                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ATS Form Auto-Fill
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrowserMode('booster_dry_run')}
                    className={`h-7 px-2.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      browserMode === 'booster_dry_run'
                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Naukri 9 AM Booster
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrowserMode('discovery_scan')}
                    className={`h-7 px-2.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      browserMode === 'discovery_scan'
                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Live Discovery
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setRunCounter((c) => c + 1)}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Re-Run Live Chromium Pass</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Live Chromium Workspace: Left 8 Cols = Real Inline Chromium Browser, Right 4 Cols = Live Telemetry & Hardware */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8">
              <InlineLiveBrowser
                key={`${selectedJob.id}-${browserMode}-${runCounter}`}
                mode={browserMode}
                url={
                  browserMode === 'booster_dry_run'
                    ? 'https://www.naukri.com/mnjuser/profile'
                    : browserMode === 'discovery_scan'
                      ? `https://www.linkedin.com/jobs/search?keywords=Power+Platform+Developer&location=${encodeURIComponent(isCa ? 'Canada' : 'India')}`
                      : selectedJob.url
                }
                portal={selectedJob.portal}
                easyApply={selectedJob.easyApply}
                externalApplyUrl={selectedJob.externalApplyUrl}
                atsProvider={selectedJob.atsProvider}
                portalName={selectedChannel.portalHeaderLabel}
                companyName={selectedJob.company}
                roleTitle={selectedJob.title}
                location={selectedJob.location}
                region={contact.region}
                jobId={selectedJob.id}
                onSessionUpdate={(sess) => setLiveSession(sess)}
                onSubmitted={async (edited) => {
                  await clientApi.applyToJob(selectedJob.id, 'co_pilot', false, true, edited);
                }}
              />
            </div>

            {/* Right 4 Cols: Live Chromium Action Log & HP OMEN 16-am0238TX Hardware Config */}
            <div className="lg:col-span-4 space-y-5">
              {/* Live Playwright Action & Coordinate Feed */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Live Chromium Execution Stream</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                    ({liveSession?.cursorX ?? 640}, {liveSession?.cursorY ?? 360}) px
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1">
                  <div className="text-slate-500 dark:text-slate-400 text-[10.5px]">Active Region Profile</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {isCa ? '🇨🇦 Canada (+1 289-890-3999)' : '🇮🇳 India (+91 7276085461)'}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                    {contact.workAuthBadge}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900 dark:bg-black/70 border border-slate-800 p-3 max-h-60 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1.5">
                  {(liveSession?.logs || ['[Chromium] Initializing headless browser...']).map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.includes('SUCCESS') || line.includes('SUBMITTED')
                          ? 'text-emerald-400 font-semibold'
                          : line.includes('CO-PILOT')
                            ? 'text-amber-300 font-semibold'
                            : 'text-slate-300'
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>

                {liveSession?.status === 'awaiting_copilot' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!liveSession?.sessionId) return;
                      await fetch(`/api/browser/session/${liveSession.sessionId}/submit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ jobId: selectedJob.id })
                      });
                    }}
                    className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Submit in Chromium</span>
                  </button>
                )}
              </div>

              {/* HP OMEN 16-am0238TX Local VLM Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {hw.deviceName}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {primaryVlm.ollamaTag}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
                  {hw.gpu} · {hw.ramGb} GB DDR5 · {embedModel.ollamaTag}
                </p>

                <button
                  onClick={() => handleCopyText('ps-ollama', powershellSnippet)}
                  className="w-full h-9 inline-flex items-center justify-center gap-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  {copiedKey === 'ps-ollama' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Copied Qwen2.5-VL Launch Script!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Local Ollama VLM Script</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* SUB-MODE 2: ONE-STOP CAREER HUB */
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                  Active Target Requisition for ATS Gap, Referral Outreach &amp; Comp Playbook
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="mt-1 h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.company} — {j.title} ({j.location})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>
                Portal: <strong className="text-indigo-600 dark:text-indigo-400 uppercase">{selectedJob?.portal}</strong>
              </span>
              <span>·</span>
              <span>
                Score: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{selectedJob?.score || 4.8}/5.0</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: ATS Keyword Gap Analyzer */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>ATS Keyword Coverage</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {keywordGapAnalysis.matchPercentage}% Match
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">
                      Matched Skills in Your Master Vault ({keywordGapAnalysis.matchedKeywords.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {keywordGapAnalysis.matchedKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 font-semibold">
                      <Award className="w-3.5 h-3.5" />
                      <span>Top High-Impact CV Bullets Selected for {selectedJob?.company}</span>
                    </div>
                    {recommendedBulletsText.map((bullet: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                      >
                        • {bullet}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Referral & Cold Outreach Generator */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Recruiter &amp; Hiring Manager Outreach Pack — {selectedJob?.company}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Grounded in your real KPI Partners, Wilfrid Laurier University, and Accenture achievements
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: 'linkedin_note',
                    title: `LinkedIn Connection Note (${outreachPack.linkedinCharCount}/300 chars)`,
                    content: outreachPack.linkedinConnectNote
                  },
                  {
                    key: 'hm_inmail',
                    title: 'Peer / Technical Lead Referral DM',
                    content: outreachPack.peerReferralDm
                  },
                  {
                    key: 'cold_email',
                    title: `Hiring Manager Email (${outreachPack.hiringManagerColdEmailSubject})`,
                    content: outreachPack.hiringManagerColdEmailBody
                  },
                  {
                    key: 'follow_up',
                    title: '7-Day Follow-Up Note',
                    content: outreachPack.followUp7DayNote
                  }
                ].map((msg) => (
                  <div
                    key={msg.key}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{msg.title}</span>
                      <button
                        onClick={() => handleCopyText(msg.key, msg.content)}
                        className="h-7 px-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-mono text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === msg.key ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
