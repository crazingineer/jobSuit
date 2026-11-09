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

    try {
      const context = await browserManager.getContext({ headless: true });
      const page = await context.newPage();

      // Naukri search URL structure
      const formattedKeywords = keywords.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const formattedLoc = location.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const searchUrl = `https://www.naukri.com/${formattedKeywords}-jobs-in-${formattedLoc}?experience=${exp}&ctcFilter=${minCtc}to50`;

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await browserManager.humanDelay(2500, 4500);

      const jobCards = await page.$$('.srp-jobtuple-wrapper, .cust-job-tuple');
      const scrapedJobs: JobListing[] = [];

      for (let i = 0; i < Math.min(jobCards.length, limit); i++) {
        const card = jobCards[i];
        const titleEl = await card.$('.title, a.title');
        const companyEl = await card.$('.comp-name, a.comp-name');
        const locEl = await card.$('.locWdth, .loc-wrap');
        const salEl = await card.$('.sal-wrap, .ni-job-tuple-icon-srp-rupee');

        if (titleEl && companyEl) {
          const title = (await titleEl.innerText()).trim();
          const company = (await companyEl.innerText()).trim();
          const loc = locEl ? (await locEl.innerText()).trim() : location;
          const sal = salEl ? (await salEl.innerText()).trim() : `INR ${minCtc}L - 45L`;
          const url = (await titleEl.getAttribute('href')) || page.url();
          const companySlug = company.toLowerCase().replace(/[^a-z0-9]/g, '-');

          scrapedJobs.push({
            id: `nk-${Date.now()}-${i}`,
            portal: 'naukri',
            portalJobId: `nk-req-${i + 500}`,
            url,
            title,
            company,
            companySlug,
            location: loc,
            remoteType: loc.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
            postedDate: new Date().toISOString().split('T')[0],
            capturedAt: new Date().toISOString(),
            rawJdText: `Job posting on Naukri.com for ${title} at ${company}. Requires ${exp}+ years experience in modern software stacks.`,
            companyType: 'Enterprise / Mature Tech',
            reportsTo: 'Engineering Manager',
            advertisedComp: sal,
            status: 'discovered',
            easyApply: false
          });
        }
      }

      await page.close();
      return scrapedJobs;
    } catch (err: any) {
      console.warn(`[Naukri Scraper] Notice: ${err.message}. Using simulated stream.`);
      if (options.mockIfUnavailable) {
        return this.getSimulatedJobs(keywords, location, minCtc);
      }
      return [];
    }
  }

  public getSimulatedJobs(keywords: string, location: string, minCtc: number): JobListing[] {
    const timestamp = Date.now();
    return [
      {
        id: `job-nk-${timestamp}-1`,
        portal: 'naukri',
        portalJobId: `nk-774411`,
        url: 'https://www.naukri.com/job-listings-774411',
        title: `Lead ${keywords} & GenAI Architect`,
        company: 'Jio Platforms AI Center',
        companySlug: 'jio-platforms-ai-center',
        location: `${location} (Hybrid)`,
        remoteType: 'Hybrid',
        postedDate: new Date().toISOString().split('T')[0],
        capturedAt: new Date().toISOString(),
        rawJdText: 'We are hiring a Lead AI Systems Architect to build large-scale multimodal agent services, vLLM inference clusters, and enterprise Copilots for 500M+ users...',
        companyType: 'Enterprise / Corporate',
        reportsTo: 'Chief AI Architect',
        advertisedComp: `INR ${minCtc + 15}L - ${minCtc + 30}L`,
        status: 'discovered',
        easyApply: false
      },
      {
        id: `job-nk-${timestamp}-2`,
        portal: 'naukri',
        portalJobId: `nk-774412`,
        url: 'https://www.naukri.com/job-listings-774412',
        title: `Principal ${keywords} - Workflow Engine`,
        company: 'Postman India',
        companySlug: 'postman-india',
        location: `${location} / Remote`,
        remoteType: 'Remote',
        postedDate: new Date().toISOString().split('T')[0],
        capturedAt: new Date().toISOString(),
        rawJdText: 'Join Postman to design autonomous API testing agents, OpenAPI tool-calling specifications, and multi-agent workflow engines in TypeScript and Go...',
        companyType: 'Growth-stage startup / VC-backed',
        reportsTo: 'VP of Platform',
        advertisedComp: `INR ${minCtc + 20}L - ${minCtc + 35}L + ESOPs`,
        status: 'discovered',
        easyApply: false
      }
    ];
  }
}

export const naukriScraper = new NaukriScraper();
