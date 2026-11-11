import React, { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle2,
  Eye,
  Code,
  Briefcase,
  Globe,
  IndianRupee,
  FileText,
  RefreshCw,
  KeyRound,
  UserCheck,
  ShieldCheck,
  EyeOff,
  Copy
} from 'lucide-react';
import { PersonalVault, MasterCV, AtsAccountRecord } from '@/types/vault';
import { INITIAL_VAULT, INITIAL_MASTER_CV, clientApi } from '@/lib/api';
import { generateJakesResumeLatex } from '@/utils/jakes-resume-generator';
import { JakesResumePaperPreview } from '../common/JakesResumePaperPreview';

const SUMMARY_LABELS: Record<string, { label: string }> = {
  powerPlatform: { label: 'Power Platform & SharePoint Architect Variant' },
  dataEngineering: { label: 'Data Engineering & Databricks ETL Variant' },
  aiAutomation: { label: 'AI Automation, Copilot Studio & RAG Variant' },
  aiEngineer: { label: 'AI Engineer / LLMOps Archetype Variant' },
  lead: { label: 'Lead / Staff Solution Architect Variant' }
};

const SKILL_CATEGORY_LABELS: Record<string, string> = {
  languages: 'Languages & Query',
  frameworks: 'Power Platform & Frameworks',
  aiLlm: 'AI, LLM & Agentic Stack',
  cloudDevops: 'Azure Cloud & Data Engineering',
  sharepointMigration: 'SharePoint & Enterprise Migration',
  toolsVersionControl: 'DevOps, ALM & Delivery Tools'
};

