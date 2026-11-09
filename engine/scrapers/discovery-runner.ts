import { db, initDatabase } from '../db';
import { linkedInScraper } from './linkedin-scraper';
import { naukriScraper } from './naukri-scraper';
import { atsScraper } from './ats-scraper';
import { careerOpsEvaluator } from '../evaluator/evaluator';
import { JobListing } from '../../src/types/job';

export interface DiscoveryOptions {
  keywords?: string;
  location?: string;
  evaluateImmediately?: boolean;
}

export class DiscoveryOrchestrator {
  /**
   * Runs end-to-end multi-portal discovery and triggers career-ops evaluation.
   * Real scraping only - zero silent mock fallbacks.
   */
  public async runDiscovery(options: DiscoveryOptions = {}): Promise<{
    discoveredCount: number;
    evaluatedCount: number;
    qualifiedCount: number;
    jobs: JobListing[];
    errors?: string[];
  }> {
    initDatabase();
    const keywords = options.keywords || 'AI Engineer';
    const location = options.location || 'India';
    const evaluateImmediately = options.evaluateImmediately ?? true;

    console.log(`\n======================================================`);
    console.log(`🚀 [jobSuite Discovery] Starting Multi-Portal Scan`);
    console.log(`Keywords: "${keywords}" | Location: "${location}"`);
    console.log(`======================================================\n`);

    // 1. Fetch Blacklist Rules
    const rulesRow = db.prepare('SELECT * FROM automation_rules WHERE id = 1').get() as any;
    const blacklistCompanies: string[] = rulesRow ? JSON.parse(rulesRow.blacklist_companies || '[]') : [];
    const blacklistKeywords: string[] = rulesRow ? JSON.parse(rulesRow.blacklist_keywords || '[]') : [];

    // 2. Run Scrapers with Real Error Surfacing
    const rawJobs: JobListing[] = [];
    const scraperErrors: string[] = [];

    // LinkedIn
    try {
      const liJobs = await linkedInScraper.scrapeJobs({ keywords, location, limit: 3, mockIfUnavailable: false });
      rawJobs.push(...liJobs);
    } catch (err: any) {
      console.warn(`[Discovery] LinkedIn notice: ${err.message}`);
      scraperErrors.push(`LinkedIn: ${err.message}`);
    }

    // Naukri (Dynamic location passed)
    try {
      const nkJobs = await naukriScraper.scrapeJobs({ keywords, location, limit: 3, mockIfUnavailable: false });
      rawJobs.push(...nkJobs);
    } catch (err: any) {
      console.warn(`[Discovery] Naukri notice: ${err.message}`);
      scraperErrors.push(`Naukri: ${err.message}`);
    }

    // Direct ATS Boards
    try {
      const ghJobs = await atsScraper.scrapeBoard({ portal: 'greenhouse', company: 'LangChain', boardUrl: 'https://boards.greenhouse.io/langchain' });
      rawJobs.push(...ghJobs);
    } catch (err: any) {
      console.warn(`[Discovery] ATS notice: ${err.message}`);
      scraperErrors.push(`ATS: ${err.message}`);
    }

    if (rawJobs.length === 0 && scraperErrors.length > 0) {
      throw new Error(`Discovery failed across sources:\n- ${scraperErrors.join('\n- ')}`);
    }

    console.log(`[Discovery] Scraped ${rawJobs.length} candidate postings. Applying safety gates & deduplication...`);

    // 3. Filter & Deduplicate
    const newJobs: JobListing[] = [];

    for (const job of rawJobs) {
      // Blacklist Company Check
      const companyBlocked = blacklistCompanies.some(c => 
        job.company.toLowerCase().includes(c.toLowerCase())
      );
      if (companyBlocked) {
        console.log(`[Blacklist Filter] Skipping blocked company: ${job.company}`);
        continue;
      }

      // Blacklist Keyword Check
      const keywordBlocked = blacklistKeywords.some(k => 
        job.title.toLowerCase().includes(k.toLowerCase()) || 
        job.rawJdText.toLowerCase().includes(k.toLowerCase())
      );
      if (keywordBlocked) {
        console.log(`[Blacklist Filter] Skipping posting with blacklisted phrase: ${job.title}`);
        continue;
      }

      // SQLite Deduplication check
      const existing = db.prepare('SELECT id FROM job_listings WHERE portal = ? AND portal_job_id = ?').get(job.portal, job.portalJobId);
      if (existing) {
        console.log(`[Deduplication] Job already tracked: ${job.title} @ ${job.company}`);
        continue;
      }

      // Insert into SQLite
      db.prepare(`
        INSERT INTO job_listings (
          id, portal, portal_job_id, url, title, company, company_slug, location,
          remote_type, posted_date, captured_at, raw_jd_text, company_type, reports_to,
          advertised_comp, status, easy_apply, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, datetime('now')
        )
      `).run(
        job.id, job.portal, job.portalJobId, job.url, job.title, job.company, job.companySlug, job.location,
        job.remoteType, job.postedDate, job.capturedAt, job.rawJdText, job.companyType, job.reportsTo,
        job.advertisedComp, job.status, job.easyApply ? 1 : 0
      );

      newJobs.push(job);
    }

    console.log(`[Discovery] Filtered & saved ${newJobs.length} brand new unique jobs in SQLite.\n`);

    // 4. Optionally Run career-ops A-H Evaluator Immediately
    let evaluatedCount = 0;
    let qualifiedCount = 0;

    if (evaluateImmediately && newJobs.length > 0) {
      console.log(`[Evaluator] Running career-ops Blocks A-H evaluation on ${newJobs.length} new jobs...`);
      for (const job of newJobs) {
        try {
          const evalReport = await careerOpsEvaluator.evaluateJob(job.id);
          evaluatedCount++;
          if (evalReport.score >= 4.0) {
            qualifiedCount++;
            console.log(`  ⭐ Qualified: ${job.title} (Score: ${evalReport.score})`);
          } else {
            console.log(`  ⏩ Skipped: ${job.title} (Score: ${evalReport.score})`);
          }
        } catch (err: any) {
          console.error(`  ❌ Evaluation failed for ${job.title}: ${err.message}`);
        }
      }
    }

    return {
      discoveredCount: newJobs.length,
      evaluatedCount,
      qualifiedCount,
      jobs: newJobs,
      errors: scraperErrors.length > 0 ? scraperErrors : undefined
    };
  }
}

export const discoveryOrchestrator = new DiscoveryOrchestrator();
