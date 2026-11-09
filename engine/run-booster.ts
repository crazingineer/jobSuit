import { NaukriBooster } from './naukri-booster';
import { initDatabase, db } from './db';

async function main() {
  initDatabase();

  const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');
  const isHeadless = !process.argv.includes('--headed');

  console.log(`[jobSuite Booster] Mode: ${isDryRun ? 'DRY RUN' : 'LIVE BROWSER'}`);
  const booster = new NaukriBooster();
  const result = await booster.executeBooster({ dryRun: isDryRun, headless: isHeadless });

  console.log('\n--- Execution Summary ---');
  console.log(`Success: ${result.success}`);
  console.log(`Resume Uploaded: ${result.resumeUploaded}`);
  console.log(`Headline Modified: ${result.headlineModified}`);
  if (result.headlineBefore && result.headlineAfter) {
    console.log(`Headline Before: "${result.headlineBefore}"`);
    console.log(`Headline After:  "${result.headlineAfter}"`);
  }
  console.log(`Next Scheduled:  ${result.nextScheduledRun}`);
  console.log('\n--- Execution Log ---');
  console.log(result.logOutput);

  process.exit(result.success ? 0 : 1);
}

main().catch(err => {
  console.error('[Booster Fatal Error]', err);
  process.exit(1);
});
