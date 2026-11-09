import { applyOrchestrator } from './apply-orchestrator';
import { db, initDatabase } from '../db';

async function main() {
  initDatabase();

  console.log('--- Testing 3-Layer Auto-Applier Engine ---\n');

  // Find a queued job
  const queuedJob = db.prepare(`SELECT id, portal, title, company FROM job_listings WHERE status = 'queued' LIMIT 1`).get() as any;

  if (!queuedJob) {
    console.log('No queued jobs found.');
    process.exit(0);
  }

  // 1. Test in Co-Pilot Mode (Pause for approval)
  console.log('>>> TEST 1: Running in Co-Pilot Mode (Human in the loop)...');
  const coPilotResult = await applyOrchestrator.applyToJob(queuedJob.id, { dryRun: true, forceMode: 'co_pilot' });
  console.log(`Co-Pilot Status:  ${coPilotResult.status}`);
  console.log(`Step Reached:     ${coPilotResult.stepReached}`);

  // 2. Test in Auto-Pilot Mode (Automatic Submission)
  console.log('\n>>> TEST 2: Running in Auto-Pilot Mode (Unattended)...');
  const autoPilotResult = await applyOrchestrator.applyToJob(queuedJob.id, { dryRun: true, forceMode: 'auto_pilot' });
  console.log(`Auto-Pilot Status: ${autoPilotResult.status}`);
  console.log(`Step Reached:      ${autoPilotResult.stepReached}`);

  // Verify SQLite runs
  const runs = db.prepare('SELECT id, portal, mode, status, step_reached FROM application_runs ORDER BY id DESC LIMIT 2').all();
  console.log('\n--- SQLite Application Runs ---');
  console.log(JSON.stringify(runs, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error('[Apply Test Error]', err);
  process.exit(1);
});
