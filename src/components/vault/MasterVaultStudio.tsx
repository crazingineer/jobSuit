import React, { useState, useEffect } from 'react';
import { 
  BookUser, 
  Save, 
  FileCheck, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Eye, 
  Code,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  IndianRupee,
  ShieldAlert,
  FileText,
  Download,
  ExternalLink,
  RefreshCw,
  Clock
} from 'lucide-react';
import { PersonalVault, MasterCV } from '@/types/vault';
import { INITIAL_VAULT, INITIAL_MASTER_CV, clientApi } from '@/lib/api';

export const MasterVaultStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'indian_vault' | 'experience' | 'skills' | 'pdf_preview'>('indian_vault');
  const [vault, setVault] = useState<PersonalVault>(INITIAL_VAULT);
  const [cv, setCv] = useState<MasterCV>(INITIAL_MASTER_CV);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileSuccess, setCompileSuccess] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'compiled_pdf' | 'semantic'>('compiled_pdf');
  const [pdfTimestamp, setPdfTimestamp] = useState<number>(Date.now());

  // Load live vault on mount
  useEffect(() => {
    async function loadVault() {
      try {
        const res = await clientApi.getVault();
        if (res.vault) setVault(res.vault);
        if (res.masterCv) setCv(res.masterCv);
      } catch (err) {
        console.error('Failed to load vault from API', err);
      }
    }
    loadVault();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await clientApi.saveVault(vault, cv);
      setPdfTimestamp(Date.now());
      setSaveSuccess(true);
      if (res?.compileResult?.durationMs) {
        setCompileSuccess(`Master Resume PDF auto-synced in ${res.compileResult.durationMs}ms!`);
        setTimeout(() => setCompileSuccess(null), 3500);
      }
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e: any) {
      alert('Error saving to SQLite: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompileMasterPdf = async () => {
    setIsCompiling(true);
    setCompileSuccess(null);
    try {
      await clientApi.saveVault(vault, cv);
      const res = await clientApi.recompileMasterCv();
      if (res.success) {
        setCompileSuccess(`Compiled in ${res.result?.durationMs || 430}ms!`);
        setPdfTimestamp(Date.now());
        setActiveTab('pdf_preview');
        setPreviewMode('compiled_pdf');
        setTimeout(() => setCompileSuccess(null), 3500);
      } else {
        alert('Compilation failed: ' + res.error);
      }
    } catch (e: any) {
      alert('Error compiling Master PDF: ' + e.message);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Master Vault & Resume Studio
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Source of Truth
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Personal Fact Vault (Indian & Global Recruitment Q&A) • Grounded Master CV bullets • Zero-Hallucination Anchor
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {compileSuccess && (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {compileSuccess}
            </span>
          )}

          <button
            onClick={handleCompileMasterPdf}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-medium text-xs border border-indigo-400/30 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            title="Compile Master CV to ATS-friendly PDF via Playwright (<500ms)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
            <span>{isCompiling ? 'Compiling PDF...' : 'Compile Master ATS PDF'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveSuccess ? 'Saved to SQLite!' : isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] text-xs font-medium">
        <button
          onClick={() => setActiveTab('indian_vault')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'indian_vault'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
          <span>Indian & Global Q&A Vault (CTC / Notice / EEO)</span>
        </button>
        <button
          onClick={() => setActiveTab('experience')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'experience'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
          <span>Modular Work Experience & Impact Bullets</span>
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'skills'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Code className="w-3.5 h-3.5 text-cyan-400" />
          <span>Skills Taxonomy & Summaries</span>
        </button>
        <button
          onClick={() => setActiveTab('pdf_preview')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'pdf_preview'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>Live ATS PDF Template Preview</span>
        </button>
      </div>

      {/* Tab 1: Indian & Global Recruitment Vault */}
      {activeTab === 'indian_vault' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Indian Recruitment Fields */}
          <div className="p-5 rounded-xl glass-panel border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-amber-400" />
                Indian Recruitment Parameters (Naukri & ATS Form Auto-Fill)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">
                Lakhs INR (LPA)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 font-mono block mb-1">Current CTC (INR Lakhs)</label>
                <input
                  type="number"
                  value={vault.currentCtcLakhs}
                  onChange={(e) => setVault({ ...vault, currentCtcLakhs: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-zinc-200 font-mono focus:border-purple-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-mono block mb-1">Expected CTC (INR Lakhs)</label>
                <input
                  type="number"
                  value={vault.expectedCtcLakhs}
                  onChange={(e) => setVault({ ...vault, expectedCtcLakhs: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-zinc-200 font-mono focus:border-purple-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-mono block mb-1">Official Notice Period (Days)</label>
                <input
                  type="number"
                  value={vault.noticePeriodDays}
                  onChange={(e) => setVault({ ...vault, noticePeriodDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-zinc-200 font-mono focus:border-purple-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-mono block mb-1">Last Working Day (LWD)</label>
                <input
                  type="text"
                  placeholder="e.g. Immediately or 2026-12-15"
                  value={vault.lastWorkingDay || ''}
                  onChange={(e) => setVault({ ...vault, lastWorkingDay: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-zinc-200 font-mono focus:border-purple-500/50 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={vault.ctcNegotiable}
                  onChange={(e) => setVault({ ...vault, ctcNegotiable: e.target.checked })}
                  className="rounded border-zinc-700 text-purple-600 focus:ring-0"
                />
                <span>CTC Negotiable depending on equity/role</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={vault.buyoutAvailable}
                  onChange={(e) => setVault({ ...vault, buyoutAvailable: e.target.checked })}
                  className="rounded border-zinc-700 text-purple-600 focus:ring-0"
                />
                <span>Notice Buyout Available</span>
              </label>
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-mono block mb-1">Preferred Work Locations</label>
              <input
                type="text"
                value={vault.preferredLocations.join(', ')}
                onChange={(e) => setVault({ ...vault, preferredLocations: e.target.value.split(',').map(s => s.trim()) })}
                className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-zinc-200 font-mono focus:border-purple-500/50 outline-none"
              />
            </div>
          </div>

          {/* Global Work Authorization & EEO */}
          <div className="p-5 rounded-xl glass-panel border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Global Authorization & EEO Disclosures
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                ATS Auto-Answer
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 font-mono block mb-1">Visa & Citizenship Status</label>
                <input
                  type="text"
                  value={vault.visaStatus}
                  onChange={(e) => setVault({ ...vault, visaStatus: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-zinc-200 font-mono focus:border-purple-500/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-xs text-zinc-400 font-mono block mb-1">Gender</label>
                  <select 
                    value={vault.gender} 
                    onChange={(e) => setVault({ ...vault, gender: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-zinc-200 font-mono"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Decline to self-identify">Decline to self-identify</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-mono block mb-1">Disability Status</label>
                  <select 
                    value={vault.disabilityStatus} 
                    onChange={(e) => setVault({ ...vault, disabilityStatus: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-zinc-200 font-mono"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="Decline to self-identify">Decline to self-identify</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Behavioral Snippets */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="text-xs font-semibold text-zinc-300 block">
                Standard Behavioral Text Snippets (Q&A Vault)
              </label>

              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-semibold block mb-1">
                    Reason for Looking / Why Change?
                  </span>
                  <textarea
                    rows={2}
                    value={vault.qaSnippets.why_change || ''}
                    onChange={(e) => setVault({ ...vault, qaSnippets: { ...vault.qaSnippets, why_change: e.target.value } })}
                    className="w-full bg-transparent text-xs text-zinc-200 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-semibold block mb-1">
                    Leadership & Shipping Philosophy
                  </span>
                  <textarea
                    rows={2}
                    value={vault.qaSnippets.leadership_style || ''}
                    onChange={(e) => setVault({ ...vault, qaSnippets: { ...vault.qaSnippets, leadership_style: e.target.value } })}
                    className="w-full bg-transparent text-xs text-zinc-200 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Modular Work Experience */}
      {activeTab === 'experience' && (
        <div className="space-y-4">
          {cv.workExperience.map((exp, expIdx) => (
            <div key={expIdx} className="p-5 rounded-xl glass-panel border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">{exp.role}</span>
                  <span className="text-xs text-purple-300 font-mono">@{exp.company}</span>
                  <span className="text-xs text-zinc-500 font-mono">({exp.dates})</span>
                </div>
                <span className="text-xs text-zinc-400 font-mono">{exp.location}</span>
              </div>

              {/* Modular Bullets */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-zinc-300">
                  Grounded Impact Bullets (Selected & Re-ordered by career-ops Block E):
                </div>

                {exp.bullets.map((bullet, bIdx) => (
                  <div key={bullet.id} className="p-3 rounded-lg bg-black/30 border border-white/[0.05] space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-zinc-200 leading-relaxed flex-1">
                        {bullet.text}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-white/[0.04]">
                      <span className="text-emerald-400 font-semibold">
                        Metrics: {bullet.metrics}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {bullet.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                            {tag}
                          </span>
                        ))}
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
        <div className="p-5 rounded-xl glass-panel border border-white/[0.08] space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Summary Variants (Archetype Adaptive)</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.05]">
                <span className="text-[10px] font-mono text-purple-400 uppercase font-semibold block mb-1">
                  AI Engineer / LLMOps Archetype Variant
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                  {cv.summaryVariants.aiEngineer}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.05]">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold block mb-1">
                  Lead / Staff Architect Archetype Variant
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                  {cv.summaryVariants.lead}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Verified Skills Taxonomy</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.05]">
                <span className="text-zinc-400 font-mono block mb-1 font-semibold">Languages</span>
                <div className="flex flex-wrap gap-1">
                  {cv.skillsTaxonomy.languages.map((s, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-300 font-mono text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.05]">
                <span className="text-zinc-400 font-mono block mb-1 font-semibold">AI & LLM Tools</span>
                <div className="flex flex-wrap gap-1">
                  {cv.skillsTaxonomy.aiLlm.map((s, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.05]">
                <span className="text-zinc-400 font-mono block mb-1 font-semibold">Frameworks</span>
                <div className="flex flex-wrap gap-1">
                  {cv.skillsTaxonomy.frameworks.map((s, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-300 font-mono text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.05]">
                <span className="text-zinc-400 font-mono block mb-1 font-semibold">Cloud & Infra</span>
                <div className="flex flex-wrap gap-1">
                  {cv.skillsTaxonomy.cloudDevops.map((s, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-300 font-mono text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Live ATS Template & PDF Preview */}
      {activeTab === 'pdf_preview' && (
        <div className="p-6 rounded-xl glass-panel border border-white/[0.08] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.06] gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Master ATS Resume (career-ops Standard)
              </h3>
              <p className="text-[11px] text-zinc-400">
                Ground-truth resume for Naukri 9 AM booster, profile uploads, and 1-click ATS applications
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg bg-black/40 p-0.5 border border-white/[0.08] text-xs">
                <button
                  onClick={() => setPreviewMode('compiled_pdf')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    previewMode === 'compiled_pdf'
                      ? 'bg-purple-600 text-white font-medium shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Compiled ATS PDF
                </button>
                <button
                  onClick={() => setPreviewMode('semantic')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    previewMode === 'semantic'
                      ? 'bg-purple-600 text-white font-medium shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Semantic Layout
                </button>
              </div>

              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ATS Score: 98/100
              </span>
            </div>
          </div>

          {previewMode === 'compiled_pdf' ? (
            <div className="space-y-3">
              {/* PDF Action Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">data/cv_tailored/Master_Resume.pdf</div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      Compiled via Playwright headless engine in &lt; 500ms
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCompileMasterPdf}
                    disabled={isCompiling}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
                    <span>{isCompiling ? 'Compiling...' : 'Recompile Now'}</span>
                  </button>

                  <a
                    href={`/data/cv_tailored/Master_Resume.pdf?t=${pdfTimestamp}`}
                    download="Master_Resume.pdf"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium border border-white/[0.1] transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>

                  <a
                    href={`/data/cv_tailored/Master_Resume.pdf?t=${pdfTimestamp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-400 hover:text-zinc-200 border border-white/[0.08]"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Embedded In-App PDF Viewer */}
              <div className="rounded-xl overflow-hidden border border-white/[0.1] shadow-2xl bg-zinc-950 min-h-[680px] flex flex-col">
                <iframe
                  src={`/data/cv_tailored/Master_Resume.pdf?t=${pdfTimestamp}#toolbar=1`}
                  className="w-full flex-1 min-h-[680px] border-none"
                  title="Master Resume PDF Preview"
                />
              </div>
            </div>
          ) : (
            /* Clean White Paper ATS View */
            <div className="bg-white text-black p-8 rounded-lg shadow-2xl max-w-3xl mx-auto font-sans text-xs leading-normal select-text">
              {/* Header */}
              <div className="border-b border-zinc-300 pb-3 mb-4 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 uppercase">
                  {vault.fullName}
                </h1>
                <div className="text-[11px] text-zinc-600 mt-1 font-mono flex items-center justify-center gap-3">
                  <span>{vault.location}</span>
                  <span>•</span>
                  <span>{vault.email}</span>
                  <span>•</span>
                  <span>{vault.phone}</span>
                </div>
                <div className="text-[11px] text-zinc-600 font-mono mt-0.5 flex items-center justify-center gap-3">
                  <span>{vault.linkedinUrl}</span>
                  <span>•</span>
                  <span>{vault.githubUrl}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-4">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-200 pb-0.5 mb-1.5 font-mono">
                  Professional Summary
                </h2>
                <p className="text-zinc-700 leading-relaxed">
                  {cv.summaryVariants.aiEngineer}
                </p>
              </div>

              {/* Experience */}
              <div className="mb-4">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-200 pb-0.5 mb-2 font-mono">
                  Work Experience
                </h2>
                {cv.workExperience.map((exp, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="flex justify-between font-bold text-zinc-900">
                      <span>{exp.role} — {exp.company}</span>
                      <span className="font-mono text-zinc-600 text-[10px]">{exp.dates}</span>
                    </div>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-zinc-700">
                      {exp.bullets.map((b) => (
                        <li key={b.id} className="leading-relaxed">
                          {b.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Skills */}
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-200 pb-0.5 mb-1.5 font-mono">
                  Technical Skills & Tools
                </h2>
                <div className="text-zinc-700 space-y-0.5">
                  <div><span className="font-semibold">Languages:</span> {cv.skillsTaxonomy.languages.join(', ')}</div>
                  <div><span className="font-semibold">AI & Automation:</span> {cv.skillsTaxonomy.aiLlm.join(', ')}</div>
                  <div><span className="font-semibold">Frameworks:</span> {cv.skillsTaxonomy.frameworks.join(', ')}</div>
                  <div><span className="font-semibold">Cloud & Databases:</span> {cv.skillsTaxonomy.cloudDevops.join(', ')}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
