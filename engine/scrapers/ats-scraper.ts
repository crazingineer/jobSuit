import { JobListing } from '../../src/types/job';

export interface AtsBoardTarget {
  portal: 'greenhouse' | 'lever' | 'ashby' | 'workday';
  company: string;
  boardUrl: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractBoardToken(url: string, portal: string): string {
  if (portal === 'greenhouse') {
    const forMatch = url.match(/for=([a-zA-Z0-9_-]+)/i);
    if (forMatch) return forMatch[1];
    const match = url.match(/greenhouse\.io\/([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : '';
  }
  if (portal === 'ashby') {
    const match = url.match(/ashbyhq\.com\/([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : '';
  }
  if (portal === 'lever') {
    const match = url.match(/lever\.co\/([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : '';
  }
  return '';
}

export class AtsScraper {
  /**
   * Scrapes live ATS boards using their public APIs and structured endpoints.
   * Zero mock objects returned.
   */
  public async scrapeBoard(target: AtsBoardTarget, limit: number = 5): Promise<JobListing[]> {
    console.log(`[ATS Scraper] Fetching live ${target.portal.toUpperCase()} board for ${target.company}...`);
    const companySlug = target.company.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const token = extractBoardToken(target.boardUrl, target.portal) || companySlug;

    try {
      if (target.portal === 'greenhouse') {
        const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
        console.log(`[ATS Scraper] Querying Greenhouse API: ${apiUrl}`);

        const res = await fetch(apiUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'jobSuite/1.0' }
        });

        if (!res.ok) {
          throw new Error(`Greenhouse API returned HTTP ${res.status} for token "${token}"`);
        }

        const data = await res.json();
        const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];
        const results: JobListing[] = [];

        for (const job of rawJobs.slice(0, limit)) {
          const rawJd = job.content ? stripHtml(job.content) : `Position at ${target.company}`;
          const loc = job.location?.name || 'Remote';

          results.push({
            id: `gh-${job.id}`,
            portal: 'greenhouse',
            portalJobId: String(job.id),
            url: job.absolute_url || `${target.boardUrl}/jobs/${job.id}`,
            title: job.title,
            company: target.company,
            companySlug,
            location: loc,
            remoteType: loc.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
            postedDate: job.updated_at ? job.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
            capturedAt: new Date().toISOString(),
            rawJdText: rawJd,
            companyType: 'High-Growth Tech',
            reportsTo: undefined,
            advertisedComp: undefined,
            status: 'discovered',
            easyApply: false
          });
        }

        console.log(`[ATS Scraper] Successfully retrieved ${results.length} real jobs from Greenhouse (${target.company}).`);
        return results;
      } else if (target.portal === 'ashby') {
        const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${token}`;
        console.log(`[ATS Scraper] Querying Ashby API: ${apiUrl}`);

        const res = await fetch(apiUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'jobSuite/1.0' }
        });

        if (!res.ok) {
          throw new Error(`Ashby API returned HTTP ${res.status} for token "${token}"`);
        }

        const data = await res.json();
        const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];
        const results: JobListing[] = [];

        for (const job of rawJobs.slice(0, limit)) {
          const rawJd = job.descriptionHtml ? stripHtml(job.descriptionHtml) : (job.descriptionPlain || `Position at ${target.company}`);
          const loc = job.location || (job.isRemote ? 'Remote' : 'Hybrid');

          results.push({
            id: `ashby-${job.id}`,
            portal: 'ashby',
            portalJobId: String(job.id),
            url: job.jobUrl || `${target.boardUrl}/${job.id}`,
            title: job.title,
            company: target.company,
            companySlug,
            location: loc,
            remoteType: loc.toLowerCase().includes('remote') || job.isRemote ? 'Remote' : 'Hybrid',
            postedDate: job.publishedAt ? job.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0],
            capturedAt: new Date().toISOString(),
            rawJdText: rawJd,
            companyType: 'Growth-stage startup',
            reportsTo: undefined,
            advertisedComp: job.compensation ? (job.compensation.summary || undefined) : undefined,
            status: 'discovered',
            easyApply: false
          });
        }

        console.log(`[ATS Scraper] Successfully retrieved ${results.length} real jobs from Ashby (${target.company}).`);
        return results;
      } else if (target.portal === 'lever') {
        const apiUrl = `https://api.lever.co/v0/postings/${token}?mode=json`;
        console.log(`[ATS Scraper] Querying Lever API: ${apiUrl}`);

        const res = await fetch(apiUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'jobSuite/1.0' }
        });

        if (!res.ok) {
          throw new Error(`Lever API returned HTTP ${res.status} for token "${token}"`);
        }

        const rawJobs = await res.json();
        const results: JobListing[] = [];

        if (Array.isArray(rawJobs)) {
          for (const job of rawJobs.slice(0, limit)) {
            const rawJd = job.descriptionPlain || (job.description ? stripHtml(job.description) : '');
            const loc = job.categories?.location || 'Remote';

            results.push({
              id: `lever-${job.id}`,
              portal: 'lever',
              portalJobId: String(job.id),
              url: job.hostedUrl || `${target.boardUrl}/${job.id}`,
              title: job.text,
              company: target.company,
              companySlug,
              location: loc,
              remoteType: loc.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
              postedDate: job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              capturedAt: new Date().toISOString(),
              rawJdText: rawJd,
              companyType: 'Tech Startup / Scaleup',
              reportsTo: undefined,
              advertisedComp: undefined,
              status: 'discovered',
              easyApply: false
            });
          }
        }

        return results;
      }
    } catch (err: any) {
      console.error(`[ATS Scraper Error] ${err.message}`);
      throw new Error(`ATS Scrape Failed for ${target.company}: ${err.message}`);
    }

    return [];
  }
}

export const atsScraper = new AtsScraper();
