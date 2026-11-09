import { Page } from 'playwright';
import { browserManager } from '../browser-manager';
import { db } from '../db';
import { llmDomFallback } from './llm-dom-fallback';
import { JobListing } from '../../src/types/job';
import { PersonalVault } from '../../src/types/vault';
import { ApplyResult } from './linkedin-easy-apply';

export class NaukriApplyAdapter {
  /**
   * Automates Naukri 1-click and Chatbot Drawer Questionnaire
   */
  public async apply(
    job: JobListing,
    vault: PersonalVault,
    tailoredPdfPath: string,
    mode: 'auto_pilot' | 'co_pilot' = 'co_pilot',
    options: { dryRun?: boolean } = {}
  ): Promise<ApplyResult> {
    const runId = `run-nk-${Date.now()}`;
    console.log(`[Naukri Applier] Applying for "${job.title}" @ ${job.company} [Mode: ${mode.toUpperCase()}]`);

    const formAnswers: Record<string, any> = {
      currentCtc: `${vault.currentCtcLakhs} LPA`,
      expectedCtc: `${vault.expectedCtcLakhs} LPA`,
      noticePeriod: `${vault.noticePeriodDays} days`,
      experienceYears: '6',
      preferredLocation: vault.preferredLocations[0] || 'Bengaluru',
      relocation: vault.relocationWilling ? 'Yes' : 'No'
    };

    if (options.dryRun) {
      console.log('[Naukri Applier] [DRY RUN] Opening Naukri job page...');
      console.log('[Naukri Applier] [DRY RUN] Clicking "Apply on Company Site / Apply" button...');
      console.log('[Naukri Applier] [DRY RUN] Chatbot Drawer Detected: auto-filling recruiter questionnaire:');
      console.log(`  - What is your Current CTC? -> "${vault.currentCtcLakhs} LPA"`);
      console.log(`  - What is your Expected CTC? -> "${vault.expectedCtcLakhs} LPA"`);
      console.log(`  - What is your Official Notice Period? -> "${vault.noticePeriodDays} days"`);
      console.log(`  - How many years of experience in AI / Python? -> "6 years"`);
      console.log(`  - Are you willing to relocate to ${job.location}? -> "Yes"`);

      let finalStatus: 'submitted' | 'awaiting_approval' = 'submitted';
      let stepReached = '1-Click Apply & Questionnaire Submitted';

      if (mode === 'co_pilot') {
        console.log('[Naukri Applier] [CO-PILOT GATE] Pausing for user confirmation before final submission.');
        finalStatus = 'awaiting_approval';
        stepReached = 'Questionnaire Pre-filled. Awaiting User Confirmation (Co-Pilot)';
      } else {
        console.log('[Naukri Applier] [AUTO-PILOT] Submitting application automatically.');
      }

      this.recordRun(runId, job.id, 'naukri', mode, finalStatus, stepReached, formAnswers);

      return {
        runId,
        success: true,
        mode,
        status: finalStatus,
        stepReached,
        formAnswers
      };
    }

    try {
      const context = await browserManager.getContext({ headless: false });
      const page = await context.newPage();

      await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await browserManager.humanDelay(2000, 3500);

      // Locate Apply Button
      const applyBtn = await page.$('.apply-button, button:has-text("Apply")');
      if (!applyBtn) {
        throw new Error('Naukri Apply button not found.');
      }

      await applyBtn.click();
      await browserManager.humanDelay(2000, 3000);

      // Check if Chatbot drawer questionnaire opens
      const drawer = await page.$('.chatbot-container, .drawer-container, .apply-message');
      if (drawer) {
        console.log('[Naukri Applier] Chatbot drawer detected. Resolving questions...');

        // Fill notice period inputs
        const noticeInputs = await page.$$('input[placeholder*="notice"], input[name*="notice"]');
        for (const input of noticeInputs) {
          await input.fill(`${vault.noticePeriodDays} days`);
        }

        // Fill CTC inputs
        const ctcInputs = await page.$$('input[placeholder*="ctc"], input[name*="ctc"]');
        if (ctcInputs.length > 0) {
          await ctcInputs[0].fill(`${vault.currentCtcLakhs}`);
          if (ctcInputs.length > 1) {
            await ctcInputs[1].fill(`${vault.expectedCtcLakhs}`);
          }
        }
      }

      if (mode === 'co_pilot') {
        console.log('[Naukri Applier] [CO-PILOT] Pausing for user review.');
        this.recordRun(runId, job.id, 'naukri', mode, 'awaiting_approval', 'Awaiting User Review', formAnswers);
        return {
          runId,
          success: true,
          mode: 'co_pilot',
          status: 'awaiting_approval',
          stepReached: 'Awaiting User Review',
          formAnswers
        };
      }

      // Submit
      const submitBtn = await page.$('button:has-text("Submit"), button.apply-submit');
      if (submitBtn) {
        await submitBtn.click();
        await browserManager.humanDelay(2000, 3000);
      }

      await page.close();

      this.recordRun(runId, job.id, 'naukri', mode, 'submitted', 'Submitted Successfully', formAnswers);

      return {
        runId,
        success: true,
        mode: 'auto_pilot',
        status: 'submitted',
        stepReached: 'Submitted Successfully',
        formAnswers
      };
    } catch (err: any) {
      console.error(`[Naukri Applier Error] ${err.message}`);
      this.recordRun(runId, job.id, 'naukri', mode, 'failed', 'Error during application', formAnswers, err.message);
      return {
        runId,
        success: false,
        mode,
        status: 'failed',
        stepReached: 'Failed during execution',
        formAnswers,
        errorMessage: err.message
      };
    }
  }

  private recordRun(
    runId: string,
    jobId: string,
    portal: string,
    mode: string,
    status: string,
    stepReached: string,
    answers: any,
    errorMsg?: string
  ) {
    db.prepare(`
      INSERT OR REPLACE INTO application_runs (
        id, job_id, portal, mode, status, step_reached, error_message,
        form_answers_snapshot, started_at, completed_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
      )
    `).run(
      runId,
      jobId,
      portal,
      mode,
      status,
      stepReached,
      errorMsg || null,
      JSON.stringify(answers)
    );

    if (status === 'submitted') {
      db.prepare(`UPDATE job_listings SET status = 'applied' WHERE id = ?`).run(jobId);
    }
  }
}

export const naukriApplyAdapter = new NaukriApplyAdapter();
