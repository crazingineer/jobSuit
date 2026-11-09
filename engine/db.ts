import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DEFAULT_PERSONAL_VAULT, DEFAULT_MASTER_CV } from './master-seed';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const DB_PATH = path.join(DB_DIR, 'jobsuite.db');
export const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency & minimal write locks
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  const schemaPath = path.resolve(process.cwd(), 'engine', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);

  // Seed default personal vault if empty
  const vaultExists = db.prepare('SELECT COUNT(*) as count FROM personal_vault').get() as { count: number };
  if (vaultExists.count === 0) {
    db.prepare(`
      INSERT INTO personal_vault (
        id, full_name, email, phone, location, linkedin_url, github_url, portfolio_url,
        current_ctc_lakhs, expected_ctc_lakhs, ctc_negotiable, notice_period_days,
        last_working_day, buyout_available, preferred_locations, relocation_willing,
        authorized_countries, needs_sponsorship, visa_status, qa_snippets, updated_at
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
      )
    `).run(
      DEFAULT_PERSONAL_VAULT.fullName,
      DEFAULT_PERSONAL_VAULT.email,
      DEFAULT_PERSONAL_VAULT.phone,
      DEFAULT_PERSONAL_VAULT.location,
      DEFAULT_PERSONAL_VAULT.linkedinUrl,
      DEFAULT_PERSONAL_VAULT.githubUrl,
      DEFAULT_PERSONAL_VAULT.portfolioUrl,
      DEFAULT_PERSONAL_VAULT.currentCtcLakhs,
      DEFAULT_PERSONAL_VAULT.expectedCtcLakhs,
      DEFAULT_PERSONAL_VAULT.ctcNegotiable ? 1 : 0,
      DEFAULT_PERSONAL_VAULT.noticePeriodDays,
      DEFAULT_PERSONAL_VAULT.lastWorkingDay || null,
      DEFAULT_PERSONAL_VAULT.buyoutAvailable ? 1 : 0,
      JSON.stringify(DEFAULT_PERSONAL_VAULT.preferredLocations),
      DEFAULT_PERSONAL_VAULT.relocationWilling ? 1 : 0,
      JSON.stringify(DEFAULT_PERSONAL_VAULT.authorizedCountries),
      DEFAULT_PERSONAL_VAULT.needsSponsorship ? 1 : 0,
      DEFAULT_PERSONAL_VAULT.visaStatus,
      JSON.stringify(DEFAULT_PERSONAL_VAULT.qaSnippets)
    );
  }

  // Seed default master CV if empty
  const cvExists = db.prepare('SELECT COUNT(*) as count FROM master_cv').get() as { count: number };
  if (cvExists.count === 0) {
    db.prepare(`
      INSERT INTO master_cv (
        id, version, title, is_active, summary_variants, skills_taxonomy,
        work_experience, education, certifications, projects, awards, created_at, updated_at
      ) VALUES (
        'cv-master-v1', 1, ?, 1, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
      )
    `).run(
      DEFAULT_MASTER_CV.title,
      JSON.stringify(DEFAULT_MASTER_CV.summaryVariants),
      JSON.stringify(DEFAULT_MASTER_CV.skillsTaxonomy),
      JSON.stringify(DEFAULT_MASTER_CV.workExperience),
      JSON.stringify(DEFAULT_MASTER_CV.education),
      JSON.stringify(DEFAULT_MASTER_CV.certifications),
      JSON.stringify(DEFAULT_MASTER_CV.projects),
      JSON.stringify(DEFAULT_MASTER_CV.awards)
    );
  }

  // Seed default automation rules
  const rulesExists = db.prepare('SELECT COUNT(*) as count FROM automation_rules').get() as { count: number };
  if (rulesExists.count === 0) {
    db.prepare(`
      INSERT INTO automation_rules (
        id, linkedin_daily_limit, naukri_daily_limit, delay_min_sec, delay_max_sec,
        min_score_threshold, blacklist_companies, blacklist_keywords,
        auto_pilot_linkedin, auto_pilot_naukri, auto_pilot_workday, auto_pilot_greenhouse, updated_at
      ) VALUES (
        1, 25, 50, 8, 25, 4.0,
        '["Staffing Solutions Inc", "Generic Outsourcing Ltd", "Unverified Recruiter Corp"]',
        '["unpaid", "commission only", "crypto web3 pump", "no salary disclosed"]',
        0, 0, 0, 1,
        datetime('now')
      )
    `).run();
  }

  // Seed default system settings
  const settingsExists = db.prepare('SELECT COUNT(*) as count FROM system_settings').get() as { count: number };
  if (settingsExists.count === 0) {
    const defaultChrome = process.env.LOCALAPPDATA 
      ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data')
      : '';
    const defaultEdge = process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data')
      : '';

    db.prepare(`
      INSERT INTO system_settings (
        id, llm_provider, llm_model, llm_api_key_encrypted, chrome_user_data_dir,
        edge_user_data_dir, preferred_browser, typst_path, naukri_refresh_time,
        naukri_refresh_jitter_mins, updated_at
      ) VALUES (
        1, 'gemini', 'gemini-1.5-flash', NULL, ?, ?, 'chrome', NULL, '08:55', 15, datetime('now')
      )
    `).run(defaultChrome, defaultEdge);
  }

  // Seed sample job pipeline items if empty
  const jobsCount = db.prepare('SELECT COUNT(*) as count FROM job_listings').get() as { count: number };
  if (jobsCount.count === 0) {
    const sampleJobs = [
      {
        id: 'job-101',
        portal: 'linkedin',
        portal_job_id: '401928312',
        url: 'https://www.linkedin.com/jobs/view/401928312',
        title: 'Lead AI Platform / Agentic Workflows Engineer',
        company: 'Anthropic Labs Partner',
        company_slug: 'anthropic-labs-partner',
        location: 'Bengaluru / Remote',
        remote_type: 'Remote',
        posted_date: '2026-11-08',
        captured_at: new Date().toISOString(),
        raw_jd_text: 'We are seeking a Lead AI Engineer to architect autonomous agentic workflows and LLMOps evaluation pipelines...',
        company_type: 'Growth-stage startup / VC-backed',
        reports_to: 'VP of Engineering',
        advertised_comp: 'INR 45L - 60L + ESOPs',
        status: 'queued',
        easy_apply: 1,
      },
      {
        id: 'job-102',
        portal: 'naukri',
        portal_job_id: 'nk-998811',
        url: 'https://www.naukri.com/job-listings-998811',
        title: 'Staff Full-Stack & GenAI Engineer',
        company: 'Zepto Tech',
        company_slug: 'zepto-tech',
        location: 'Bengaluru',
        remote_type: 'Hybrid',
        posted_date: '2026-11-09',
        captured_at: new Date().toISOString(),
        raw_jd_text: 'Looking for Staff Engineers with expertise in React, Node/Go, and LLM integrations. Must have 5+ years experience...',
        company_type: 'Mature Tech / Unicorn',
        reports_to: 'Director of Platform Engineering',
        advertised_comp: 'INR 50L - 70L',
        status: 'tailored',
        easy_apply: 0,
      },
      {
        id: 'job-103',
        portal: 'greenhouse',
        portal_job_id: 'gh-ashby-334',
        url: 'https://boards.greenhouse.io/vanna/jobs/334',
        title: 'AI Forward Deployed Engineer (FDE)',
        company: 'Vanna AI',
        company_slug: 'vanna-ai',
        location: 'Remote (Worldwide)',
        remote_type: 'Remote',
        posted_date: '2026-11-07',
        captured_at: new Date().toISOString(),
        raw_jd_text: 'Join as an FDE to build customer-specific agents, enterprise RAG connections, and reliable tool calling...',
        company_type: 'Growth-stage startup / VC-backed',
        reports_to: 'Head of Solutions',
        advertised_comp: '$130,000 - $160,000 USD',
        status: 'applied',
        easy_apply: 0,
      },
      {
        id: 'job-104',
        portal: 'linkedin',
        portal_job_id: '401928999',
        url: 'https://www.linkedin.com/jobs/view/401928999',
        title: 'Senior Python & LLM Systems Engineer',
        company: 'Razorpay',
        company_slug: 'razorpay',
        location: 'Bengaluru',
        remote_type: 'Hybrid',
        posted_date: '2026-11-09',
        captured_at: new Date().toISOString(),
        raw_jd_text: 'Build AI-native fraud detection systems and merchant intelligence copilots...',
        company_type: 'Enterprise / Mature Tech',
        reports_to: 'Engineering Manager',
        advertised_comp: 'INR 38L - 48L',
        status: 'evaluated',
        easy_apply: 1,
      },
      {
        id: 'job-105',
        portal: 'naukri',
        portal_job_id: 'nk-441100',
        url: 'https://www.naukri.com/job-listings-441100',
        title: 'Lead Software Architect - AI Solutions',
        company: 'Cognizant Digital',
        company_slug: 'cognizant-digital',
        location: 'Hyderabad',
        remote_type: 'Onsite',
        posted_date: '2026-11-01',
        captured_at: new Date().toISOString(),
        raw_jd_text: 'Generic consulting role for banking client...',
        company_type: 'Agency / Outsourcing Vendor',
        reports_to: 'Program Director',
        advertised_comp: 'INR 28L - 32L',
        status: 'discovered',
        easy_apply: 0,
      }
    ];

    const insertJob = db.prepare(`
      INSERT INTO job_listings (
        id, portal, portal_job_id, url, title, company, company_slug, location,
        remote_type, posted_date, captured_at, raw_jd_text, company_type, reports_to,
        advertised_comp, status, easy_apply, created_at
      ) VALUES (
        @id, @portal, @portal_job_id, @url, @title, @company, @company_slug, @location,
        @remote_type, @posted_date, @captured_at, @raw_jd_text, @company_type, @reports_to,
        @advertised_comp, @status, @easy_apply, datetime('now')
      )
    `);

    for (const job of sampleJobs) {
      insertJob.run(job);
    }

    // Insert full career-ops A-H evaluation for job-101
    db.prepare(`
      INSERT INTO evaluations (
        id, job_id, score, final_decision, archetype, legitimacy_tier, work_auth_tier,
        cv_match_score, north_star_score, comp_score, culture_score, red_flags_deduction,
        evidence_confidence, confidence_gaps, hard_stops, soft_gaps, top_strengths,
        block_a_summary, block_b_requirements, block_c_strategy, block_d_comp,
        block_e_personalization, block_f_interview, block_g_legitimacy, block_h_answers,
        risk_summary, score_evidence, machine_summary_yaml, full_markdown_report, evaluated_at
      ) VALUES (
        'eval-101',
        'job-101',
        4.7,
        'Apply',
        'Agentic Workflows / Automation Engineer',
        'High Confidence',
        'Not needed',
        4.8, 4.9, 4.6, 4.7, 0.0,
        'High',
        '[]',
        '[]',
        '["Experience scaling vLLM clusters in bare-metal Kubernetes"]',
        '["High-scale Playwright multi-agent experience", "Production RAG with sub-150ms latency", "Clean modular TypeScript + Python systems architecture"]',
        '{"archetype": "Agentic Workflows / Automation", "domain": "Enterprise AI Orchestration", "seniority": "Lead / Staff", "work_mode": "Remote", "team_size": "8-12 engineers", "work_auth": "Not needed (India/Remote authorized)"}',
        '[{"requirement": "Multi-agent orchestration with tool calling & human-in-the-loop", "importance": "critical", "evidence": "stated", "match": "strong", "jd_signal": "Must have hands-on experience designing multi-agent workflows with tool-calling and human intervention checkpoints.", "gap": null, "mitigation": null}, {"requirement": "Playwright / headless browser automation at scale", "importance": "high", "evidence": "stated", "match": "strong", "jd_signal": "Demonstrated expertise controlling web environments via Playwright/Puppeteer.", "gap": null, "mitigation": null}, {"requirement": "Kubernetes bare-metal cluster management for LLM inference", "importance": "meaningful", "evidence": "structural", "match": "partial", "jd_signal": "Bonus: Experience with on-prem GPU orchestrations.", "gap": "Candidate has AWS ECS/EKS rather than bare-metal k8s", "mitigation": "Highlight containerized deployment patterns and ECS Fargate GPU benchmarks"}]',
        '{"level_fit": "Peer / Stretch to Lead", "positioning": "Lead Builder who bridges product discovery, multi-agent architecture, and production stability.", "downlevel_defense": "Demonstrate architecture ownership of 10M+ daily events and direct deflection metrics."}',
        '{"company_type": "Growth-stage startup / VC-backed", "comp_reliability": "High", "advertised_comp": "INR 45L - 60L + ESOPs", "guaranteed_base": "INR 45L", "variable": "INR 10L - 15L performance bonus", "market_percentile": "Top 10% (P90) in Indian AI hiring market"}',
        '[{"id": "e1", "section": "Summary", "current_state": "Senior AI Systems & Full-Stack Engineer...", "proposed_change": "Lead AI & Agentic Automation Architect...", "why": "Matches JD role title and positions as end-to-end multi-agent specialist"}, {"id": "e2", "section": "HyperFlow Tech Bullets", "current_state": "Architected multi-agent customer support automation platform...", "proposed_change": "Promoted Playwright CDP & tool-calling deflection metrics to bullet #1", "why": "Directly mirrors primary requirement in JD section 2"}]',
        '{"star_stories": [{"id": 1, "requirement": "Multi-agent orchestration", "story": "Customer Support Automation Deflection", "s": "HyperFlow was spending $15k/mo on manual L1 support triage.", "t": "Build an autonomous agent with human approval escalation.", "a": "Implemented Playwright CDP tool caller with Gemini 1.5 JSON function calling.", "r": "Achieved 42% autonomous resolution rate with zero data leak incidents.", "reflection": "Strict type validation on tool parameters prevented 98% of hallucinations."}], "case_study": "Designing a reliable self-healing browser worker that recovers from DOM mutations.", "red_flag_qa": [{"q": "Why transition from Full-Stack to dedicated Agentic Engineering?", "a": "Deterministic business logic is best augmented by structured LLM reasoning; I thrive at the boundary of solid software engineering and probabilistic models."}]}',
        '{"posting_freshness": "Active (posted 1 day ago)", "description_quality": "High specificity, detailed architecture responsibilities", "repost_signals": "First seen req", "ai_buzzword_mismatch": "Consistent (clear technical stack mentioned)", "pay_transparency": "Compliant (narrow range 45L-60L)", "recruiter_verification": "Verified hiring manager on LinkedIn"}',
        '{"why_apply": "I have spent the last 3 years engineering deterministic multi-agent architectures that interact with web and software tooling. Having achieved 42% autonomous deflection in production at HyperFlow, this role directly aligns with my passion for resilient automation.", "expected_ctc": "INR 50-55 LPA negotiable based on equity component", "notice_period": "60 days (buyout negotiable for immediate joining)"}',
        '{"legitimacy": "high_confidence", "classification": "clear", "culture": "pass", "ai_infra": "consistent", "fixed_term": "not_detected"}',
        '{"cv_match": "supported", "north_star": "supported", "compensation": "supported", "culture": "supported", "red_flags": "supported"}',
        'score: 4.7\\nlegitimacy_tier: High Confidence\\narchetype: Agentic Workflows / Automation\\nfinal_decision: Apply\\nhard_stops: []\\nsoft_gaps:\\n  - Kubernetes bare-metal cluster management\\ntop_strengths:\\n  - High-scale Playwright multi-agent experience\\n  - Production RAG with sub-150ms latency\\nwork_auth: not_needed\\nadvertised_comp: "INR 45L - 60L + ESOPs"',
        '# Evaluation: Anthropic Labs Partner — Lead AI Platform Engineer\\n\\n**Date:** 2026-11-09\\n**Archetype:** Agentic Workflows / Automation\\n**Score:** 4.7/5\\n**Decision:** Apply\\n**Legitimacy:** High Confidence\\n**Work Auth:** ➖ Not needed\\n\\n**Apply.** Outstanding alignment with candidate primary strengths in Playwright automation and LLMOps.',
        datetime('now')
      )
    `).run();

    // Insert tailored CV document for job-101
    db.prepare(`
      INSERT INTO tailored_documents (
        id, job_id, doc_type, file_path, payload_json, diff_json, compiled_at
      ) VALUES (
        'doc-101-cv',
        'job-101',
        'cv',
        'data/cv_tailored/Arjun_Sharma_AnthropicPartner_LeadAI.pdf',
        '{"title": "Lead AI & Agentic Automation Architect", "company": "Anthropic Labs Partner"}',
        '[{"section": "Title", "diff": "Senior AI Systems Engineer -> Lead AI & Agentic Automation Architect"}, {"section": "Bullet 1", "diff": "Highlighted Playwright CDP and 42% deflection metric"}]',
        datetime('now')
      )
    `).run();

    // Insert sample application run for job-103
    db.prepare(`
      INSERT INTO application_runs (
        id, job_id, portal, mode, status, step_reached, error_message, screenshot_path,
        form_answers_snapshot, started_at, completed_at
      ) VALUES (
        'run-103',
        'job-103',
        'greenhouse',
        'auto_pilot',
        'submitted',
        'Form Submitted (Confirmation #GH-88192)',
        NULL,
        'data/screenshots/job-103-success.png',
        '{"name": "Arjun Sharma", "email": "arjun.sharma@example.com", "notice": "60 days", "ctc": "$140,000"}',
        datetime('now', '-2 hours'),
        datetime('now', '-2 hours', '+3 minutes')
      )
    `).run();

    // Insert sample booster log
    db.prepare(`
      INSERT INTO naukri_booster_logs (
        executed_at, status, resume_uploaded, headline_modified, headline_before, headline_after,
        next_scheduled_run, log_output
      ) VALUES (
        datetime('now', '-9 hours'),
        'success',
        1,
        1,
        'Senior AI Systems & Full-Stack Engineer | Python, React, LLMs',
        'Senior AI Systems & Full-Stack Engineer | Python, React, LLMs.',
        '2026-11-10 08:52:00',
        'Session connected via CDP: Profile page loaded -> Resume PDF uploaded successfully -> Headline toggled trailing period -> Profile timestamp updated.'
      )
    `).run();
  }
}