export const MasterVaultStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'indian_vault' | 'experience' | 'skills' | 'pdf_preview'>('indian_vault');
  const [vault, setVault] = useState<PersonalVault>(INITIAL_VAULT);
  const [cv, setCv] = useState<MasterCV>(INITIAL_MASTER_CV);
  const [atsAccounts, setAtsAccounts] = useState<AtsAccountRecord[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'compiled_pdf' | 'latex'>('compiled_pdf');
  const [copiedTex, setCopiedTex] = useState(false);
  const [pdfTimestamp, setPdfTimestamp] = useState<number>(Date.now());

  useEffect(() => {
    async function loadVault() {
      try {
        const res = await clientApi.getVault();
        if (res.vault) setVault(res.vault);
        if (res.masterCv) setCv(res.masterCv);
        if (res.atsAccounts) setAtsAccounts(res.atsAccounts);
      } catch (err) {
        console.error('Failed to load vault from API', err);
      }
    }
    loadVault();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await clientApi.saveVault(vault, cv);
      setPdfTimestamp(Date.now());
      setSaveSuccess(true);
      setStatusMessage(
        res?.compileResult?.durationMs
          ? `Saved to SQLite & Master PDF synced in ${res.compileResult.durationMs}ms`
          : 'Vault & Master CV saved to SQLite'
      );
      setTimeout(() => {
        setSaveSuccess(false);
        setStatusMessage(null);
      }, 3500);
    } catch (e: any) {
      setStatusMessage(`Save notice: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompileMasterPdf = async () => {
    setIsCompiling(true);
    setStatusMessage(null);
    try {
      await clientApi.saveVault(vault, cv);
      const res = await clientApi.recompileMasterCv();
      if (res.success) {
        setStatusMessage(`Compiled Master_Resume.pdf in ${res.result?.durationMs || 420}ms`);
        setPdfTimestamp(Date.now());
        setActiveTab('pdf_preview');
        setPreviewMode('compiled_pdf');
        setTimeout(() => setStatusMessage(null), 3500);
      } else {
        setStatusMessage(`Compilation notice: ${res.error || 'Fallback PDF active'}`);
      }
    } catch (e: any) {
      setStatusMessage(`Compile error: ${e.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const summaryEntries = Object.entries(cv.summaryVariants || {}).filter(
    ([, text]) => typeof text === 'string' && text.trim().length > 0
  );

  const skillEntries = Object.entries(cv.skillsTaxonomy || {}).filter(
    ([, list]) => Array.isArray(list) && list.length > 0
  );

  const inputClass =
    'w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-mono focus:border-indigo-500 outline-none';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Master Vault &amp; Jake&apos;s Resume Studio
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dual-Market Profile: India (🇮🇳 +91 7276085461) &amp; Canada (🇨🇦 +1 289-890-3999 · Open Work Permit) · ATS Credentials · Grounded Master CV
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {statusMessage && (
            <span className="h-9 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-mono inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </span>
          )}

          <button
            onClick={handleCompileMasterPdf}
            disabled={isCompiling}
            className="h-9 inline-flex items-center justify-center gap-2 px-3.5 rounded-xl bg-white dark:bg-[#111522] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-xs border border-slate-200 dark:border-slate-800 transition-all disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isCompiling ? 'animate-spin' : ''}`} />
            <span>{isCompiling ? 'Compiling PDF...' : 'Compile Master ATS PDF'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 inline-flex items-center justify-center gap-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveSuccess ? 'Saved to SQLite!' : isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('indian_vault')}
          className={`h-10 px-3 border-b-2 inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'indian_vault'
              ? 'border-indigo-600 text-indigo-600 dark:text-white font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>India &amp; Canada Vault, Work Permit &amp; ATS Credentials</span>
        </button>
        <button
          onClick={() => setActiveTab('experience')}
          className={`h-10 px-3 border-b-2 inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'experience'
              ? 'border-indigo-600 text-indigo-600 dark:text-white font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Work Experience &amp; Grounded Bullets ({cv.workExperience.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`h-10 px-3 border-b-2 inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'skills'
              ? 'border-indigo-600 text-indigo-600 dark:text-white font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Code className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Skills Taxonomy &amp; Archetype Summaries</span>
        </button>
        <button
          onClick={() => setActiveTab('pdf_preview')}
          className={`h-10 px-3 border-b-2 inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'pdf_preview'
              ? 'border-indigo-600 text-indigo-600 dark:text-white font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Jake&apos;s Resume Live Preview</span>
        </button>
      </div>

      {/* Tab 1: Dual India + Canada Vault */}
      {activeTab === 'indian_vault' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Candidate Identity */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Candidate Identity</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-500">Primary Profile</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={vault.fullName || ''}
                    onChange={(e) => setVault({ ...vault, fullName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">Primary Email</label>
                  <input
                    type="email"
                    value={vault.email || ''}
                    onChange={(e) => setVault({ ...vault, email: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={vault.linkedinUrl || ''}
                    onChange={(e) => setVault({ ...vault, linkedinUrl: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">GitHub / Portfolio URL</label>
                  <input
                    type="text"
                    value={vault.githubUrl || ''}
                    onChange={(e) => setVault({ ...vault, githubUrl: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Canadian Work Permit & Contact Profile Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>🇨🇦 Canada Work Permit &amp; Phone</span>
                </h3>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  Authorized in CA
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">
                    Canadian Phone Number (+1)
                  </label>
                  <input
                    type="text"
                    value={vault.phoneCanada || '+1 289-890-3999'}
                    onChange={(e) => setVault({ ...vault, phoneCanada: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">
                    Canadian Location / Hub
                  </label>
                  <input
                    type="text"
                    value={vault.locationCanada || 'Waterloo / Toronto, ON, Canada'}
                    onChange={(e) => setVault({ ...vault, locationCanada: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">
                    Canadian Work Authorization Status
                  </label>
                  <input
                    type="text"
                    value={
                      vault.workPermitCanada ||
                      'Canadian Open Work Permit (Authorized to work in Canada — No LMIA / Sponsorship Required)'
                    }
                    onChange={(e) => setVault({ ...vault, workPermitCanada: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">
                    Target Compensation (CAD)
                  </label>
                  <input
                    type="text"
                    value={vault.expectedCompCad || 'CAD $115,000 - $135,000'}
                    onChange={(e) => setVault({ ...vault, expectedCompCad: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Indian Recruitment Parameters Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-amber-500" />
                  <span>🇮🇳 India Profile, CTC &amp; Notice</span>
                </h3>
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  Authorized in IN
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">India Phone (+91)</label>
                  <input
                    type="text"
                    value={vault.phone || ''}
                    onChange={(e) => setVault({ ...vault, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">India City</label>
                  <input
                    type="text"
                    value={vault.location || ''}
                    onChange={(e) => setVault({ ...vault, location: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">Current CTC (LPA)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={vault.currentCtcLakhs ?? 0}
                    onChange={(e) => setVault({ ...vault, currentCtcLakhs: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">Expected CTC (LPA)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={vault.expectedCtcLakhs ?? 0}
                    onChange={(e) => setVault({ ...vault, expectedCtcLakhs: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">Notice Period (Days)</label>
                  <input
                    type="number"
                    value={vault.noticePeriodDays ?? 60}
                    onChange={(e) => setVault({ ...vault, noticePeriodDays: parseInt(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>

                <div className="flex items-end pb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={Boolean(vault.buyoutAvailable)}
                      onChange={(e) => setVault({ ...vault, buyoutAvailable: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <span>Buyout Option</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: ATS Portal Credentials & Login vs Sign-Up Ledger */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>ATS Portal Credentials &amp; Smart Login vs. Sign-Up Resolution</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Used when applying on Workday (*.myworkdayjobs.com), SmartRecruiters, Oracle Taleo, or iCIMS portals.
                </p>
              </div>
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                SQLite ats_accounts Ledger
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">
                  ATS Account Email Address
                </label>
                <input
                  type="email"
                  value={vault.atsEmail || vault.email || ''}
                  onChange={(e) => setVault({ ...vault, atsEmail: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">
                  Dedicated ATS Portal Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={vault.atsPassword || ''}
                    onChange={(e) => setVault({ ...vault, atsPassword: e.target.value })}
                    className={`${inputClass} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">
                  Login vs. Sign-Up Decision Strategy
                </label>
                <select
                  value={vault.atsAuthStrategy || 'smart_detect'}
                  onChange={(e) => setVault({ ...vault, atsAuthStrategy: e.target.value as any })}
                  className={inputClass}
                >
                  <option value="smart_detect">Smart Auto-Detect (Ledger → Sign-In → Auto Sign-Up)</option>
                  <option value="login_first">Always Try Sign-In First, Pivot on Error</option>
                  <option value="signup_first">Try Create Account First for Unknown Domains</option>
                </select>
              </div>
            </div>

            {/* Domain-Scoped ATS Account Ledger Table */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Tracked Company ATS Domains (Auto-Sign-In Enabled)</span>
                <span className="text-[11px] font-mono text-slate-500">{atsAccounts.length} tenant(s) recorded</span>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px]">
                    <tr>
                      <th className="py-2 px-3">ATS Tenant Hostname</th>
                      <th className="py-2 px-3">Portal Engine</th>
                      <th className="py-2 px-3">Registered Email</th>
                      <th className="py-2 px-3">Resolution Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                    {atsAccounts.map((acc) => (
                      <tr key={acc.id} className="text-slate-700 dark:text-slate-300">
                        <td className="py-2 px-3 text-slate-900 dark:text-white font-semibold">{acc.domain}</td>
                        <td className="py-2 px-3 uppercase text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold">
                          {acc.portalType}
                        </td>
                        <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{acc.emailUsed}</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Known Account → Direct Sign-In
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Modular Work Experience */}
      {activeTab === 'experience' && (
        <div className="space-y-4">
          {cv.workExperience.map((exp, expIdx) => (
            <div
              key={expIdx}
              className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{exp.role}</span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                    @{exp.company}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">({exp.dates})</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{exp.location}</span>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Grounded Impact Bullets ({exp.bullets.length} verified statements):
                </div>

                {exp.bullets.map((bullet) => (
                  <div
                    key={bullet.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151a2a] border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">{bullet.text}</p>

                    <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono pt-1.5 border-t border-slate-200/80 dark:border-slate-800">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        Impact: {bullet.metrics}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap text-slate-500 dark:text-slate-400">
                        {bullet.tags.join(' · ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Skills Taxonomy & Summaries */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Archetype-Adaptive Professional Summaries ({summaryEntries.length} Active Variants)
              </h3>
              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                career-ops Block E Selector
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {summaryEntries.map(([key, text]) => {
                const meta = SUMMARY_LABELS[key] || { label: `${key} Variant` };
                return (
                  <div
                    key={key}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151a2a] border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <span className="text-[11px] font-mono uppercase font-bold block text-indigo-600 dark:text-indigo-400">
                      {meta.label}
                    </span>
                    <textarea
                      rows={2}
                      value={text}
                      onChange={(e) =>
                        setCv({
                          ...cv,
                          summaryVariants: { ...cv.summaryVariants, [key]: e.target.value }
                        })
                      }
                      className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none resize-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Verified Technical Skills Taxonomy
              </h3>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                Zero-Hallucination Grounded
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {skillEntries.map(([catKey, skills]) => (
                <div
                  key={catKey}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151a2a] border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <span className="text-slate-900 dark:text-white font-mono block font-bold text-xs">
                    {SKILL_CATEGORY_LABELS[catKey] || catKey}
                  </span>
                  <div className="text-slate-600 dark:text-slate-300 font-mono text-[11px] leading-relaxed">
                    {(skills as string[]).join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Live ATS Template & Paper Preview */}
      {activeTab === 'pdf_preview' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111522] border border-slate-200 dark:border-slate-800 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Jake&apos;s Resume ATS Standard (Overleaf syzfjbzwjncs)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Single-column Computer Modern / Latin Modern serif layout with India (+91 7276085461) &amp; Canada (+1 289-890-3999) switch
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="h-9 inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setPreviewMode('compiled_pdf')}
                  className={`h-7 px-3 rounded-lg transition-colors cursor-pointer ${
                    previewMode === 'compiled_pdf'
                      ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Jake&apos;s Resume Paper Preview
                </button>
                <button
                  onClick={() => setPreviewMode('latex')}
                  className={`h-7 px-3 rounded-lg transition-colors cursor-pointer ${
                    previewMode === 'latex'
                      ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Overleaf LaTeX (.tex)
                </button>
              </div>
            </div>
          </div>

          {previewMode === 'compiled_pdf' && (
            <JakesResumePaperPreview
              vault={vault}
              masterCv={cv}
              pdfDownloadUrl={`/data/cv_tailored/Master_Resume.pdf?t=${pdfTimestamp}`}
              pdfFilename="Shubham_Yadav_Master_Resume.pdf"
              onRecompile={handleCompileMasterPdf}
              isCompiling={isCompiling}
            />
          )}

          {previewMode === 'latex' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141722] border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                    Jake&apos;s Resume Overleaf LaTeX Source (.tex)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Direct drop-in for Overleaf template https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs
                  </div>
                </div>
                <button
                  onClick={() => {
                    const tex = generateJakesResumeLatex(vault, cv);
                    navigator.clipboard.writeText(tex);
                    setCopiedTex(true);
                    setStatusMessage("Copied Jake's Resume LaTeX (.tex) to clipboard!");
                    setTimeout(() => {
                      setCopiedTex(false);
                      setStatusMessage(null);
                    }, 3000);
                  }}
                  className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedTex ? 'Copied .tex!' : 'Copy LaTeX (.tex)'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[600px] whitespace-pre leading-relaxed">
                {generateJakesResumeLatex(vault, cv)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
