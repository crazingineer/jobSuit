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

    let page: Page | null = null;
    try {
      const context = await browserManager.getContext({ headless: true });
      page = await context.newPage();

      // Encode URL parameters
      const f_AL = easyApply ? '&f_AL=true' : '';
      const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}${f_AL}&sortBy=DD`;

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await browserManager.humanDelay(2500, 4500);

      // Check for auth wall
      if (page.url().includes('login') || page.url().includes('authwall') || page.url().includes('checkpoint')) {
        await page.close();
        throw new Error('LinkedIn authentication wall encountered. Please launch Chrome CDP (Port 9222) from Settings and ensure your LinkedIn account is logged in.');
      }

      const scrapedJobs: JobListing[] = [];
      const jobCards = await page.$$('.jobs-search-results__list-item, .job-card-container');

      if (jobCards.length === 0) {
        console.log(`[LinkedIn Scraper] No job cards found on page. Current URL: ${page.url()}`);
      }

      for (let i = 0; i < Math.min(jobCards.length, limit); i++) {
        const card = jobCards[i];

        // 1. Extract Real Job ID from card attributes or anchor href
        let realJobId = '';
        const occludableId = await card.getAttribute('data-occludable-job-id');
        const entityUrn = await card.getAttribute('data-job-id');
        if (occludableId && occludableId.trim()) {
          realJobId = occludableId.trim();
        } else if (entityUrn && entityUrn.trim()) {
          realJobId = entityUrn.trim();
        } else {
          const linkEl = await card.$('a.job-card-container__link, a.job-card-list__title, a[href*="/jobs/view/"]');
          const href = linkEl ? await linkEl.getAttribute('href') : null;
          const match = href ? href.match(/view\/([0-9]+)/) : null;
          if (match) {
            realJobId = match[1];
          } else {
            realJobId = `li-${Date.now()}-${i}`;
          }
        }

        await card.click();
        await browserManager.humanDelay(1500, 2500);

        const titleEl = await page.$('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24');
        const companyEl = await page.$('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__primary-description a');
        const locationEl = await page.$('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__workplace-type');
        const jdEl = await page.$('#job-details, .jobs-description__content, .jobs-box__html-content');

        // Extract Real Advertised Comp if present
        let advertisedComp: string | undefined = undefined;
        const compEl = await page.$('.job-details-jobs-unified-top-card__job-insight:has-text("$"), .job-details-jobs-unified-top-card__job-insight:has-text("₹"), .salary-compensation, .compensation__salary');
        if (compEl) {
          advertisedComp = (await compEl.innerText()).trim();
        }

        // Check if actually Easy Apply
        const applyBtn = await page.$('.jobs-apply-button--top-card, .jobs-apply-button, button[aria-label*="Easy Apply"]');
        let isRealEasyApply = false;
        if (applyBtn) {
          const btnText = (await applyBtn.innerText()).toLowerCase();
          const btnAria = (await applyBtn.getAttribute('aria-label'))?.toLowerCase() || '';
          isRealEasyApply = btnText.includes('easy apply') || btnAria.includes('easy apply');
        }

        if (titleEl && companyEl) {
          const title = (await titleEl.innerText()).trim();
          const company = (await companyEl.innerText()).trim();
          const loc = locationEl ? (await locationEl.innerText()).trim() : location;
          const rawJd = jdEl ? (await jdEl.innerText()).trim() : '';
          const companySlug = company.toLowerCase().replace(/[^a-z0-9]/g, '-');

          // Extract job URL from page or parameter
          let jobUrl = page.url();
          if (realJobId && !realJobId.startsWith('li-')) {
            jobUrl = `https://www.linkedin.com/jobs/view/${realJobId}/`;
          }

          scrapedJobs.push({
            id: `li-${realJobId}`,
            portal: 'linkedin',
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
            companyType: 'Enterprise / Technology',
            reportsTo: undefined,
            advertisedComp,
            status: 'discovered',
            easyApply: isRealEasyApply
          });
        }
      }

      await page.close();
      return scrapedJobs;
    } catch (err: any) {
      if (page) {
        try { await page.close(); } catch {}
      }
      console.error(`[LinkedIn Scraper Error] ${err.message}`);
      throw new Error(`LinkedIn Scrape Failed: ${err.message}`);
    }
  }
}

export const linkedInScraper = new LinkedInScraper();
