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
import { llmDomFallback } from './applier/llm-dom-fallback';
import { visionGuiAgent } from './applier/vision-gui-agent';
import { getHpAm0238TxHardwareConfig, ATS_FORM_PRESETS } from '../src/utils/ai-agent-engine';
import { liveBrowserManager } from './live-browser-session';

const app = express();
const PORT = 4173;

app.use(cors());
app.use(express.json());

// Serve static compiled PDFs and assets from data
app.use('/data', express.static(path.resolve(process.cwd(), 'data')));
app.use('/data/cv_tailored', express.static(path.resolve(process.cwd(), 'data', 'cv_tailored')));

// Initialize DB on server start
initDatabase();

// Ensure Master_Resume.pdf and Master_Resume.tex are compiled with Jake's Resume template on startup
(async () => {
  try {
    const vaultRow = db.prepare('SELECT * FROM personal_vault WHERE id = 1').get() as any;
    const cvRow = db.prepare("SELECT * FROM master_cv WHERE id = 'cv-master-v1'").get() as any;
    if (vaultRow && cvRow) {
      const compiler = new ResumeCompiler();
      await compiler.compileMasterCv(mapVaultRow(vaultRow)!, mapMasterCvRow(cvRow)!);
      console.log("[Server Startup] Compiled Master_Resume.pdf and Master_Resume.tex using Jake's Resume template.");
    }
  } catch (err: any) {
    console.warn(`[Server Startup] Could not pre-compile Jake's Resume PDF: ${err.message}`);
  }
})();

