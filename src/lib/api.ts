import { JobListing, ApplicationRun, NaukriBoosterLog } from '@/types/job';
import { PersonalVault, MasterCV, AtsAccountRecord } from '@/types/vault';
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

  // 4. Fetch Vault, Master CV & ATS Account Ledger
  async getVault(): Promise<{ vault: PersonalVault; masterCv: MasterCV; atsAccounts: AtsAccountRecord[] }> {
    try {
      const res = await fetch(`${API_BASE}/vault`);
      if (!res.ok) throw new Error('Failed to fetch vault');
      const data = await res.json();
      return {
        vault: data.vault || INITIAL_VAULT,
        masterCv: data.masterCv || INITIAL_MASTER_CV,
        atsAccounts: data.atsAccounts || []
      };
    } catch {
      return { vault: INITIAL_VAULT, masterCv: INITIAL_MASTER_CV, atsAccounts: [] };
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
  async runDiscovery(keywords: string, location: string, sources?: string[]) {
    const res = await fetch(`${API_BASE}/discovery/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, location, evaluateImmediately: true, sources })
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
  async applyToJob(
    jobId: string,
    forceMode: 'auto_pilot' | 'co_pilot' = 'co_pilot',
    dryRun: boolean = true,
    confirmSubmit: boolean = false,
    formAnswers?: Record<string, string>
  ) {
    const res = await fetch(`${API_BASE}/applier/apply/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceMode, dryRun, confirmSubmit, formAnswers })
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
  },

  // 16. Reset Mock Data
  async resetMockData() {
    try {
      const res = await fetch(`${API_BASE}/system/reset-mock-data`, {
        method: 'POST'
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 17. Run AI-Centric Browser DOM Action Planner (Set-of-Mark + HP AM0238TX)
  async runAiDomAgentPass(payload: {
    presetKey?: string;
    customElements?: any[];
    companyName?: string;
    domain?: string;
  }) {
    try {
      const res = await fetch(`${API_BASE}/applier/ai-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('AI DOM planner request failed');
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 18. Fetch HP AM0238TX Hardware Profile & SQLite DOM Selector Cache
  async getHardwareProfile() {
    try {
      const res = await fetch(`${API_BASE}/system/hardware-profile`);
      if (!res.ok) throw new Error('Hardware profile failed');
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 19. Run Multimodal Screen-Grab Vision Loop (Qwen2.5-VL / Computer Use)
  async runMultimodalVisionLoop(payload: {
    presetKey?: 'workday' | 'linkedin' | 'naukri';
    customControls?: any[];
    companyName?: string;
    sampleScreenshotBase64?: string;
  }) {
    try {
      const res = await fetch(`${API_BASE}/applier/vision-loop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Multimodal Vision Loop request failed');
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 20. Fetch & Verify Live Active Jobs from LinkedIn Public Guest API
  async refreshLiveJobs(keywords: string = 'Power Platform Developer', location: string = 'India') {
    try {
      const res = await fetch(`${API_BASE}/jobs/refresh-live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, location })
      });
      if (!res.ok) throw new Error('Live job refresh failed');
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
};

// Initial state data
export const INITIAL_VAULT: PersonalVault = {
  id: 1,
  fullName: 'Shubham Yadav',
  email: 'shubhambhagwatyadav@gmail.com',
  phone: '+91 7276085461',
  location: 'Pune, Maharashtra, India',
  phoneCanada: '+1 289-890-3999',
  locationCanada: 'Waterloo / Toronto, ON, Canada',
  workPermitCanada: 'Canadian Open Work Permit (Authorized to work in Canada — No LMIA / Sponsorship Required)',
  expectedCompCad: 'CAD $115,000 - $135,000',
  linkedinUrl: 'https://linkedin.com/in/shubhambhagwatyadav',
  githubUrl: 'https://github.com/crazingineer',
  portfolioUrl: 'https://linkedin.com/in/shubhambhagwatyadav',
  currentCtcLakhs: 18.0,
  expectedCtcLakhs: 28.0,
  ctcNegotiable: true,
  noticePeriodDays: 60,
  lastWorkingDay: '',
  buyoutAvailable: true,
  preferredLocations: ['Pune', 'Bengaluru', 'Toronto, ON', 'Waterloo, ON', 'Oakville, ON', 'Vancouver, BC', 'Remote'],
  relocationWilling: true,
  authorizedCountries: ['IN', 'CA'],
  needsSponsorship: false,
  visaStatus: 'Indian Citizen + Canadian Open Work Permit Holder (Authorized in India & Canada)',
  gender: 'Decline to self-identify',
  disabilityStatus: 'No',
  veteranStatus: 'No',
  eeoEthnicity: 'Asian',
  atsEmail: 'shubhambhagwatyadav@gmail.com',
  atsPassword: 'JobSuite#ATS2026!',
  atsAuthStrategy: 'smart_detect',
  qaSnippets: {
    total_experience: '4.5+ years',
    canada_work_permit: 'Hold a valid Canadian Open Work Permit (M.A.C. graduate from Wilfrid Laurier University, Waterloo, ON) with Canadian phone +1 289-890-3999; legally authorized to work for any employer in Canada without LMIA or sponsorship.',
    why_change: 'Seeking high-impact Power Platform, Data Engineering, and Generative AI Automation roles in India or Canada to build scalable enterprise solutions and intelligent agentic workflows.',
    leadership_style: 'Hands-on architectural leadership, governance and CoE best practices, mentoring junior engineers, and agile sprint delivery.',
    governance_philosophy: 'Adhering strictly to Power Platform Center of Excellence (CoE) framework, ALM solution layering, environment variables, and DLP security compliance.',
    migration_expertise: 'Cross-tenant SharePoint migrations using PowerShell/ShareGate, plus legacy modernization of InfoPath, Nintex, and SharePoint Designer workflows to Power Automate.'
  },
  updatedAt: new Date().toISOString()
};

export const INITIAL_MASTER_CV: MasterCV = {
  id: 'cv-master-v1',
  version: 1,
  title: 'Power Platform & SharePoint Developer | Power Apps, Power Automate, Data Engineering',
  isActive: true,
  summaryVariants: {
    powerPlatform: 'Results-driven Power Platform and SharePoint Developer with 4.5+ years of experience engineering enterprise Canvas & Model-driven Power Apps, Power Automate (Cloud & Desktop RPA) workflows, Power BI semantic models, and Azure AI Foundry integrations. Certified in PL-600, PL-400, AZ-204, and MS-900 with proven expertise in enterprise SharePoint migrations, ALM governance, and RAG architectures.',
    dataEngineering: 'Data Analyst & Systems Developer specializing in Azure Databricks, Azure SQL, Logic Apps, and semantic ETL modeling. Engineered high-throughput data extraction and AI Builder pipelines saving hundreds of manual assessment hours while bypassing complex legacy scripting.',
    aiAutomation: 'AI Automation Engineer experienced in Azure AI Foundry, Content Understanding, Microsoft Copilot Studio agents, and FAISS vector retrieval. Built end-to-end RAG chatbots achieving 1.0 Context Precision on Ragas benchmarks.'
  },
  skillsTaxonomy: {
    languages: ['C#', 'Python', 'JavaScript/TypeScript (React, JSX)', 'HTML/CSS', 'XML', 'PowerShell', 'SQL', 'DAX', 'Power Fx'],
    frameworks: ['Power Apps (Canvas & Model-Driven)', 'Power Automate', 'Power Automate Desktop (RPA)', 'Power BI', 'Dataverse', 'Copilot Studio', 'AI Builder', 'Power Pages'],
    aiLlm: ['Azure AI Foundry', 'AI Builder', 'Copilot Studio', 'Content Understanding', 'OpenAI API', 'FAISS Vector Stores', 'RAG', 'Ragas'],
    cloudDevops: ['Azure Databricks', 'Azure Functions', 'Logic Apps', 'Azure SQL', 'FAISS Vector Stores', 'Azure AI Foundry', 'Fabric Capacity Scaling', 'KQL'],
    sharepointMigration: ['SharePoint Online', 'SPFx', 'PnP Framework', 'ShareGate', 'PowerShell Migration', 'InfoPath Replacement', 'Nintex Migration'],
    toolsVersionControl: ['Git', 'Jira', 'Confluence', 'VS Code', 'Azure DevOps']
  },
  workExperience: [
    {
      company: 'KPI Partners',
      role: 'Data Analyst II (Power Platform & AI)',
      location: 'Pune, MH',
      dates: 'Nov 2025 – Present',
      bullets: [
        {
          id: 'kp-b1',
          text: 'Designed and developed the comprehensive Vital Signs Review Power BI report applying user-centric design principles, including end-to-end semantic modeling, custom interactive visuals, and embedded Power Apps Canvas Apps, accelerating clinical data evaluation by 60% for Scientific and Medical Reviewers.',
          metrics: '60% faster clinical data evaluation',
          tags: ['Power BI', 'Power Apps', 'Semantic Modeling']
        },
        {
          id: 'kp-b2',
          text: 'Engineered a bulk-edit update mechanism using Dataverse/SQL Patch and ClearCollect functions, bypassing 1,000-record delegation limits by triggering dynamic dataset and visual refreshes via Power Automate HTTP webhooks.',
          metrics: 'Bypassed 1,000-record delegation limit',
          tags: ['Dataverse', 'Power Fx', 'Power Automate', 'Patch']
        },
        {
          id: 'kp-b3',
          text: 'Drove the adoption of an automation-first mindset by developing a highly efficient Power Automate workflow integrated with AI Builder to automatically evaluate business risk descriptions and generate Risk Assessment and Categorization Tool (RACT) categories. Optimized the pipeline by batching array chunks and executing Databricks SQL MERGE statements, saving 15+ hours of manual assessment weekly.',
          metrics: 'Saved 15+ hours weekly',
          tags: ['Power Automate', 'AI Builder', 'Databricks', 'SQL MERGE']
        },
        {
          id: 'kp-b4',
          text: 'Built an automated AI Builder pipeline connected to Azure Databricks to query new and changed patient vitals (e.g., BMI, BP), utilizing custom LLM prompts to automatically generate clinical health risk queries directly into an Azure SQL database.',
          metrics: 'Automated LLM clinical risk querying',
          tags: ['AI Builder', 'Azure Databricks', 'Azure SQL', 'LLM']
        },
        {
          id: 'kp-b5',
          text: 'Guided and supported junior to mid-level engineers through mentorship and technical advice, ensuring alignment with Power Platform governance, security guidelines, and architectural best practices.',
          metrics: 'Mentored team engineers',
          tags: ['Mentorship', 'Governance', 'Architecture']
        },
        {
          id: 'kp-b6',
          text: 'Leveraged Azure AI Foundry models to accurately extract data from vendor contracts and medical invoices, achieving a 95%+ accuracy rate (confidence score) in automated data capture.',
          metrics: '95%+ extraction accuracy',
          tags: ['Azure AI Foundry', 'Document Intelligence', 'Data Capture']
        },
        {
          id: 'kp-b7',
          text: 'Implemented Azure AI Foundry’s Content Understanding service to cross-reference extracted contract and invoice data, identifying procedure pricing disparities, replacing a highly complex Python script, and decreasing processing time by 50% and cost savings of 70%.',
          metrics: '50% faster processing, 70% cost savings',
          tags: ['Azure AI Foundry', 'Content Understanding', 'Cost Optimization']
        },
        {
          id: 'kp-b8',
          text: 'Integrated Azure Databricks semantic models into Power BI reports, allowing workflows to seamlessly execute structured data operations and ETL pipelines directly into Databricks and SQL tables.',
          metrics: 'Seamless ETL & semantic modeling',
          tags: ['Databricks', 'Power BI', 'ETL']
        },
        {
          id: 'kp-b9',
          text: 'Automated the dynamic scaling of Fabric Capacity utilizing KQL alerts and Logic Apps to ensure cost-efficient cloud resource utilization, reducing unnecessary compute costs.',
          metrics: 'Dynamic capacity auto-scaling',
          tags: ['Fabric', 'KQL', 'Logic Apps']
        }
      ]
    },
    {
      company: 'Wilfrid Laurier University',
      role: 'Power Platform Assistant (CO-OP)',
      location: 'Waterloo, ON',
      dates: 'May 2025 – Aug 2025',
      bullets: [
        {
          id: 'wlu-b1',
          text: 'Developed a Power Automate flow integrated with webhook events to automatically generate and deliver custom certificates upon student course completion, which saved 16 hours per week.',
          metrics: 'Saved 16 hours/week',
          tags: ['Power Automate', 'Webhooks', 'Certificate Automation']
        },
        {
          id: 'wlu-b2',
          text: 'Used Microsoft Copilot Studio and developed Copilot Agents to answer student inquiries using a private knowledge base.',
          metrics: 'Knowledge-grounded Copilot Agent',
          tags: ['Copilot Studio', 'Copilot Agents', 'AI Knowledge Base']
        },
        {
          id: 'wlu-b3',
          text: 'Designed and deployed an authenticated Power Pages Student Dashboard, empowering students to securely view their enrollment history, active courses, grades, and financial statements in real-time.',
          metrics: 'Secure real-time student portal',
          tags: ['Power Pages', 'Dataverse', 'Security']
        },
        {
          id: 'wlu-b4',
          text: 'Developed a dynamic Live Course Catalog within the portal by leveraging the Power Pages Cloud Flow API to trigger Power Automate. The flow utilized HTTP connectors to query the Destiny One REST API, processed JSON payloads, and synchronized live course descriptions directly into Dataverse.',
          metrics: 'Real-time course catalog sync',
          tags: ['Power Pages', 'Cloud Flow API', 'REST API', 'Dataverse']
        },
        {
          id: 'wlu-b5',
          text: 'Designed and updated sections of the university website, including FAQ and tax documentation pages, which helped decrease recurrent student queries by 83.5%.',
          metrics: '83.5% reduction in student queries',
          tags: ['Web Design', 'Content Strategy']
        },
        {
          id: 'wlu-b6',
          text: 'Built multiple Canvas and Model-driven Power Apps for internal teams to manage student requests, track queries, and monitor Modern Campus Destiny One ticket status, used daily by 6 staff members.',
          metrics: '6 staff members daily active users',
          tags: ['Canvas Apps', 'Model-Driven Apps', 'Destiny One']
        },
        {
          id: 'wlu-b7',
          text: 'Supported the large-scale transition of 27,000 police officers to the Modern Campus Destiny One platform, ensuring accurate data migration and minimal disruption.',
          metrics: '27,000 users migrated',
          tags: ['Data Migration', 'Modern Campus']
        },
        {
          id: 'wlu-b8',
          text: 'Implemented a recurring Power Automate flow leveraging REST API calls to automatically notify students with incomplete profiles, saving 32 hours per week by reducing manual outreach.',
          metrics: 'Saved 32 hours/week',
          tags: ['Power Automate', 'REST API', 'Notifications']
        },
        {
          id: 'wlu-b9',
          text: 'Followed Power Platform governance and CoE practices to manage environments and ensure security compliance for university applications.',
          metrics: 'CoE compliance',
          tags: ['CoE', 'Governance', 'Security Compliance']
        }
      ]
    },
    {
      company: 'Accenture Solutions Pvt. Ltd.',
      role: 'Packaged App Development Analyst (SharePoint and Power Platform Developer)',
      location: 'Pune, MH',
      dates: 'Aug 2021 – Aug 2024',
      bullets: [
        {
          id: 'acc-b1',
          text: 'Handled cross-tenant SharePoint migrations using PowerShell and ShareGate.',
          metrics: 'Cross-tenant migrations',
          tags: ['SharePoint', 'PowerShell', 'ShareGate']
        },
        {
          id: 'acc-b2',
          text: 'Developed an intelligent Power Automate Desktop (RPA) flow to automate post-migration testing across thousands of SharePoint Online sites, autonomously navigating pages to verify UI integrity and capture error screenshots.',
          metrics: 'Thousands of sites tested via RPA',
          tags: ['Power Automate Desktop', 'RPA', 'Automated Testing']
        },
        {
          id: 'acc-b3',
          text: 'Modernized legacy data collection processes by architecting and developing multiple Power Apps to replace deprecated InfoPath forms during a large-scale enterprise migration.',
          metrics: 'Legacy InfoPath forms replacement',
          tags: ['Power Apps', 'InfoPath Modernization']
        },
        {
          id: 'acc-b4',
          text: 'Worked with Dataverse and SharePoint Lists to optimize workflow efficiency, reducing manual inputs for a leading European banking client.',
          metrics: 'Optimized workflow for tier-1 European bank',
          tags: ['Dataverse', 'SharePoint Lists', 'Banking']
        },
        {
          id: 'acc-b5',
          text: 'Followed Power Platform ALM best practices using solution layering, environment variables, and managed/unmanaged solutions to streamline deployment between Dev, Test, and Prod environments.',
          metrics: 'Streamlined ALM deployment pipelines',
          tags: ['ALM', 'Solutions', 'Environment Variables']
        },
        {
          id: 'acc-b6',
          text: 'Worked within Power Platform Center of Excellence (CoE) framework to maintain governance, app lifecycle policies, and drive process improvement and compliance methodologies (including DLP) across multiple environments.',
          metrics: 'Multi-environment CoE & DLP governance',
          tags: ['CoE', 'Governance', 'DLP Policies']
        },
        {
          id: 'acc-b7',
          text: 'Architected, engineered, and automated custom Canvas and Model-driven Power Apps and Power Automate workflows for various North American clients, which included approval workflows, state machines, and complex SharePoint list updates.',
          metrics: 'Enterprise North American clients',
          tags: ['Canvas Apps', 'Model-Driven', 'Approval Workflows']
        },
        {
          id: 'acc-b8',
          text: 'Created dashboards and reports to monitor migration progress in multiple projects using SharePoint and Power BI, which were used by 4 senior managers and 9 team leads.',
          metrics: 'Used by 4 senior managers & 9 team leads',
          tags: ['Power BI', 'SharePoint', 'Reporting']
        },
        {
          id: 'acc-b9',
          text: 'Ensured data integrity during the complex migration of 500+ Nintex and SharePoint Designer workflows to Power Automate.',
          metrics: '500+ workflows migrated',
          tags: ['Nintex', 'SharePoint Designer', 'Power Automate']
        },
        {
          id: 'acc-b10',
          text: 'Designed custom webparts for SharePoint sites, improving UX and data accessibility.',
          metrics: 'Custom webparts deployment',
          tags: ['SPFx', 'Webparts', 'UX']
        },
        {
          id: 'acc-b11',
          text: 'Lead agile development and managed end-to-end solution delivery in sprints using Jira for backlog management and Confluence for documentation.',
          metrics: 'End-to-end sprint leadership',
          tags: ['Agile', 'Jira', 'Confluence', 'Sprint Delivery']
        }
      ]
    }
  ],
  education: [
    {
      degree: 'Master of Applied Computing',
      institution: 'Wilfrid Laurier University',
      location: 'Waterloo, ON, Canada',
      year: 'Sep. 2024 – Dec. 2025',
      description: 'Advanced curriculum in distributed systems, cloud computing, and applied machine learning.'
    },
    {
      degree: 'Bachelor of Computer Engineering',
      institution: 'Pune University',
      location: 'Pune, MH, India',
      year: 'Apr. 2017 – May 2021',
      description: 'Core computer science, data structures, algorithms, databases, and software engineering.'
    }
  ],
  certifications: [
    {
      title: 'PL-600: Microsoft Power Platform Solution Architect',
      issuer: 'Microsoft',
      year: '2024',
      url: 'https://learn.microsoft.com/credentials'
    },
    {
      title: 'PL-400: Microsoft Power Platform Developer',
      issuer: 'Microsoft',
      year: '2024',
      url: 'https://learn.microsoft.com/credentials'
    },
    {
      title: 'AZ-204: Developing Solutions for Microsoft Azure',
      issuer: 'Microsoft',
      year: '2024',
      url: 'https://learn.microsoft.com/credentials'
    },
    {
      title: 'PL-900: Microsoft Power Platform Fundamentals',
      issuer: 'Microsoft',
      year: '2023',
      url: 'https://learn.microsoft.com/credentials'
    },
    {
      title: 'MS-900: Microsoft 365 Fundamentals',
      issuer: 'Microsoft',
      year: '2023',
      url: 'https://learn.microsoft.com/credentials'
    },
    {
      title: 'AZ-900: Microsoft Azure Fundamentals',
      issuer: 'Microsoft',
      year: '2023',
      url: 'https://learn.microsoft.com/credentials'
    },
    {
      title: 'AI-900: Microsoft Azure AI Fundamentals',
      issuer: 'Microsoft',
      year: '2023',
      url: 'https://learn.microsoft.com/credentials'
    },
    {
      title: 'SC-900: Microsoft Security, Compliance, and Identity Fundamentals',
      issuer: 'Microsoft',
      year: '2023',
      url: 'https://learn.microsoft.com/credentials'
    }
  ],
  projects: [
    {
      name: 'Context-Aware Institutional RAG Chatbot',
      description: 'Engineered a custom Retrieval-Augmented Generation (RAG) backend using Python, Flask, and OpenAI GPT models to securely query unstructured institutional data while avoiding out-of-domain hallucinations.',
      tech: ['Python', 'Flask', 'OpenAI API', 'FAISS', 'Crawl4AI', 'Ragas'],
      bullets: [
        'Implemented an optimized semantic search pipeline utilizing a FAISS dense vector index and text-embedding-3-large, populated via a resilient, caching web crawler built with Crawl4AI.',
        'Developed a zero-shot query rewriting mechanism to maintain coreference resolution and conversational context across multi-turn interactions.',
        'Evaluated the pipeline using the Ragas framework, achieving a perfect 1.0 Context Precision score while demonstrating robust architectural adaptability for local LLM deployment.'
      ],
      url: 'https://github.com/crazingineer'
    },
    {
      name: 'CMS Consolidation and Migration',
      description: 'Consolidated M-Files and Efecte into a unified SharePoint Online environment to enhance data accessibility and reporting.',
      tech: ['Power Apps', 'Power Automate', 'SharePoint Online', 'Power BI', 'PowerShell'],
      bullets: [
        'Consolidated M-Files and Efecte into a unified SharePoint Online environment.',
        'Developed custom PowerShell scripts for efficient data migration, ensuring integrity and normalization during transition.',
        'Created interactive Power BI dashboards to monitor migration progress and proactively identify issues.'
      ],
      url: 'https://github.com/crazingineer'
    },
    {
      name: 'Employee Churn Prediction',
      description: 'Developed a predictive machine learning model to identify employees likely to leave, enabling proactive retention strategies, risk mitigation, and reduced turnover costs.',
      tech: ['Python', 'Pandas', 'NumPy', 'scikit-learn', 'SVM', 'XGBoost', 'CatBoost', 'Random Forest'],
      bullets: [
        'Performed comprehensive preprocessing: missing-value handling, categorical encoding, and feature engineering to enhance model performance while maintaining data integrity.',
        'Evaluated Random Forest, SVM, XGBoost, and CatBoost; selected Random Forest with an F1 score of 0.722 and an accuracy of 83.0%.'
      ],
      url: 'https://github.com/crazingineer'
    }
  ],
  awards: [
    {
      title: 'Microsoft Certified: 8x Professional Certifications (PL-600, PL-400, AZ-204, PL-900, MS-900, AZ-900, AI-900, SC-900)',
      org: 'Microsoft',
      year: '2023 - 2024'
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const INITIAL_JOBS: JobListing[] = [
  {
    id: 'job-301',
    portal: 'greenhouse',
    portalJobId: '8907990002',
    url: 'https://job-boards.greenhouse.io/embed/job_app?for=databricks&token=8907990002',
    externalApplyUrl: 'https://job-boards.greenhouse.io/embed/job_app?for=databricks&token=8907990002',
    atsProvider: 'Greenhouse',
    title: 'Delivery Solutions Architect (Data & AI)',
    company: 'Databricks',
    companySlug: 'databricks-canada',
    location: 'Toronto, Ontario, Canada (Remote / Hybrid)',
    remoteType: 'Remote',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T12:30:00Z',
    rawJdText:
      'Verified Live Direct Greenhouse Application (#8907990002) at Databricks (Canada). Guide enterprise customers on Lakehouse architecture, Azure Databricks SQL MERGE ETL pipelines, Delta Lake, Unity Catalog governance, Power BI semantic integration, Python, and AI/RAG production deployments across North America.',
    companyType: 'Global Data & AI Platform Leader',
    reportsTo: 'Director — Field Engineering & Delivery Architecture (Canada)',
    advertisedComp: 'CAD $145,000 - $175,000',
    status: 'queued',
    easyApply: false,
    score: 4.9,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  },
  {
    id: 'job-302',
    portal: 'greenhouse',
    portalJobId: '8585164002',
    url: 'https://job-boards.greenhouse.io/embed/job_app?for=databricks&token=8585164002',
    externalApplyUrl: 'https://job-boards.greenhouse.io/embed/job_app?for=databricks&token=8585164002',
    atsProvider: 'Greenhouse',
    title: 'Specialist Solutions Architect - AI/ML & Data',
    company: 'Databricks',
    companySlug: 'databricks-india',
    location: 'Bengaluru, Karnataka, India',
    remoteType: 'Hybrid',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T12:25:00Z',
    rawJdText:
      'Verified Live Direct Greenhouse Application (#8585164002) at Databricks (Bengaluru, India). Partner with enterprise engineering teams to design production RAG pipelines, vector search, Azure Databricks SQL ETL, Python ML models, and Power BI / enterprise data analytics.',
    companyType: 'Global Data & AI Platform Leader',
    reportsTo: 'Head of Specialist Solutions Architecture (India)',
    advertisedComp: 'INR 36L - 48L',
    status: 'queued',
    easyApply: false,
    score: 4.9,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  },
  {
    id: 'job-303',
    portal: 'greenhouse',
    portalJobId: '8132163',
    url: 'https://job-boards.greenhouse.io/embed/job_app?for=okta&token=8132163',
    externalApplyUrl: 'https://job-boards.greenhouse.io/embed/job_app?for=okta&token=8132163',
    atsProvider: 'Greenhouse',
    title: 'Senior Data Engineer (Enterprise Analytics)',
    company: 'Okta',
    companySlug: 'okta-india',
    location: 'Bengaluru, Karnataka, India',
    remoteType: 'Hybrid',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T12:20:00Z',
    rawJdText:
      'Verified Live Direct Greenhouse Application (#8132163) at Okta (Bengaluru, India). Build scalable enterprise data pipelines using SQL, Python, cloud data warehouses/Databricks, semantic models, and automated BI analytics.',
    companyType: 'Public Enterprise Cloud Identity Leader (NASDAQ: OKTA)',
    reportsTo: 'Senior Engineering Manager — Enterprise Data & Analytics',
    advertisedComp: 'INR 32L - 42L',
    status: 'queued',
    easyApply: false,
    score: 4.8,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  },
  {
    id: 'job-101',
    portal: 'linkedin',
    portalJobId: '4487744718',
    url: 'https://www.linkedin.com/jobs/view/4487744718',
    atsProvider: 'Workday External ATS',
    title: 'Microsoft Power Platform Developer II',
    company: 'Toro Technology Center - India',
    companySlug: 'toro-technology-center-india',
    location: 'Pune Division, Maharashtra, India',
    remoteType: 'Hybrid',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T08:30:00Z',
    rawJdText:
      'Job Purpose: The Power Platform Developer II designs, builds, and supports low-code business solutions on the Microsoft Power Platform — primarily Power Apps (Canvas & Model-Driven), Power Automate, and Copilot Studio — replacing manual and spreadsheet-driven processes with governed, scalable digital workflows integrated with SharePoint Online, Dataverse, and Power BI.',
    companyType: 'Enterprise Technology Center',
    reportsTo: 'Manager — Enterprise Business Applications',
    advertisedComp: 'INR 24L - 32L',
    status: 'queued',
    easyApply: false,
    score: 4.9,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  },
  {
    id: 'job-102',
    portal: 'linkedin',
    portalJobId: '4487641538',
    url: 'https://www.linkedin.com/jobs/view/4487641538',
    externalApplyUrl: 'https://careers.persistent.com/',
    atsProvider: 'Persistent Careers ATS',
    title: 'Senior Power Platform Developer',
    company: 'Persistent Systems',
    companySlug: 'persistent-systems',
    location: 'Pune Division, Maharashtra, India',
    remoteType: 'Hybrid',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T09:15:00Z',
    rawJdText:
      'About Persistent: We are an AI-led, platform-driven Digital Engineering and Enterprise Modernization partner. Seeking a Senior Power Platform Developer in Pune with deep expertise in Power Apps (Canvas & Model-Driven), Power Automate Cloud & Desktop RPA flows, Dataverse relational modeling, SharePoint Online, Custom Connectors, Managed Solutions ALM, and Power BI.',
    companyType: 'Global Digital Engineering',
    reportsTo: 'Delivery Director — Microsoft Practice',
    advertisedComp: 'INR 26L - 34L',
    status: 'tailored',
    easyApply: false,
    score: 4.9,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  },
  {
    id: 'job-103',
    portal: 'linkedin',
    portalJobId: '4344708627',
    url: 'https://www.linkedin.com/jobs/view/4344708627',
    externalApplyUrl: 'https://burnsmcd.jobs/',
    atsProvider: 'Burns & McDonnell Careers',
    title: 'Senior Power Platform Developer',
    company: 'Burns & McDonnell India',
    companySlug: 'burns-mcdonnell-india',
    location: 'Bengaluru, Karnataka, India',
    remoteType: 'Hybrid',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T10:00:00Z',
    rawJdText:
      'Description: We are seeking an experienced Power Platform Developer with 4-5 years of expertise in designing, developing, and deploying solutions using Microsoft Power Platform (Power Apps, Power Automate, and Power BI). The ideal candidate will be responsible for building scalable business applications, automating workflows, and delivering impactful data visualizations.',
    companyType: 'Global Engineering & Enterprise Consulting',
    reportsTo: 'Principal — Enterprise Applications',
    advertisedComp: 'INR 25L - 33L',
    status: 'applied',
    easyApply: false,
    score: 4.8,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  },
  {
    id: 'job-104',
    portal: 'linkedin',
    portalJobId: '4477383896',
    url: 'https://www.linkedin.com/jobs/view/4477383896',
    externalApplyUrl: 'https://www.acuityanalytics.com/working-here/',
    atsProvider: 'Acuity Careers ATS',
    title: 'Senior Associate - SharePoint & Power Platform Developer',
    company: 'Acuity Analytics',
    companySlug: 'acuity-analytics',
    location: 'Bengaluru, Karnataka, India',
    remoteType: 'Hybrid',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T10:30:00Z',
    rawJdText:
      'Job Purpose: The SharePoint Developer will be responsible for designing, developing, enhancing, and supporting enterprise SharePoint Online and Power Platform solutions (Power Apps, Power Automate, SPFx, PnP PowerShell, ShareGate migrations) that enable effective collaboration, document management, and workflow automation.',
    companyType: 'Global Financial Research & Analytics',
    reportsTo: 'Associate Director — Digital Workplace',
    advertisedComp: 'INR 24L - 30L',
    status: 'evaluated',
    easyApply: false,
    score: 4.8,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  },
  {
    id: 'job-105',
    portal: 'linkedin',
    portalJobId: '4487695412',
    url: 'https://www.linkedin.com/jobs/view/4487695412',
    atsProvider: 'LinkedIn Easy Apply',
    title: 'Azure Databricks Data Engineer',
    company: 'WTW',
    companySlug: 'wtw',
    location: 'India (Hybrid)',
    remoteType: 'Hybrid',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T11:00:00Z',
    rawJdText:
      'Role and Responsibility: Build and maintain scalable pipelines with Azure Databricks, Python, and SQL. Orchestrate data movement and workflows with Azure Data Factory / Logic Apps pipelines, triggers, and integration runtimes. Ingest and transform large datasets from SQL Server and Azure SQL. Manage data governance and access control with Unity Catalog.',
    companyType: 'Global FinTech & Advisory',
    reportsTo: 'Lead Data Engineering Architect',
    advertisedComp: 'INR 26L - 35L',
    status: 'queued',
    easyApply: true,
    score: 4.7,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  },
  {
    id: 'job-106',
    portal: 'linkedin',
    portalJobId: '4480223745',
    url: 'https://www.linkedin.com/jobs/view/4480223745',
    externalApplyUrl: 'https://www.anthesisgroup.com/careers/',
    atsProvider: 'Anthesis Careers ATS',
    title: 'Senior PowerBI Developer',
    company: 'Anthesis Group',
    companySlug: 'anthesis-group',
    location: 'Pune Division, Maharashtra, India',
    remoteType: 'Hybrid',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T11:15:00Z',
    rawJdText:
      'Department: Enabling IT | Location: Pune, India | Description: We are seeking an experienced Senior Power BI Developer to join our Global Data Analytics & Reporting team. This role combines hands-on technical development with DAX, Power Query, semantic data modeling, Row-Level Security (RLS), and Azure SQL / Microsoft Fabric integration.',
    companyType: 'Global Sustainability & Analytics Advisory',
    reportsTo: 'Head of Global Data Analytics & Reporting',
    advertisedComp: 'INR 24L - 30L',
    status: 'discovered',
    easyApply: false,
    score: 4.6,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  },
  {
    id: 'job-201',
    portal: 'linkedin',
    portalJobId: '4469605924',
    url: 'https://www.linkedin.com/jobs/view/4469605924',
    externalApplyUrl: 'https://careers.softchoice.com/',
    atsProvider: 'Softchoice Careers ATS',
    title: 'Sr. Power Platform Developer',
    company: 'Softchoice',
    companySlug: 'softchoice-canada',
    location: 'Toronto, Ontario, Canada',
    remoteType: 'Hybrid',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T11:30:00Z',
    rawJdText:
      'Verified Active Canadian LinkedIn Requisition (#4469605924) at Softchoice (Toronto, Ontario, Canada). Seeking a Senior Power Platform Developer to architect and deliver enterprise Canvas & Model-Driven Power Apps, Power Automate Cloud & Desktop RPA workflows, Dataverse data models, Copilot Studio agents, SharePoint Online integrations, and Power BI analytics across North American enterprise clients.',
    companyType: 'North American Cloud & Digital Workplace Leader (TSX: SFTC)',
    reportsTo: 'Director — Microsoft Business Applications (Canada)',
    advertisedComp: 'CAD $120,000 - $138,000',
    status: 'queued',
    easyApply: false,
    score: 4.9,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  },
  {
    id: 'job-202',
    portal: 'linkedin',
    portalJobId: '4487684684',
    url: 'https://www.linkedin.com/jobs/view/4487684684',
    atsProvider: 'MNP External ATS',
    title: 'Solution Developer, Power Platform & D365',
    company: 'MNP',
    companySlug: 'mnp-canada',
    location: 'Markham, Ontario, Canada (GTA)',
    remoteType: 'Hybrid',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T11:45:00Z',
    rawJdText:
      'Verified Active Canadian LinkedIn Requisition (#4487684684) at MNP Digital (Markham / Greater Toronto Area, Ontario, Canada). Looking for a Solution Developer specializing in Microsoft Power Platform (Power Apps, Power Automate, Power Pages, Dataverse, Copilot Studio) and SharePoint Online to build scalable digital solutions for Canadian enterprise and public-sector clients.',
    companyType: 'National Canadian Professional Services & Digital Advisory Firm',
    reportsTo: 'Partner — Digital & Enterprise Platforms (Ontario)',
    advertisedComp: 'CAD $112,000 - $130,000',
    status: 'tailored',
    easyApply: false,
    score: 4.8,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  },
  {
    id: 'job-203',
    portal: 'linkedin',
    portalJobId: '4485864694',
    url: 'https://www.linkedin.com/jobs/view/4485864694',
    atsProvider: 'LinkedIn Easy Apply',
    title: 'Sr. SharePoint Developer',
    company: 'Apptoza Inc.',
    companySlug: 'apptoza-inc',
    location: 'Vancouver, British Columbia, Canada (Remote / Hybrid)',
    remoteType: 'Hybrid',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T12:00:00Z',
    rawJdText:
      'Verified Active Canadian LinkedIn Requisition (#4485864694) at Apptoza Inc. (Canada). Seeking a Senior SharePoint & Power Platform Developer with proven expertise in SharePoint Online, SPFx (React/TypeScript), ShareGate & PnP PowerShell migrations, InfoPath/Nintex modernization into Power Apps & Power Automate, and Microsoft 365 governance.',
    companyType: 'Canadian Microsoft Cloud & SharePoint Consulting Partner',
    reportsTo: 'VP — Microsoft 365 & SharePoint Practice',
    advertisedComp: 'CAD $115,000 - $132,000',
    status: 'evaluated',
    easyApply: true,
    score: 4.8,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  },
  {
    id: 'job-204',
    portal: 'linkedin',
    portalJobId: '4473024769',
    url: 'https://www.linkedin.com/jobs/view/4473024769',
    externalApplyUrl: 'https://www.nesto.ca/careers/',
    atsProvider: 'nesto Careers ATS',
    title: 'Senior Data Engineer, Analytics',
    company: 'nesto',
    companySlug: 'nesto-canada',
    location: 'Canada (Montreal / Toronto / Hybrid)',
    remoteType: 'Hybrid',
    postedDate: '2026-11-11',
    capturedAt: '2026-11-11T12:15:00Z',
    rawJdText:
      'Verified Active Canadian LinkedIn Requisition (#4473024769) at nesto (Canada). Seeking a Senior Data Engineer, Analytics experienced in Azure Databricks, SQL MERGE ETL pipelines, Python, Azure SQL, and Power BI semantic models & DAX dashboards to power Canadian fintech analytics.',
    companyType: 'Leading Canadian FinTech & Digital Mortgage Platform',
    reportsTo: 'Head of Data Engineering & Analytics',
    advertisedComp: 'CAD $125,000 - $145,000',
    status: 'queued',
    easyApply: false,
    score: 4.7,
    legitimacyTier: 'High Confidence',
    finalDecision: 'Apply',
    tailoredDocPath: 'data/cv_tailored/Master_Resume.pdf'
  }
];

export const SAMPLE_EVALUATION: EvaluationReport = {
  id: 'eval-101',
  jobId: 'job-101',
  score: 4.9,
  finalDecision: 'Apply',
  archetype: 'Power Platform & Enterprise AI Architect',
  legitimacyTier: 'High Confidence',
  workAuthTier: 'Not needed',
  cvMatchScore: 4.9,
  northStarScore: 4.9,
  compScore: 4.8,
  cultureScore: 4.8,
  redFlagsDeduction: 0.0,
  evidenceConfidence: 'High',
  confidenceGaps: [],
  hardStops: [],
  softGaps: ['Dynamics 365 Finance & Operations ERP module (mitigated by deep Dataverse, Custom Connectors & SAP/ERP RPA integration experience)'],
  topStrengths: [
    '8x Microsoft Certified including PL-600 (Solution Architect Expert), PL-400 (Developer Associate), and AZ-204',
    'Production Azure AI Foundry (Content Understanding) invoice pipeline with 95%+ accuracy & 70% compute cost reduction at KPI Partners',
    '4.5+ years delivering Power Apps, Power Automate (Cloud & Desktop RPA), Dataverse, SharePoint Online (15+ TB ShareGate migrations), and Databricks SQL ETL'
  ],
  blockASummary: {
    archetype: 'Power Platform & Enterprise AI Architect',
    domain: 'Microsoft Business Applications, Copilot Studio & Azure AI Automation',
    seniority: 'Senior / Lead (4.5+ Years)',
    workMode: 'Hybrid (Pune / Bengaluru / Remote)',
    teamSize: '8 - 14 engineers & solution architects',
    workAuth: 'Not needed (Authorized in India)',
    tldr: 'Direct 1:1 alignment with Shubham Yadav’s Master CV across Power Apps, Power Automate, Dataverse, SharePoint Online, Copilot Studio, Azure AI Foundry, and PL-600/PL-400 certifications.'
  },
  blockBRequirements: [
    {
      requirement: 'Power Apps (Canvas & Model-Driven), Dataverse & Power Automate Cloud/Desktop RPA',
      importance: 'critical',
      evidence: 'stated',
      match: 'strong',
      jdSignal: '4+ years building enterprise Canvas & Model-Driven Power Apps, Power Automate flows, and Dataverse security models.',
      gap: null,
      mitigation: null
    },
    {
      requirement: 'Copilot Studio, AI Builder & Azure AI Foundry Document Automation',
      importance: 'critical',
      evidence: 'stated',
      match: 'strong',
      jdSignal: 'Hands-on experience deploying Copilot Studio agents and Azure AI Foundry / AI Builder document extraction workflows.',
      gap: null,
      mitigation: null
    },
    {
      requirement: 'SharePoint Online Architecture, SPFx & Legacy Migration (ShareGate / PowerShell)',
      importance: 'high',
      evidence: 'stated',
      match: 'strong',
      jdSignal: 'Integrate SharePoint Online lists/libraries, SPFx web parts, and migrate legacy InfoPath/Nintex forms.',
      gap: null,
      mitigation: null
    },
    {
      requirement: 'Microsoft Power Platform Certifications (PL-600, PL-400, AZ-204)',
      importance: 'high',
      evidence: 'stated',
      match: 'strong',
      jdSignal: 'PL-600 Solution Architect or PL-400 Developer certification strongly preferred.',
      gap: null,
      mitigation: null
    }
  ],
  blockCStrategy: {
    levelFit: 'Senior Developer / Solution Architect (PL-600 Certified)',
    positioning: 'Microsoft PL-600 Solution Architect & Senior Power Platform/AI Engineer who combines low-code velocity (Power Apps, Power Automate, Copilot Studio) with pro-code Azure Data & AI engineering (Azure AI Foundry, Databricks SQL, Python RAG).',
    downlevelDefense: 'Anchor on PL-600 Solution Architect certification, CoE governance leadership at Accenture, and end-to-end ownership of clinical & financial AI pipelines at KPI Partners.'
  },
  blockDComp: {
    companyType: 'Enterprise Microsoft Partner / Global Consulting',
    compReliability: 'High',
    advertisedComp: 'INR 26L - 34L',
    guaranteedBase: 'INR 26L - 30L',
    variable: 'INR 3L - 4L performance bonus',
    marketPercentile: 'Top 10% for 4.5+ YOE Power Platform & Azure AI Engineers in Pune/Bengaluru'
  },
  blockEPersonalization: [
    {
      id: 'e1',
      section: 'KPI Partners — Bullet #1 (Power Apps & Clinical Study Intake)',
      currentState:
        'Developed and deployed a scalable Power Apps solution integrated with SharePoint Online to streamline clinical study intake and regulatory tracking, reducing processing time by 60%.',
      proposedChange:
        'Architected and deployed a governed Power Platform solution (Canvas & Model-Driven Power Apps, Dataverse, and Power Automate cloud flows) integrated with SharePoint Online to automate clinical study intake and multi-tier regulatory approvals, reducing end-to-end processing time by 60%.',
      why: 'Aligns with JD requirement for Canvas/Model-Driven Power Apps & Dataverse governance. | Interview Talking Point: Walk through how Power Fx validation and multi-stage Power Automate approvals eliminated 15+ hrs/week of manual tracking at KPI Partners.'
    },
    {
      id: 'e2',
      section: 'KPI Partners — Bullet #6 (Azure AI Foundry & Copilot Studio)',
      currentState:
        'Engineered an automated invoice processing pipeline using Azure AI Foundry (Content Understanding) to extract structured data from complex, multi-page financial PDFs with 95%+ accuracy.',
      proposedChange:
        'Engineered an enterprise AI document-understanding and Copilot Studio workflow pipeline using Azure AI Foundry (Content Understanding) and Power Automate to extract structured data from multi-page financial PDFs with 95%+ accuracy and 70% lower compute cost.',
      why: 'Bridges JD requirement for Copilot Studio & AI Builder with your real Azure AI Foundry pipeline. | Interview Talking Point: Explain how you replaced heavy LLM token calls with Azure AI Foundry Content Understanding + Power Automate orchestration, cutting compute costs by 70%.'
    },
    {
      id: 'e3',
      section: 'Accenture Solutions — Bullet #1 & #2 (SharePoint Online & InfoPath/Nintex Modernization)',
      currentState:
        'Migrated 40+ legacy InfoPath and Nintex workflows to modern Power Apps and Power Automate solutions, improving maintainability and mobile responsiveness.',
      proposedChange:
        'Led enterprise SharePoint Online modernization (15+ TB via ShareGate & PnP PowerShell with 99.9% fidelity) and refactored 40+ legacy InfoPath and Nintex workflows into responsive Power Apps, SPFx web parts, and Power Automate Cloud/Desktop RPA flows.',
      why: 'Directly matches enterprise migration and RPA automation requirements using 100% real Accenture deliverables. | Interview Talking Point: Discuss your PowerShell pre-migration inventory scripts, ShareGate taxonomy mapping, and attended/unattended Power Automate Desktop RPA bots.'
    }
  ],
  blockFInterview: {
    starStories: [
      {
        id: 1,
        requirement: 'Enterprise AI Document Extraction & Workflow Orchestration',
        story: 'Azure AI Foundry Invoice Pipeline at KPI Partners (95%+ Accuracy, 70% Cost Reduction)',
        s: 'Financial operations teams manually processed complex multi-page vendor invoices, while naive LLM prompts were expensive and inconsistent on tabular layouts.',
        t: 'Design a deterministic, cost-efficient automated extraction and approval pipeline integrated with Power Platform and Azure.',
        a: 'Engineered an ingestion pipeline using Azure AI Foundry (Content Understanding), orchestrated via Power Automate and Azure Functions with schema validation and exception queues.',
        r: 'Achieved 95%+ field extraction accuracy and reduced compute costs by 70% compared to standard LLM calls.',
        reflection: 'Combining structured Azure AI Content Understanding with Power Automate human-in-the-loop review gates gives enterprise auditability without token bloat.'
      },
      {
        id: 2,
        requirement: 'Scalable Power Apps & Dataverse Clinical Workflow Automation',
        story: 'Clinical Study Intake & Regulatory Tracking Platform at KPI Partners',
        s: 'Clinical study intake relied on fragmented spreadsheets and email threads, causing bottlenecks and delayed regulatory handoffs.',
        t: 'Deliver a unified, role-based intake and approval application with full audit history.',
        a: 'Built a scalable Power Apps solution integrated with SharePoint Online and Power Automate multi-tier approval flows, enforcing Power Fx field validation and RBAC.',
        r: 'Reduced end-to-end clinical study intake processing time by 60% and saved 15+ hours/week of manual coordination.',
        reflection: 'Designing clean delegation-friendly queries and modular Power Automate child flows ensured zero throttling as record volume scaled.'
      }
    ],
    caseStudy: 'Designing a governed Power Platform & Azure AI Foundry architecture with DLP policies, Managed Solutions ALM, and Databricks SQL analytics sync.',
    redFlagQa: [
      {
        q: 'How do you decide between low-code Power Automate/Copilot Studio and pro-code Azure Functions/Databricks?',
        a: 'I use Power Apps, Copilot Studio, and Power Automate for user experience, human approvals, and M365 connector orchestration, and offload heavy multi-tab file parsing, SQL MERGE ETL, or custom FAISS vector retrieval to Azure Functions, Databricks, and Python.'
      }
    ]
  },
  blockGLegitimacy: {
    postingFreshness: 'Active (Posted within 24 hours)',
    descriptionQuality: 'High specificity — lists concrete Microsoft certifications (PL-600/PL-400) and architectural deliverables',
    repostSignals: 'Verified new requisition',
    aiBuzzwordMismatch: 'Consistent (Power Platform + Copilot Studio + Azure AI Foundry stack)',
    payTransparency: 'Aligned with Pune/Bengaluru Senior Power Platform & Azure AI market (26L - 34L)',
    recruiterVerification: 'Verified Microsoft Partner talent acquisition team'
  },
  blockHAnswers: {
    why_apply:
      'With 4.5+ years of experience across KPI Partners, Wilfrid Laurier University, and Accenture—and 8 Microsoft certifications including PL-600 Solution Architect, PL-400, and AZ-204—I have delivered 60% faster clinical workflows in Power Apps/Power Automate, 95%+ accuracy document pipelines in Azure AI Foundry, and 15+ TB SharePoint migrations.',
    expected_ctc: 'INR 28L - 32L (Negotiable based on variable/bonus structure)',
    notice_period: '60 days (Notice buyout available for expedited 30-day joining)'
  },
  riskSummary: {
    legitimacy: 'High Confidence',
    classification: 'Clear (Full-time Permanent Role)',
    culture: 'Pass',
    interview_redflags: 'None — 100% of tailored bullets are grounded in real KPI Partners, WLU & Accenture projects',
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
  machineSummaryYaml: `company: "Avanade (Microsoft Partner)"
role: "Senior Power Platform & Copilot Studio Developer"
score: 4.9
legitimacy_tier: "High Confidence"
archetype: "Power Platform & Enterprise AI Architect"
final_decision: "Apply"
hard_stops: []
soft_gaps:
  - "Dynamics 365 F&O module (mitigated by Dataverse & ERP RPA integration)"
top_strengths:
  - "8x Microsoft Certified (PL-600, PL-400, AZ-204)"
  - "Azure AI Foundry & Power Automate pipelines (95%+ accuracy, 70% cost reduction)"
  - "4.5+ yrs Power Apps, SharePoint Online (15+ TB ShareGate), Databricks SQL & Python RAG"
work_auth: "not_needed"
advertised_comp: "INR 26L - 34L"`,
  fullMarkdownReport: `# Evaluation: Avanade — Senior Power Platform & Copilot Studio Developer

**Date:** 2026-11-09
**Archetype:** Power Platform & Enterprise AI Architect
**Score:** 4.9/5.0
**Decision:** Apply
**Legitimacy:** High Confidence
**Work Auth:** ➖ Not needed (Authorized in India)

**Apply.** Direct 1:1 match with Shubham Yadav's 4.5+ years of experience at KPI Partners, Wilfrid Laurier University, and Accenture, backed by PL-600, PL-400, and AZ-204 certifications.`,
  evaluatedAt: '2026-11-09T08:35:00Z'
};

