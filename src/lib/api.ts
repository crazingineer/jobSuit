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
  }
};

// Initial state data
export const INITIAL_VAULT: PersonalVault = {
  id: 1,
  fullName: 'Shubham Yadav',
  email: 'shubhambhagwatyadav@gmail.com',
  phone: '+91 7276085461',
  location: 'Pune, Maharashtra, India',
  linkedinUrl: 'https://linkedin.com/in/shubhambhagwatyadav',
  githubUrl: 'https://github.com/crazingineer',
  portfolioUrl: 'https://linkedin.com/in/shubhambhagwatyadav',
  currentCtcLakhs: 0.0,
  expectedCtcLakhs: 0.0,
  ctcNegotiable: true,
  noticePeriodDays: 60,
  lastWorkingDay: '',
  buyoutAvailable: true,
  preferredLocations: ['Pune', 'Bengaluru', 'Hyderabad', 'Remote'],
  relocationWilling: true,
  authorizedCountries: ['IN', 'CA'],
  needsSponsorship: false,
  visaStatus: 'Indian Citizen (Full work authorization in India)',
  gender: 'Decline to self-identify',
  disabilityStatus: 'No',
  veteranStatus: 'No',
  eeoEthnicity: 'Asian',
  qaSnippets: {
    total_experience: '4.5+ years',
    why_change: 'Seeking high-impact Power Platform, Data Engineering, and Generative AI Automation roles to build scalable enterprise solutions and intelligent agentic workflows.',
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
