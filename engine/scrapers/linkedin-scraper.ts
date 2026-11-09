import { Page } from 'playwright';
import { browserManager } from '../browser-manager';
import { db } from '../db';
import { JobListing } from '../../src/types/job';

export interface LinkedInScrapeOptions {
  keywords?: string;
  location?: string;
  easyApplyOnly?: boolean;
  limit?: number;
  mockIfUnavailable?: boolean;
}

export class LinkedInScraper {
  /**
   * Scrapes LinkedIn Jobs with human emulation delays and rate limiting
   */
  public async scrapeJobs(options: LinkedInScrapeOptions = {}): Promise<JobListing[]> {
    const keywords = options.keywords || 'AI Engineer';
    const location = options.location || 'India';
    const easyApply = options.easyApplyOnly ?? true;
    const limit = options.limit || 5;

    console.log(`[LinkedIn Scraper] Searching for "${keywords}" in "${location}" (EasyApply: ${easyApply})...`);

    try {
      const context = await browserManager.getContext({ headless: true });
      const page = await context.newPage();

      // Encode URL parameters
      const f_AL = easyApply ? '&f_AL=true' : '';
      const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}${f_AL}&sortBy=DD`;

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await browserManager.humanDelay(2500, 4500);

      // Check for auth wall
      if (page.url().includes('login') || page.url().includes('authwall')) {
        console.warn('[LinkedIn Scraper] LinkedIn auth wall encountered. Session not logged in.');
        await page.close();
        if (options.mockIfUnavailable) {
          return this.getSimulatedJobs(keywords, location);
        }
        return [];
      }

      const scrapedJobs: JobListing[] = [];
      const jobCards = await page.$$('.jobs-search-results__list-item, .job-card-container');

      for (let i = 0; i < Math.min(jobCards.length, limit); i++) {
        const card = jobCards[i];
        await card.click();
        await browserManager.humanDelay(1500, 2500);

        const titleEl = await page.$('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title');
        const companyEl = await page.$('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name');
        const locationEl = await page.$('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet');
        const jdEl = await page.$('#job-details, .jobs-description__content');

        if (titleEl && companyEl) {
          const title = (await titleEl.innerText()).trim();
          const company = (await companyEl.innerText()).trim();
          const loc = locationEl ? (await locationEl.innerText()).trim() : location;
          const rawJd = jdEl ? (await jdEl.innerText()).trim() : 'Full description on LinkedIn';
          const jobId = `li-${Date.now()}-${i}`;
          const companySlug = company.toLowerCase().replace(/[^a-z0-9]/g, '-');

          scrapedJobs.push({
            id: jobId,
            portal: 'linkedin',
            portalJobId: `li-${i + 100}`,
            url: page.url(),
            title,
            company,
            companySlug,
            location: loc,
            remoteType: loc.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
            postedDate: new Date().toISOString().split('T')[0],
            capturedAt: new Date().toISOString(),
            rawJdText: rawJd,
            companyType: 'Technology',
            reportsTo: 'Engineering Manager',
            advertisedComp: 'INR 40L - 60L',
            status: 'discovered',
            easyApply: true
          });
        }
      }

      await page.close();
      return scrapedJobs;
    } catch (err: any) {
      console.warn(`[LinkedIn Scraper] Scraper notice: ${err.message}. Using simulated stream.`);
      if (options.mockIfUnavailable) {
        return this.getSimulatedJobs(keywords, location);
      }
      return [];
    }
  }

  /**
   * High-fidelity simulated scraper stream for local and unattended offline operation
   */
  public getSimulatedJobs(keywords: string, location: string): JobListing[] {
    const timestamp = Date.now();
    return [
      {
        id: `job-li-${timestamp}-1`,
        portal: 'linkedin',
        portalJobId: `li-881920`,
        url: 'https://www.linkedin.com/jobs/view/881920',
        title: `Lead ${keywords} & Agentic Automation Architect`,
        company: 'Cursor AI Partner Labs',
        companySlug: 'cursor-ai-partner-labs',
        location: `${location} / Remote`,
        remoteType: 'Remote',
        postedDate: new Date().toISOString().split('T')[0],
        capturedAt: new Date().toISOString(),
        rawJdText: 'We are seeking a Lead Automation Architect to build agentic coding workflows, Playwright headless workers, and multi-model evaluation benchmarks...',
        companyType: 'Growth-stage startup / VC-backed',
        reportsTo: 'Head of Engineering',
        advertisedComp: 'INR 50L - 70L + Equity',
        status: 'discovered',
        easyApply: true
      },
      {
        id: `job-li-${timestamp}-2`,
        portal: 'linkedin',
        portalJobId: `li-881921`,
        url: 'https://www.linkedin.com/jobs/view/881921',
        title: `Staff ${keywords} (Distributed Systems)`,
        company: 'Swiggy Genie Platform',
        companySlug: 'swiggy-genie-platform',
        location: 'Bengaluru, Karnataka',
        remoteType: 'Hybrid',
        postedDate: new Date().toISOString().split('T')[0],
        capturedAt: new Date().toISOString(),
        rawJdText: 'Looking for Staff Engineers to build autonomous merchant dispatch agents, low-latency Kafka event streams, and real-time decisioning pipelines...',
        companyType: 'Mature Tech / Unicorn',
        reportsTo: 'Director of Platform Engineering',
        advertisedComp: 'INR 55L - 75L',
        status: 'discovered',
        easyApply: true
      }
    ];
  }
}

export const linkedInScraper = new LinkedInScraper();
