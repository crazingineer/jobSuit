import { JobListing, ApplicationRun, NaukriBoosterLog } from '@/types/job';
import { PersonalVault, MasterCV } from '@/types/vault';
import { EvaluationReport } from '@/types/evaluation';

export const API_BASE = '/api';

export const clientApi = {
  // 1. Fetch system status & metrics
  async getStatus() {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (!res.ok) throw new Error('Status failed');
      return await res.json();
    } catch {
      return {
        success: true,
        stats: { totalJobs: 9, evaluated: 5, queued: 4, applied: 2, tailored: 11 },
        lastBooster: null
      };
    }
  },

  // 2. Fetch all jobs
  async getJobs(): Promise<JobListing[]> {
    try {
      const res = await fetch(`${API_BASE}/jobs`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      return data.jobs || [];
    } catch {
      return INITIAL_JOBS;
    }
  },

  // 3. Fetch single job with full A-H evaluation
  async getJobDetails(id: string): Promise<{ job: JobListing; evaluation: EvaluationReport | null; documents: any[] }> {
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}`);
      if (!res.ok) throw new Error('Failed to fetch job details');
      return await res.json();
    } catch {
      const job = INITIAL_JOBS.find(j => j.id === id) || INITIAL_JOBS[0];
      return { job, evaluation: SAMPLE_EVALUATION, documents: [] };
    }
  },

  // 4. Fetch Vault & Master CV
  async getVault(): Promise<{ vault: PersonalVault; masterCv: MasterCV }> {
    try {
      const res = await fetch(`${API_BASE}/vault`);
      if (!res.ok) throw new Error('Failed to fetch vault');
      const data = await res.json();
      return { vault: data.vault || INITIAL_VAULT, masterCv: data.masterCv || INITIAL_MASTER_CV };
    } catch {
      return { vault: INITIAL_VAULT, masterCv: INITIAL_MASTER_CV };
    }
  },

  // 5. Save Vault & Master CV
  async saveVault(vault: PersonalVault, masterCv: MasterCV) {
    try {
      const res = await fetch(`${API_BASE}/vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vault, masterCv })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 6. Trigger Discovery Scan
  async runDiscovery(keywords: string, location: string) {
    const res = await fetch(`${API_BASE}/discovery/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, location, evaluateImmediately: true })
    });
    return await res.json();
  },

  // 7. Trigger Naukri Daily Booster
  async runBooster(dryRun: boolean = true) {
    const res = await fetch(`${API_BASE}/booster/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun, headless: true })
    });
    return await res.json();
  },

  // 8. Evaluate Single Job (career-ops Blocks A-H)
  async evaluateJob(jobId: string) {
    const res = await fetch(`${API_BASE}/evaluator/evaluate/${jobId}`, {
      method: 'POST'
    });
    return await res.json();
  },

  // 9. Generate Tailored PDF
  async tailorJobPdf(jobId: string) {
    const res = await fetch(`${API_BASE}/compiler/tailor/${jobId}`, {
      method: 'POST'
    });
    return await res.json();
  },

  // 9b. Recompile Master CV to PDF
  async recompileMasterCv() {
    const res = await fetch(`${API_BASE}/compiler/recompile-master`, {
      method: 'POST'
    });
    return await res.json();
  },

  // 10. Launch Co-Pilot or Auto-Pilot Apply
  async applyToJob(jobId: string, forceMode: 'auto_pilot' | 'co_pilot' = 'co_pilot', dryRun: boolean = true) {
    const res = await fetch(`${API_BASE}/applier/apply/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceMode, dryRun })
    });
    return await res.json();
  },

  // 11. Launch Chrome with CDP
  async launchChromeCdp() {
    const res = await fetch(`${API_BASE}/system/launch-chrome-cdp`, {
      method: 'POST'
    });
    return await res.json();
  },

  // 12. Register Windows Task Scheduler Hook
  async scheduleWindowsTask() {
    const res = await fetch(`${API_BASE}/system/schedule-task`, {
      method: 'POST'
    });
    return await res.json();
  },

  // 13. Test Browser Status
  async testBrowser() {
    try {
      const res = await fetch(`${API_BASE}/system/browser-status`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 14. Automation Rules
  async getRules() {
    try {
      const res = await fetch(`${API_BASE}/rules`);
      return await res.json();
    } catch {
      return { success: false, rules: null };
    }
  },

  async saveRules(rules: any) {
    try {
      const res = await fetch(`${API_BASE}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 15. System Settings
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      return await res.json();
    } catch {
      return { success: false, settings: null };
    }
  },

  async saveSettings(settings: any) {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
};

