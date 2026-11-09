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
   * Runs end-to-end multi-portal discovery and triggers career-ops evaluation
   */
  public async runDiscovery(options: DiscoveryOptions = {}): Promise<{
    discoveredCount: number;
    evaluatedCount: number;
    qualifiedCount: number;
    jobs: JobListing[];
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
    const blacklistCompanies: string[] = rulesRow ? JSON.parse(rulesRow.blacklist_companies) : [];
    const blacklistKeywords: string[] = rulesRow ? JSON.parse(rulesRow.blacklist_keywords) : [];

    // 2. Run Scrapers
    const rawJobs: JobListing[] = [];

    // LinkedIn
    const liJobs = await linkedInScraper.scrapeJobs({ keywords, location, limit: 3, mockIfUnavailable: true });
    rawJobs.push(...liJobs);

    // Naukri
    const nkJobs = await naukriScraper.scrapeJobs({ keywords, location: 'Bengaluru', limit: 2, mockIfUnavailable: true });
    rawJobs.push(...nkJobs);

    // Direct ATS Boards
    const ghJobs = await atsScraper.scrapeBoard({ portal: 'greenhouse', company: 'LangChain AI', boardUrl: 'https://boards.greenhouse.io/langchain' });
    rawJobs.push(...ghJobs);

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

    console.log(`\n[Database] Inserted ${newJobs.length} new unique jobs into SQLite.`);

    // 4. Run career-ops A-H Evaluator
    let evaluatedCount = 0;
    let qualifiedCount = 0;

    if (evaluateImmediately && newJobs.length > 0) {
      console.log(`\n--- Initiating career-ops Evaluation on Discovered Jobs ---`);
      for (const job of newJobs) {
        try {
          const report = await careerOpsEvaluator.evaluateJob(job.id);
          evaluatedCount++;
          console.log(`★ Evaluated "${job.title}" @ ${job.company} -> Score: ${report.score}/5.0 [${report.finalDecision}]`);
          if (report.score >= 4.0 && report.finalDecision === 'Apply') {
            qualifiedCount++;
          }
        } catch (evalErr: any) {
          console.error(`Failed to evaluate job ${job.id}:`, evalErr.message);
        }
      }
    }

    console.log(`\n======================================================`);
    console.log(`🎯 [Discovery Summary]`);
    console.log(`Discovered:  ${newJobs.length} new listings`);
    console.log(`Evaluated:   ${evaluatedCount} reports generated (Blocks A-H)`);
    console.log(`Qualified:   ${qualifiedCount} jobs scored >= 4.0 (Tailored & Queued)`);
    console.log(`======================================================\n`);

    return {
      discoveredCount: newJobs.length,
      evaluatedCount,
      qualifiedCount,
      jobs: newJobs
    };
  }
}

export const discoveryOrchestrator = new DiscoveryOrchestrator();
