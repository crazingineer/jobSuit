import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assessJobAlignmentWithCv,
  containsForbiddenFabrication,
  buildDefensibleTailoringPlan
} from './cv-alignment-guard';
import { INITIAL_MASTER_CV } from '../lib/api';

describe('CV Alignment Guard & Interview-Defensible Tailoring Engine', () => {
  it('accepts jobs aligned with Shubham Yadav Power Platform, SharePoint, and Azure AI stack', () => {
    const powerPlatformJob = {
      title: 'Senior Power Platform & Copilot Studio Developer',
      company: 'Avanade (Microsoft Partner)',
      rawJdText:
        'Looking for a Senior Power Platform Developer with 4+ years in Power Apps (Canvas & Model-Driven), Power Automate Cloud & Desktop RPA, Dataverse, SharePoint Online, SPFx, Copilot Studio, and PL-600 / PL-400 certifications.'
    };

    const result = assessJobAlignmentWithCv(powerPlatformJob, INITIAL_MASTER_CV);
    assert.equal(result.isAligned, true);
    assert.ok(result.recommendedScore >= 4.5, `Expected score >= 4.5, got ${result.recommendedScore}`);
    assert.ok(result.matchedVerifiedSkills.includes('Power Apps'));
    assert.ok(result.matchedVerifiedSkills.includes('Power Automate'));
    assert.ok(result.matchedVerifiedSkills.includes('SharePoint Online'));
  });

  it('rejects unaligned jobs requiring Playwright, Kubernetes GPU clusters, or Golang', () => {
    const unalignedJob = {
      title: 'Lead Playwright QA & Bare-Metal Kubernetes Golang Engineer',
      company: 'Generic Test Corp',
      rawJdText:
        'Must have 6+ years writing Playwright and Selenium browser tests in Golang and managing bare-metal GPU Kubernetes clusters.'
    };

    const result = assessJobAlignmentWithCv(unalignedJob, INITIAL_MASTER_CV);
    assert.equal(result.isAligned, false);
    assert.ok(result.forbiddenUnalignedSkillsInJd.includes('Playwright'));
    assert.ok(result.rejectionReason?.includes('Playwright'));
  });

  it('detects forbidden fabrications such as Playwright, HyperFlow, and Kubernetes', () => {
    assert.equal(
      containsForbiddenFabrication('Promoted Playwright CDP tool calling and 42% deflection at HyperFlow'),
      true
    );
    assert.equal(
      containsForbiddenFabrication('Managed bare-metal GPU Kubernetes clusters in Golang'),
      true
    );
    assert.equal(
      containsForbiddenFabrication(
        'Engineered an automated invoice processing pipeline using Azure AI Foundry (Content Understanding) and Power Automate with 95%+ accuracy.'
      ),
      false
    );
  });

  it('strips Playwright fabrications from tailoring plans and substitutes interview-defensible KPI Partners / Accenture bullets', () => {
    const targetJob = {
      title: 'Senior Power Platform & AI Automation Engineer',
      company: 'Mastercard',
      rawJdText:
        'Build enterprise workflows with Power Apps, Power Automate RPA, Dataverse, Azure AI Foundry, and Databricks SQL.'
    };

    const rawHallucinatedMods = [
      {
        bulletId: 'kp-b1',
        originalText: 'Developed Power Apps solution...',
        tailoredText: 'Built Playwright CDP browser automation at HyperFlow saving $180k/yr.',
        reason: 'Matches automation requirement'
      }
    ];

    const sanitized = buildDefensibleTailoringPlan(targetJob, INITIAL_MASTER_CV, rawHallucinatedMods);

    // Ensure the Playwright fabrication was rejected
    assert.equal(sanitized.rejectedFabrications.length, 1);
    assert.ok(sanitized.rejectedFabrications[0].includes('Playwright'));

    // Ensure zero tailored bullets contain Playwright or HyperFlow
    for (const mod of sanitized.bulletModifications) {
      assert.equal(containsForbiddenFabrication(mod.tailoredText), false);
      assert.ok(mod.interviewTalkingPoint.length > 20);
    }

    for (const item of sanitized.blockEPersonalization) {
      assert.equal(containsForbiddenFabrication(item.proposedChange), false);
      assert.ok(item.why.includes('Interview Talking Point:'));
    }
  });
});
