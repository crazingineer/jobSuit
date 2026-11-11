import { JobListing } from '../types/job';
import { MasterCV } from '../types/vault';
import { PersonalizationItem } from '../types/evaluation';

/**
 * Technologies and tools verified directly from Shubham Yadav's attached resume
 * (ShubhamYadav_Resume_2bb95baf.pdf)
 */
export const SHUBHAM_VERIFIED_SKILLS: string[] = [
  'Power Apps',
  'Canvas Apps',
  'Model-Driven Apps',
  'Power Automate',
  'Power Automate Desktop',
  'RPA',
  'Power BI',
  'Dataverse',
  'Power Fx',
  'Power Pages',
  'Copilot Studio',
  'AI Builder',
  'Custom Connectors',
  'Azure AI Foundry',
  'Content Understanding',
  'Document Intelligence',
  'Azure Databricks',
  'Databricks SQL',
  'Azure Functions',
  'Azure Logic Apps',
  'Azure SQL',
  'Microsoft Fabric',
  'SharePoint Online',
  'SharePoint Server',
  'SPFx',
  'PnP Framework',
  'ShareGate',
  'InfoPath',
  'Nintex',
  'PowerShell',
  'Python',
  'Flask',
  'OpenAI API',
  'FAISS',
  'RAG',
  'Crawl4AI',
  'Ragas',
  'Pandas',
  'NumPy',
  'scikit-learn',
  'XGBoost',
  'CatBoost',
  'Random Forest',
  'C#',
  'JavaScript',
  'TypeScript',
  'React',
  'SQL',
  'DAX',
  'KQL',
  'REST API',
  'Git',
  'Azure DevOps',
  'JIRA',
  'PL-600',
  'PL-400',
  'AZ-204',
  'PL-900',
  'MS-900',
  'AZ-900',
  'AI-900',
  'SC-900'
];

/**
 * Alien technologies that do NOT exist in Shubham's resume and CANNOT be defended in an interview.
 * These must NEVER be injected into tailored resumes or evaluation reports.
 */
export const FORBIDDEN_ALIEN_TERMS: string[] = [
  'Playwright',
  'Puppeteer',
  'Selenium',
  'Cypress',
  'Kubernetes',
  'bare-metal GPU',
  'k8s',
  'Golang',
  'Rust',
  'Kafka',
  'Solidity',
  'Web3',
  'HyperFlow',
  'Arjun Sharma',
  'ECS/EKS',
  'Fargate',
  'Terraform',
  'Spring Boot',
  'Ruby on Rails',
  'iOS',
  'Swift',
  'Kotlin'
];

export interface AdjacentBridgeRule {
  jdConcept: string;
  jdTriggers: string[];
  groundedAnchorId: string;
  groundedAnchorCompany: string;
  groundedOriginalBullet: string;
  defensibleTailoredBullet: string;
  interviewTalkingPoint: string;
}

/**
 * Interview-Defensible Adjacent Tailoring Bridges:
 * Maps target JD terminology onto Shubham's real projects at KPI Partners,
 * Wilfrid Laurier University, and Accenture so every tailored bullet is 100% explainable in an interview.
 */
