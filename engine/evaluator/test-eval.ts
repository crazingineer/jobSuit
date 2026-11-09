import { careerOpsEvaluator } from './evaluator';
import { db, initDatabase } from '../db';

async function main() {
  initDatabase();

  console.log('--- Testing career-ops Evaluation Pipeline ---');

  // Insert a fresh test job listing to evaluate
  const testJobId = 'job-test-201';
  db.prepare(`
    INSERT OR REPLACE INTO job_listings (
      id, portal, portal_job_id, url, title, company, company_slug, location,
      remote_type, posted_date, captured_at, raw_jd_text, company_type, reports_to,
      advertised_comp, status, easy_apply, created_at
    ) VALUES (
      ?, 'linkedin', '40992211', 'https://www.linkedin.com/jobs/view/40992211',
      'Staff AI Automation & Agentic Platform Engineer', 'Perplexity AI Partner', 'perplexity-ai-partner',
      'Bengaluru / Remote', 'Remote', '2026-11-09', datetime('now'),
      'We are looking for a Staff AI Automation Engineer to lead autonomous tool use, Playwright browser orchestration, and multi-agent systems with human-in-the-loop validation...',
      'Growth-stage startup / VC-backed', 'VP of AI Systems', 'INR 55L - 75L', 'discovered', 1, datetime('now')
    )
  `).run(testJobId);

  // Run evaluation
  const report = await careerOpsEvaluator.evaluateJob(testJobId);

  console.log(`\n--- Evaluation Completed ---`);
  console.log(`Job:        ${report.blockASummary.domain}`);
  console.log(`Score:      ${report.score} / 5.0`);
  console.log(`Decision:   ${report.finalDecision}`);
  console.log(`Archetype:  ${report.archetype}`);
  console.log(`Legitimacy: ${report.legitimacyTier}`);
  console.log(`Work Auth:  ${report.workAuthTier}`);
  console.log(`Hard Stops: ${report.hardStops.length}`);
  console.log(`Block B Rows: ${report.blockBRequirements.length}`);
  console.log(`Block H Generated: ${Boolean(report.blockHAnswers)}`);

  // Verify DB state
  const evalRow = db.prepare('SELECT * FROM evaluations WHERE job_id = ?').get(testJobId) as any;
  console.log(`[DB Verify] Evaluation persisted in SQLite: ${evalRow.id}`);

  const updatedJob = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(testJobId) as any;
  console.log(`[DB Verify] Job status advanced to: ${updatedJob.status}`);

  const docs = db.prepare('SELECT * FROM tailored_documents WHERE job_id = ?').all(testJobId);
  console.log(`[DB Verify] Tailored PDFs compiled & indexed: ${docs.length} items`);

  process.exit(0);
}

main().catch(err => {
  console.error('[Evaluation Error]', err);
  process.exit(1);
});
