import { Page } from 'playwright';
import { browserManager } from '../browser-manager';
import { db } from '../db';
import { llmDomFallback } from './llm-dom-fallback';
import { JobListing, ApplicationRun } from '../../src/types/job';
import { PersonalVault } from '../../src/types/vault';

export interface ApplyResult {
  runId: string;
  success: boolean;
  mode: 'auto_pilot' | 'co_pilot';
  status: 'submitted' | 'awaiting_approval' | 'failed';
  stepReached: string;
  formAnswers: Record<string, any>;
  errorMessage?: string;
}

export class LinkedInEasyApplyAdapter {
  /**
   * Automates the multi-step LinkedIn Easy Apply modal
   */
  public async apply(
    job: JobListing,
    vault: PersonalVault,
    tailoredPdfPath: string,
    mode: 'auto_pilot' | 'co_pilot' = 'co_pilot',
    options: { dryRun?: boolean } = {}
  ): Promise<ApplyResult> {
    const runId = `run-li-${Date.now()}`;
    if (!job.easyApply) {
      const msg = `"${job.title}" @ ${job.company} is an Offsite External ATS posting (easyApply=false), not LinkedIn Easy Apply.`;
      console.warn(`[LinkedIn Applier Guard] ${msg}`);
      return {
        runId,
        success: false,
        mode,
        status: 'failed',
        stepReached: 'Rejected by Easy Apply Guard — Job uses External ATS',
        formAnswers: {},
        errorMessage: msg
      };
    }
    console.log(`[LinkedIn Easy Apply] Starting onsite modal application for "${job.title}" @ ${job.company} [Mode: ${mode.toUpperCase()}]`);

    const formAnswers: Record<string, any> = {
      phone: vault.phone,
      email: vault.email,
      resume: tailoredPdfPath,
      currentCtc: `${vault.currentCtcLakhs} LPA`,
      expectedCtc: `${vault.expectedCtcLakhs} LPA`,
      noticePeriod: `${vault.noticePeriodDays} days`
    };

    if (options.dryRun) {
      console.log('[LinkedIn Applier] [DRY RUN] Navigating to job page...');
      console.log('[LinkedIn Applier] [DRY RUN] Clicking "Easy Apply" button...');
      console.log('[LinkedIn Applier] [DRY RUN] Step 1: Contact Info verified (Phone, Email, City). Clicking "Next"...');
      console.log(`[LinkedIn Applier] [DRY RUN] Step 2: Uploading Tailored Resume: ${tailoredPdfPath}...`);
      console.log('[LinkedIn Applier] [DRY RUN] Step 3: Answering Custom Questions:');
      console.log(`  - Notice Period -> "${vault.noticePeriodDays} days"`);
      console.log(`  - Current CTC -> "${vault.currentCtcLakhs} LPA"`);
      console.log(`  - Expected CTC -> "${vault.expectedCtcLakhs} LPA"`);
      console.log(`  - Work Authorization -> "Yes"`);
      console.log('[LinkedIn Applier] [DRY RUN] Step 4: Reached Review step.');

      let finalStatus: 'submitted' | 'awaiting_approval' = 'submitted';
      let stepReached = 'Application Submitted Successfully';

      if (mode === 'co_pilot') {
        console.log('[LinkedIn Applier] [CO-PILOT GATE] Pausing at final review screen for user 1-click confirmation.');
        finalStatus = 'awaiting_approval';
        stepReached = 'Awaiting User Final Click (Co-Pilot Mode)';
      } else {
        console.log('[LinkedIn Applier] [AUTO-PILOT] Submitting application automatically.');
      }

      this.recordRun(runId, job.id, 'linkedin', mode, finalStatus, stepReached, formAnswers);

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
      await browserManager.humanDelay(2000, 3000);

      // Locate Easy Apply button
      const easyApplyBtn = await page.$('.jobs-apply-button--top-card, button:has-text("Easy Apply")');
      if (!easyApplyBtn) {
        throw new Error('Easy Apply button not found on this listing.');
      }

      await easyApplyBtn.click();
      await browserManager.humanDelay(1500, 2500);

      // Step loop
      let stepCount = 0;
      let finalStepReached = false;

      while (stepCount < 10 && !finalStepReached) {
        stepCount++;
        await browserManager.humanDelay(1000, 2000);

        // Check for file upload input
        const fileInput = await page.$('input[type="file"]');
        if (fileInput && tailoredPdfPath) {
          console.log(`[LinkedIn Applier] Injecting tailored PDF: ${tailoredPdfPath}`);
          await fileInput.setInputFiles(tailoredPdfPath);
          await browserManager.humanDelay(1500, 2500);
        }

        // Check for Review button or Submit button
        const submitBtn = await page.$('button[aria-label="Submit application"], button:has-text("Submit application")');
        if (submitBtn) {
          finalStepReached = true;
          if (mode === 'co_pilot') {
            console.log('[LinkedIn Applier] [CO-PILOT] Pausing at final review step.');
            const result: ApplyResult = {
              runId,
              success: true,
              mode: 'co_pilot',
              status: 'awaiting_approval',
              stepReached: 'Awaiting User Final Confirmation',
              formAnswers
            };
            this.recordRun(runId, job.id, 'linkedin', mode, 'awaiting_approval', result.stepReached, formAnswers);
            return result;
          } else {
            await submitBtn.click();
            await browserManager.humanDelay(2000, 3500);
            const result: ApplyResult = {
              runId,
              success: true,
              mode: 'auto_pilot',
              status: 'submitted',
              stepReached: 'Submitted Automatically',
              formAnswers
            };
            this.recordRun(runId, job.id, 'linkedin', mode, 'submitted', result.stepReached, formAnswers);
            return result;
          }
        }

        // Click Next
        const nextBtn = await page.$('button[aria-label="Continue to next step"], button:has-text("Next"), button:has-text("Review")');
        if (nextBtn) {
          await nextBtn.click();
          await browserManager.humanDelay(1500, 2500);
        } else {
          break;
        }
      }

      await page.close();

      return {
        runId,
        success: true,
        mode,
        status: 'awaiting_approval',
        stepReached: 'Modal Traversal Completed',
        formAnswers
      };
    } catch (err: any) {
      console.error(`[LinkedIn Applier Error] ${err.message}`);
      this.recordRun(runId, job.id, 'linkedin', mode, 'failed', 'Error during modal execution', formAnswers, err.message);
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

export const linkedInEasyApplyAdapter = new LinkedInEasyApplyAdapter();
