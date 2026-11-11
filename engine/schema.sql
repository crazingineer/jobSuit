-- jobSuite SQLite Database Schema
-- Optimized for native Windows performance, career-ops evaluation blocks A-H,
-- Indian & Global recruitment vaults, ATS account ledger, and persistent Playwright automation.

PRAGMA foreign_keys = ON;

-- 1. Personal Fact Vault (Contact, ATS Credentials, Indian recruitment CTC & Notice, Global Auth, Standard Q&A)
CREATE TABLE IF NOT EXISTS personal_vault (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  -- ATS Account & Login Automation Credentials
  ats_email TEXT,
  ats_password_encrypted TEXT,
  ats_auth_strategy TEXT DEFAULT 'try_login_then_signup', -- 'try_login_then_signup' | 'copilot_confirm'
  -- Indian Specific Recruitment Fields
  current_ctc_lakhs REAL DEFAULT 0.0,
  expected_ctc_lakhs REAL DEFAULT 0.0,
  ctc_negotiable INTEGER DEFAULT 1,
  notice_period_days INTEGER DEFAULT 60,
  last_working_day TEXT,
  buyout_available INTEGER DEFAULT 1,
  preferred_locations TEXT DEFAULT '["Bengaluru", "Remote"]', -- JSON array
  relocation_willing INTEGER DEFAULT 1,
  -- Global Work Authorization & EEO
  authorized_countries TEXT DEFAULT '["IN", "US"]', -- JSON array
  needs_sponsorship INTEGER DEFAULT 0,
  visa_status TEXT DEFAULT 'Citizen / Permanent Resident',
  gender TEXT DEFAULT 'Decline to self-identify',
  disability_status TEXT DEFAULT 'Decline to self-identify',
  veteran_status TEXT DEFAULT 'Decline to self-identify',
  eeo_ethnicity TEXT DEFAULT 'Decline to self-identify',
  -- Standard Application Q&A Snippets (Why us, Strengths, Leadership, Career Transition)
  qa_snippets TEXT DEFAULT '{}', -- JSON object: key -> text
  updated_at TEXT NOT NULL
);

-- 2. Master CV Schema (Versioned, modular bullet points, skills taxonomy)
CREATE TABLE IF NOT EXISTS master_cv (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  summary_variants TEXT NOT NULL, -- JSON: { "powerPlatform": "...", "dataEngineering": "...", "aiAutomation": "..." }
  skills_taxonomy TEXT NOT NULL,  -- JSON: { "languages": [], "frameworks": [], "aiLlm": [], "cloudDevops": [] }
  work_experience TEXT NOT NULL,  -- JSON array of { company, role, location, dates, bullets: [{ id, text, metrics, tags }] }
  education TEXT NOT NULL,        -- JSON array of { degree, institution, location, year, description }
  certifications TEXT NOT NULL,   -- JSON array of { title, issuer, year, url }
  projects TEXT NOT NULL,         -- JSON array of { name, description, tech: [], bullets: [], url }
  awards TEXT DEFAULT '[]',       -- JSON array of { title, org, year }
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. Job Listings (Discovered across LinkedIn, Naukri, HiringCafe, Workday, Greenhouse, etc.)
CREATE TABLE IF NOT EXISTS job_listings (
  id TEXT PRIMARY KEY,
  portal TEXT NOT NULL CHECK(portal IN ('linkedin', 'naukri', 'hiringcafe', 'workday', 'greenhouse', 'lever', 'ashby', 'other')),
  portal_job_id TEXT,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_slug TEXT NOT NULL,
  location TEXT,
  remote_type TEXT DEFAULT 'Onsite', -- Remote, Hybrid, Onsite
  posted_date TEXT,
  captured_at TEXT NOT NULL,
  raw_jd_text TEXT NOT NULL,
  company_type TEXT, -- Public Big Tech, VC Startup, Enterprise, Agency/Recruiter
  reports_to TEXT,
  advertised_comp TEXT,
  status TEXT DEFAULT 'discovered' CHECK(status IN ('discovered', 'evaluated', 'tailored', 'queued', 'applied', 'rejected', 'interview', 'skipped')),
  easy_apply INTEGER DEFAULT 0,
  external_apply_url TEXT,
  ats_provider TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_listings(status);
CREATE INDEX IF NOT EXISTS idx_jobs_portal ON job_listings(portal);
CREATE INDEX IF NOT EXISTS idx_jobs_company_slug ON job_listings(company_slug);

-- 4. The career-ops A-H Structured Evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  score REAL NOT NULL, -- 1.0 to 5.0 holistic score
  final_decision TEXT NOT NULL CHECK(final_decision IN ('Apply', 'Consider', 'Research first', 'Skip')),
  archetype TEXT NOT NULL,
  legitimacy_tier TEXT NOT NULL CHECK(legitimacy_tier IN ('High Confidence', 'Proceed with Caution', 'Suspicious')),
  work_auth_tier TEXT NOT NULL CHECK(work_auth_tier IN ('Sponsors', 'Not needed', 'Unstated', 'No sponsorship')),
  -- 5-Dimension Score Components
  cv_match_score REAL DEFAULT 0.0,
  north_star_score REAL DEFAULT 0.0,
  comp_score REAL DEFAULT 0.0,
  culture_score REAL DEFAULT 0.0,
  red_flags_deduction REAL DEFAULT 0.0,
  evidence_confidence TEXT NOT NULL CHECK(evidence_confidence IN ('High', 'Medium', 'Low')),
  confidence_gaps TEXT DEFAULT '[]', -- JSON array
  hard_stops TEXT DEFAULT '[]',      -- JSON array
  soft_gaps TEXT DEFAULT '[]',       -- JSON array
  top_strengths TEXT DEFAULT '[]',   -- JSON array
  -- Structured Blocks Content
  block_a_summary TEXT NOT NULL,        -- JSON: archetype, domain, seniority, work mode, work_auth details
  block_b_requirements TEXT NOT NULL,   -- JSON array: { requirement, importance, evidence, match, jd_signal, gap, mitigation }
  block_c_strategy TEXT NOT NULL,       -- JSON: level match, positioning, downlevel strategy
  block_d_comp TEXT NOT NULL,           -- JSON: company type, reliability tier, base/variable split, comp score
  block_e_personalization TEXT NOT NULL,-- JSON array: { id, section, current_state, proposed_change, why }
  block_f_interview TEXT NOT NULL,      -- JSON: { star_stories: [], case_study, red_flag_qa }
  block_g_legitimacy TEXT NOT NULL,     -- JSON: 22 signal evaluations
  block_h_answers TEXT DEFAULT '{}',    -- JSON: tailored application answers (if score >= 4.0)
  risk_summary TEXT NOT NULL,           -- JSON: machine-readable risk summary
  score_evidence TEXT NOT NULL,         -- JSON: 5 dimension audit
  machine_summary_yaml TEXT NOT NULL,   -- Verbatim YAML fence
  full_markdown_report TEXT NOT NULL,   -- Full report formatted markdown
  evaluated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eval_job_id ON evaluations(job_id);
CREATE INDEX IF NOT EXISTS idx_eval_score ON evaluations(score);
CREATE INDEX IF NOT EXISTS idx_eval_decision ON evaluations(final_decision);

-- 5. Tailored Documents (PDFs, Diff summary, and JSON payloads)
CREATE TABLE IF NOT EXISTS tailored_documents (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK(doc_type IN ('cv', 'cover_letter')),
  file_path TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  diff_json TEXT NOT NULL, -- Exact modified bullets vs master CV
  compiled_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_doc_job_id ON tailored_documents(job_id);

-- 6. Application State Machine & Execution Runs
CREATE TABLE IF NOT EXISTS application_runs (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  portal TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('auto_pilot', 'co_pilot')),
  status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'awaiting_approval', 'submitted', 'failed', 'cancelled')),
  step_reached TEXT,
  error_message TEXT,
  screenshot_path TEXT,
  form_answers_snapshot TEXT DEFAULT '{}', -- JSON of filled values
  started_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_app_runs_job_id ON application_runs(job_id);
CREATE INDEX IF NOT EXISTS idx_app_runs_status ON application_runs(status);

-- 7. Naukri Daily Refresher ("The 9 AM Refresh") Logs
CREATE TABLE IF NOT EXISTS naukri_booster_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  executed_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'running')),
  resume_uploaded INTEGER DEFAULT 0,
  headline_modified INTEGER DEFAULT 0,
  headline_before TEXT,
  headline_after TEXT,
  next_scheduled_run TEXT,
  error_message TEXT,
  log_output TEXT
);

