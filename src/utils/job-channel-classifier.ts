import { JobListing } from '../types/job';

export type ApplicationChannel =
  | 'direct_ats'
  | 'linkedin_easy_apply'
  | 'linkedin_external_ats'
  | 'naukri_native'
  | 'enterprise_ats';

export interface JobChannelDescriptor {
  channel: ApplicationChannel;
  badgeLabel: string;
  shortBadge: string;
  actionLabel: string;
  portalHeaderLabel: string;
  targetApplyUrl: string;
}

/**
 * Pure, deterministic classifier that distinguishes:
 * 1. Direct Public ATS Forms (Greenhouse / Lever / Ashby — native HTML forms with zero login wall)
 * 2. True LinkedIn Onsite Easy Apply (strictly verified `public_jobs_apply-link-onsite`)
 * 3. Normal LinkedIn Jobs (`easyApply === false` — offsite external employer ATS `Apply ↗`)
 * 4. Enterprise ATS (Workday / Naukri / HiringCafe)
 */
export function classifyJobChannel(
  job: Pick<JobListing, 'portal' | 'easyApply' | 'url' | 'externalApplyUrl' | 'atsProvider'>
): JobChannelDescriptor {
  const portal = (job.portal || 'other').toLowerCase();

  if (portal === 'greenhouse' || portal === 'lever' || portal === 'ashby') {
    const providerLabel =
      job.atsProvider || portal.charAt(0).toUpperCase() + portal.slice(1);
    return {
      channel: 'direct_ats',
      badgeLabel: `${providerLabel} · Direct ATS`,
      shortBadge: 'Direct ATS',
      actionLabel: `Auto-Fill ${providerLabel}`,
      portalHeaderLabel: `${providerLabel} Native ATS Form`,
      targetApplyUrl: job.externalApplyUrl || job.url
    };
  }

  if (portal === 'linkedin') {
    if (job.easyApply === true) {
      return {
        channel: 'linkedin_easy_apply',
        badgeLabel: 'LinkedIn · Easy Apply ⚡',
        shortBadge: 'Easy Apply ⚡',
        actionLabel: 'Easy Apply Co-Pilot',
        portalHeaderLabel: 'LinkedIn Onsite Easy Apply',
        targetApplyUrl: job.url
      };
    }

    const atsSuffix = job.atsProvider ? ` (${job.atsProvider})` : '';
    return {
      channel: 'linkedin_external_ats',
      badgeLabel: `LinkedIn · External ATS ↗`,
      shortBadge: 'External ATS ↗',
      actionLabel: 'External ATS Co-Pilot ↗',
      portalHeaderLabel: `LinkedIn Offsite → External ATS${atsSuffix}`,
      targetApplyUrl: job.externalApplyUrl || job.url
    };
  }

  if (portal === 'naukri') {
    return {
      channel: 'naukri_native',
      badgeLabel: job.easyApply ? 'Naukri · Quick Apply' : 'Naukri · Company Site ↗',
      shortBadge: job.easyApply ? 'Quick Apply' : 'Company Site ↗',
      actionLabel: 'Naukri Co-Pilot',
      portalHeaderLabel: 'Naukri Application Portal',
      targetApplyUrl: job.externalApplyUrl || job.url
    };
  }

  const label = job.atsProvider || portal.toUpperCase();
  return {
    channel: 'enterprise_ats',
    badgeLabel: `${label} · Enterprise ATS`,
    shortBadge: 'Enterprise ATS',
    actionLabel: 'ATS Co-Pilot',
    portalHeaderLabel: `${label} Enterprise Application`,
    targetApplyUrl: job.externalApplyUrl || job.url
  };
}

export interface ParsedLinkedInApplyMetadata {
  isEasyApply: boolean;
  applyType: 'onsite_easy_apply' | 'offsite_external_ats';
  externalApplyUrl?: string;
}

/**
 * Inspects LinkedIn's public `/jobs-guest/jobs/api/jobPosting/{id}` HTML to determine
 * whether the job uses true Onsite LinkedIn Easy Apply or Offsite External ATS ("Apply ↗").
 *
 * CRITICAL: Never defaults to Easy Apply (`true`) unless `public_jobs_apply-link-onsite`
 * is explicitly present AND no offsite icon/control is present.
 */
export function parseLinkedInGuestPostingHtml(detailHtml: string): ParsedLinkedInApplyMetadata {
  if (!detailHtml) {
    return { isEasyApply: false, applyType: 'offsite_external_ats' };
  }

  const hasOnsiteApply =
    detailHtml.includes('public_jobs_apply-link-onsite') ||
    /class="[^"]*jobs-apply-button[^"]*"[^>]*>[\s\S]{0,120}?Easy Apply/i.test(detailHtml);

  const hasOffsiteApply =
    detailHtml.includes('apply-button__offsite-apply-icon-svg') ||
    detailHtml.includes('public_jobs_apply-link-offsite');

  const isEasyApply = Boolean(hasOnsiteApply && !hasOffsiteApply);

  let externalApplyUrl: string | undefined;

  // 1. Check `<code id="applyUrl"><!--"https://..."--></code>`
  const codeUrlMatch = detailHtml.match(
    /<code[^>]*id="applyUrl"[^>]*>\s*<!--\s*"?(https?:\/\/[^"<>]+)"?\s*-->\s*<\/code>/i
  );
  if (codeUrlMatch?.[1]) {
    try {
      const rawUrl = codeUrlMatch[1].replace(/&amp;/g, '&');
      const parsed = new URL(rawUrl);
      const nestedUrl = parsed.searchParams.get('url');
      externalApplyUrl = nestedUrl ? decodeURIComponent(nestedUrl) : rawUrl;
    } catch {
      externalApplyUrl = codeUrlMatch[1];
    }
  }

  // 2. Fallback: Check `<a ... data-tracking-control-name="public_jobs_apply-link-offsite" href="...">`
  if (!externalApplyUrl) {
    const anchorMatch = detailHtml.match(
      /href="([^"]+)"[^>]*data-tracking-control-name="public_jobs_apply-link-offsite"|data-tracking-control-name="public_jobs_apply-link-offsite"[^>]*href="([^"]+)"/i
    );
    const rawHref = anchorMatch?.[1] || anchorMatch?.[2];
    if (rawHref) {
      try {
        const cleaned = rawHref.replace(/&amp;/g, '&');
        const parsed = new URL(cleaned, 'https://www.linkedin.com');
        const nestedUrl = parsed.searchParams.get('url');
        externalApplyUrl = nestedUrl ? decodeURIComponent(nestedUrl) : parsed.toString();
      } catch {
        // ignore malformed href
      }
    }
  }

  // Avoid keeping a linkedin.com login/signup redirect as externalApplyUrl
  if (externalApplyUrl && /linkedin\.com\/(login|signup|uas|authwall)/i.test(externalApplyUrl)) {
    externalApplyUrl = undefined;
  }

  return {
    isEasyApply,
    applyType: isEasyApply ? 'onsite_easy_apply' : 'offsite_external_ats',
    externalApplyUrl
  };
}
