import { MasterCV, PersonalVault } from '../types/vault';
import { containsForbiddenFabrication } from './cv-alignment-guard';

export interface JakesResumeBulletMod {
  bulletId: string;
  originalText: string;
  tailoredText: string;
  reason?: string;
  interviewTalkingPoint?: string;
}

const VERIFIED_BOLD_PHRASES = [
  'Power Apps',
  'Canvas & Model-Driven Power Apps',
  'Power Automate Desktop (RPA)',
  'Power Automate',
  'SharePoint Online',
  'Dataverse',
  'Copilot Studio',
  'AI Builder',
  'Power BI',
  'DAX',
  'Row-Level Security (RLS)',
  'Azure Logic Apps',
  'Azure Functions',
  'Azure Databricks',
  'Databricks SQL',
  'SQL MERGE',
  'Azure AI Foundry (Content Understanding)',
  'Azure AI Foundry',
  'Microsoft Fabric',
  'KQL',
  'ShareGate',
  'PowerShell',
  'InfoPath',
  'Nintex',
  'SPFx',
  'Python',
  'Flask',
  'OpenAI',
  'FAISS',
  'Crawl4AI',
  'Ragas',
  'reducing processing time by 60%',
  'reducing end-to-end processing time by 60%',
  'accelerating clinical data evaluation by 60%',
  'saving 15+ hours/week',
  'saving 15+ hours of manual assessment weekly',
  'reducing processing time by 50%',
  'decreasing processing time by 50%',
  'cutting processing latency by 50%',
  '95%+ accuracy',
  'reducing compute costs by 70%',
  'cost savings of 70%',
  '70% lower compute cost',
  '32 hours per week',
  '32 hours/week',
  '16 hours per week',
  'cutting processing time by 45%',
  'saving 20+ hours/week',
  '15+ TB',
  '99.9% data fidelity',
  '99.9% fidelity',
  '40+ legacy',
  '500+ Nintex',
  '27,000 police officers',
  '83.5%',
  'saving 25+ hours/week',
  '1.0 Context Precision score',
  'F1 score of 0.722',
  'accuracy of 83.0%'
];

export function isCanadianTargetLocation(locationOrText?: string): boolean {
  if (!locationOrText) return false;
  const lower = locationOrText.toLowerCase();
  return (
    lower.includes('canada') ||
    lower.includes('toronto') ||
    lower.includes('waterloo') ||
    lower.includes('ontario') ||
    lower.includes('oakville') ||
    lower.includes('markham') ||
    lower.includes('mississauga') ||
    lower.includes('vancouver') ||
    lower.includes('montreal') ||
    lower.includes('calgary') ||
    lower.includes('ottawa') ||
    lower.includes('british columbia') ||
    lower.includes('quebec')
  );
}

export function resolveCandidateContactForRegion(
  vault: PersonalVault,
  targetLocation?: string
): {
  region: 'CA' | 'IN';
  phone: string;
  location: string;
  workAuthBadge: string;
  expectedComp: string;
} {
  const isCanada = isCanadianTargetLocation(targetLocation);
  if (isCanada) {
    return {
      region: 'CA',
      phone: vault.phoneCanada || '+1 289-890-3999',
      location: vault.locationCanada || 'Waterloo / Toronto, ON, Canada',
      workAuthBadge: vault.workPermitCanada || 'Canadian Work Permit Holder (Authorized in Canada)',
      expectedComp: vault.expectedCompCad || 'CAD $115,000 - $135,000'
    };
  }
  return {
    region: 'IN',
    phone: vault.phone || '+91 7276085461',
    location: vault.location || 'Pune, Maharashtra, India',
    workAuthBadge: 'Indian Citizen (Authorized in India)',
    expectedComp: `INR ${vault.expectedCtcLakhs || 28} LPA`
  };
}

export function formatHtmlBulletWithBold(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let formatted = escaped;
  for (const phrase of VERIFIED_BOLD_PHRASES) {
    const safeRegex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    formatted = formatted.replace(safeRegex, `<strong>${phrase}</strong>`);
  }
  return formatted;
}

export function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