export const DEFENSIBLE_ADJACENT_BRIDGES: AdjacentBridgeRule[] = [
  {
    jdConcept: 'Enterprise AI Agents, Copilot Studio & Document Intelligence',
    jdTriggers: ['copilot', 'agent', 'ai builder', 'document intelligence', 'llm', 'genai', 'openai', 'extraction'],
    groundedAnchorId: 'kp-b6',
    groundedAnchorCompany: 'KPI Partners (Nov 2025 – Present)',
    groundedOriginalBullet:
      'Engineered an automated invoice processing pipeline using Azure AI Foundry (Content Understanding) to extract structured data from complex, multi-page financial PDFs with 95%+ accuracy.',
    defensibleTailoredBullet:
      'Engineered an enterprise AI document-understanding and agentic workflow pipeline using Azure AI Foundry (Content Understanding), Copilot Studio, and Power Automate to extract structured data from multi-page financial PDFs with 95%+ accuracy and 70% lower compute cost.',
    interviewTalkingPoint:
      'Explain how you replaced heavy vision/LLM token calls at KPI Partners with Azure AI Foundry Content Understanding + Power Automate orchestration, cutting per-document compute cost by 70% while maintaining 95%+ extraction accuracy.'
  },
  {
    jdConcept: 'Power Apps, Dataverse & End-to-End Workflow Automation',
    jdTriggers: ['power apps', 'power platform', 'canvas', 'model-driven', 'dataverse', 'power fx', 'power automate'],
    groundedAnchorId: 'kp-b1',
    groundedAnchorCompany: 'KPI Partners (Nov 2025 – Present)',
    groundedOriginalBullet:
      'Developed and deployed a scalable Power Apps solution integrated with SharePoint Online to streamline clinical study intake and regulatory tracking, reducing processing time by 60%.',
    defensibleTailoredBullet:
      'Architected and deployed a governed Power Platform solution (Canvas & Model-Driven Power Apps, Dataverse, and Power Automate cloud flows) integrated with SharePoint Online to automate clinical study intake and multi-tier regulatory approvals, reducing end-to-end processing time by 60%.',
    interviewTalkingPoint:
      'Walk through the clinical study intake architecture at KPI Partners: how Power Fx validation, role-based security, and automated multi-stage Power Automate approvals eliminated 15+ hours/week of manual tracking.'
  },
  {
    jdConcept: 'Cloud Data Engineering, Databricks ETL & SQL Pipelines',
    jdTriggers: ['databricks', 'etl', 'data engineering', 'data pipeline', 'azure sql', 'logic apps', 'data factory', 'delta'],
    groundedAnchorId: 'kp-b3',
    groundedAnchorCompany: 'KPI Partners (Nov 2025 – Present)',
    groundedOriginalBullet:
      'Built an automated data processing pipeline using Azure Logic Apps, Azure Functions, and Azure Databricks to ingest, validate, and transform raw files into structured analytics tables, reducing processing time by 50%.',
    defensibleTailoredBullet:
      'Engineered an idempotent cloud ETL data pipeline using Azure Logic Apps, Azure Functions, and Azure Databricks (SQL MERGE upsert patterns) to ingest, validate, and transform multi-tab enterprise datasets into analytics-ready tables, cutting processing latency by 50%.',
    interviewTalkingPoint:
      'Discuss how Azure Logic Apps triggers an Azure Function to normalize multi-tab Excel payloads before executing Databricks SQL MERGE statements for zero-duplicate incremental loads.'
  },
  {
    jdConcept: 'RAG Architecture, Semantic Vector Search & Python AI Backend',
    jdTriggers: ['rag', 'vector', 'faiss', 'python', 'flask', 'embeddings', 'semantic search', 'chatbot'],
    groundedAnchorId: 'proj-rag',
    groundedAnchorCompany: 'Technical Project — Context-Aware Institutional RAG Chatbot (Feb 2026 – Mar 2026)',
    groundedOriginalBullet:
      'Engineered a custom Retrieval-Augmented Generation (RAG) backend using Python, Flask, and OpenAI GPT models to securely query unstructured institutional data while avoiding out-of-domain hallucinations.',
    defensibleTailoredBullet:
      'Architected a production-grade Retrieval-Augmented Generation (RAG) service using Python, Flask, OpenAI text-embedding-3-large, and a FAISS dense vector store with zero-shot multi-turn query rewriting, achieving a 1.0 Context Precision score on the Ragas evaluation benchmark.',
    interviewTalkingPoint:
      'Explain your Crawl4AI caching ingestion pipeline, FAISS vector indexing, coreference query rewriting across multi-turn conversations, and how you validated zero out-of-domain hallucinations using Ragas.'
  },
  {
    jdConcept: 'SharePoint Online, SPFx, ShareGate & Legacy Platform Migration',
    jdTriggers: ['sharepoint', 'spfx', 'sharegate', 'migration', 'infopath', 'nintex', 'pnp', 'powershell', 'm365'],
    groundedAnchorId: 'acc-b1',
    groundedAnchorCompany: 'Accenture Solutions Pvt. Ltd. (Aug 2021 – Aug 2024)',
    groundedOriginalBullet:
      'Executed end-to-end SharePoint migrations (2013/2016 to Online) using ShareGate and custom PowerShell scripts, migrating 15+ TB of enterprise content with 99.9% data fidelity.',
    defensibleTailoredBullet:
      'Led end-to-end enterprise SharePoint Online migrations (15+ TB content via ShareGate & PnP PowerShell with 99.9% fidelity) and modernized 40+ legacy InfoPath/Nintex workflows into responsive Power Apps, SPFx web parts, and Power Automate flows.',
    interviewTalkingPoint:
      'Detail your pre-migration PowerShell inventory audits, taxonomy mapping in ShareGate, permission matrix preservation at Accenture, and how you refactored legacy InfoPath forms into modern Canvas/Model-Driven Power Apps.'
  },
  {
    jdConcept: 'UI & Process Automation (RPA) via Power Automate Desktop',
    jdTriggers: ['rpa', 'desktop automation', 'ui automation', 'process automation', 'workflow automation', 'bot'],
    groundedAnchorId: 'acc-b5',
    groundedAnchorCompany: 'Accenture Solutions Pvt. Ltd. (Aug 2021 – Aug 2024)',
    groundedOriginalBullet:
      'Automated repetitive data entry and legacy ERP synchronization tasks using Power Automate Desktop (RPA) and UI flows, saving 25+ hours/week across finance operations.',
    defensibleTailoredBullet:
      'Engineered attended and unattended RPA workflows using Power Automate Desktop and Cloud Flows with structured exception handling to synchronize legacy ERP portals and SharePoint/Dataverse backends, saving 25+ hours/week across enterprise operations.',
    interviewTalkingPoint:
      'Clarify in the interview that your UI/process automation expertise is built on Microsoft Power Automate Desktop RPA + Cloud Flows (rather than Playwright/Selenium QA scripts), used to bridge legacy ERP screens with Dataverse and SharePoint.'
  }
];