// Initial state data
export const INITIAL_VAULT: PersonalVault = {
  id: 1,
  fullName: 'Arjun Sharma',
  email: 'arjun.sharma@example.com',
  phone: '+91 98765 43210',
  location: 'Bengaluru, Karnataka, India',
  linkedinUrl: 'https://linkedin.com/in/arjun-sharma-builder',
  githubUrl: 'https://github.com/arjunsharma',
  portfolioUrl: 'https://arjunsharma.dev',
  currentCtcLakhs: 26.0,
  expectedCtcLakhs: 38.0,
  ctcNegotiable: true,
  noticePeriodDays: 60,
  lastWorkingDay: '',
  buyoutAvailable: true,
  preferredLocations: ['Bengaluru', 'Hyderabad', 'Remote (India/US)'],
  relocationWilling: true,
  authorizedCountries: ['IN', 'US'],
  needsSponsorship: false,
  visaStatus: 'Indian Citizen (No visa sponsorship required for IN)',
  gender: 'Decline to self-identify',
  disabilityStatus: 'No',
  veteranStatus: 'No',
  eeoEthnicity: 'Asian',
  qaSnippets: {
    why_change: 'Seeking high-ownership AI systems & agentic workflow engineering roles in hyper-growth teams.',
    leadership_style: 'Hands-on technical leadership, metrics-driven architecture, iterative high-velocity shipping.',
    remote_philosophy: 'Deep async documentation, proactive Slack communication, and robust CI/CD metrics.',
    notice_period_handling: 'Serving standard 60 days; immediate buyout option negotiable upon offer confirmation.'
  },
  updatedAt: new Date().toISOString()
};

