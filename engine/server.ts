import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { db, initDatabase } from './db';
import { browserManager } from './browser-manager';
import { NaukriBooster } from './naukri-booster';
import { discoveryOrchestrator } from './scrapers/discovery-runner';
import { careerOpsEvaluator } from './evaluator/evaluator';
import { ResumeCompiler } from './pdf/compiler';
import { applyOrchestrator } from './applier/apply-orchestrator';

const app = express();
const PORT = 4173;

app.use(cors());
app.use(express.json());

// Serve static compiled PDFs and assets from data
app.use('/data', express.static(path.resolve(process.cwd(), 'data')));
app.use('/data/cv_tailored', express.static(path.resolve(process.cwd(), 'data', 'cv_tailored')));

// Initialize DB on server start
initDatabase();

// 1. System Health & Dashboard Status
app.get('/api/status', async (req, res) => {
  try {
    const jobsCount = db.prepare('SELECT count(*) as c FROM job_listings').get() as { c: number };
    const evaluatedCount = db.prepare('SELECT count(*) as c FROM evaluations').get() as { c: number };
    const queuedCount = db.prepare('SELECT count(*) as c FROM job_listings WHERE status = "queued"').get() as { c: number };
    const appliedCount = db.prepare('SELECT count(*) as c FROM job_listings WHERE status = "applied"').get() as { c: number };
    const tailoredCount = db.prepare('SELECT count(*) as c FROM tailored_documents WHERE doc_type = "cv"').get() as { c: number };
    const lastBoosterLog = db.prepare('SELECT * FROM naukri_booster_logs ORDER BY id DESC LIMIT 1').get() as any;

    res.json({
      success: true,
      stats: {
        totalJobs: jobsCount.c,
        evaluated: evaluatedCount.c,
        queued: queuedCount.c,
        applied: appliedCount.c,
        tailored: tailoredCount.c,
      },
      lastBooster: lastBoosterLog || null,
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Job Listings & Detail
app.get('/api/jobs', (req, res) => {
  try {
    const jobs = db.prepare(`
      SELECT j.*, e.score, e.legitimacy_tier as legitimacyTier, e.final_decision as finalDecision,
             d.file_path as tailoredDocPath
      FROM job_listings j
      LEFT JOIN evaluations e ON j.id = e.job_id
      LEFT JOIN tailored_documents d ON j.id = d.job_id AND d.doc_type = 'cv'
      ORDER BY j.created_at DESC
    `).all();

    res.json({ success: true, jobs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/jobs/:id', (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(req.params.id) as any;
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    const evaluation = db.prepare('SELECT * FROM evaluations WHERE job_id = ?').get(req.params.id) as any;
    const documents = db.prepare('SELECT * FROM tailored_documents WHERE job_id = ?').all(req.params.id);

    let parsedEval = null;
    if (evaluation) {
      parsedEval = {
        ...evaluation,
        confidenceGaps: JSON.parse(evaluation.confidence_gaps || '[]'),
        hardStops: JSON.parse(evaluation.hard_stops || '[]'),
        softGaps: JSON.parse(evaluation.soft_gaps || '[]'),
        topStrengths: JSON.parse(evaluation.top_strengths || '[]'),
        blockASummary: JSON.parse(evaluation.block_a_summary || '{}'),
        blockBRequirements: JSON.parse(evaluation.block_b_requirements || '[]'),
        blockCStrategy: JSON.parse(evaluation.block_c_strategy || '{}'),
        blockDComp: JSON.parse(evaluation.block_d_comp || '{}'),
        blockEPersonalization: JSON.parse(evaluation.block_e_personalization || '[]'),
        blockFInterview: JSON.parse(evaluation.block_f_interview || '{}'),
        blockGLegitimacy: JSON.parse(evaluation.block_g_legitimacy || '{}'),
        blockHAnswers: JSON.parse(evaluation.block_h_answers || '{}'),
        riskSummary: JSON.parse(evaluation.risk_summary || '{}'),
        scoreEvidence: JSON.parse(evaluation.score_evidence || '{}')
      };
    }

    res.json({ success: true, job, evaluation: parsedEval, documents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Vault & Master CV
app.get('/api/vault', (req, res) => {
  try {
    const vaultRow = db.prepare('SELECT * FROM personal_vault WHERE id = 1').get() as any;
    const cvRow = db.prepare("SELECT * FROM master_cv WHERE id = 'cv-master-v1'").get() as any;

    const vault = vaultRow ? {
      ...vaultRow,
      preferredLocations: JSON.parse(vaultRow.preferred_locations || '[]'),
      authorizedCountries: JSON.parse(vaultRow.authorized_countries || '[]'),
      qaSnippets: JSON.parse(vaultRow.qa_snippets || '{}')
    } : null;

    const masterCv = cvRow ? {
      ...cvRow,
      summaryVariants: JSON.parse(cvRow.summary_variants || '{}'),
      skillsTaxonomy: JSON.parse(cvRow.skills_taxonomy || '{}'),
      workExperience: JSON.parse(cvRow.work_experience || '[]'),
      education: JSON.parse(cvRow.education || '[]'),
      certifications: JSON.parse(cvRow.certifications || '[]'),
      projects: JSON.parse(cvRow.projects || '[]'),
      awards: JSON.parse(cvRow.awards || '[]')
    } : null;

    res.json({ success: true, vault, masterCv });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/vault', (req, res) => {
  try {
    const { vault, masterCv } = req.body;
    if (vault) {
      db.prepare(`
        UPDATE personal_vault SET
          full_name = ?, email = ?, phone = ?, location = ?,
          linkedin_url = ?, github_url = ?, portfolio_url = ?,
          current_ctc_lakhs = ?, expected_ctc_lakhs = ?, ctc_negotiable = ?,
          notice_period_days = ?, last_working_day = ?, buyout_available = ?,
          preferred_locations = ?, relocation_willing = ?, visa_status = ?,
          gender = ?, disability_status = ?, qa_snippets = ?, updated_at = datetime('now')
        WHERE id = 1
      `).run(
        vault.fullName, vault.email, vault.phone, vault.location,
        vault.linkedinUrl, vault.githubUrl, vault.portfolioUrl,
        vault.currentCtcLakhs, vault.expectedCtcLakhs, vault.ctcNegotiable ? 1 : 0,
        vault.noticePeriodDays, vault.lastWorkingDay || null, vault.buyoutAvailable ? 1 : 0,
        JSON.stringify(vault.preferredLocations), vault.relocationWilling ? 1 : 0, vault.visaStatus,
        vault.gender, vault.disabilityStatus, JSON.stringify(vault.qaSnippets)
      );
    }
    if (masterCv) {
      db.prepare(`
        UPDATE master_cv SET
          title = ?, summary_variants = ?, skills_taxonomy = ?,
          work_experience = ?, education = ?, certifications = ?, projects = ?,
          updated_at = datetime('now')
        WHERE id = 'cv-master-v1'
      `).run(
        masterCv.title,
        JSON.stringify(masterCv.summaryVariants),
        JSON.stringify(masterCv.skillsTaxonomy),
        JSON.stringify(masterCv.workExperience),
        JSON.stringify(masterCv.education),
        JSON.stringify(masterCv.certifications),
        JSON.stringify(masterCv.projects)
      );
    }
    res.json({ success: true, message: 'Vault updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Trigger Multi-Portal Discovery Scan
app.post('/api/discovery/run', async (req, res) => {
  try {
    const { keywords, location, evaluateImmediately } = req.body;
    console.log(`[UI Server] Discovery requested: keywords="${keywords}", location="${location}"`);
    const result = await discoveryOrchestrator.runDiscovery({
      keywords: keywords || 'AI Engineer',
      location: location || 'India',
      evaluateImmediately: evaluateImmediately ?? true
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Trigger Naukri Profile Booster ("The 9 AM Refresh")
app.post('/api/booster/run', async (req, res) => {
  try {
    const { dryRun, headless } = req.body;
    console.log(`[UI Server] Naukri Booster triggered. Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    const booster = new NaukriBooster();
    const result = await booster.executeBooster({
      dryRun: dryRun ?? false,
      headless: headless ?? true
    });
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Trigger Single Job Evaluation (career-ops Blocks A-H)
app.post('/api/evaluator/evaluate/:jobId', async (req, res) => {
  try {
    console.log(`[UI Server] Evaluating job: ${req.params.jobId}`);
    const report = await careerOpsEvaluator.evaluateJob(req.params.jobId);
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Trigger Tailored PDF Generation
app.post('/api/compiler/tailor/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(jobId) as any;
    const vaultRow = db.prepare('SELECT * FROM personal_vault WHERE id = 1').get() as any;
    const cvRow = db.prepare("SELECT * FROM master_cv WHERE id = 'cv-master-v1'").get() as any;

    const vault = {
      ...vaultRow,
      preferredLocations: JSON.parse(vaultRow.preferred_locations),
      authorizedCountries: JSON.parse(vaultRow.authorized_countries),
      qaSnippets: JSON.parse(vaultRow.qa_snippets)
    };

    const masterCv = {
      ...cvRow,
      summaryVariants: JSON.parse(cvRow.summary_variants),
      skillsTaxonomy: JSON.parse(cvRow.skills_taxonomy),
      workExperience: JSON.parse(cvRow.work_experience),
      education: JSON.parse(cvRow.education),
      certifications: JSON.parse(cvRow.certifications),
      projects: JSON.parse(cvRow.projects),
      awards: JSON.parse(cvRow.awards)
    };

    const compiler = new ResumeCompiler();
    const result = await compiler.compileTailoredPackage(jobId, vault, masterCv, {
      company: job.company,
      roleTitle: job.title
    });

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7b. Trigger Master Resume Compilation
app.post('/api/compiler/recompile-master', async (req, res) => {
  try {
    const vaultRow = db.prepare('SELECT * FROM personal_vault WHERE id = 1').get() as any;
    const cvRow = db.prepare("SELECT * FROM master_cv WHERE id = 'cv-master-v1'").get() as any;

    if (!vaultRow || !cvRow) {
      return res.status(404).json({ success: false, error: 'Vault or Master CV not found' });
    }

    const vault = {
      ...vaultRow,
      preferredLocations: JSON.parse(vaultRow.preferred_locations || '[]'),
      authorizedCountries: JSON.parse(vaultRow.authorized_countries || '[]'),
      qaSnippets: JSON.parse(vaultRow.qa_snippets || '{}')
    };

    const masterCv = {
      ...cvRow,
      summaryVariants: JSON.parse(cvRow.summary_variants || '{}'),
      skillsTaxonomy: JSON.parse(cvRow.skills_taxonomy || '{}'),
      workExperience: JSON.parse(cvRow.work_experience || '[]'),
      education: JSON.parse(cvRow.education || '[]'),
      certifications: JSON.parse(cvRow.certifications || '[]'),
      projects: JSON.parse(cvRow.projects || '[]'),
      awards: JSON.parse(cvRow.awards || '[]')
    };

    const compiler = new ResumeCompiler();
    const result = await compiler.compileMasterCv(vault, masterCv);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Trigger 3-Layer Auto-Applier (Co-Pilot or Auto-Pilot)
app.post('/api/applier/apply/:jobId', async (req, res) => {
  try {
    const { forceMode, dryRun } = req.body;
    console.log(`[UI Server] Applying to job: ${req.params.jobId} [Mode: ${forceMode || 'DEFAULT'}]`);
    const result = await applyOrchestrator.applyToJob(req.params.jobId, {
      forceMode,
      dryRun: dryRun ?? true
    });
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Browser CDP Check and Launcher
app.get('/api/system/browser-status', async (req, res) => {
  try {
    const status = await browserManager.testSessionStatus({ headless: true });
    res.json({ success: true, ...status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/system/launch-chrome-cdp', (req, res) => {
  const scriptPath = path.resolve(process.cwd(), 'scripts', 'launch-chrome-cdp.ps1');
  exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, message: 'Chrome launched with CDP on Port 9222', output: stdout });
  });
});

// 10. Register Windows Task Scheduler Hook
app.post('/api/system/schedule-task', (req, res) => {
  const scriptPath = path.resolve(process.cwd(), 'scripts', 'schedule-naukri-booster.ps1');
  exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, message: 'Windows Task Scheduler registered for 08:55 AM IST', output: stdout });
  });
});

// 11. Automation Rules API
app.get('/api/rules', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM automation_rules WHERE id = 1').get() as any;
    if (!row) {
      return res.json({ success: true, rules: null });
    }
    res.json({
      success: true,
      rules: {
        ...row,
        blacklistCompanies: JSON.parse(row.blacklist_companies || '[]'),
        blacklistKeywords: JSON.parse(row.blacklist_keywords || '[]')
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/rules', (req, res) => {
  try {
    const { rules } = req.body;
    if (!rules) return res.status(400).json({ success: false, error: 'Missing rules' });

    db.prepare(`
      INSERT INTO automation_rules (
        id, linkedin_daily_limit, naukri_daily_limit, delay_min_sec, delay_max_sec,
        min_score_threshold, blacklist_companies, blacklist_keywords,
        auto_pilot_linkedin, auto_pilot_naukri, auto_pilot_workday, auto_pilot_greenhouse, updated_at
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
      )
      ON CONFLICT(id) DO UPDATE SET
        linkedin_daily_limit = excluded.linkedin_daily_limit,
        naukri_daily_limit = excluded.naukri_daily_limit,
        delay_min_sec = excluded.delay_min_sec,
        delay_max_sec = excluded.delay_max_sec,
        min_score_threshold = excluded.min_score_threshold,
        blacklist_companies = excluded.blacklist_companies,
        blacklist_keywords = excluded.blacklist_keywords,
        auto_pilot_linkedin = excluded.auto_pilot_linkedin,
        auto_pilot_naukri = excluded.auto_pilot_naukri,
        auto_pilot_workday = excluded.auto_pilot_workday,
        auto_pilot_greenhouse = excluded.auto_pilot_greenhouse,
        updated_at = datetime('now')
    `).run(
      rules.linkedinLimit || rules.linkedin_daily_limit || 25,
      rules.naukriLimit || rules.naukri_daily_limit || 50,
      rules.delayMin || rules.delay_min_sec || 8,
      rules.delayMax || rules.delay_max_sec || 25,
      rules.scoreThreshold || rules.min_score_threshold || 4.0,
      JSON.stringify(rules.blacklistedCompanies || rules.blacklistCompanies || []),
      JSON.stringify(rules.blacklistedKeywords || rules.blacklistKeywords || []),
      rules.toggles?.linkedin === 'auto_pilot' ? 1 : 0,
      rules.toggles?.naukri === 'auto_pilot' ? 1 : 0,
      rules.toggles?.workday === 'auto_pilot' ? 1 : 0,
      rules.toggles?.greenhouse === 'auto_pilot' ? 1 : 0
    );

    res.json({ success: true, message: 'Automation rules saved to SQLite' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. System Settings API
app.get('/api/settings', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM system_settings WHERE id = 1').get() as any;
    res.json({ success: true, settings: row || null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) return res.status(400).json({ success: false, error: 'Missing settings' });

    db.prepare(`
      INSERT INTO system_settings (
        id, llm_provider, llm_model, llm_api_key_encrypted, chrome_user_data_dir,
        edge_user_data_dir, preferred_browser, naukri_refresh_time, naukri_refresh_jitter_mins, updated_at
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
      )
      ON CONFLICT(id) DO UPDATE SET
        llm_provider = excluded.llm_provider,
        llm_model = excluded.llm_model,
        llm_api_key_encrypted = excluded.llm_api_key_encrypted,
        chrome_user_data_dir = excluded.chrome_user_data_dir,
        edge_user_data_dir = excluded.edge_user_data_dir,
        preferred_browser = excluded.preferred_browser,
        naukri_refresh_time = excluded.naukri_refresh_time,
        naukri_refresh_jitter_mins = excluded.naukri_refresh_jitter_mins,
        updated_at = datetime('now')
    `).run(
      settings.llmProvider || 'gemini',
      settings.llmModel || 'gemini-1.5-flash',
      settings.llmApiKey || '',
      settings.chromeProfilePath || '',
      settings.edgeProfilePath || '',
      settings.preferredBrowser || 'chrome',
      settings.naukriTime || '08:55',
      settings.naukriJitter || 15
    );

    res.json({ success: true, message: 'System settings saved to SQLite' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export { app };

export function startServer() {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`[jobSuite UI Server] Running at http://127.0.0.1:${PORT}`);
  });
}

// Auto-start if run directly
if (process.argv.includes('--start')) {
  startServer();
}
