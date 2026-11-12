import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateJakesResumeLatex,
  escapeLatex,
  formatLatexBulletWithBold,
  formatHtmlBulletWithBold,
  isCanadianTargetLocation,
  resolveCandidateContactForRegion
} from './jakes-resume-generator';
import { INITIAL_VAULT, INITIAL_MASTER_CV, INITIAL_JOBS } from '../lib/api';

describe("Jake's Resume Generator & Dual India/Canada Active Job URL Verification", () => {
  it("generates authentic Overleaf Jake's Resume (syzfjbzwjncs) LaTeX structure", () => {
    const tex = generateJakesResumeLatex(
      INITIAL_VAULT,
      INITIAL_MASTER_CV,
      [
        {
          section: 'KPI Partners — Bullet #1',
          currentState:
            'Developed and deployed a scalable Power Apps solution integrated with SharePoint Online to streamline clinical study intake and regulatory tracking, reducing processing time by 60%.',
          proposedChange:
            'Architected and deployed a governed Power Platform solution (Canvas & Model-Driven Power Apps, Dataverse, and Power Automate cloud flows) integrated with SharePoint Online to automate clinical study intake and multi-tier regulatory approvals, reducing end-to-end processing time by 60%.'
        }
      ],
      {
        company: 'Toro Technology Center - India',
        roleTitle: 'Microsoft Power Platform Developer II',
        location: 'Pune Division, Maharashtra, India'
      }
    );

    assert.ok(tex.includes('\\documentclass[letterpaper,11pt]{article}'));
    assert.ok(tex.includes('\\textbf{\\Huge \\scshape Shubham Yadav}'));
    assert.ok(tex.includes('+91 7276085461'));
    assert.ok(tex.includes('\\titlerule'));
    assert.ok(tex.includes('\\resumeSubheading'));
    assert.ok(tex.includes('\\resumeProjectHeading'));
    assert.ok(tex.includes('\\resumeItemListStart'));
    assert.ok(tex.includes('\\resumeItem{'));

    assert.ok(tex.includes('KPI Partners'));
    assert.ok(tex.includes('Wilfrid Laurier University'));
    assert.ok(tex.includes('Accenture Solutions Pvt. Ltd.'));
    assert.ok(tex.includes('Pune University'));

    assert.ok(!tex.toLowerCase().includes('playwright'));
    assert.ok(!tex.toLowerCase().includes('hyperflow'));
  });

  it('automatically switches to Canadian phone (+1 289-890-3999) and Canadian Work Permit for Canadian jobs', () => {
    assert.equal(isCanadianTargetLocation('Toronto, Ontario, Canada'), true);
    assert.equal(isCanadianTargetLocation('Markham, Ontario, Canada (GTA)'), true);
    assert.equal(isCanadianTargetLocation('Pune Division, Maharashtra, India'), false);

    const caContact = resolveCandidateContactForRegion(INITIAL_VAULT, 'Toronto, Ontario, Canada');
    assert.equal(caContact.region, 'CA');
    assert.equal(caContact.phone, '+1 289-890-3999');
    assert.ok(caContact.workAuthBadge.includes('Canadian Open Work Permit'));

    const caTex = generateJakesResumeLatex(
      INITIAL_VAULT,
      INITIAL_MASTER_CV,
      [],
      {
        company: 'Softchoice',
        roleTitle: 'Sr. Power Platform Developer',
        location: 'Toronto, Ontario, Canada'
      }
    );
    assert.ok(caTex.includes('+1 289-890-3999'));
    assert.ok(caTex.includes('Canadian Work Permit'));
  });

  it('escapes LaTeX special characters and bolds metrics cleanly', () => {
    const escaped = escapeLatex('Achieved 95%+ accuracy & 60% faster processing ($10k saved)');
    assert.ok(escaped.includes('95\\%+'));
    assert.ok(escaped.includes('\\&'));
    assert.ok(escaped.includes('\\$10k'));

    const boldLatex = formatLatexBulletWithBold('Streamlined intake, reducing processing time by 60% across 15+ TB of data');
    assert.ok(boldLatex.includes('\\textbf{reducing processing time by 60\\%}'));
    assert.ok(boldLatex.includes('\\textbf{15+ TB}'));

    const boldHtml = formatHtmlBulletWithBold('Streamlined intake, reducing processing time by 60% across 15+ TB of data');
    assert.ok(boldHtml.includes('<strong>reducing processing time by 60%</strong>'));
    assert.ok(boldHtml.includes('<strong>15+ TB</strong>'));
  });

  it('ensures all 16 INITIAL_JOBS (3 Direct Greenhouse + 3 Naukri + 6 India LinkedIn + 4 Canada LinkedIn) use verified active URLs and truthful easyApply flags', () => {
    const deadJobIds = ['408899104', '408819201', 'nk-998811', 'wd-zs-334', 'hc-atlassian-882', 'nk-441100'];
    const verifiedGreenhouseIds = ['8907990002', '8585164002', '8132163'];
    const verifiedNaukriIds = ['nk-57055618', 'nk-44775592', 'nk-38642109'];
    const verifiedLinkedInOffsiteIds = [
      '4487744718', // Toro
      '4487641538', // Persistent Systems
      '4344708627', // Burns & McDonnell
      '4477383896', // Acuity Analytics
      '4480223745', // Anthesis Group
      '4469605924', // Softchoice
      '4487684684', // MNP
      '4473024769'  // nesto
    ];
    const verifiedLinkedInOnsiteEasyApplyIds = [
      '4487695412', // WTW
      '4485864694'  // Apptoza Inc.
    ];

    assert.equal(INITIAL_JOBS.length, 16);
    const naukriJobs = INITIAL_JOBS.filter((j) => j.portal === 'naukri');
    assert.equal(naukriJobs.length, 3);

    const anthesisJob = INITIAL_JOBS.find((j) => j.id === 'job-106');
    assert.ok(anthesisJob, 'Anthesis Group job-106 must exist');
    assert.equal(
      anthesisJob.externalApplyUrl,
      'https://anthesisgroup.pinpointhq.com/en/postings/2c996cbe-451b-451c-82b6-d7bc248ba6e6',
      'Anthesis Group job-106 must point to exact Pinpoint HQ requisition URL, not marketing /careers/'
    );

    for (const job of INITIAL_JOBS) {
      const pid = job.portalJobId || '';
      assert.ok(
        !deadJobIds.includes(pid),
        `Found dead synthetic job ID ${pid} in INITIAL_JOBS`
      );

      if (job.portal === 'greenhouse') {
        assert.ok(
          verifiedGreenhouseIds.includes(pid),
          `Greenhouse job ID ${pid} must be in verified public Greenhouse jobs list`
        );
        assert.ok(
          job.url.startsWith('https://job-boards.greenhouse.io/'),
          `Greenhouse job ${pid} must point to job-boards.greenhouse.io`
        );
      } else if (job.portal === 'naukri') {
        assert.ok(
          verifiedNaukriIds.includes(pid),
          `Naukri job ID ${pid} must be in verified Naukri jobs list`
        );
        assert.ok(
          job.url.startsWith('https://www.naukri.com/job-listings-'),
          `Naukri job ${pid} must point to naukri.com/job-listings-*`
        );
      } else if (job.portal === 'linkedin') {
        assert.equal(job.url, `https://www.linkedin.com/jobs/view/${pid}`);
        if (verifiedLinkedInOnsiteEasyApplyIds.includes(pid)) {
          assert.equal(
            job.easyApply,
            true,
            `Onsite LinkedIn job ${pid} (${job.company}) should have easyApply=true`
          );
        } else {
          assert.ok(
            verifiedLinkedInOffsiteIds.includes(pid),
            `LinkedIn job ID ${pid} must be in verified active LinkedIn jobs list`
          );
          assert.equal(
            job.easyApply,
            false,
            `Normal offsite LinkedIn job ${pid} (${job.company}) MUST have easyApply=false, never Easy Apply`
          );
        }
      }
    }
  });
});
