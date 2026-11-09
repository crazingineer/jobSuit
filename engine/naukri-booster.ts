import fs from 'fs';
import path from 'path';
import { Page } from 'playwright';
import { browserManager } from './browser-manager';
import { db } from './db';

export interface BoosterExecutionResult {
  success: boolean;
  resumeUploaded: boolean;
  headlineModified: boolean;
  headlineBefore?: string;
  headlineAfter?: string;
  nextScheduledRun: string;
  logOutput: string;
  errorMessage?: string;
}

export class NaukriBooster {
  private resumePdfPath: string;

  constructor(designatedPdfPath?: string) {
    if (designatedPdfPath && fs.existsSync(designatedPdfPath)) {
      this.resumePdfPath = designatedPdfPath;
    } else {
      // Find latest tailored resume in data/cv_tailored or fallback
      const tailoredDir = path.resolve(process.cwd(), 'data', 'cv_tailored');
      const files = fs.existsSync(tailoredDir) ? fs.readdirSync(tailoredDir).filter(f => f.endsWith('.pdf') && !f.includes('CoverLetter')) : [];
      if (files.length > 0) {
        this.resumePdfPath = path.join(tailoredDir, files[0]);
      } else {
        this.resumePdfPath = path.resolve(process.cwd(), 'data', 'master_cv', 'Master_Resume.pdf');
      }
    }
  }