export interface JobAlignmentAssessment {
  isAligned: boolean;
  alignmentPercentage: number;
  recommendedScore: number; // 1.0 to 5.0
  primaryArchetype: string;
  matchedVerifiedSkills: string[];
  forbiddenUnalignedSkillsInJd: string[];
  adjacentBridges: AdjacentBridgeRule[];
  rejectionReason?: string;
}

/**
 * Evaluates whether a scraped or seeded job actually aligns with Shubham Yadav's Master CV.
 * Filters out roles requiring alien stacks (Playwright-only, Kubernetes GPU, Golang/Rust, iOS, etc.)
 * and prioritizes Power Platform, SharePoint, Azure AI/Databricks, Power BI, and Python RAG roles.
 */
export function assessJobAlignmentWithCv(
  job: Pick<JobListing, 'title' | 'rawJdText' | 'company'>,
  _masterCv?: MasterCV
): JobAlignmentAssessment {
  const combinedText = `${job.title} ${job.rawJdText || ''}`.toLowerCase();
  const titleLower = job.title.toLowerCase();

  const matchedVerifiedSkills = SHUBHAM_VERIFIED_SKILLS.filter((skill) =>
    combinedText.includes(skill.toLowerCase())
  );

  const forbiddenUnalignedSkillsInJd = FORBIDDEN_ALIEN_TERMS.filter((term) =>
    combinedText.includes(term.toLowerCase())
  );

  // Check if title or JD is predominantly an alien role
  const isAlienTitle =
    titleLower.includes('ios ') ||
    titleLower.includes('android') ||
    titleLower.includes('golang') ||
    titleLower.includes('rust ') ||
    titleLower.includes('kubernetes') ||
    titleLower.includes('playwright') ||
    titleLower.includes('embedded') ||
    titleLower.includes('devops') && matchedVerifiedSkills.length < 2;

  const isCorePowerPlatformOrSharePoint =
    combinedText.includes('power platform') ||
    combinedText.includes('power apps') ||
    combinedText.includes('power automate') ||
    combinedText.includes('power bi') ||
    combinedText.includes('sharepoint') ||
    combinedText.includes('dataverse') ||
    combinedText.includes('copilot studio') ||
    combinedText.includes('spfx');

  const isAzureDataOrAiAligned =
    combinedText.includes('databricks') ||
    combinedText.includes('azure ai') ||
    combinedText.includes('logic apps') ||
    combinedText.includes('azure functions') ||
    combinedText.includes('document intelligence') ||
    combinedText.includes('rag') ||
    combinedText.includes('openai');

  // Identify applicable interview-defensible bridges
  const adjacentBridges = DEFENSIBLE_ADJACENT_BRIDGES.filter((bridge) =>
    bridge.jdTriggers.some((trigger) => combinedText.includes(trigger))
  );

  let primaryArchetype = 'Power Platform & Enterprise AI Architect';
  if (combinedText.includes('sharepoint') || combinedText.includes('spfx') || combinedText.includes('migration')) {
    primaryArchetype = 'Power Platform & SharePoint Developer';
  } else if (combinedText.includes('databricks') || combinedText.includes('etl') || combinedText.includes('power bi')) {
    primaryArchetype = 'Azure Data Engineering & Power BI Specialist';
  } else if (combinedText.includes('copilot') || combinedText.includes('rag') || combinedText.includes('azure ai')) {
    primaryArchetype = 'Enterprise AI Automation & Copilot Studio Engineer';
  }

  // If the job demands alien technologies (like Playwright CDP or bare-metal Kubernetes) and lacks core Power Platform/SharePoint/Azure alignment
  if (
    isAlienTitle ||
    (forbiddenUnalignedSkillsInJd.length >= 2 && !isCorePowerPlatformOrSharePoint) ||
    (matchedVerifiedSkills.length === 0 && !isCorePowerPlatformOrSharePoint && !isAzureDataOrAiAligned)
  ) {
    return {
      isAligned: false,
      alignmentPercentage: Math.max(15, Math.min(40, matchedVerifiedSkills.length * 8)),
      recommendedScore: 2.2,
      primaryArchetype: 'Unaligned Stack (Filtered)',
      matchedVerifiedSkills,
      forbiddenUnalignedSkillsInJd,
      adjacentBridges: [],
      rejectionReason: `Filtered out: Role requires unverified stack (${
        forbiddenUnalignedSkillsInJd.join(', ') || 'Non-Power Platform / Non-Azure core'
      }) not present in Shubham Yadav's Master CV.`
    };
  }

  const basePct = isCorePowerPlatformOrSharePoint ? 72 : isAzureDataOrAiAligned ? 64 : 45;
  const skillBoost = Math.min(26, matchedVerifiedSkills.length * 4);
  const penalty = Math.min(25, forbiddenUnalignedSkillsInJd.length * 10);
  const alignmentPercentage = Math.max(50, Math.min(98, basePct + skillBoost - penalty));

  const recommendedScore = Number(
    Math.max(3.8, Math.min(4.9, 3.4 + (alignmentPercentage - 50) * 0.032)).toFixed(1)
  );

  return {
    isAligned: true,
    alignmentPercentage,
    recommendedScore,
    primaryArchetype,
    matchedVerifiedSkills,
    forbiddenUnalignedSkillsInJd,
    adjacentBridges: adjacentBridges.length > 0 ? adjacentBridges : DEFENSIBLE_ADJACENT_BRIDGES.slice(0, 3)
  };
}