export const INITIAL_MASTER_CV: MasterCV = {
  id: 'cv-master-v1',
  version: 1,
  title: 'Master AI & Distributed Systems Engineer CV',
  isActive: true,
  summaryVariants: {
    aiEngineer: 'Senior AI Systems & Full-Stack Engineer with 6+ years designing scalable agentic workflows, LLMOps pipelines, and low-latency microservices. Spearheaded production systems processing 10M+ daily events with 99.99% uptime.',
    lead: 'Lead AI Architect with proven track record in end-to-end ML platform delivery, technical product discovery, and cross-functional engineering leadership.',
    fullstack: 'Staff Full-Stack & Systems Engineer proficient in React 19, TypeScript, Python, Go, and high-throughput streaming architectures.'
  },
  skillsTaxonomy: {
    languages: ['TypeScript', 'Python', 'Rust', 'Go', 'SQL'],
    frameworks: ['React 19', 'Next.js', 'FastAPI', 'Node.js', 'Tailwind CSS'],
    aiLlm: ['Playwright CDP', 'LangChain', 'LlamaIndex', 'Gemini API', 'Claude SDK', 'OpenAI APIs', 'vLLM', 'Ollama'],
    cloudDevops: ['AWS (ECS, Lambda, S3)', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis', 'Kafka']
  },
  workExperience: [
    {
      company: 'HyperFlow Tech',
      role: 'Senior AI & Platform Engineer',
      location: 'Bengaluru (Hybrid)',
      dates: '2023 - Present',
      bullets: [
        {
          id: 'b1',
          text: 'Architected multi-agent customer support automation platform using Playwright CDP and Gemini 1.5, deflecting 42% of manual tier-1 tickets and saving $180k/year in operational overhead.',
          metrics: '42% ticket deflection, $180k savings',
          tags: ['AI', 'Playwright', 'LLMOps']
        },
        {
          id: 'b2',
          text: 'Engineered real-time document extraction and RAG pipeline indexing 2.5M enterprise contracts with sub-120ms vector retrieval latency.',
          metrics: '2.5M docs, 120ms retrieval',
          tags: ['RAG', 'VectorDB', 'FastAPI']
        }
      ]
    },
    {
      company: 'CloudMatrix Systems',
      role: 'Full-Stack Software Engineer',
      location: 'Bengaluru',
      dates: '2020 - 2023',
      bullets: [
        {
          id: 'b3',
          text: 'Built mission-critical event streaming gateway in Go and Kafka handling peak loads of 45,000 req/sec with P99 latency under 18ms.',
          metrics: '45k req/sec, <18ms P99',
          tags: ['Go', 'Kafka', 'High-Throughput']
        },
        {
          id: 'b4',
          text: 'Mentored 5 junior engineers and established zero-downtime deployment pipelines with Docker and GitHub Actions.',
          metrics: '5 engineers mentored',
          tags: ['Mentorship', 'CI/CD']
        }
      ]
    }
  ],
  education: [
    {
      degree: 'Bachelor of Technology in Computer Science & Engineering',
      institution: 'National Institute of Technology (NIT)',
      location: 'India',
      year: '2020',
      description: 'First Class with Distinction. Specialization in Distributed Algorithms & Applied Machine Learning.'
    }
  ],
  certifications: [
    {
      title: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      year: '2023',
      url: 'https://aws.amazon.com/verification'
    }
  ],
  projects: [
    {
      name: 'jobSuite Desktop',
      description: 'Ultra-efficient Windows native AI Career-Ops desktop app with Tauri v2, React 19, and Playwright CDP stealth automation.',
      tech: ['Tauri v2', 'React 19', 'Playwright', 'SQLite'],
      bullets: ['Sub-50ms native UI response', 'Automated persistent CDP session injection'],
      url: 'https://github.com/example/jobsuite'
    }
  ],
  awards: [
    {
      title: 'Winner, National GenAI Hackathon',
      org: 'TechSparks',
      year: '2024'
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const INITIAL_JOBS: JobListing[] = [
  {
    id: 'job-101',
    portal: 'linkedin',
    portalJobId: '401928312',
    url: 'https://www.linkedin.com/jobs/view/401928312',
    title: 'Lead AI Platform / Agentic Workflows Engineer',
    company: 'Anthropic Labs Partner',
    companySlug: 'anthropic-labs-partner',
    location: 'Bengaluru / Remote',
    remoteType: 'Remote',
    postedDate: '2026-11-08',
    capturedAt: '2026-11-09T08:30:00Z',
    rawJdText: 'We are seeking a Lead AI Engineer to architect autonomous agentic workflows and LLMOps evaluation pipelines...',
    companyType: 'Growth-stage startup / VC-backed',
    reportsTo: 'VP of Engineering',
    advertisedComp: 'INR 45L - 60L + ESOPs',
    status: 'queued',
    easyApply: true,
    score: 4.7,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Arjun_Sharma_AnthropicPartner_LeadAI.pdf'
  },
  {
    id: 'job-102',
    portal: 'naukri',
    portalJobId: 'nk-998811',
    url: 'https://www.naukri.com/job-listings-998811',
    title: 'Staff Full-Stack & GenAI Engineer',
    company: 'Zepto Tech',
    companySlug: 'zepto-tech',
    location: 'Bengaluru',
    remoteType: 'Hybrid',
    postedDate: '2026-11-09',
    capturedAt: '2026-11-09T09:15:00Z',
    rawJdText: 'Looking for Staff Engineers with expertise in React, Node/Go, and LLM integrations. Must have 5+ years experience...',
    companyType: 'Mature Tech / Unicorn',
    reportsTo: 'Director of Platform Engineering',
    advertisedComp: 'INR 50L - 70L',
    status: 'tailored',
    easyApply: false,
    score: 4.5,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply'
  },
  {
    id: 'job-103',
    portal: 'greenhouse',
    portalJobId: 'gh-ashby-334',
    url: 'https://boards.greenhouse.io/vanna/jobs/334',
    title: 'AI Forward Deployed Engineer (FDE)',
    company: 'Vanna AI',
    companySlug: 'vanna-ai',
    location: 'Remote (Worldwide)',
    remoteType: 'Remote',
    postedDate: '2026-11-07',
    capturedAt: '2026-11-08T14:20:00Z',
    rawJdText: 'Join as an FDE to build customer-specific agents, enterprise RAG connections, and reliable tool calling...',
    companyType: 'Growth-stage startup / VC-backed',
    reportsTo: 'Head of Solutions',
    advertisedComp: '$130,000 - $160,000 USD',
    status: 'applied',
    easyApply: false,
    score: 4.8,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply'
  },
  {
    id: 'job-104',
    portal: 'linkedin',
    portalJobId: '401928999',
    url: 'https://www.linkedin.com/jobs/view/401928999',
    title: 'Senior Python & LLM Systems Engineer',
    company: 'Razorpay',
    companySlug: 'razorpay',
    location: 'Bengaluru',
    remoteType: 'Hybrid',
    postedDate: '2026-11-09',
    capturedAt: '2026-11-09T10:00:00Z',
    rawJdText: 'Build AI-native fraud detection systems and merchant intelligence copilots...',
    companyType: 'Enterprise / Mature Tech',
    reportsTo: 'Engineering Manager',
    advertisedComp: 'INR 38L - 48L',
    status: 'evaluated',
    easyApply: true,
    score: 4.2,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply'
  },
  {
    id: 'job-105',
    portal: 'naukri',
    portalJobId: 'nk-441100',
    url: 'https://www.naukri.com/job-listings-441100',
    title: 'Lead Software Architect - AI Solutions',
    company: 'Cognizant Digital',
    companySlug: 'cognizant-digital',
    location: 'Hyderabad',
    remoteType: 'Onsite',
    postedDate: '2026-11-01',
    capturedAt: '2026-11-09T06:00:00Z',
    rawJdText: 'Generic consulting role for banking client with vague responsibilities...',
    companyType: 'Agency / Outsourcing Vendor',
    reportsTo: 'Program Director',
    advertisedComp: 'INR 28L - 32L',
    status: 'discovered',
    easyApply: false,
    score: 2.8,
    legitimacyTier: 'Proceed with Caution',
    finalDecision: 'Skip'
  }
];

export const SAMPLE_EVALUATION: EvaluationReport = {
  id: 'eval-101',
  jobId: 'job-101',
  score: 4.7,
  finalDecision: 'Apply',
  archetype: 'Agentic Workflows / Automation',
  legitimacyTier: 'High Confidence',
  workAuthTier: 'Not needed',
  cvMatchScore: 4.8,
  northStarScore: 4.9,
  compScore: 4.6,
  cultureScore: 4.7,
  redFlagsDeduction: 0.0,
  evidenceConfidence: 'High',
  confidenceGaps: [],
  hardStops: [],
  softGaps: ['Experience scaling bare-metal Kubernetes GPU clusters (AWS ECS/EKS available)'],
  topStrengths: [
    'High-scale Playwright CDP multi-agent automation',
    'Production RAG with sub-120ms vector retrieval',
    'Proven 42% autonomous support deflection ($180k/yr saved)'
  ],
  blockASummary: {
    archetype: 'Agentic Workflows / Automation',
    domain: 'Enterprise AI Orchestration & Tool Use',
    seniority: 'Lead / Staff',
    workMode: 'Remote (India/Worldwide)',
    teamSize: '8 - 12 engineers',
    workAuth: 'Not needed (Authorized in India)',
    tldr: 'Direct ownership of agent runtime, Playwright execution, and tool-calling reliability.'
  },
  blockBRequirements: [
    {
      requirement: 'Multi-agent orchestration with tool calling & human-in-the-loop checkpoints',
      importance: 'critical',
      evidence: 'stated',
      match: 'strong',
      jdSignal: 'Must have hands-on experience designing multi-agent workflows with tool-calling and human intervention checkpoints.',
      gap: null,
      mitigation: null
    },
    {
      requirement: 'Playwright / Headless Chromium automation via CDP at scale',
      importance: 'high',
      evidence: 'stated',
      match: 'strong',
      jdSignal: 'Demonstrated expertise controlling web environments via Playwright/Puppeteer with stealth evasion.',
      gap: null,
      mitigation: null
    },
    {
      requirement: 'Sub-second vector retrieval & evaluation pipelines',
      importance: 'high',
      evidence: 'structural',
      match: 'strong',
      jdSignal: 'Production RAG and prompt evaluation benchmarks.',
      gap: null,
      mitigation: null
    },
    {
      requirement: 'Bare-metal Kubernetes GPU cluster management',
      importance: 'meaningful',
      evidence: 'structural',
      match: 'partial',
      jdSignal: 'Bonus: Experience with on-prem GPU orchestrations.',
      gap: 'Candidate experience is in AWS ECS/EKS Fargate rather than bare-metal k8s',
      mitigation: 'Emphasize containerized worker lifecycle management and cloud cost optimization.'
    }
  ],
  blockCStrategy: {
    levelFit: 'Peer / Natural Lead',
    positioning: 'Lead Automation Architect who bridges customer discovery, agentic design, and fault-tolerant production infrastructure.',
    downlevelDefense: 'Highlight 10M+ daily events throughput and verified $180k annual cost savings at HyperFlow.'
  },
  blockDComp: {
    companyType: 'Growth-stage startup / VC-backed',
    compReliability: 'High',
    advertisedComp: 'INR 45L - 60L + ESOPs',
    guaranteedBase: 'INR 45L',
    variable: 'INR 10L - 15L performance bonus',
    marketPercentile: 'Top 8% in Indian AI hiring market'
  },
  blockEPersonalization: [
    {
      id: 'e1',
      section: 'Resume Headline / Title',
      currentState: 'Senior AI Systems & Full-Stack Engineer',
      proposedChange: 'Lead AI Platform & Agentic Workflows Architect',
      why: 'Directly mirrors the JD role title and positions as end-to-end agentic automation specialist.'
    },
    {
      id: 'e2',
      section: 'HyperFlow Tech (Bullet 1)',
      currentState: 'Architected multi-agent customer support automation platform...',
      proposedChange: 'Promoted Playwright CDP tool calling and 42% deflection metric to bullet #1',
      why: 'Directly aligns with the critical requirement #1 in the JD.'
    }
  ],
  blockFInterview: {
    starStories: [
      {
        id: 1,
        requirement: 'Multi-agent orchestration & tool calling',
        story: 'Playwright Customer Support Deflection Engine',
        s: 'HyperFlow spent $15,000/month on repetitive L1 support tickets.',
        t: 'Design an autonomous agent with human escalation checkpoints.',
        a: 'Engineered Playwright CDP workers driven by Gemini 1.5 JSON function calling with strict schema validation.',
        r: 'Achieved 42% autonomous resolution rate with zero data leaks, saving $180k/yr.',
        reflection: 'Deterministic schema validation on tool parameters eliminated 98% of hallucinations.'
      }
    ],
    caseStudy: 'Designing a self-healing browser worker that recovers gracefully from DOM mutations and rate limits.',
    redFlagQa: [
      {
        q: 'Why specialize in agentic workflows over traditional full-stack software?',
        a: 'Deterministic code and probabilistic LLMs are complimentary; building resilient systems at that boundary is where the highest operational leverage lives.'
      }
    ]
  },
  blockGLegitimacy: {
    postingFreshness: 'Active (Posted 24 hours ago)',
    descriptionQuality: 'High specificity, explicit architectural requirements, no marketing fluff',
    repostSignals: 'First seen requisition',
    aiBuzzwordMismatch: 'Consistent (Deep technical stack specified)',
    payTransparency: 'Compliant (Narrow transparent range 45L - 60L)',
    recruiterVerification: 'Hiring Manager verified on LinkedIn via official company domain'
  },
  blockHAnswers: {
    why_apply: 'I have dedicated the last 3 years to building resilient multi-agent systems and Playwright automation. Having achieved 42% autonomous deflection in production at HyperFlow, this role directly matches my focus on production-grade agentic architectures.',
    expected_ctc: 'INR 50L - 55L negotiable based on equity component',
    notice_period: '60 days (buyout negotiable for immediate joining)'
  },
  riskSummary: {
    legitimacy: 'High Confidence',
    classification: 'Clear (Full-time W2/Permanent employee)',
    culture: 'Pass',
    interview_redflags: 'None',
    ai_infra: 'Consistent',
    fixed_term: 'Not detected'
  },
  scoreEvidence: {
    cv_match: 'supported',
    north_star: 'supported',
    compensation: 'supported',
    culture: 'supported',
    red_flags: 'supported'
  },
  machineSummaryYaml: `company: "Anthropic Labs Partner"
role: "Lead AI Platform / Agentic Workflows Engineer"
score: 4.7
legitimacy_tier: "High Confidence"
archetype: "Agentic Workflows / Automation"
final_decision: "Apply"
hard_stops: []
soft_gaps:
  - "Kubernetes bare-metal cluster management"
top_strengths:
  - "High-scale Playwright multi-agent experience"
  - "Production RAG with sub-120ms latency"
work_auth: "not_needed"
advertised_comp: "INR 45L - 60L + ESOPs"`,
  fullMarkdownReport: `# Evaluation: Anthropic Labs Partner — Lead AI Platform Engineer

**Date:** 2026-11-09
**Archetype:** Agentic Workflows / Automation
**Score:** 4.7/5
**Decision:** Apply
**Legitimacy:** High Confidence
**Work Auth:** ➖ Not needed

**Apply.** Outstanding alignment with candidate primary strengths in Playwright automation and LLMOps.`,
  evaluatedAt: '2026-11-09T08:35:00Z'
};