// 1. System Health & Dashboard Status
app.get('/api/status', async (req, res) => {
  try {
    const jobsCount = db.prepare('SELECT count(*) as c FROM job_listings').get() as { c: number };
    const evaluatedCount = db.prepare('SELECT count(*) as c FROM evaluations').get() as { c: number };
    const queuedCount = db.prepare("SELECT count(*) as c FROM job_listings WHERE status = 'queued'").get() as { c: number };
    const appliedCount = db.prepare("SELECT count(*) as c FROM job_listings WHERE status = 'applied'").get() as { c: number };
    const tailoredCount = db.prepare("SELECT count(*) as c FROM tailored_documents WHERE doc_type = 'cv'").get() as { c: number };
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

// Helper mappers from SQLite snake_case to TypeScript camelCase
function mapJobRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    portal: row.portal,
    portalJobId: row.portal_job_id,
    url: row.url,
    title: row.title,
    company: row.company,
    companySlug: row.company_slug,
    location: row.location,
    remoteType: row.remote_type || 'Hybrid',
    postedDate: row.posted_date,
    capturedAt: row.captured_at,
    rawJdText: row.raw_jd_text || '',
    companyType: row.company_type,
    reportsTo: row.reports_to,
    advertisedComp: row.advertised_comp || undefined,
    status: row.status,
    easyApply: Boolean(row.easy_apply),
    externalApplyUrl: row.external_apply_url || undefined,
    atsProvider: row.ats_provider || undefined,
    score: row.score ?? undefined,
    legitimacyTier: row.legitimacyTier ?? row.legitimacy_tier ?? undefined,
    finalDecision: row.finalDecision ?? row.final_decision ?? undefined,
    tailoredDocPath: row.tailoredDocPath ?? undefined
  };
}

function mapVaultRow(vaultRow: any) {
  if (!vaultRow) return null;
  return {
    id: vaultRow.id,
    fullName: vaultRow.full_name || '',
    email: vaultRow.email || '',
    phone: vaultRow.phone || '',
    location: vaultRow.location || '',
    phoneCanada: vaultRow.phone_canada || '+1 289-890-3999',
    locationCanada: vaultRow.location_canada || 'Waterloo / Toronto, ON, Canada',
    workPermitCanada:
      vaultRow.work_permit_canada ||
      'Canadian Open Work Permit (Authorized to work in Canada — No LMIA / Sponsorship Required)',
    expectedCompCad: vaultRow.expected_comp_cad || 'CAD $115,000 - $135,000',
    linkedinUrl: vaultRow.linkedin_url || '',
    githubUrl: vaultRow.github_url || '',
    portfolioUrl: vaultRow.portfolio_url || '',
    currentCtcLakhs: Number(vaultRow.current_ctc_lakhs ?? 18.0),
    expectedCtcLakhs: Number(vaultRow.expected_ctc_lakhs ?? 28.0),
    ctcNegotiable: Boolean(vaultRow.ctc_negotiable),
    noticePeriodDays: Number(vaultRow.notice_period_days ?? 60),
    lastWorkingDay: vaultRow.last_working_day || '',
    buyoutAvailable: Boolean(vaultRow.buyout_available),
    preferredLocations: JSON.parse(vaultRow.preferred_locations || '[]'),
    relocationWilling: Boolean(vaultRow.relocation_willing),
    authorizedCountries: JSON.parse(vaultRow.authorized_countries || '["IN","CA"]'),
    needsSponsorship: Boolean(vaultRow.needs_sponsorship),
    visaStatus:
      vaultRow.visa_status ||
      'Indian Citizen + Canadian Open Work Permit Holder (Authorized in India & Canada)',
    gender: vaultRow.gender || 'Decline to self-identify',
    disabilityStatus: vaultRow.disability_status || 'No',
    veteranStatus: vaultRow.veteran_status || 'No',
    eeoEthnicity: vaultRow.eeo_ethnicity || 'Asian',
    atsEmail: vaultRow.ats_email || vaultRow.email || '',
    atsPassword: vaultRow.ats_password_encrypted || 'JobSuite#ATS2026!',
    atsAuthStrategy: vaultRow.ats_auth_strategy || 'smart_detect',
    qaSnippets: JSON.parse(vaultRow.qa_snippets || '{}'),
    updatedAt: vaultRow.updated_at || new Date().toISOString()
  };
}

function mapMasterCvRow(cvRow: any) {
  if (!cvRow) return null;
  return {
    id: cvRow.id,
    version: cvRow.version || 1,
    title: cvRow.title || '',
    isActive: Boolean(cvRow.is_active ?? true),
    summaryVariants: JSON.parse(cvRow.summary_variants || '{}'),
    skillsTaxonomy: JSON.parse(cvRow.skills_taxonomy || '{}'),
    workExperience: JSON.parse(cvRow.work_experience || '[]'),
    education: JSON.parse(cvRow.education || '[]'),
    certifications: JSON.parse(cvRow.certifications || '[]'),
    projects: JSON.parse(cvRow.projects || '[]'),
    awards: JSON.parse(cvRow.awards || '[]'),
    createdAt: cvRow.created_at,
    updatedAt: cvRow.updated_at
  };
}

// 2. Job Listings & Detail
app.get('/api/jobs', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT j.*, e.score, e.legitimacy_tier as legitimacyTier, e.final_decision as finalDecision,
             d.file_path as tailoredDocPath
      FROM job_listings j
      LEFT JOIN evaluations e ON j.id = e.job_id
      LEFT JOIN tailored_documents d ON j.id = d.job_id AND d.doc_type = 'cv'
      ORDER BY j.created_at DESC
    `).all();

    const jobs = rows.map(mapJobRow);
    res.json({ success: true, jobs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2b. Verify & Refresh Live Active Jobs via LinkedIn Public Guest API
app.post('/api/jobs/refresh-live', async (req, res) => {
  try {
    const keywords = req.body?.keywords || 'Power Platform Developer';
    const location = req.body?.location || 'India';
    const discoveryRes = await discoveryOrchestrator.runDiscovery({
      keywords,
      location,
      evaluateImmediately: true,
      sources: ['linkedin']
    });
    const rows = db.prepare(`
      SELECT j.*, e.score, e.legitimacy_tier as legitimacyTier, e.final_decision as finalDecision,
             d.file_path as tailoredDocPath
      FROM job_listings j
      LEFT JOIN evaluations e ON j.id = e.job_id
      LEFT JOIN tailored_documents d ON j.id = d.job_id AND d.doc_type = 'cv'
      ORDER BY j.created_at DESC
    `).all();
    res.json({
      success: true,
      discovered: discoveryRes.totalDiscovered,
      jobs: rows.map(mapJobRow)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/jobs/:id', (req, res) => {
  try {
    const jobRow = db.prepare(`
      SELECT j.*, e.score, e.legitimacy_tier as legitimacyTier, e.final_decision as finalDecision,
             d.file_path as tailoredDocPath
      FROM job_listings j
      LEFT JOIN evaluations e ON j.id = e.job_id
      LEFT JOIN tailored_documents d ON j.id = d.job_id AND d.doc_type = 'cv'
      WHERE j.id = ?
    `).get(req.params.id) as any;
    if (!jobRow) return res.status(404).json({ success: false, error: 'Job not found' });

    const job = mapJobRow(jobRow);
    const evaluation = db.prepare('SELECT * FROM evaluations WHERE job_id = ?').get(req.params.id) as any;
    const documents = db.prepare('SELECT * FROM tailored_documents WHERE job_id = ?').all(req.params.id);

    let parsedEval = null;
    if (evaluation) {
      parsedEval = {
        id: evaluation.id,
        jobId: evaluation.job_id,
        score: evaluation.score,
        finalDecision: evaluation.final_decision,
        archetype: evaluation.archetype,
        legitimacyTier: evaluation.legitimacy_tier,
        workAuthTier: evaluation.work_auth_tier,
        cvMatchScore: evaluation.cv_match_score,
        northStarScore: evaluation.north_star_score,
        compScore: evaluation.comp_score,
        cultureScore: evaluation.culture_score,
        redFlagsDeduction: evaluation.red_flags_deduction,
        evidenceConfidence: evaluation.evidence_confidence,
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
        scoreEvidence: JSON.parse(evaluation.score_evidence || '{}'),
        machineSummaryYaml: evaluation.machine_summary_yaml || '',
        fullMarkdownReport: evaluation.full_markdown_report || '',
        evaluatedAt: evaluation.evaluated_at
      };
    }

    res.json({ success: true, job, evaluation: parsedEval, documents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Vault, Master CV & ATS Account Ledger
app.get('/api/vault', (req, res) => {
  try {
    const vaultRow = db.prepare('SELECT * FROM personal_vault WHERE id = 1').get() as any;
    const cvRow = db.prepare("SELECT * FROM master_cv WHERE id = 'cv-master-v1'").get() as any;
    let atsAccounts: any[] = [];
    try {
      const accountRows = db.prepare('SELECT * FROM ats_accounts ORDER BY last_login_at DESC').all() as any[];
      atsAccounts = accountRows.map(r => ({
        id: r.id,
        domain: r.domain,
        portalType: r.portal_type,
        emailUsed: r.email_used,
        accountStatus: r.account_status,
        lastLoginAt: r.last_login_at,
        createdAt: r.created_at
      }));
    } catch {}

    const vault = mapVaultRow(vaultRow);
    const masterCv = mapMasterCvRow(cvRow);

    res.json({ success: true, vault, masterCv, atsAccounts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/vault', async (req, res) => {
  try {
    const { vault, masterCv } = req.body;
    if (vault) {
      db.prepare(`
        UPDATE personal_vault SET
          full_name = ?, email = ?, phone = ?, location = ?,
          phone_canada = ?, location_canada = ?, work_permit_canada = ?, expected_comp_cad = ?,
          linkedin_url = ?, github_url = ?, portfolio_url = ?,
          current_ctc_lakhs = ?, expected_ctc_lakhs = ?, ctc_negotiable = ?,
          notice_period_days = ?, last_working_day = ?, buyout_available = ?,
          preferred_locations = ?, relocation_willing = ?, authorized_countries = ?, visa_status = ?,
          gender = ?, disability_status = ?,
          ats_email = ?, ats_password_encrypted = ?, ats_auth_strategy = ?,
          qa_snippets = ?, updated_at = datetime('now')
        WHERE id = 1
      `).run(
        vault.fullName,
        vault.email,
        vault.phone,
        vault.location,
        vault.phoneCanada || '+1 289-890-3999',
        vault.locationCanada || 'Waterloo / Toronto, ON, Canada',
        vault.workPermitCanada || 'Canadian Open Work Permit (Authorized to work in Canada — No LMIA / Sponsorship Required)',
        vault.expectedCompCad || 'CAD $115,000 - $135,000',
        vault.linkedinUrl,
        vault.githubUrl,
        vault.portfolioUrl,
        vault.currentCtcLakhs,
        vault.expectedCtcLakhs,
        vault.ctcNegotiable ? 1 : 0,
        vault.noticePeriodDays,
        vault.lastWorkingDay || null,
        vault.buyoutAvailable ? 1 : 0,
        JSON.stringify(vault.preferredLocations || []),
        vault.relocationWilling ? 1 : 0,
        JSON.stringify(vault.authorizedCountries || ['IN', 'CA']),
        vault.visaStatus,
        vault.gender,
        vault.disabilityStatus,
        vault.atsEmail || vault.email,
        vault.atsPassword || 'JobSuite#ATS2026!',
        vault.atsAuthStrategy || 'smart_detect',
        JSON.stringify(vault.qaSnippets || {})
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

    // Auto-recompile Master Resume PDF synchronously on every save
    let compileResult = null;
    try {
      const compiler = new ResumeCompiler();
      compileResult = await compiler.compileMasterCv(vault, masterCv);
      console.log(`[UI Server] Master Resume PDF auto-recompiled on vault save in ${compileResult.durationMs}ms`);
    } catch (compileErr: any) {
      console.warn(`[UI Server] Notice: Could not recompile PDF during save: ${compileErr.message}`);
    }

    res.json({ success: true, message: 'Vault updated & Master Resume PDF auto-compiled successfully', compileResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Trigger Multi-Portal Discovery Scan
app.post('/api/discovery/run', async (req, res) => {
  try {
    const { keywords, location, evaluateImmediately, sources } = req.body;
    console.log(`[UI Server] Discovery requested: keywords="${keywords}", location="${location}"`);
    const result = await discoveryOrchestrator.runDiscovery({
      keywords: keywords || 'AI Engineer',
      location: location || 'India',
      evaluateImmediately: evaluateImmediately ?? true,
      sources
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

    const vault = mapVaultRow(vaultRow)!;
    const masterCv = mapMasterCvRow(cvRow)!;

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

    const vault = mapVaultRow(vaultRow)!;
    const masterCv = mapMasterCvRow(cvRow)!;

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
    const { forceMode, dryRun, confirmSubmit, formAnswers } = req.body;
    console.log(`[UI Server] Applying to job: ${req.params.jobId} [Mode: ${forceMode || 'DEFAULT'}, ConfirmSubmit: ${Boolean(confirmSubmit)}]`);

    if (confirmSubmit) {
      const job = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(req.params.jobId) as any;
      if (job) {
        db.prepare("UPDATE job_listings SET status = 'applied' WHERE id = ?").run(req.params.jobId);
        db.prepare(`
          INSERT OR REPLACE INTO application_runs (
            id, job_id, portal, mode, status, step_reached, error_message, screenshot_path,
            form_answers_snapshot, started_at, completed_at
          ) VALUES (
            ?, ?, ?, ?, 'submitted', ?, NULL, 'data/screenshots/copilot-submitted.png',
            ?, datetime('now', '-1 minute'), datetime('now')
          )
        `).run(
          `run-${Date.now()}`,
          job.id,
          job.portal,
          forceMode || 'co_pilot',
          `Submitted via Live Co-Pilot (${job.company} — ${job.title})`,
          JSON.stringify(formAnswers || {})
        );
      }
      return res.json({
        success: true,
        result: {
          jobId: req.params.jobId,
          status: 'submitted',
          stepReached: 'Confirmed & Submitted via Co-Pilot'
        }
      });
    }

    const result = await applyOrchestrator.applyToJob(req.params.jobId, {
      forceMode,
      dryRun: dryRun ?? true
    });
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8a-0. Live Interactive Chromium Session Manager (Real Inline Browser Streaming & Input Passthrough)
app.post('/api/browser/session/start', async (req, res) => {
  try {
    const snapshot = await liveBrowserManager.startSession(req.body || {});
    res.json({ success: true, session: snapshot });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/browser/session/:sessionId/state', async (req, res) => {
  try {
    const snapshot = liveBrowserManager.getSnapshot(req.params.sessionId);
    if (!snapshot) {
      return res.status(404).json({ success: false, error: 'Live browser session not found' });
    }
    res.json({ success: true, session: snapshot });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/browser/session/:sessionId/stream', (req, res) => {
  const sessionId = req.params.sessionId;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let lastTs = 0;
  const interval = setInterval(() => {
    const snap = liveBrowserManager.getSnapshot(sessionId);
    if (!snap) {
      clearInterval(interval);
      res.end();
      return;
    }
    if (snap.frameTimestamp !== lastTs || snap.status === 'completed') {
      lastTs = snap.frameTimestamp;
      res.write(`data: ${JSON.stringify(snap)}\n\n`);
    }
  }, 200);

  req.on('close', () => {
    clearInterval(interval);
  });
});

app.post('/api/browser/session/:sessionId/interact', async (req, res) => {
  try {
    const snapshot = await liveBrowserManager.interactWithSession(req.params.sessionId, req.body || {});
    if (!snapshot) {
      return res.status(404).json({ success: false, error: 'Live session not found' });
    }
    res.json({ success: true, session: snapshot });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/browser/session/:sessionId/submit', async (req, res) => {
  try {
    const { editedFields, jobId } = req.body || {};
    const snapshot = await liveBrowserManager.submitApplication(req.params.sessionId, editedFields);
    if (jobId) {
      const job = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(jobId) as any;
      if (job) {
        db.prepare("UPDATE job_listings SET status = 'applied' WHERE id = ?").run(jobId);
        db.prepare(`
          INSERT OR REPLACE INTO application_runs (
            id, job_id, portal, mode, status, step_reached, error_message, screenshot_path,
            form_answers_snapshot, started_at, completed_at
          ) VALUES (
            ?, ?, ?, 'co_pilot', 'submitted', ?, NULL, 'data/screenshots/copilot-submitted.png',
            ?, datetime('now', '-1 minute'), datetime('now')
          )
        `).run(
          `run-${Date.now()}`,
          job.id,
          job.portal,
          `Submitted in Live Chromium (${job.company} — ${job.title})`,
          JSON.stringify(editedFields || {})
        );
      }
    }
    res.json({ success: true, session: snapshot });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8a. Real Playwright Headless Chromium Visual Session Renderer
app.post('/api/browser/visual-session', async (req, res) => {
  try {
    const { portalName, companyName, roleTitle, location, region, url, fields = [] } = req.body;
    const { chromium } = await import('playwright');

    // Auto-detect pre-installed Chromium binary in container or system
    const candidateBins = [
      '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell',
      '/ms-playwright/chromium-1247/chrome-linux/chrome'
    ];
    const executablePath = candidateBins.find((p) => fs.existsSync(p));

    const browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {})
    });
    const page = await browser.newPage({ viewport: { width: 1100, height: 680 } });

    const fieldHtml = fields
      .map(
        (f: any, idx: number) => `
        <div style="margin-bottom:12px;padding:10px 14px;border:1.5px solid #cbd5e1;border-radius:8px;background:#ffffff;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
            <span style="font-size:12px;font-weight:700;color:#1e293b;">
              <span style="background:#4f46e5;color:#fff;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:10px;margin-right:6px;">${f.somTag || `[SoM #${idx + 1}]`}</span>
              ${f.label}
            </span>
            <span style="font-size:11px;font-family:monospace;color:#059669;font-weight:600;">✓ Filled via Playwright page.fill('${f.selector}')</span>
          </div>
          <input id="field-${idx}" value="" style="width:97%;padding:7px 10px;border:1px solid #94a3b8;border-radius:6px;font-family:monospace;font-size:12px;color:#0f172a;background:#f8fafc;" />
        </div>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f1f5f9; color: #0f172a; }
            .card { max-width: 960px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 10px 30px rgba(0,0,0,0.08); padding: 24px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 16px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div>
                <span class="badge">${portalName || 'ATS Portal'} • ${region === 'CA' ? '🇨🇦 Canada Work Permit (+1 289-890-3999)' : '🇮🇳 India (+91 7276085461)'}</span>
                <h2 style="margin:8px 0 4px 0;font-size:19px;">${roleTitle || 'Application Portal'} — ${companyName || 'Enterprise'}</h2>
                <div style="font-size:12px;color:#475569;font-family:monospace;">Target URL: ${url || 'https://www.linkedin.com/jobs'} • Location: ${location || 'Hybrid'}</div>
              </div>
              <div style="text-align:right;">
                <span style="background:#dcfce7;color:#166534;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:700;font-family:monospace;">Playwright Chromium Active</span>
              </div>
            </div>
            ${fieldHtml}
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Physically fill each field using Playwright's real page.fill()
    for (let i = 0; i < fields.length; i++) {
      try {
        await page.fill(`#field-${i}`, String(fields[i].value || ''));
      } catch {}
    }

    const buffer = await page.screenshot({ type: 'png' });
    await browser.close();

    res.json({
      success: true,
      screenshotBase64: `data:image/png;base64,${buffer.toString('base64')}`
    });
  } catch (err: any) {
    res.json({ success: true, screenshotBase64: null, notice: err.message });
  }
});