  /**
   * Computes the next scheduled run with random jitter (+/- 15 minutes)
   */
  public getNextScheduledTime(targetTime: string = '08:55', jitterMinutes: number = 15): string {
    const [hours, minutes] = targetTime.split(':').map(Number);
    const now = new Date();
    const nextRun = new Date();
    nextRun.setDate(now.getDate() + 1);
    nextRun.setHours(hours, minutes, 0, 0);

    // Apply random jitter: between -jitterMinutes and +jitterMinutes
    const randomJitter = (Math.random() * (jitterMinutes * 2) - jitterMinutes) * 60 * 1000;
    const jitteredTime = new Date(nextRun.getTime() + randomJitter);

    return jitteredTime.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Performs the micro-update transformation on the resume headline.
   * State A: ends with '.' -> State B: strips trailing '.'
   * State B: no '.' -> State A: appends trailing '.'
   */
  public computeMicroUpdate(currentHeadline: string): string {
    const trimmed = currentHeadline.trim();
    if (trimmed.endsWith('.')) {
      return trimmed.slice(0, -1);
    } else {
      return trimmed + '.';
    }
  }

  /**
   * Executes the full 9 AM Refresh automation
   */
  public async executeBooster(options: { dryRun?: boolean; headless?: boolean } = {}): Promise<BoosterExecutionResult> {
    const logs: string[] = [];
    logs.push(`[${new Date().toLocaleTimeString()}] Starting Naukri 9 AM Daily Profile Booster...`);

    const nextRun = this.getNextScheduledTime();

    // Dry Run Mode for headless test & verification without live Naukri credentials
    if (options.dryRun) {
      logs.push('[DRY RUN] Simulating Naukri profile connection via persistent CDP...');
      const dummyHeadline = 'Senior AI Systems & Full-Stack Engineer | Python, React, LLMs';
      const updatedHeadline = this.computeMicroUpdate(dummyHeadline);

      logs.push(`[DRY RUN] Current Headline: "${dummyHeadline}"`);
      logs.push(`[DRY RUN] Designated Resume attached: ${this.resumePdfPath}`);
      logs.push('[DRY RUN] PDF uploaded successfully (Naukri Profile Last Updated timestamp refreshed)');
      logs.push(`[DRY RUN] Applied micro-edit: "${updatedHeadline}"`);
      logs.push('[DRY RUN] Saved headline changes. Algorithm activity registered.');

      const result: BoosterExecutionResult = {
        success: true,
        resumeUploaded: true,
        headlineModified: true,
        headlineBefore: dummyHeadline,
        headlineAfter: updatedHeadline,
        nextScheduledRun: nextRun,
        logOutput: logs.join('\n')
      };

      this.recordLog(result);
      return result;
    }

    try {
      // Connect to browser session
      const context = await browserManager.getContext({ headless: options.headless });
      const page = await context.newPage();

      logs.push('Navigating to Naukri Profile: https://www.naukri.com/mnjuser/profile');
      await page.goto('https://www.naukri.com/mnjuser/profile', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await browserManager.humanDelay(2000, 3500);

      // Verify login state
      const isLoginUrl = page.url().includes('nlogin') || page.url().includes('login');
      if (isLoginUrl) {
        throw new Error('Naukri session is not logged in. Please log in once in your Chrome profile.');
      }

      // 1. Re-upload Resume PDF
      logs.push(`Checking designated resume PDF: ${this.resumePdfPath}`);
      if (!fs.existsSync(this.resumePdfPath)) {
        throw new Error(`Resume PDF not found at path: ${this.resumePdfPath}`);
      }

      // Naukri upload resume button selector
      const uploadInputSelector = 'input[type="file"][id="attachCV"], input[type="file"]';
      const uploadInput = await page.$(uploadInputSelector);
      let resumeUploaded = false;

      if (uploadInput) {
        logs.push('Attaching resume file to upload input...');
        await uploadInput.setInputFiles(this.resumePdfPath);
        await browserManager.humanDelay(3000, 5000);
        logs.push('Resume PDF uploaded. Timestamp refreshed!');
        resumeUploaded = true;
      } else {
        logs.push('Warning: Direct upload input not found on profile. Skipping file re-upload.');
      }

      // 2. Micro-update Resume Headline
      logs.push('Locating Resume Headline section...');
      const headlineEditSelector = 'span.editIcon:near(:text("Resume headline")), .resumeHeadline .edit';
      const headlineTextSelector = '.resumeHeadline .text, .resumeHeadlineText';

      let headlineBefore = '';
      let headlineAfter = '';
      let headlineModified = false;

      const headlineEl = await page.$(headlineTextSelector);
      if (headlineEl) {
        headlineBefore = (await headlineEl.innerText()).trim();
        headlineAfter = this.computeMicroUpdate(headlineBefore);

        // Click edit
        const editBtn = await page.$(headlineEditSelector);
        if (editBtn) {
          await editBtn.click();
          await browserManager.humanDelay(800, 1500);

          // Type new headline
          const textarea = await page.$('textarea#resumeHeadlineTxt, textarea');
          if (textarea) {
            await textarea.fill(headlineAfter);
            await browserManager.humanDelay(1000, 2000);

            // Click save button
            const saveBtn = await page.$('button:has-text("Save"), .actionSubmit');
            if (saveBtn) {
              await saveBtn.click();
              await browserManager.humanDelay(2000, 3000);
              logs.push(`Headline micro-edit saved successfully: "${headlineBefore}" -> "${headlineAfter}"`);
              headlineModified = true;
            }
          }
        }
      }

      await page.close();

      const result: BoosterExecutionResult = {
        success: true,
        resumeUploaded,
        headlineModified,
        headlineBefore,
        headlineAfter,
        nextScheduledRun: nextRun,
        logOutput: logs.join('\n')
      };

      this.recordLog(result);
      return result;
    } catch (err: any) {
      logs.push(`[Error] Execution failed: ${err.message}`);
      const failedResult: BoosterExecutionResult = {
        success: false,
        resumeUploaded: false,
        headlineModified: false,
        nextScheduledRun: nextRun,
        logOutput: logs.join('\n'),
        errorMessage: err.message
      };

      this.recordLog(failedResult);
      return failedResult;
    }
  }

  /**
   * Persists execution log into SQLite naukri_booster_logs table
   */
  private recordLog(res: BoosterExecutionResult) {
    db.prepare(`
      INSERT INTO naukri_booster_logs (
        executed_at, status, resume_uploaded, headline_modified,
        headline_before, headline_after, next_scheduled_run, error_message, log_output
      ) VALUES (
        datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      res.success ? 'success' : 'failed',
      res.resumeUploaded ? 1 : 0,
      res.headlineModified ? 1 : 0,
      res.headlineBefore || null,
      res.headlineAfter || null,
      res.nextScheduledRun,
      res.errorMessage || null,
      res.logOutput
    );
  }
}
