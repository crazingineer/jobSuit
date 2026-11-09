import { db, initDatabase } from '../db';
import { linkedInEasyApplyAdapter } from './linkedin-easy-apply';
import { naukriApplyAdapter } from './naukri-apply';
import { workdayApplyAdapter } from './workday-apply';
import { greenhouseApplyAdapter } from './greenhouse-apply';
import { JobListing } from '../../src/types/job';
import { PersonalVault } from '../../src/types/vault';

export class ApplyOrchestrator {
  /**
   * Applies to a single queued job according to platform rules
   */
  public async applyToJob(jobId: string, options: { dryRun?: boolean; forceMode?: 'auto_pilot' | 'co_pilot' } = {}) {
    initDatabase();
    const job = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(jobId) as any;
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const vaultRow = db.prepare('SELECT * FROM personal_vault WHERE id = 1').get() as any;
    const vault: PersonalVault = {
      id: vaultRow.id,
      fullName: vaultRow.full_name,
      email: vaultRow.email,
      phone: vaultRow.phone,
      location: vaultRow.location,
      linkedinUrl: vaultRow.linkedin_url,
      githubUrl: vaultRow.github_url,
      portfolioUrl: vaultRow.portfolio_url,
      currentCtcLakhs: vaultRow.current_ctc_lakhs,
      expectedCtcLakhs: vaultRow.expected_ctc_lakhs,
      ctcNegotiable: Boolean(vaultRow.ctc_negotiable),
      noticePeriodDays: vaultRow.notice_period_days,
      lastWorkingDay: vaultRow.last_working_day,
      buyoutAvailable: Boolean(vaultRow.buyout_available),
      preferredLocations: JSON.parse(vaultRow.preferred_locations),
      relocationWilling: Boolean(vaultRow.relocation_willing),
      authorizedCountries: JSON.parse(vaultRow.authorized_countries),
      needsSponsorship: Boolean(vaultRow.needs_sponsorship),
      visaStatus: vaultRow.visa_status,
      gender: vaultRow.gender,
      disabilityStatus: vaultRow.disability_status,
      veteranStatus: vaultRow.veteran_status,
      eeoEthnicity: vaultRow.eeo_ethnicity,
      qaSnippets: JSON.parse(vaultRow.qa_snippets),
      updatedAt: vaultRow.updated_at
    };

    // Get Tailored PDF Path
    const docRow = db.prepare(`SELECT file_path FROM tailored_documents WHERE job_id = ? AND doc_type = 'cv'`).get(jobId) as any;
    const tailoredPdfPath = docRow ? docRow.file_path : 'data/master_cv/Master_Resume.pdf';

    // Get Platform Mode (Auto-Pilot vs Co-Pilot) from SQLite rules
    const rulesRow = db.prepare('SELECT * FROM automation_rules WHERE id = 1').get() as any;
    let mode: 'auto_pilot' | 'co_pilot' = options.forceMode || 'co_pilot';

    if (!options.forceMode && rulesRow) {
      if (job.portal === 'linkedin') mode = rulesRow.auto_pilot_linkedin ? 'auto_pilot' : 'co_pilot';
      else if (job.portal === 'naukri') mode = rulesRow.auto_pilot_naukri ? 'auto_pilot' : 'co_pilot';
      else if (job.portal === 'workday') mode = rulesRow.auto_pilot_workday ? 'auto_pilot' : 'co_pilot';
      else if (['greenhouse', 'lever', 'ashby'].includes(job.portal)) mode = rulesRow.auto_pilot_greenhouse ? 'auto_pilot' : 'co_pilot';
    }

    const jobListing: JobListing = {
      id: job.id,
      portal: job.portal,
      portalJobId: job.portal_job_id,
      url: job.url,
      title: job.title,
      company: job.company,
      companySlug: job.company_slug,
      location: job.location,
      remoteType: job.remote_type,
      postedDate: job.posted_date,
      capturedAt: job.captured_at,
      rawJdText: job.raw_jd_text,
      companyType: job.company_type,
      reportsTo: job.reports_to,
      advertisedComp: job.advertised_comp,
      status: job.status,
      easyApply: Boolean(job.easy_apply)
    };

    console.log(`\n--- Executing 3-Layer Auto-Applier ---`);
    console.log(`Job:      ${jobListing.title} @ ${jobListing.company}`);
    console.log(`Portal:   ${jobListing.portal.toUpperCase()}`);
    console.log(`Mode:     ${mode.toUpperCase()}`);
    console.log(`Resume:   ${tailoredPdfPath}`);

    if (jobListing.portal === 'linkedin') {
      return await linkedInEasyApplyAdapter.apply(jobListing, vault, tailoredPdfPath, mode, { dryRun: options.dryRun ?? true });
    } else if (jobListing.portal === 'naukri') {
      return await naukriApplyAdapter.apply(jobListing, vault, tailoredPdfPath, mode, { dryRun: options.dryRun ?? true });
    } else if (jobListing.portal === 'workday') {
      return await workdayApplyAdapter.apply(jobListing, vault, tailoredPdfPath, mode, { dryRun: options.dryRun ?? true });
    } else {
      return await greenhouseApplyAdapter.apply(jobListing, vault, tailoredPdfPath, mode, { dryRun: options.dryRun ?? true });
    }
  }

  /**
   * Batch process all queued jobs
   */
  public async processQueue(options: { dryRun?: boolean } = {}) {
    initDatabase();
    const queuedJobs = db.prepare(`SELECT id, title, company, portal FROM job_listings WHERE status = 'queued'`).all() as any[];
    console.log(`[Queue Runner] Found ${queuedJobs.length} queued jobs ready for application.`);

    const results = [];
    for (const j of queuedJobs) {
      const res = await this.applyToJob(j.id, options);
      results.push(res);
    }
    return results;
  }
}

export const applyOrchestrator = new ApplyOrchestrator();