export function formatLatexBulletWithBold(text: string): string {
  let escaped = escapeLatex(text);
  for (const phrase of VERIFIED_BOLD_PHRASES) {
    const escapedPhrase = escapeLatex(phrase);
    const safeRegex = new RegExp(escapedPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    escaped = escaped.replace(safeRegex, `\\textbf{${escapedPhrase}}`);
  }
  return escaped;
}

export type AnyBulletOverride =
  | JakesResumeBulletMod
  | {
      section?: string;
      currentState?: string;
      proposedChange?: string;
    };

/**
 * Generates authentic Overleaf LaTeX (.tex) source code using Jake's Resume template
 * (https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs)
 * populated with Shubham Yadav's Master CV and interview-defensible tailored bullets.
 * Automatically switches between India (+91 7276085461) and Canada (+1 289-890-3999)
 * when a Canadian job location is passed.
 */
export function generateJakesResumeLatex(
  vault: PersonalVault,
  masterCv: MasterCV,
  bulletMods: AnyBulletOverride[] = [],
  targetRoleHeadline?: string | { company?: string; roleTitle?: string; location?: string }
): string {
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

  const targetLoc = typeof targetRoleHeadline === 'object' ? targetRoleHeadline?.location : undefined;
  const contact = resolveCandidateContactForRegion(vault, targetLoc);

  const fullName = escapeLatex(vault.fullName || 'Shubham Yadav');
  const headline = escapeLatex(resolvedHeadline);
  const phone = escapeLatex(contact.phone);
  const email = vault.email || 'shubhambhagwatyadav@gmail.com';
  const linkedinClean = (vault.linkedinUrl || 'linkedin.com/in/shubhambhagwatyadav')
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '');

  const eduLocations: Record<string, string> = {
    'Wilfrid Laurier University': 'Waterloo, Canada',
    'Pune University': 'Pune, India'
  };

  const eduBlocks = (masterCv.education || [])
    .map((edu) => {
      const loc = eduLocations[edu.institution] || edu.location || 'India';
      return `    \\resumeSubheading
      {${escapeLatex(edu.institution)}}{${escapeLatex(loc)}}
      {${escapeLatex(edu.degree)}}{${escapeLatex(edu.year)}}`;
    })
    .join('\n');

  const expBlocks = (masterCv.workExperience || [])
    .map((exp) => {
      const items = (exp.bullets || [])
        .map((b) => {
          const finalTxt = modMap.get(b.id) || textOverrideMap.get(b.text.trim()) || b.text;
          return `        \\resumeItem{${formatLatexBulletWithBold(finalTxt)}}`;
        })
        .join('\n');

      return `    \\resumeSubheading
      {${escapeLatex(exp.role)}}{${escapeLatex(exp.dates)}}
      {${escapeLatex(exp.company)}}{${escapeLatex(exp.location)}}
      \\resumeItemListStart
${items}
      \\resumeItemListEnd`;
    })
    .join('\n\n');

  const projectDates: Record<string, string> = {
    'Context-Aware Institutional RAG Chatbot': 'Feb 2026 -- Mar 2026',
    'CMS Consolidation and Migration': 'Apr 2023 -- Aug 2024',
    'Employee Churn Prediction': 'Sep 2024 -- Dec 2024'
  };

  const projBlocks = (masterCv.projects || [])
    .map((proj) => {
      const dateStr = projectDates[proj.name] || '2024 -- 2026';
      const techList = escapeLatex((proj.tech || []).join(', '));
      const allBullets = [proj.description, ...(proj.bullets || [])].filter(Boolean);
      const items = allBullets
        .map((bt) => `          \\resumeItem{${formatLatexBulletWithBold(bt)}}`)
        .join('\n');

      return `      \\resumeProjectHeading
          {\\textbf{${escapeLatex(proj.name)}} $|$ \\emph{${techList}}}{${dateStr}}
          \\resumeItemListStart
${items}
          \\resumeItemListEnd`;
    })
    .join('\n');

  const workPermitSuffix =
    contact.region === 'CA'
      ? ` $|$ ${escapeLatex('Waterloo / Toronto, ON (Canadian Work Permit)')}`
      : '';

  return `%-------------------------
% Resume in LaTeX (Jake's Resume Template — https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs)
% Author : ${fullName}
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins (Jake's Resume standard)
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

% Custom commands (Jake's Resume macros)
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${fullName}} \\\\ \\vspace{2pt}
    \\small ${headline} \\\\ \\vspace{2pt}
    \\small ${phone} $|$ \\href{mailto:${email}}{\\underline{${escapeLatex(email)}}} $|$
    \\href{https://${linkedinClean}}{\\underline{${escapeLatex(linkedinClean)}}}${workPermitSuffix}
\\end{center}

%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Power Platform \\& AI}{: Power Apps (Canvas, Model-Driven), Power Automate (Cloud, Desktop RPA), Power BI (DAX, Power Query), Dataverse, Power Fx, Power Pages, Copilot Studio, AI Builder, Custom Connectors} \\\\
     \\textbf{Cloud, Database \\& Data Engineering}{: Azure AI Foundry (Content Understanding, Document Intelligence), Azure Databricks (SQL), Azure Functions, Azure Logic Apps, Azure SQL, SSMS, Fabric Capacity (KQL), SharePoint Lists} \\\\
     \\textbf{SharePoint \\& Migration}{: SharePoint Online, SharePoint Server (2013/2016/2019), SPFx, PnP Framework, ShareGate, InfoPath, Nintex, PowerShell} \\\\
     \\textbf{Languages}{: C\\#, JavaScript, TypeScript (React, JSX), Python, SQL, HTML, CSS, XML, JSON} \\\\
     \\textbf{Tools \\& Version Control}{: Git, GitHub, Azure DevOps, JIRA, ServiceNow, Visual Studio, VS Code, Postman} \\\\
     \\textbf{Certifications}{: PL-600, PL-400, AZ-204, PL-900, MS-900, AZ-900, AI-900, SC-900}
    }}
 \\end{itemize}

%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
${eduBlocks}
  \\resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
${expBlocks}
  \\resumeSubHeadingListEnd

%-----------PROJECTS-----------
\\section{Technical Projects}
    \\resumeSubHeadingListStart
${projBlocks}
    \\resumeSubHeadingListEnd

%-----------PROFESSIONAL SKILLS-----------
\\section{Professional Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Analytical Skills}{: Strong ability to analyze complex business processes, translate requirements into scalable technical architectures, and optimize system performance.} \\\\
     \\textbf{Communication}{: Proven track record of collaborating with cross-functional teams, stakeholders, and executives to deliver user-centric solutions and conduct technical training.} \\\\
     \\textbf{Organizational Skills}{: Adept at managing multiple priorities in Agile/Scrum environments, ensuring timely delivery of enterprise-grade projects with high attention to detail.}
    }}
 \\end{itemize}

\\end{document}
`;
}
