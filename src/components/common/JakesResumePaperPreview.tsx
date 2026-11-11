import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  FileText,
  Globe,
  ShieldCheck,
  Code
} from 'lucide-react';
import { MasterCV, PersonalVault } from '@/types/vault';
import {
  AnyBulletOverride,
  formatHtmlBulletWithBold,
  generateJakesResumeLatex,
  isCanadianTargetLocation,
  resolveCandidateContactForRegion
} from '@/utils/jakes-resume-generator';
import { containsForbiddenFabrication } from '@/utils/cv-alignment-guard';

interface JakesResumePaperPreviewProps {
  vault: PersonalVault;
  masterCv: MasterCV;
  bulletMods?: AnyBulletOverride[];
  targetRoleHeadline?: string | { company?: string; roleTitle?: string; location?: string };
  pdfDownloadUrl?: string;
  pdfFilename?: string;
  onRecompile?: () => void;
  isCompiling?: boolean;
}

export const JakesResumePaperPreview: React.FC<JakesResumePaperPreviewProps> = ({
  vault,
  masterCv,
  bulletMods = [],
  targetRoleHeadline,
  pdfDownloadUrl = '/data/cv_tailored/Master_Resume.pdf',
  pdfFilename = 'Shubham_Yadav_Jakes_Resume.pdf',
  onRecompile,
  isCompiling = false
}) => {
  const defaultLoc =
    typeof targetRoleHeadline === 'object' ? targetRoleHeadline?.location : undefined;
  const [regionOverride, setRegionOverride] = useState<'auto' | 'IN' | 'CA'>('auto');
  const [zoom, setZoom] = useState<number>(100);
  const [copiedTex, setCopiedTex] = useState(false);

  const effectiveTargetLoc =
    regionOverride === 'CA'
      ? 'Toronto, Ontario, Canada'
      : regionOverride === 'IN'
        ? 'Pune, Maharashtra, India'
        : defaultLoc || vault.location;

  const contact = resolveCandidateContactForRegion(vault, effectiveTargetLoc);
  const isCanadaActive =
    regionOverride === 'CA' || (regionOverride === 'auto' && isCanadianTargetLocation(effectiveTargetLoc));

  // Build override maps with anti-fabrication guard
  const modMap = new Map<string, string>();
  const textOverrideMap = new Map<string, string>();

  for (const mod of bulletMods) {
    if ('bulletId' in mod && mod.bulletId && mod.tailoredText && !containsForbiddenFabrication(mod.tailoredText)) {
      modMap.set(mod.bulletId, mod.tailoredText);
    } else if ('proposedChange' in mod && mod.proposedChange && !containsForbiddenFabrication(mod.proposedChange)) {
      if (mod.currentState) {
        textOverrideMap.set(mod.currentState.trim(), mod.proposedChange);
      }
    }
  }

  const resolvedHeadline =
    typeof targetRoleHeadline === 'string'
      ? targetRoleHeadline
      : targetRoleHeadline?.roleTitle
        ? `${targetRoleHeadline.roleTitle} | Power Apps, Power Automate, Data Engineering`
        : masterCv.title ||
          'Power Platform and SharePoint Developer | Power Apps, Power Automate, Data Engineering';

  const linkedinClean = (vault.linkedinUrl || 'linkedin.com/in/shubhambhagwatyadav')
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '');

  const eduLocations: Record<string, string> = {
    'Wilfrid Laurier University': 'Waterloo, Canada',
    'Pune University': 'Pune, India'
  };

  const projectDates: Record<string, string> = {
    'Context-Aware Institutional RAG Chatbot': 'Feb 2026 – Mar 2026',
    'CMS Consolidation and Migration': 'Apr 2023 – Aug 2024',
    'Employee Churn Prediction': 'Sep 2024 – Dec 2024'
  };

  const handleCopyLatex = () => {
    const tex = generateJakesResumeLatex(vault, masterCv, bulletMods, {
      company: typeof targetRoleHeadline === 'object' ? targetRoleHeadline?.company : undefined,
      roleTitle: typeof targetRoleHeadline === 'object' ? targetRoleHeadline?.roleTitle : undefined,
      location: effectiveTargetLoc
    });
    navigator.clipboard.writeText(tex);
    setCopiedTex(true);
    setTimeout(() => setCopiedTex(false), 2500);
  };

  return (
    <div className="space-y-3">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#141826] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-mono truncate max-w-[200px]">{pdfFilename}</span>
          </div>

          {/* Region Contact Switcher (India +91 vs Canada +1 289-890-3999) */}
          <div className="h-8 inline-flex items-center rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 border border-slate-300/70 dark:border-slate-700 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setRegionOverride('IN')}
              className={`h-7 px-2.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                !isCanadaActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇮🇳 India (+91 7276085461)</span>
            </button>
            <button
              type="button"
              onClick={() => setRegionOverride('CA')}
              className={`h-7 px-2.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                isCanadaActive
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇨🇦 Canada (+1 289-890-3999)</span>
            </button>
          </div>
        </div>

        {/* Zoom & Export Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-8 inline-flex items-center rounded-lg bg-white dark:bg-slate-800 px-1.5 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setZoom(Math.max(75, zoom - 10))}
              className="p-1 hover:text-indigo-600 transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 tabular-nums">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(125, zoom + 10))}
              className="p-1 hover:text-indigo-600 transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyLatex}
            className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {copiedTex ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Code className="w-3.5 h-3.5" />}
            <span>{copiedTex ? 'Copied .tex!' : 'Copy Overleaf .tex'}</span>
          </button>

          {onRecompile && (
            <button
              type="button"
              onClick={onRecompile}
              disabled={isCompiling}
              className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <span>{isCompiling ? 'Syncing PDF...' : 'Sync PDF File'}</span>
            </button>
          )}

          <a
            href={pdfDownloadUrl}
            download={pdfFilename}
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* Active Region & Work Authorization Strip */}
      <div className="px-3.5 py-2 rounded-lg bg-slate-100/80 dark:bg-[#141824] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-300 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Active Resume Header:{' '}
            <strong className="text-slate-900 dark:text-white">{contact.phone}</strong> ·{' '}
            <strong className="text-emerald-700 dark:text-emerald-400">{contact.workAuthBadge}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Jake&apos;s Resume (Overleaf syzfjbzwjncs) · Native Paper Sheet</span>
        </div>
      </div>

      {/* Print-Exact US Letter Jake's Resume Paper Sheet */}
      <div className="rounded-xl bg-slate-200/70 dark:bg-[#161923] border border-slate-300 dark:border-slate-800 p-4 sm:p-6 overflow-x-auto max-h-[680px] overflow-y-auto flex justify-center shadow-inner">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            fontFamily:
              '"Latin Modern Roman", "Computer Modern Serif", "Times New Roman", Georgia, Cambria, serif'
          }}
          className="bg-white text-black w-full max-w-[780px] shadow-xl px-8 py-7 text-[10.5px] leading-[1.28] select-text transition-transform border border-slate-300"
        >
          {/* Jake's Resume Header */}
          <div className="text-center mb-2">
            <h1
              className="text-[23px] font-bold tracking-[0.5px] text-black m-0 leading-tight"
              style={{ fontVariant: 'small-caps' }}
            >
              {vault.fullName || 'Shubham Yadav'}
            </h1>
            <div className="text-[10.5px] font-semibold text-black mt-0.5">
              {resolvedHeadline}
            </div>
            <div className="text-[10px] text-black mt-0.5 flex items-center justify-center gap-1.5 flex-wrap">
              <span>{contact.phone}</span>
              <span>|</span>
              <span className="underline">{vault.email || 'shubhambhagwatyadav@gmail.com'}</span>
              <span>|</span>
              <span className="underline">{linkedinClean}</span>
              {isCanadaActive && (
                <>
                  <span>|</span>
                  <span className="font-semibold">
                    Waterloo / Toronto, ON (Canadian Open Work Permit)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Section 1: Technical Skills */}
          <div className="mt-2">
            <div
              className="text-[11.5px] font-bold tracking-[0.6px] border-b border-black pb-[1px] mb-1.5 text-black"
              style={{ fontVariant: 'small-caps' }}
            >
              Technical Skills
            </div>
            <div className="pl-2 space-y-[2px] text-[9.8px]">
              <div>
                <strong>Power Platform &amp; AI:</strong> Power Apps (Canvas, Model-Driven), Power Automate (Cloud, Desktop RPA), Power BI (DAX, Power Query), Dataverse, Power Fx, Power Pages, Copilot Studio, AI Builder, Custom Connectors
              </div>
              <div>
                <strong>Cloud, Database &amp; Data Engineering:</strong> Azure AI Foundry (Content Understanding, Document Intelligence), Azure Databricks (SQL), Azure Functions, Azure Logic Apps, Azure SQL, SSMS, Fabric Capacity (KQL), SharePoint Lists
              </div>
              <div>
                <strong>SharePoint &amp; Migration:</strong> SharePoint Online, SharePoint Server (2013/2016/2019), SPFx, PnP Framework, ShareGate, InfoPath, Nintex, PowerShell
              </div>
              <div>
                <strong>Languages:</strong> C#, JavaScript, TypeScript (React, JSX), Python, SQL, HTML, CSS, XML, JSON
              </div>
              <div>
                <strong>Tools &amp; Version Control:</strong> Git, GitHub, Azure DevOps, JIRA, ServiceNow, Visual Studio, VS Code, Postman
              </div>
              <div>
                <strong>Certifications:</strong> PL-600, PL-400, AZ-204, PL-900, MS-900, AZ-900, AI-900, SC-900
              </div>
            </div>
          </div>

          {/* Section 2: Education */}
          <div className="mt-2.5">
            <div
              className="text-[11.5px] font-bold tracking-[0.6px] border-b border-black pb-[1px] mb-1.5 text-black"
              style={{ fontVariant: 'small-caps' }}
            >
              Education
            </div>
            <div className="pl-2 space-y-1.5">
              {(masterCv.education || []).map((edu, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline font-bold text-[10.5px]">
                    <span>{edu.institution}</span>
                    <span className="font-normal text-[10px]">
                      {eduLocations[edu.institution] || edu.location}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline italic text-[9.8px]">
                    <span>{edu.degree}</span>
                    <span>{edu.year}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Experience */}
          <div className="mt-2.5">
            <div
              className="text-[11.5px] font-bold tracking-[0.6px] border-b border-black pb-[1px] mb-1.5 text-black"
              style={{ fontVariant: 'small-caps' }}
            >
              Experience
            </div>
            <div className="pl-2 space-y-2">
              {(masterCv.workExperience || []).map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline font-bold text-[10.5px]">
                    <span>{exp.role}</span>
                    <span className="font-normal text-[10px]">{exp.dates}</span>
                  </div>
                  <div className="flex justify-between items-baseline italic text-[9.8px] mb-0.5">
                    <span>{exp.company}</span>
                    <span>{exp.location}</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-[2px] text-[9.6px] text-justify">
                    {(exp.bullets || []).map((b) => {
                      const finalTxt =
                        modMap.get(b.id) || textOverrideMap.get(b.text.trim()) || b.text;
                      const isModified =
                        modMap.has(b.id) || textOverrideMap.has(b.text.trim());
                      return (
                        <li
                          key={b.id}
                          className={
                            isModified
                              ? 'bg-emerald-50/90 px-1 rounded'
                              : ''
                          }
                          dangerouslySetInnerHTML={{
                            __html: formatHtmlBulletWithBold(finalTxt)
                          }}
                        />
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Technical Projects */}
          <div className="mt-2.5">
            <div
              className="text-[11.5px] font-bold tracking-[0.6px] border-b border-black pb-[1px] mb-1.5 text-black"
              style={{ fontVariant: 'small-caps' }}
            >
              Technical Projects
            </div>
            <div className="pl-2 space-y-1.5">
              {(masterCv.projects || []).map((proj, idx) => {
                const allBullets = [proj.description, ...(proj.bullets || [])].filter(Boolean);
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline text-[10px]">
                      <span>
                        <strong>{proj.name}</strong> | <em>{(proj.tech || []).join(', ')}</em>
                      </span>
                      <span>{projectDates[proj.name] || '2024 – 2026'}</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-[1.5px] text-[9.6px] text-justify mt-0.5">
                      {allBullets.map((bt, bIdx) => (
                        <li
                          key={bIdx}
                          dangerouslySetInnerHTML={{
                            __html: formatHtmlBulletWithBold(bt)
                          }}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Professional Skills */}
          <div className="mt-2.5">
            <div
              className="text-[11.5px] font-bold tracking-[0.6px] border-b border-black pb-[1px] mb-1.5 text-black"
              style={{ fontVariant: 'small-caps' }}
            >
              Professional Skills
            </div>
            <div className="pl-2 space-y-[2px] text-[9.6px]">
              <div>
                <strong>Analytical Skills:</strong> Strong ability to analyze complex business processes, translate requirements into scalable technical architectures, and optimize system performance.
              </div>
              <div>
                <strong>Communication:</strong> Proven track record of collaborating with cross-functional teams, stakeholders, and executives to deliver user-centric solutions and conduct technical training.
              </div>
              <div>
                <strong>Organizational Skills:</strong> Adept at managing multiple priorities in Agile/Scrum environments, ensuring timely delivery of enterprise-grade projects with high attention to detail.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
