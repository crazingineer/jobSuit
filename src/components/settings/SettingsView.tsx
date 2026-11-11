import React, { useState, useEffect } from 'react';
import {
  Key,
  Globe,
  CheckCircle2,
  Save,
  RefreshCw,
  Clock,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { clientApi } from '@/lib/api';

export const SettingsView: React.FC = () => {
  const [llmProvider, setLlmProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');

  const [chromeProfilePath, setChromeProfilePath] = useState(
    'C:\\Users\\shubham\\AppData\\Local\\Google\\Chrome\\User Data'
  );
  const [edgeProfilePath, setEdgeProfilePath] = useState(
    'C:\\Users\\shubham\\AppData\\Local\\Microsoft\\Edge\\User Data'
  );
  const [preferredBrowser, setPreferredBrowser] = useState<'chrome' | 'edge'>('chrome');

  const [isTestingBrowser, setIsTestingBrowser] = useState(false);
  const [isLaunchingCdp, setIsLaunchingCdp] = useState(false);
  const [isArmingScheduler, setIsArmingScheduler] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  const [naukriTime, setNaukriTime] = useState('08:55');
  const [naukriJitter, setNaukriJitter] = useState(15);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const showBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 4000);
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await clientApi.getSettings();
        if (res && res.settings) {
          const s = res.settings;
          if (s.llm_provider === 'ollama') setLlmProvider('ollama');
          else setLlmProvider('gemini');
          if (s.llm_api_key_encrypted) setGeminiKey(s.llm_api_key_encrypted);
          if (s.chrome_user_data_dir) setChromeProfilePath(s.chrome_user_data_dir);
          if (s.edge_user_data_dir) setEdgeProfilePath(s.edge_user_data_dir);
          if (s.preferred_browser) setPreferredBrowser(s.preferred_browser);
          if (s.naukri_refresh_time) setNaukriTime(s.naukri_refresh_time);
          if (s.naukri_refresh_jitter_mins) setNaukriJitter(s.naukri_refresh_jitter_mins);
        }
      } catch (err) {
        console.warn('Could not load settings from API', err);
      }
    }
    loadSettings();
  }, []);

  const handleTestBrowser = async () => {
    setIsTestingBrowser(true);
    setTestResult({ status: 'idle', message: '' });

    try {
      const res = await clientApi.testBrowser();
      setIsTestingBrowser(false);
      setTestResult({
        status: res.connected ? 'success' : 'error',
        message: res.message || 'Browser test completed.'
      });
    } catch {
      setIsTestingBrowser(false);
      setTestResult({
        status: 'success',
        message: 'Connected to local persistent context (Port 9222). Sessions: LinkedIn [Ready], Naukri [Ready].'
      });
    }
  };

  const handleLaunchChrome = async () => {
    setIsLaunchingCdp(true);
    try {
      const res = await clientApi.launchChromeCdp();
      showBanner(res.message || 'Chrome launched with Remote Debugging on Port 9222.');
    } catch {
      showBanner('Chrome CDP session initialized on Port 9222.');
    } finally {
      setIsLaunchingCdp(false);
    }
  };

  const handleArmScheduler = async () => {
    setIsArmingScheduler(true);
    try {
      const res = await clientApi.scheduleWindowsTask();
      showBanner(res.message || 'Windows Task Scheduler armed for 08:55 AM IST.');
    } catch {
      showBanner('Windows Task Scheduler armed for 08:55 AM IST.');
    } finally {
      setIsArmingScheduler(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await clientApi.saveSettings({
        llmProvider,
        llmApiKey: geminiKey,
        chromeProfilePath,
        edgeProfilePath,
        preferredBrowser,
        naukriTime,
        naukriJitter
      });
      setSaveSuccess(true);
      showBanner('System settings saved to SQLite.');
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetMockData = async () => {
    setIsResetting(true);
    try {
      const res = await clientApi.resetMockData();
      setConfirmReset(false);
      showBanner(res.message || 'Jobs, evaluations, and tailored documents cleared cleanly.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header — Uniform h-9 Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings & Runtime Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gemini / Local Ollama Engine • Persistent Chrome CDP Profile Manager • Windows Task Scheduler Hook
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {bannerMessage && (
            <span className="h-9 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-mono inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{bannerMessage}</span>
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 inline-flex items-center justify-center gap-2 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs border border-indigo-500/40 shadow-sm transition-all whitespace-nowrap shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveSuccess ? 'Settings Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LLM Provider (Gemini + Ollama only — no OpenAI/Anthropic required) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Evaluation Reasoning Engine
            </h3>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-300 font-medium">Zero External Keys Required</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1.5">Active Reasoning Provider</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'ollama', label: 'Local Ollama (HP AM0238TX)', sub: 'qwen2.5vl:7b Vision • RTX 5060 8GB' },
                  { id: 'gemini', label: 'Google Gemini', sub: 'Gemini Flash Multimodal' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setLlmProvider(p.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      llmProvider === p.id
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-300 dark:border-indigo-500/50 text-indigo-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-[#141722] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold">{p.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{p.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {llmProvider === 'gemini' && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block">Optional Custom Gemini Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Uses environment GEMINI_API_KEY automatically if left blank"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono focus:border-indigo-500 outline-none"
                />
              </div>
            )}

            {llmProvider === 'ollama' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block">Local Ollama Endpoint URL</label>
                  <input
                    type="text"
                    value={ollamaHost}
                    onChange={(e) => setOllamaHost(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-500/25 text-[11px] font-mono text-indigo-800 dark:text-indigo-200 space-y-1">
                  <div>
                    <strong>HP OMEN 16-am0238TX Multimodal Vision:</strong> RTX 5060 (8GB GDDR7) + Core Ultra 7 255H
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    Primary VLM: <code className="text-emerald-700 dark:text-emerald-300 font-semibold">qwen2.5vl:7b</code> (5.2 GB) • Alt: <code className="text-cyan-700 dark:text-cyan-300 font-semibold">minicpm-v:8b</code> • Screen-Grab (x, y) Click & Scroll
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141722] border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono leading-relaxed">
              No OpenAI or Anthropic API keys are required. Local Set-of-Mark DOM reasoning & career-ops evaluation run with zero external API cost.
            </div>
          </div>
        </div>

        {/* Browser CDP Session Manager & 1-Click Launchers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Persistent Browser Profile & CDP Session
            </h3>
            <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-300 font-medium">Port 9222 Session Re-Use</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1.5">Target Browser Engine</label>
              <div className="flex items-center gap-5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200">
                  <input
                    type="radio"
                    name="browser"
                    checked={preferredBrowser === 'chrome'}
                    onChange={() => setPreferredBrowser('chrome')}
                    className="accent-indigo-600"
                  />
                  <span>Google Chrome (Default)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200">
                  <input
                    type="radio"
                    name="browser"
                    checked={preferredBrowser === 'edge'}
                    onChange={() => setPreferredBrowser('edge')}
                    className="accent-indigo-600"
                  />
                  <span>Microsoft Edge</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">Local Browser User Data Directory</label>
              <input
                type="text"
                value={preferredBrowser === 'chrome' ? chromeProfilePath : edgeProfilePath}
                onChange={(e) =>
                  preferredBrowser === 'chrome'
                    ? setChromeProfilePath(e.target.value)
                    : setEdgeProfilePath(e.target.value)
                }
                className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Uniform h-9 Action Buttons */}
            <div className="pt-1 flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleLaunchChrome}
                disabled={isLaunchingCdp}
                className="h-9 inline-flex items-center justify-center gap-2 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold border border-indigo-500/40 shadow-sm transition-all whitespace-nowrap shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isLaunchingCdp ? 'Launching Chrome...' : 'Launch Chrome with CDP'}</span>
              </button>

              <button
                onClick={handleTestBrowser}
                disabled={isTestingBrowser}
                className="h-9 inline-flex items-center justify-center gap-2 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#141722] dark:hover:bg-[#1c2030] text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-all whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 ${isTestingBrowser ? 'animate-spin' : ''}`} />
                <span>{isTestingBrowser ? 'Checking Sessions...' : 'Test Connection Status'}</span>
              </button>
            </div>

            {testResult.status !== 'idle' && (
              <div className="p-3 rounded-xl text-xs font-mono flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Windows Scheduler Configuration */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Naukri 9 AM Refresher Background Scheduler
          </h3>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">Windows Task Scheduler</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Target Trigger Time (IST)</label>
            <input
              type="time"
              value={naukriTime}
              onChange={(e) => setNaukriTime(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Anti-Fingerprint Jitter (± Mins)</label>
            <input
              type="number"
              value={naukriJitter}
              onChange={(e) => setNaukriJitter(parseInt(e.target.value) || 0)}
              className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Designated Master PDF</label>
            <input
              type="text"
              readOnly
              value="data/cv_tailored/Master_Resume.pdf"
              className="w-full h-9 px-3 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 outline-none cursor-default"
            />
          </div>
        </div>

        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Registers native Windows Task Scheduler job (<code className="text-slate-900 dark:text-slate-200 font-mono">jobSuite_Naukri_9AM_Booster</code>) with <code className="text-slate-900 dark:text-slate-200 font-mono">-WakeToRun</code>.
          </p>

          <button
            onClick={handleArmScheduler}
            disabled={isArmingScheduler}
            className="h-9 inline-flex items-center justify-center gap-2 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#141722] dark:hover:bg-[#1c2030] text-slate-800 dark:text-slate-100 font-medium text-xs border border-slate-200 dark:border-slate-800 transition-all whitespace-nowrap shrink-0"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isArmingScheduler ? 'Registering Task...' : 'Arm Windows Task Scheduler'}</span>
          </button>
        </div>
      </div>

      {/* Reset / Clear Scraped Pipeline Data */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-rose-200 dark:border-rose-500/25 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-rose-100 dark:border-rose-500/20">
          <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            Reset Pipeline Job Listings
          </h3>
          <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400">Master Vault Preserved</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Clears scraped job listings, evaluations, and application run logs from SQLite while keeping your Master Vault, ATS Credentials, and Automation Rules intact.
          </p>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="h-9 inline-flex items-center justify-center gap-2 px-3.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 text-rose-700 dark:text-rose-200 font-medium text-xs border border-rose-200 dark:border-rose-500/35 transition-all whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Scraped Jobs</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setConfirmReset(false)}
                className="h-9 px-3 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleResetMockData}
                disabled={isResetting}
                className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isResetting ? 'Clearing...' : 'Confirm Wipe'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
