import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getHpAm0238TxHardwareConfig,
  planDomFormActions,
  planMultimodalVisionGuiSteps,
  VISUAL_SCREEN_PRESETS,
  generateOutreachMessages,
  analyzeAtsKeywordGap,
  ATS_FORM_PRESETS
} from './ai-agent-engine';
import { INITIAL_VAULT, INITIAL_MASTER_CV, INITIAL_JOBS } from '../lib/api';

test('HP OMEN 16-am0238TX hardware profile configures Multimodal VLM (qwen2.5vl:7b) for 8GB GDDR7 VRAM', () => {
  const hw = getHpAm0238TxHardwareConfig();
  assert.equal(hw.modelId, 'HP-AM0238TX');
  assert.equal(hw.vramGb, 8);
  assert.equal(hw.ramGb, 24);
  assert.equal(hw.ollamaEnvVars.OLLAMA_KV_CACHE_TYPE, 'q8_0');
  assert.equal(hw.ollamaEnvVars.OLLAMA_FLASH_ATTENTION, '1');

  // Verify primary model is Multimodal Vision-Language (qwen2.5vl:7b) and fits inside 8 GB GDDR7 VRAM
  const primaryModel = hw.recommendedModels[0];
  assert.ok(primaryModel.vramFootprintGb <= 6.0, 'Primary multimodal VLM must fit within 8GB VRAM');
  assert.equal(primaryModel.ollamaTag, 'qwen2.5vl:7b');
});

test('planMultimodalVisionGuiSteps grounds (x, y) pixel clicks, types into textboxes, and scrolls when fields are below the fold', () => {
  const workdayControls = VISUAL_SCREEN_PRESETS.workday.controls;
  const steps = planMultimodalVisionGuiSteps(
    workdayControls,
    INITIAL_VAULT,
    'data/cv_tailored/Master_Resume.pdf',
    'Stripe'
  );

  // Step 1 should click First Name textbox at (x=390, y=176) and type "Shubham"
  assert.equal(steps[0].primitive, 'CLICK_AND_TYPE');
  assert.equal(steps[0].clickX, 390);
  assert.equal(steps[0].clickY, 176);
  assert.equal(steps[0].textToType, 'Shubham');

  // Verify a MOUSE_WHEEL_SCROLL step occurs before filling below-the-fold fields (y > 700)
  const scrollStep = steps.find(s => s.primitive === 'MOUSE_WHEEL_SCROLL');
  assert.ok(scrollStep, 'Expected a MOUSE_WHEEL_SCROLL step when form fields are below y=680');
  assert.equal(scrollStep.scrollDeltaY, 440);
  assert.equal(scrollStep.viewportScrollY, 0);
  assert.equal(scrollStep.nextViewportScrollY, 440);

  // Verify Current CTC is clicked at adjusted viewport Y coordinate after scrolling
  const ctcStep = steps.find(s => s.targetControlId === 'wd-current-ctc');
  assert.ok(ctcStep);
  assert.equal(ctcStep.viewportScrollY, 440);
  assert.equal(ctcStep.textToType, '18 LPA');

  // Final step pauses at Submit Application button
  const lastStep = steps[steps.length - 1];
  assert.equal(lastStep.primitive, 'WAIT_HUMAN_SUBMIT');
});

test('planDomFormActions accurately decides where to click, fill, select, and upload on Workday preset', () => {
  const workdayElements = ATS_FORM_PRESETS.workday.elements;
  const decisions = planDomFormActions(
    workdayElements,
    INITIAL_VAULT,
    'data/cv_tailored/Master_Resume.pdf',
    'Stripe'
  );

  assert.equal(decisions.length, workdayElements.length);
  assert.equal(decisions[0].action, 'fill');
  assert.equal(decisions[0].valueToEnter, 'Shubham');
  assert.equal(decisions[1].action, 'fill');
  assert.equal(decisions[1].valueToEnter, 'Yadav');
});

test('generateOutreachMessages enforces strict 300-character limit on LinkedIn connection note', () => {
  const job = INITIAL_JOBS[0];
  const bundle = generateOutreachMessages(job, INITIAL_VAULT, INITIAL_MASTER_CV);
  assert.ok(bundle.linkedinCharCount <= 300, `Expected <= 300 chars, got ${bundle.linkedinCharCount}`);
  assert.ok(bundle.peerReferralDm.includes(job.company));
  assert.ok(bundle.hiringManagerColdEmailSubject.includes(job.title));
});

test('analyzeAtsKeywordGap computes keyword match percentage and negotiation anchors', () => {
  const sampleJd =
    'Looking for a Senior Power Platform Engineer skilled in Power Apps, Power Automate, Dataverse, SharePoint Online, Databricks, Python, SQL, and PL-600.';
  const analysis = analyzeAtsKeywordGap(sampleJd, INITIAL_MASTER_CV, INITIAL_VAULT);
  assert.ok(analysis.matchPercentage >= 85);
  assert.ok(analysis.matchedKeywords.includes('Power Apps'));
  assert.ok(analysis.matchedKeywords.includes('Power Automate'));
  assert.ok(analysis.matchedKeywords.includes('Databricks'));
  assert.ok(analysis.negotiationScript.anchorAskLakhs > INITIAL_VAULT.expectedCtcLakhs);
});
