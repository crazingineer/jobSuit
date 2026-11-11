import { db } from '../db';
import { linkedInScraper } from './linkedin-scraper';
import { naukriScraper } from './naukri-scraper';
import { atsScraper } from './ats-scraper';
import { hiringCafeScraper } from './hiringcafe-scraper';
import { JobListing } from '../../src/types/job';
import { careerOpsEvaluator } from '../evaluator/evaluator';
import { assessJobAlignmentWithCv } from '../../src/utils/cv-alignment-guard';

export interface DiscoveryRunOptions {
  keywords?: string;
  location?: string;
  evaluateImmediately?: boolean;
  sources?: ('linkedin' | 'naukri' | 'ats' | 'hiringcafe')[];
}

export interface DiscoveryRunResult {
  discoveredCount: number;
  newUniqueCount: number;
  filteredBySafetyCount: number;
  filteredByCvAlignmentCount: number;
  evaluatedCount: number;
  qualifiedCount: number;
  jobs: JobListing[];
}

export class DiscoveryOrchestrator {
  /**
   * Executes multi-portal discovery across LinkedIn, Naukri, HiringCafe, and Direct ATS boards,
   * enforces SQLite deduplication, blacklist safety gates, AND strict Master CV Alignment filtering
   * before evaluating jobs with career-ops Blocks A–H.
   */
  public async runDiscovery(options: DiscoveryRunOptions = {}): Promise<DiscoveryRunResult> {
    const keywords =
      options.keywords ||
      'Power Platform Developer, SharePoint Online, Copilot Studio, Azure AI Foundry';
    const location = options.location || 'Pune / Bengaluru';
    const evaluateNow = options.evaluateImmediately ?? true;
    const sources = options.sources || ['hiringcafe', 'linkedin', 'naukri', 'ats'];

    console.log('\n=======================================================');
    console.log('[Discovery Orchestrator] Starting Multi-Portal Job Scan');
    console.log(`Keywords: "${keywords}" | Location: "${location}" | Sources: ${sources.join(', ')}`);
    console.log('=======================================================\n');

    // 1. Load Automation Safety Rules from SQLite
    const rulesRow = db.prepare('SELECT * FROM automation_rules WHERE id = 1').get() as any;
    const blacklistCompanies: string[] = rulesRow
      ? JSON.parse(rulesRow.blacklist_companies || '[]').map((s: string) => s.toLowerCase())
      : [];
    const blacklistKeywords: string[] = rulesRow
      ? JSON.parse(rulesRow.blacklist_keywords || '[]').map((s: string) => s.toLowerCase())
      : [];
    const minScoreThreshold: number = rulesRow?.min_score_threshold ?? 4.0;

    let allScraped: JobListing[] = [];

    // 2. Scrape HiringCafe.com (Direct ATS Aggregator)
    if (sources.includes('hiringcafe')) {
      try {
        const hcJobs = await hiringCafeScraper.scrapeJobs({
          keywords,
          location,
          limit: 3
        });
        allScraped = allScraped.concat(hcJobs);
      } catch (e: any) {
        console.warn(`[Discovery] HiringCafe scrape notice: ${e.message}`);
      }
    }

    // 3. Scrape LinkedIn (Easy Apply & Direct)
    if (sources.includes('linkedin')) {
      try {
        const liJobs = await linkedInScraper.scrapeJobs({
          keywords,
          location,
          easyApplyOnly: false,
          limit: 3
        });
        allScraped = allScraped.concat(liJobs);
      } catch (e: any) {
        console.warn(`[Discovery] LinkedIn scrape skipped/notice: ${e.message}`);
      }
    }

    // 4. Scrape Naukri.com
    if (sources.includes('naukri')) {
      try {
        const nkJobs = await naukriScraper.scrapeJobs({
          keywords,
          location,
          experienceYears: 4,
          minCtcLakhs: 22,
          limit: 3
        });
        allScraped = allScraped.concat(nkJobs);
      } catch (e: any) {
        console.warn(`[Discovery] Naukri scrape skipped/notice: ${e.message}`);
      }
    }

    // 5. Scrape Direct ATS Boards (Greenhouse / Ashby / Lever)
    if (sources.includes('ats')) {
      const atsTargets = [
        { portal: 'greenhouse' as const, company: 'Databricks', boardUrl: 'https://boards.greenhouse.io/databricks' }
      ];
      for (const target of atsTargets) {
        try {
          const jobs = await atsScraper.scrapeBoard(target, 3);
          allScraped = allScraped.concat(jobs);
        } catch (e: any) {
          console.warn(`[Discovery] ATS scrape for ${target.company} skipped: ${e.message}`);
        }
      }
    }

    // 6. Safety Filtering, Master CV Alignment Gate & SQLite Insertion
    let newUniqueCount = 0;
    let filteredBySafetyCount = 0;
    let filteredByCvAlignmentCount = 0;
    const newlyInsertedIds: string[] = [];

    const checkExisting = db.prepare(
      'SELECT id FROM job_listings WHERE portal = ? AND portal_job_id = ?'
    );
    const insertJob = db.prepare(`
      INSERT INTO job_listings (
        id, portal, portal_job_id, url, external_apply_url, ats_provider, title, company, company_slug, location,
        remote_type, posted_date, captured_at, raw_jd_text, company_type, reports_to,
        advertised_comp, status, easy_apply, created_at
      ) VALUES (
        @id, @portal, @portalJobId, @url, @externalApplyUrl, @atsProvider, @title, @company, @companySlug, @location,
        @remoteType, @postedDate, @capturedAt, @rawJdText, @companyType, @reportsTo,
        @advertisedComp, @status, @easyApply, datetime('now')
      )
    `);

    for (const job of allScraped) {
      const companyLower = job.company.toLowerCase();
      const titleAndJdLower = `${job.title} ${job.rawJdText}`.toLowerCase();

      // Gate A: Blacklist Company / Keyword Check
      const isBlacklistedCompany = blacklistCompanies.some((bc) => companyLower.includes(bc));
      const isBlacklistedKeyword = blacklistKeywords.some((bk) => titleAndJdLower.includes(bk));

      if (isBlacklistedCompany || isBlacklistedKeyword) {
        console.log(`[Safety Gate] Filtered out blacklisted job: "${job.title}" @ ${job.company}`);
        filteredBySafetyCount++;
        continue;
      }

      // Gate B: Master CV Alignment Check (Rejects unaligned roles like Playwright/Golang/Kubernetes/iOS)
      const cvAlignment = assessJobAlignmentWithCv(job);
      if (!cvAlignment.isAligned) {
        console.log(
          `[CV Alignment Gate] Filtered out unaligned job: "${job.title}" @ ${job.company} — ${cvAlignment.rejectionReason}`
        );
        filteredByCvAlignmentCount++;
        continue;
      }

      // Gate C: Deduplication Check
      const existing = checkExisting.get(job.portal, job.portalJobId);
      if (existing) {
        console.log(`[Deduplicator] Skipping already-indexed job: "${job.title}" @ ${job.company}`);
        continue;
      }

      try {
        insertJob.run({
          ...job,
          externalApplyUrl: job.externalApplyUrl || null,
          atsProvider: job.atsProvider || null,
          reportsTo: job.reportsTo || null,
          advertisedComp: job.advertisedComp || null,
          easyApply: job.easyApply ? 1 : 0
        });
        newUniqueCount++;
        newlyInsertedIds.push(job.id);
        console.log(
          `[SQLite Indexed] + "${job.title}" @ ${job.company} [${job.portal.toUpperCase()}] (CV Alignment: ${cvAlignment.alignmentPercentage}%)`
        );
      } catch (err: any) {
        console.warn(`[SQLite Insert Warning] ${err.message}`);
      }
    }

    // 7. Immediate career-ops Evaluation (Blocks A-H)
    let evaluatedCount = 0;
    let qualifiedCount = 0;

    if (evaluateNow && newlyInsertedIds.length > 0) {
      console.log(
        `\n[Evaluator] Triggering career-ops A–H Evaluation on ${newlyInsertedIds.length} newly discovered CV-aligned jobs...`
      );
      for (const jobId of newlyInsertedIds) {
        try {
          const report = await careerOpsEvaluator.evaluateJob(jobId);
          evaluatedCount++;
          if (report.score >= minScoreThreshold && report.finalDecision === 'Apply') {
            qualifiedCount++;
            db.prepare("UPDATE job_listings SET status = 'queued' WHERE id = ?").run(jobId);
          }
        } catch (evalErr: any) {
          console.error(`[Evaluator Error] Failed to evaluate ${jobId}: ${evalErr.message}`);
        }
      }
    }

    return {
      discoveredCount: allScraped.length,
      newUniqueCount,
      filteredBySafetyCount,
      filteredByCvAlignmentCount,
      evaluatedCount,
      qualifiedCount,
      jobs: allScraped
    };
  }
}

export const discoveryOrchestrator = new DiscoveryOrchestrator();
