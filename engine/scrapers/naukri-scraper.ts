import { Page } from 'playwright';
import { browserManager } from '../browser-manager';
import { db } from '../db';
import { JobListing } from '../../src/types/job';

export interface NaukriScrapeOptions {
  keywords?: string;
  experienceYears?: number;
  location?: string;
  minCtcLakhs?: number;
  limit?: number;
  mockIfUnavailable?: boolean;
}

export class NaukriScraper {
  /**
   * Scrapes Naukri.com listings with stealth and human emulation delays
   */
  public async scrapeJobs(options: NaukriScrapeOptions = {}): Promise<JobListing[]> {
    const keywords = options.keywords || 'AI Engineer';
    const location = options.location || 'Bengaluru';
    const exp = options.experienceYears || 5;
    const minCtc = options.minCtcLakhs || 25;
    const limit = options.limit || 5;

    console.log(`[Naukri Scraper] Searching for "${keywords}" in "${location}" (Exp: ${exp}y, Min CTC: ${minCtc} LPA)...`);

    let page: Page | null = null;
    try {
      const context = await browserManager.getContext({ headless: true });
      page = await context.newPage();

      // Naukri search URL structure
      const formattedKeywords = keywords.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const formattedLoc = location.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const searchUrl = `https://www.naukri.com/${formattedKeywords}-jobs-in-${formattedLoc}?experience=${exp}&ctcFilter=${minCtc}to50`;

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await browserManager.humanDelay(2500, 4500);

      // Check for bot challenge or login wall
      if (page.url().includes('login') || page.url().includes('blocked') || page.url().includes('challenge')) {
        await page.close();
        throw new Error('Naukri access challenge or login required. Please launch Chrome CDP (Port 9222) and verify your Naukri session.');
      }

      const jobCards = await page.$$('.srp-jobtuple-wrapper, .cust-job-tuple, [data-job-id]');
      const scrapedJobs: JobListing[] = [];

      console.log(`[Naukri Scraper] Found ${jobCards.length} job cards on search results page.`);

      const rulesRow = db.prepare('SELECT min_delay_sec, max_delay_sec FROM automation_rules WHERE id = 1').get() as { min_delay_sec?: number; max_delay_sec?: number } | undefined;
      const minDelayMs = (rulesRow?.min_delay_sec || 3) * 1000;
      const maxDelayMs = (rulesRow?.max_delay_sec || 7) * 1000;

      for (let i = 0; i < Math.min(jobCards.length, limit); i++) {
        const card = jobCards[i];

        // 1. Extract Real Naukri Job ID from data-job-id or href URL
        let realJobId = '';
        const dataJobId = await card.getAttribute('data-job-id');
        if (dataJobId && dataJobId.trim()) {
          realJobId = dataJobId.trim();
        }

        const titleEl = await card.$('.title, a.title, [data-label="job-title"]');
        const companyEl = await card.$('.comp-name, a.comp-name, [data-label="company-name"]');
        const locEl = await card.$('.locWdth, .loc-wrap, .location');
        const salEl = await card.$('.sal-wrap, .ni-job-tuple-icon-srp-rupee, .salary');

        if (titleEl && companyEl) {
          const title = (await titleEl.innerText()).trim();
          const company = (await companyEl.innerText()).trim();
          const loc = locEl ? (await locEl.innerText()).trim() : location;
          const href = (await titleEl.getAttribute('href')) || '';

          // Parse numeric or alphanumeric job ID from href if not in data-job-id
          if (!realJobId && href) {
            const urlMatch = href.match(/([0-9]{8,})/);
            if (urlMatch) {
              realJobId = urlMatch[1];
            } else {
              realJobId = `nk-${Date.now()}-${i}`;
            }
          }

          // Anti-Rate-Limit Gate: Pre-deduplicate in SQLite BEFORE opening a secondary tab to fetch full JD
          const existing = db.prepare('SELECT id FROM job_listings WHERE portal = ? AND portal_job_id = ?').get('naukri', realJobId);
          if (existing) {
            console.log(`[Naukri Scraper] Skipping already-indexed job ID ${realJobId} (${title} @ ${company}) before opening secondary tab`);
            continue;
          }

          // Extract real salary without hardcoding
          let advertisedComp: string | undefined = undefined;
          if (salEl) {
            const rawSal = (await salEl.innerText()).trim();
            if (rawSal && !rawSal.toLowerCase().includes('not disclosed') && !rawSal.toLowerCase().includes('undisclosed')) {
              advertisedComp = rawSal;
            }
          }

          const companySlug = company.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const jobUrl = href.startsWith('http') ? href : `https://www.naukri.com${href}`;

          // 2. Fetch the Full Real Job Description text from the job page
          let rawJd = '';
          if (jobUrl.startsWith('http')) {
            try {
              console.log(`[Naukri Scraper] Fetching full JD text for "${title}" @ ${company}...`);
              const jdPage = await context.newPage();
              await jdPage.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
              await browserManager.humanDelay(minDelayMs, maxDelayMs);

              const jdContainer = await jdPage.$(
                '.styles_JDC__dang-inner-html__h0K4t, .job-desc, .dang-inner-html, article.job-description, .styles_job-desc-container__txpYf, .clear-both.description'
              );

              if (jdContainer) {
                rawJd = (await jdContainer.innerText()).trim();
              } else {
                // Fallback to body or article text
                const articleEl = await jdPage.$('article, .styles_jhc__header__Pq_9q');
                rawJd = articleEl ? (await articleEl.innerText()).trim() : '';
              }
              await jdPage.close();
            } catch (jdErr: any) {
              console.warn(`[Naukri Scraper] Could not fetch detailed JD page: ${jdErr.message}`);
              rawJd = `Role: ${title} at ${company}. Location: ${loc}. (Full JD available at ${jobUrl})`;
            }
          }

          if (!rawJd) {
            rawJd = `Role: ${title} at ${company}. Location: ${loc}. (Full JD available at ${jobUrl})`;
          }

          scrapedJobs.push({
            id: `nk-${realJobId}`,
            portal: 'naukri',
            portalJobId: realJobId,
            url: jobUrl,
            title,
            company,
            companySlug,
            location: loc,
            remoteType: loc.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
            postedDate: new Date().toISOString().split('T')[0],
            capturedAt: new Date().toISOString(),
            rawJdText: rawJd,
            companyType: 'Enterprise / Mature Tech',
            reportsTo: undefined,
            advertisedComp,
            status: 'discovered',
            easyApply: false
          });
        }
      }

      await page.close();
      return scrapedJobs;
    } catch (err: any) {
      if (page) {
        try { await page.close(); } catch {}
      }
      console.error(`[Naukri Scraper Error] ${err.message}`);
      throw new Error(`Naukri Scrape Failed: ${err.message}`);
    }
  }
}

export const naukriScraper = new NaukriScraper();
