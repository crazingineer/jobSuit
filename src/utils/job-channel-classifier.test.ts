import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyJobChannel,
  parseLinkedInGuestPostingHtml
} from './job-channel-classifier';

describe('Job Channel Classifier & LinkedIn Apply Type Parser', () => {
  it('never labels normal LinkedIn jobs (easyApply=false) as Easy Apply', () => {
    const normalLinkedIn = classifyJobChannel({
      portal: 'linkedin',
      easyApply: false,
      url: 'https://www.linkedin.com/jobs/view/4469605924',
      externalApplyUrl: 'https://careers.softchoice.com/',
      atsProvider: 'Softchoice Careers ATS'
    });

    assert.equal(normalLinkedIn.channel, 'linkedin_external_ats');
    assert.equal(normalLinkedIn.badgeLabel, 'LinkedIn · External ATS ↗');
    assert.equal(normalLinkedIn.actionLabel, 'External ATS Co-Pilot ↗');
    assert.ok(!normalLinkedIn.badgeLabel.includes('Easy Apply'));
    assert.ok(!normalLinkedIn.actionLabel.includes('Easy Apply'));
    assert.equal(normalLinkedIn.targetApplyUrl, 'https://careers.softchoice.com/');
  });

  it('labels verified onsite LinkedIn postings (easyApply=true) as LinkedIn · Easy Apply ⚡', () => {
    const onsiteEasyApply = classifyJobChannel({
      portal: 'linkedin',
      easyApply: true,
      url: 'https://www.linkedin.com/jobs/view/4487695412',
      atsProvider: 'LinkedIn Easy Apply'
    });

    assert.equal(onsiteEasyApply.channel, 'linkedin_easy_apply');
    assert.equal(onsiteEasyApply.badgeLabel, 'LinkedIn · Easy Apply ⚡');
    assert.equal(onsiteEasyApply.actionLabel, 'Easy Apply Co-Pilot');
    assert.equal(onsiteEasyApply.targetApplyUrl, 'https://www.linkedin.com/jobs/view/4487695412');
  });

  it('labels Direct Public Greenhouse postings cleanly as Direct ATS', () => {
    const ghJob = classifyJobChannel({
      portal: 'greenhouse',
      easyApply: true,
      url: 'https://job-boards.greenhouse.io/embed/job_app?for=databricks&token=8907990002',
      atsProvider: 'Greenhouse'
    });

    assert.equal(ghJob.channel, 'direct_ats');
    assert.equal(ghJob.badgeLabel, 'Greenhouse · Direct ATS');
    assert.equal(ghJob.actionLabel, 'Auto-Fill Greenhouse');
  });

  it('parses LinkedIn guest HTML with offsite SVG icon as isEasyApply=false and extracts externalApplyUrl', () => {
    const offsiteHtml = `
      <div class="top-card-layout__cta-container">
        <code id="applyUrl" style="display: none"><!--"https://www.linkedin.com/jobs/view/externalApply/4469605924?url=https%3A%2F%2Fcareers.softchoice.com%2Fjobs%2F123"--></code>
        <a class="apply-button apply-button--link" data-tracking-control-name="public_jobs_apply-link-offsite" href="https://www.linkedin.com/uas/login">
          Apply
          <svg class="apply-button__offsite-apply-icon-svg"></svg>
        </a>
      </div>
    `;

    const parsed = parseLinkedInGuestPostingHtml(offsiteHtml);
    assert.equal(parsed.isEasyApply, false);
    assert.equal(parsed.applyType, 'offsite_external_ats');
    assert.equal(parsed.externalApplyUrl, 'https://careers.softchoice.com/jobs/123');
  });

  it('parses LinkedIn guest HTML with public_jobs_apply-link-onsite and no offsite icon as isEasyApply=true', () => {
    const onsiteHtml = `
      <div class="top-card-layout__cta-container">
        <button class="apply-button" data-tracking-control-name="public_jobs_apply-link-onsite">
          Easy Apply
        </button>
      </div>
    `;

    const parsed = parseLinkedInGuestPostingHtml(onsiteHtml);
    assert.equal(parsed.isEasyApply, true);
    assert.equal(parsed.applyType, 'onsite_easy_apply');
    assert.equal(parsed.externalApplyUrl, undefined);
  });

  it('defaults unknown/empty LinkedIn HTML safely to isEasyApply=false (never assumes Easy Apply)', () => {
    const emptyParsed = parseLinkedInGuestPostingHtml('<div>Some job posting without apply button</div>');
    assert.equal(emptyParsed.isEasyApply, false);
    assert.equal(emptyParsed.applyType, 'offsite_external_ats');
  });
});
