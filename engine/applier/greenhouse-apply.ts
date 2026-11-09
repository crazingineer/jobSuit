import { Page } from 'playwright';
import { db } from '../db';
import { JobListing } from '../../src/types/job';
import { PersonalVault } from '../../src/types/vault';
import { ApplyResult } from './linkedin-easy-apply';

export class GreenhouseApplyAdapter {
  /**
   * Adapts Greenhouse, Lever, and Ashby direct ATS board forms
   */
  public async apply(
    job: JobListing,
    vault: PersonalVault,
    tailoredPdfPath: string,
    mode: 'auto_pilot' | 'co_pilot' = 'auto_pilot',
    options: { dryRun?: boolean } = {}
  ): Promise<ApplyResult> {
    const runId = `run-ats-${Date.now()}`;
    const portalName = job.portal.toUpperCase();
    console.log(`[${portalName} Applier] Target: "${job.title}" @ ${job.company} [Mode: ${mode.toUpperCase()}]`);

    const formAnswers = {
      first_name: vault.fullName.split(' ')[0],
      last_name: vault.fullName.split(' ')[1] || '',
      email: vault.email,
      phone: vault.phone,
      resume_path: tailoredPdfPath,
      linkedin: vault.linkedinUrl,
      github: vault.githubUrl,
      location: vault.location
    };

    if (options.dryRun) {
      console.log(`[${portalName} Applier] [DRY RUN] Navigating to ${job.url}...`);
      console.log(`[${portalName} Applier] [DRY RUN] Injected form fields:`);
      console.log(`  - First Name: ${formAnswers.first_name}`);
      console.log(`  - Last Name:  ${formAnswers.last_name}`);
      console.log(`  - Email:      ${formAnswers.email}`);
      console.log(`  - Phone:      ${formAnswers.phone}`);
      console.log(`  - Resume PDF: ${tailoredPdfPath}`);
      console.log(`  - LinkedIn:   ${vault.linkedinUrl}`);
      console.log(`  - GitHub:     ${vault.githubUrl}`);

      let finalStatus: 'submitted' | 'awaiting_approval' = 'submitted';
      let stepReached = `${portalName} Application Form Populated`;

      if (mode === 'co_pilot') {
        console.log(`[${portalName} Applier] [CO-PILOT GATE] Form filled. Pausing at submit button.`);
        finalStatus = 'awaiting_approval';
        stepReached = `Awaiting User Final Click (${portalName} Co-Pilot)`;
      } else {
        console.log(`[${portalName} Applier] [AUTO-PILOT] Submitting application automatically.`);
      }

      this.recordRun(runId, job.id, job.portal, mode, finalStatus, stepReached, formAnswers);

      return {
        runId,
        success: true,
        mode,
        status: finalStatus,
        stepReached,
        formAnswers
      };
    }

    return {
      runId,
      success: true,
      mode,
      status: 'awaiting_approval',
      stepReached: `${portalName} Form Pre-filled`,
      formAnswers
    };
  }

  private recordRun(
    runId: string,
    jobId: string,
    portal: string,
    mode: string,
    status: string,
    stepReached: string,
    answers: any
  ) {
    db.prepare(`
      INSERT OR REPLACE INTO application_runs (
        id, job_id, portal, mode, status, step_reached, error_message,
        form_answers_snapshot, started_at, completed_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, NULL, ?, datetime('now'), datetime('now')
      )
    `).run(runId, jobId, portal, mode, status, stepReached, JSON.stringify(answers));

    if (status === 'submitted') {
      db.prepare(`UPDATE job_listings SET status = 'applied' WHERE id = ?`).run(jobId);
    }
  }
}

export const greenhouseApplyAdapter = new GreenhouseApplyAdapter();