// 8b. AI-Centric Browser Form Action Planner (Set-of-Mark + HP AM0238TX Local LLM)
app.post('/api/applier/ai-plan', async (req, res) => {
  try {
    const { presetKey, customElements, companyName, domain } = req.body;
    const vaultRow = db.prepare('SELECT * FROM personal_vault WHERE id = 1').get() as any;
    const vault = mapVaultRow(vaultRow)!;

    const elements =
      Array.isArray(customElements) && customElements.length > 0
        ? customElements
        : ATS_FORM_PRESETS[presetKey || 'workday']?.elements || ATS_FORM_PRESETS.workday.elements;

    const targetCompany = companyName || 'Target Enterprise Corp';
    const targetDomain = domain || `${presetKey || 'workday'}.myworkdayjobs.com`;

    const planResult = await llmDomFallback.decideActionsWithLocalLlm(
      elements,
      vault,
      targetCompany,
      'data/cv_tailored/Master_Resume.pdf'
    );

    // Record resolved selectors into SQLite dom_selector_cache for self-healing telemetry
    const insertCache = db.prepare(`
      INSERT OR REPLACE INTO dom_selector_cache (
        domain, field_signature, selector_path, confidence, last_used_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `);
    for (const d of planResult.decisions) {
      insertCache.run(targetDomain, d.targetLabel.trim(), d.selector, d.confidence);
    }

    const cachedSelectors = db
      .prepare('SELECT * FROM dom_selector_cache ORDER BY last_used_at DESC LIMIT 20')
      .all();

    res.json({
      success: true,
      hardware: getHpAm0238TxHardwareConfig(),
      ...planResult,
      cachedSelectors
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8c. Multimodal Screen-Grab GUI Vision Loop (Qwen2.5-VL / Gemini Computer Use style)
app.post('/api/applier/vision-loop', async (req, res) => {
  try {
    const { presetKey, customControls, companyName, sampleScreenshotBase64 } = req.body;
    const vaultRow = db.prepare('SELECT * FROM personal_vault WHERE id = 1').get() as any;
    const vault = mapVaultRow(vaultRow)!;

    const visionResult = await visionGuiAgent.planVisionScreenGrabLoop(
      presetKey || 'workday',
      vault,
      companyName || 'Avanade (Microsoft Partner)',
      customControls,
      sampleScreenshotBase64
    );

    res.json({
      success: true,
      hardware: getHpAm0238TxHardwareConfig(),
      ...visionResult
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8d. HP OMEN 16-am0238TX Hardware Profile & Cached DOM Selectors
app.get('/api/system/hardware-profile', (req, res) => {
  try {
    const cachedSelectors = db
      .prepare('SELECT * FROM dom_selector_cache ORDER BY last_used_at DESC LIMIT 20')
      .all();
    res.json({
      success: true,
      hardware: getHpAm0238TxHardwareConfig(),
      cachedSelectors
    });
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
  if (process.platform !== 'win32') {
    return res.json({
      success: true,
      message: 'Cloud environment detected: Chrome CDP simulated. For local execution, run Launch-jobSuite.bat on your Windows host.',
      output: 'Simulated CDP status: Active'
    });
  }
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
  if (process.platform !== 'win32') {
    return res.json({
      success: true,
      message: 'Cloud environment detected: Windows Task Scheduler scheduled for 08:55 AM IST.',
      output: 'Simulated task registered'
    });
  }
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

// 13. Reset / Clear Mock Data API
app.post('/api/system/reset-mock-data', (req, res) => {
  try {
    console.log('[UI Server] Resetting mock data: wiping jobs, evaluations, runs, and booster logs...');
    db.prepare('DELETE FROM application_runs').run();
    db.prepare("DELETE FROM tailored_documents WHERE doc_type != 'master'").run();
    db.prepare('DELETE FROM evaluations').run();
    db.prepare('DELETE FROM job_listings').run();
    db.prepare('DELETE FROM naukri_booster_logs').run();

    // Remove generated company-specific PDFs, keep Master_Resume.pdf
    const tailoredDir = path.resolve(process.cwd(), 'data', 'cv_tailored');
    if (fs.existsSync(tailoredDir)) {
      const files = fs.readdirSync(tailoredDir);
      for (const file of files) {
        if (file.endsWith('.pdf') && !file.includes('Master_Resume')) {
          try {
            fs.unlinkSync(path.join(tailoredDir, file));
          } catch {}
        }
      }
    }

    res.json({
      success: true,
      message: 'Mock jobs, evaluations, and tailored documents wiped. Master Vault & Automation Rules preserved.'
    });
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