-- 8. Dynamic DOM Selector Cache (Self-healing ATS mapping)
CREATE TABLE IF NOT EXISTS dom_selector_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,
  field_signature TEXT NOT NULL, -- e.g. "ctc_input", "notice_period_radio", "eeo_veteran"
  selector_path TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,
  last_used_at TEXT NOT NULL,
  UNIQUE(domain, field_signature)
);

-- 9. ATS Portal Account Ledger (Tracks whether an account exists per tenant domain for Login vs Sign-Up resolution)
CREATE TABLE IF NOT EXISTS ats_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE, -- e.g. "mastercard.wd1.myworkdayjobs.com"
  portal_type TEXT NOT NULL,   -- e.g. "workday", "icims", "smartrecruiters"
  email_used TEXT NOT NULL,
  account_status TEXT DEFAULT 'registered' CHECK(account_status IN ('registered', 'verified', 'needs_verification')),
  last_login_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 10. Automation Rules & Safety Limits
CREATE TABLE IF NOT EXISTS automation_rules (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  linkedin_daily_limit INTEGER DEFAULT 25,
  naukri_daily_limit INTEGER DEFAULT 50,
  delay_min_sec INTEGER DEFAULT 8,
  delay_max_sec INTEGER DEFAULT 25,
  min_score_threshold REAL DEFAULT 4.0,
  blacklist_companies TEXT DEFAULT '[]', -- JSON array
  blacklist_keywords TEXT DEFAULT '[]',  -- JSON array
  auto_pilot_linkedin INTEGER DEFAULT 0,
  auto_pilot_naukri INTEGER DEFAULT 0,
  auto_pilot_workday INTEGER DEFAULT 0,
  auto_pilot_greenhouse INTEGER DEFAULT 1,
  updated_at TEXT NOT NULL
);

-- 11. System Settings & Secure BYOK Credentials
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  llm_provider TEXT DEFAULT 'gemini',
  llm_model TEXT DEFAULT 'gemini-1.5-flash',
  llm_api_key_encrypted TEXT,
  chrome_user_data_dir TEXT,
  edge_user_data_dir TEXT,
  preferred_browser TEXT DEFAULT 'chrome',
  typst_path TEXT,
  naukri_refresh_time TEXT DEFAULT '08:55',
  naukri_refresh_jitter_mins INTEGER DEFAULT 15,
  updated_at TEXT NOT NULL
);