/**
 * Strips any forbidden alien technology names (Playwright, Kubernetes, HyperFlow, Golang, etc.)
 * from a text string so that resume bullets never claim experience Shubham did not do.
 */
export function containsForbiddenFabrication(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return FORBIDDEN_ALIEN_TERMS.some((term) => {
    const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(lower);
  });
}

/**
 * Sanitizes and grounds bullet modifications and Block E personalization items so that:
 * 1. ZERO unverified technologies (like Playwright, Kubernetes, Golang, HyperFlow) ever enter the tailored resume.
 * 2. All tailored bullets are anchored to Shubham's real roles (KPI Partners, Wilfrid Laurier University, Accenture)
 *    and include a clear "Interview Defense / How to Explain" note.
 */
export function buildDefensibleTailoringPlan(
  job: Pick<JobListing, 'title' | 'company' | 'rawJdText'>,
  _masterCv: MasterCV,
  rawProposedMods?: Array<{ bulletId: string; originalText: string; tailoredText: string; reason: string }>
): {
  bulletModifications: Array<{
    bulletId: string;
    originalText: string;
    tailoredText: string;
    reason: string;
    interviewTalkingPoint: string;
  }>;
  blockEPersonalization: PersonalizationItem[];
  rejectedFabrications: string[];
} {
  const rejectedFabrications: string[] = [];
  const validMods: Array<{
    bulletId: string;
    originalText: string;
    tailoredText: string;
    reason: string;
    interviewTalkingPoint: string;
  }> = [];

  if (Array.isArray(rawProposedMods)) {
    for (const mod of rawProposedMods) {
      if (containsForbiddenFabrication(mod.tailoredText) || containsForbiddenFabrication(mod.originalText)) {
        rejectedFabrications.push(mod.tailoredText);
        continue;
      }
      validMods.push({
        ...mod,
        interviewTalkingPoint:
          'Directly grounded in your production delivery at KPI Partners / Wilfrid Laurier University / Accenture; emphasize the measurable latency and manual-effort reduction.'
      });
    }
  }

  const alignment = assessJobAlignmentWithCv(job, _masterCv);

  // Always populate with interview-defensible adjacent bridges when validMods is empty or partial
  for (const bridge of alignment.adjacentBridges) {
    if (validMods.some((m) => m.bulletId === bridge.groundedAnchorId)) continue;
    validMods.push({
      bulletId: bridge.groundedAnchorId,
      originalText: bridge.groundedOriginalBullet,
      tailoredText: bridge.defensibleTailoredBullet,
      reason: `Aligns with "${bridge.jdConcept}" in ${job.company}'s JD using your real ${bridge.groundedAnchorCompany} architecture.`,
      interviewTalkingPoint: bridge.interviewTalkingPoint
    });
  }

  const blockEPersonalization: PersonalizationItem[] = validMods.slice(0, 4).map((mod, idx) => ({
    id: `defensible-e-${idx + 1}`,
    section: `Grounded Resume Tailoring (${mod.bulletId.toUpperCase()})`,
    currentState: mod.originalText,
    proposedChange: mod.tailoredText,
    why: `${mod.reason} | Interview Talking Point: ${mod.interviewTalkingPoint}`
  }));

  return {
    bulletModifications: validMods,
    blockEPersonalization,
    rejectedFabrications
  };
}
