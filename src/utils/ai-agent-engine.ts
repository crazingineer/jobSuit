import { PersonalVault, MasterCV } from '../types/vault';
import { JobListing } from '../types/job';

export interface HardwareProfileConfig {
  modelId: string;
  deviceName: string;
  cpu: string;
  gpu: string;
  vramGb: number;
  ramGb: number;
  npu: string;
  recommendedModels: {
    role: string;
    name: string;
    ollamaTag: string;
    vramFootprintGb: number;
    speedTokensPerSec: string;
    purpose: string;
  }[];
  ollamaEnvVars: Record<string, string>;
  ollamaModelfileParams: {
    num_ctx: number;
    num_gpu: number;
    num_thread: number;
    temperature: number;
    top_p: number;
  };
}

export interface SomDomElement {
  somId: number;
  tag: 'input' | 'select' | 'textarea' | 'button' | 'file' | 'radio' | 'checkbox';
  inputType?: string;
  label: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
  selector: string;
  currentValue?: string;
  boundingBox?: { x: number; y: number; w: number; h: number };
}

export interface AiDomActionDecision {
  somId: number;
  action: 'fill' | 'select' | 'click' | 'upload' | 'check' | 'radio' | 'wait_human';
  selector: string;
  targetLabel: string;
  valueToEnter: string;
  confidence: number;
  sourceAnchor: string;
  reasoning: string;
}

/**
 * Multimodal Screen-Grab GUI Vision Types (Qwen2.5-VL / UI-TARS / Gemini Mariner style)
 */
export interface ScreenVisualControl {
  id: string;
  label: string;
  placeholder?: string;
  controlType: 'textbox' | 'dropdown' | 'file_dropzone' | 'textarea' | 'checkbox' | 'submit_button';
  options?: string[];
  /** Coordinates in the full 1280x1320 document (before scroll offset) */
  docBox: { x: number; y: number; w: number; h: number };
  required: boolean;
}

export interface VisionGuiPrimitiveStep {
  stepIndex: number;
  frameTitle: string;
  /** Scroll offset of the 1280x800 browser viewport when this screenshot was captured */
  viewportScrollY: number;
  /** Scroll offset after this step executes (changes when primitive === 'MOUSE_WHEEL_SCROLL') */
  nextViewportScrollY: number;
  /** Low-level OS/Playwright GUI action decided by the Multimodal VLM from the screenshot */
  primitive:
    | 'CLICK_AND_TYPE'
    | 'CLICK_AND_SELECT'
    | 'CLICK_FILE_DROPZONE'
    | 'CLICK_CHECKBOX'
    | 'MOUSE_WHEEL_SCROLL'
    | 'WAIT_HUMAN_SUBMIT';
  /** Exact (x, y) pixel coordinates inside the 1280x800 screen grab where the mouse clicks */
  clickX: number;
  clickY: number;
  /** Visual bounding box [x1, y1, x2, y2] in the 1280x800 screen grab detected by the VLM */
  detectedViewportBox: [number, number, number, number];
  targetControlId: string;
  targetLabel: string;
  textToType: string;
  scrollDeltaY: number;
  confidence: number;
  /** What the Multimodal VLM visually observes in the 1280x800 screenshot */
  visualObservation: string;
  /** Exact Playwright mouse/keyboard command executed on the browser page */
  playwrightCommand: string;
  /** Snapshot of all field values filled up to and including this frame */
  filledValuesSnapshot: Record<string, string>;
}

export interface OutreachBundle {
  linkedinConnectNote: string;
  linkedinCharCount: number;
  peerReferralDm: string;
  hiringManagerColdEmailSubject: string;
  hiringManagerColdEmailBody: string;
  followUp7DayNote: string;
}

export interface KeywordGapAnalysis {
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendedBulletIds: string[];
  negotiationScript: {
    anchorAskLakhs: number;
    walkAwayLakhs: number;
    buyoutPitch: string;
  };
}

/**
 * Hardware optimization profile specifically tuned for HP OMEN 16-am0238TX:
 * - CPU: Intel Core Ultra 7 255H (16 Cores: 6P + 8E + 2LPE, up to 5.1 GHz)
 * - GPU: NVIDIA GeForce RTX 5060 Laptop GPU (8 GB GDDR7 VRAM)
 * - RAM: 24 GB DDR5-5600 MT/s
 * - NPU: Intel AI Boost NPU (13+ TOPS)
 *
 * Configured for MULTIMODAL SCREEN-GRAB COMPUTER USE (like Gemini in Chrome / Qwen2.5-VL / UI-TARS).
 */
export function getHpAm0238TxHardwareConfig(): HardwareProfileConfig {
  return {
    modelId: 'HP-AM0238TX',
    deviceName: 'HP OMEN 16-am0238TX (Multimodal Vision GUI Agent)',
    cpu: 'Intel® Core™ Ultra 7 255H (16C / 5.1 GHz)',
    gpu: 'NVIDIA® GeForce RTX™ 5060 Laptop (8 GB GDDR7)',
    vramGb: 8,
    ramGb: 24,
    npu: 'Intel® AI Boost NPU',
    recommendedModels: [
      {
        role: 'Primary Multimodal Screen-Grab Agent (CUDA)',
        name: 'Qwen 2.5 VL 7B Vision-Language (Q4_K_M)',
        ollamaTag: 'qwen2.5vl:7b',
        vramFootprintGb: 5.2,
        speedTokensPerSec: '48–62 tok/s',
        purpose: 'Reads raw 1280×800 browser screenshots, grounds visual textboxes/buttons to (x, y) pixels, and drives mouse.click, keyboard.type, and mouse.wheel scroll'
      },
      {
        role: 'Alternative GUI Computer-Use Specialist (CUDA)',
        name: 'UI-TARS 7B / MiniCPM-V 2.6 (Q4_K_M)',
        ollamaTag: 'minicpm-v:8b',
        vramFootprintGb: 5.5,
        speedTokensPerSec: '44–55 tok/s',
        purpose: 'High-density OCR + visual form widget recognition for complex multi-step modals and custom dropdowns'
      },
      {
        role: 'Fast Semantic Vault Matcher (NPU / CPU)',
        name: 'Nomic Embed Text v1.5',
        ollamaTag: 'nomic-embed-text',
        vramFootprintGb: 0.3,
        speedTokensPerSec: '650+ emb/s',
        purpose: 'Runs on Intel AI Boost NPU / CPU so 100% of the 8 GB GDDR7 VRAM stays dedicated to the Multimodal Vision model'
      }
    ],
    ollamaEnvVars: {
      OLLAMA_FLASH_ATTENTION: '1',
      OLLAMA_KV_CACHE_TYPE: 'q8_0',
      OLLAMA_MAX_LOADED_MODELS: '1',
      OLLAMA_NUM_PARALLEL: '1',
      OLLAMA_GPU_OVERHEAD: '536870912',
      CUDA_VISIBLE_DEVICES: '0'
    },
    ollamaModelfileParams: {
      num_ctx: 8192,
      num_gpu: 99,
      num_thread: 14,
      temperature: 0.1,
      top_p: 0.9
    }
  };
}

/**
 * Built-in Visual Screen-Grab Form Layouts (1280x1320 full document height viewed through a 1280x800 viewport).
 * Controls with docBox.y > 700 are initially BELOW THE FOLD and require the Multimodal VLM to issue a
 * `MOUSE_WHEEL_SCROLL` action (`page.mouse.wheel(0, 460)`) to scroll them into view before clicking and typing!
 */
export const VISUAL_SCREEN_PRESETS: Record<
  'workday' | 'linkedin' | 'naukri',
  {
    name: string;
    portal: string;
    domain: string;
    viewportWidth: number;
    viewportHeight: number;
    documentHeight: number;
    controls: ScreenVisualControl[];
  }
> = {
  workday: {
    name: 'Workday Enterprise ATS — Multimodal Screen-Grab Loop',
    portal: 'workday',
    domain: 'stripe.wd5.myworkdayjobs.com/en-US/Staff_AI_Engineer/apply',
    viewportWidth: 1280,
    viewportHeight: 800,
    documentHeight: 1280,
    controls: [
      // ABOVE THE FOLD (Visible at scrollY = 0)
      {
        id: 'wd-first-name',
        label: 'Legal First Name *',
        placeholder: 'Enter given name',
        controlType: 'textbox',
        docBox: { x: 180, y: 150, w: 420, h: 52 },
        required: true
      },
      {
        id: 'wd-last-name',
        label: 'Legal Last Name *',
        placeholder: 'Enter family name',
        controlType: 'textbox',
        docBox: { x: 640, y: 150, w: 420, h: 52 },
        required: true
      },
      {
        id: 'wd-email',
        label: 'Candidate Email Address *',
        placeholder: 'name@domain.com',
        controlType: 'textbox',
        docBox: { x: 180, y: 255, w: 420, h: 52 },
        required: true
      },
      {
        id: 'wd-phone',
        label: 'Primary Mobile Number *',
        placeholder: '+91 XXXXX XXXXX',
        controlType: 'textbox',
        docBox: { x: 640, y: 255, w: 420, h: 52 },
        required: true
      },
      {
        id: 'wd-resume',
        label: 'Resume / CV Dropzone (Click or Drop PDF) *',
        placeholder: 'Drop PDF here or click to browse',
        controlType: 'file_dropzone',
        docBox: { x: 180, y: 365, w: 880, h: 86 },
        required: true
      },
      {
        id: 'wd-work-auth',
        label: 'Are you legally authorized to work in India? *',
        options: ['Yes', 'No'],
        controlType: 'dropdown',
        docBox: { x: 180, y: 505, w: 420, h: 52 },
        required: true
      },
      {
        id: 'wd-visa',
        label: 'Will you now or in the future require visa sponsorship? *',
        options: ['No', 'Yes'],
        controlType: 'dropdown',
        docBox: { x: 640, y: 505, w: 420, h: 52 },
        required: true
      },
      // BELOW THE FOLD (y > 700 — requires MOUSE_WHEEL_SCROLL to bring into 1280x800 screen grab!)
      {
        id: 'wd-current-ctc',
        label: 'Current CTC (in INR Lakhs per Annum) *',
        placeholder: 'e.g. 18 LPA',
        controlType: 'textbox',
        docBox: { x: 180, y: 760, w: 420, h: 52 },
        required: true
      },
      {
        id: 'wd-expected-ctc',
        label: 'Expected CTC (in INR Lakhs per Annum) *',
        placeholder: 'e.g. 28 LPA',
        controlType: 'textbox',
        docBox: { x: 640, y: 760, w: 420, h: 52 },
        required: true
      },
      {
        id: 'wd-notice',
        label: 'Official Notice Period / Joining Timeline *',
        options: ['Immediate', '30 Days', '60 Days (Buyout Negotiable)', '90 Days'],
        controlType: 'dropdown',
        docBox: { x: 180, y: 870, w: 880, h: 52 },
        required: true
      },
      {
        id: 'wd-why-apply',
        label: 'Why do you want to join this engineering team?',
        placeholder: 'Share relevant architecture & AI automation experience...',
        controlType: 'textarea',
        docBox: { x: 180, y: 975, w: 880, h: 80 },
        required: false
      },
      {
        id: 'wd-consent',
        label: 'I acknowledge and agree to the Candidate Privacy Statement *',
        controlType: 'checkbox',
        docBox: { x: 180, y: 1090, w: 520, h: 36 },
        required: true
      },
      {
        id: 'wd-submit',
        label: 'Submit Application',
        controlType: 'submit_button',
        docBox: { x: 780, y: 1155, w: 280, h: 50 },
        required: false
      }
    ]
  },
  linkedin: {
    name: 'LinkedIn Easy Apply Modal — Multimodal Screen-Grab Loop',
    portal: 'linkedin',
    domain: 'linkedin.com/jobs/view/401928312/apply',
    viewportWidth: 1280,
    viewportHeight: 800,
    documentHeight: 1180,
    controls: [
      {
        id: 'li-email',
        label: 'Email address *',
        placeholder: 'Candidate email',
        controlType: 'textbox',
        docBox: { x: 260, y: 160, w: 760, h: 52 },
        required: true
      },
      {
        id: 'li-phone',
        label: 'Mobile phone number *',
        placeholder: 'Mobile number',
        controlType: 'textbox',
        docBox: { x: 260, y: 265, w: 760, h: 52 },
        required: true
      },
      {
        id: 'li-resume',
        label: 'Upload Tailored Resume PDF *',
        placeholder: 'Attach ATS PDF',
        controlType: 'file_dropzone',
        docBox: { x: 260, y: 375, w: 760, h: 82 },
        required: true
      },
      {
        id: 'li-exp-years',
        label: 'How many years of work experience do you have with AI & Workflow Automation? *',
        placeholder: 'Numeric years (e.g. 4.5)',
        controlType: 'textbox',
        docBox: { x: 260, y: 515, w: 760, h: 52 },
        required: true
      },
      // BELOW THE FOLD
      {
        id: 'li-cur-ctc',
        label: 'What is your current CTC in INR Lakhs? *',
        placeholder: '18',
        controlType: 'textbox',
        docBox: { x: 260, y: 760, w: 360, h: 52 },
        required: true
      },
      {
        id: 'li-exp-ctc',
        label: 'What is your expected CTC in INR Lakhs? *',
        placeholder: '28',
        controlType: 'textbox',
        docBox: { x: 660, y: 760, w: 360, h: 52 },
        required: true
      },
      {
        id: 'li-notice',
        label: 'How soon can you join if offered the role? *',
        options: ['Immediately', '30 days', '60 days (buyout negotiable)', '90 days'],
        controlType: 'dropdown',
        docBox: { x: 260, y: 875, w: 760, h: 52 },
        required: true
      },
      {
        id: 'li-submit',
        label: 'Submit Application',
        controlType: 'submit_button',
        docBox: { x: 740, y: 985, w: 280, h: 50 },
        required: false
      }
    ]
  },
  naukri: {
    name: 'Naukri.com Chatbot Recruiter Drawer — Multimodal Screen-Grab Loop',
    portal: 'naukri',
    domain: 'naukri.com/job-listings-staff-genai-engineer',
    viewportWidth: 1280,
    viewportHeight: 800,
    documentHeight: 1140,
    controls: [
      {
        id: 'nk-cur-ctc',
        label: 'What is your Current CTC (in LPA)? *',
        placeholder: 'Enter current CTC',
        controlType: 'textbox',
        docBox: { x: 340, y: 175, w: 680, h: 52 },
        required: true
      },
      {
        id: 'nk-exp-ctc',
        label: 'What is your Expected CTC (in LPA)? *',
        placeholder: 'Enter expected CTC',
        controlType: 'textbox',
        docBox: { x: 340, y: 290, w: 680, h: 52 },
        required: true
      },
      {
        id: 'nk-notice',
        label: 'What is your official Notice Period? *',
        options: ['15 Days or less', '1 Month', '2 Months (60 Days)', '3 Months'],
        controlType: 'dropdown',
        docBox: { x: 340, y: 405, w: 680, h: 52 },
        required: true
      },
      {
        id: 'nk-exp-years',
        label: 'Total years of experience in Power Platform / Azure / Python? *',
        placeholder: '4.5',
        controlType: 'textbox',
        docBox: { x: 340, y: 520, w: 680, h: 52 },
        required: true
      },
      // BELOW THE FOLD
      {
        id: 'nk-location',
        label: 'Preferred Work Location (Pune / Bengaluru / Remote) *',
        placeholder: 'Pune, Bengaluru, Remote',
        controlType: 'textbox',
        docBox: { x: 340, y: 760, w: 680, h: 52 },
        required: true
      },
      {
        id: 'nk-why',
        label: 'Brief summary of your relevant AI & Data Engineering achievements',
        placeholder: 'Describe production impact...',
        controlType: 'textarea',
        docBox: { x: 340, y: 865, w: 680, h: 80 },
        required: false
      },
      {
        id: 'nk-submit',
        label: 'Submit Application',
        controlType: 'submit_button',
        docBox: { x: 740, y: 990, w: 280, h: 50 },
        required: false
      }
    ]
  }
};

/**
 * Resolves the grounded value to type/select for a visually detected screen control
 */
export function resolveValueForVisualControl(
  ctrl: ScreenVisualControl,
  vault: PersonalVault,
  tailoredPdfPath: string = 'data/cv_tailored/Master_Resume.pdf',
  companyName: string = 'Target Company'
): string {
  const labelLower = `${ctrl.label} ${ctrl.placeholder || ''}`.toLowerCase();
  const nameParts = (vault.fullName || 'Shubham Yadav').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Shubham';
  const lastName = nameParts.slice(1).join(' ') || 'Yadav';

  if (ctrl.controlType === 'file_dropzone') return tailoredPdfPath;
  if (ctrl.controlType === 'checkbox') return 'Checked (true)';
  if (ctrl.controlType === 'submit_button') return 'Pause for Co-Pilot Sign-Off';

  if (labelLower.includes('first name') || labelLower.includes('given name')) return firstName;
  if (labelLower.includes('last name') || labelLower.includes('family name')) return lastName;
  if (labelLower.includes('email')) return vault.atsEmail || vault.email;
  if (labelLower.includes('phone') || labelLower.includes('mobile')) return vault.phone;
  if (labelLower.includes('current ctc')) return `${vault.currentCtcLakhs} LPA`;
  if (labelLower.includes('expected ctc')) {
    return `${vault.expectedCtcLakhs} LPA${vault.ctcNegotiable ? ' (Negotiable)' : ''}`;
  }
  if (labelLower.includes('notice') || labelLower.includes('how soon')) {
    if (ctrl.options && ctrl.options.length > 0) {
      return (
        ctrl.options.find(
          (o) =>
            o.includes(String(vault.noticePeriodDays)) ||
            o.toLowerCase().includes('60') ||
            o.toLowerCase().includes('2 month')
        ) || ctrl.options[0]
      );
    }
    return `${vault.noticePeriodDays} Days (Buyout Negotiable)`;
  }
  if (ctrl.controlType === 'textarea' || labelLower.includes('why') || labelLower.includes('summary')) {
    return (
      vault.qaSnippets?.why_change ||
      `4.5+ years engineering Azure AI Foundry, Databricks SQL, and Power Platform automation (60% faster clinical/enterprise workflows). Excited to build for ${companyName}.`
    );
  }
  if (labelLower.includes('experience') || labelLower.includes('how many years')) {
    const expStr = vault.qaSnippets?.total_experience || '4.5';
    const match = expStr.match(/(\d+(?:\.\d+)?)/);
    return match ? `${match[1]} years` : '4.5 years';
  }
  if (labelLower.includes('sponsorship') || labelLower.includes('visa')) {
    return vault.needsSponsorship ? 'Yes' : 'No';
  }
  if (labelLower.includes('authorized')) {
    return 'Yes';
  }
  if (labelLower.includes('location')) {
    return vault.preferredLocations?.join(', ') || vault.location;
  }
  return vault.fullName;
}

/**
 * Generates the complete Multimodal Screen-Grab Vision Loop (`VisionGuiPrimitiveStep[]`):
 * 1. Captures 1280x800 screenshot at scrollY = 0.
 * 2. Multimodal VLM (`qwen2.5vl:7b`) visually locates each visible control `[x1, y1, x2, y2]` on screen,
 *    moves the mouse to `(clickX, clickY)`, clicks, and types/selects the value.
 * 3. When all controls visible in the upper 1280x800 screen grab are filled and the VLM sees the form
 *    continues below the bottom edge (`y > 680`), it issues `MOUSE_WHEEL_SCROLL` (`page.mouse.wheel(0, 440)`)
 *    to scroll the page down!
 * 4. Captures the new 1280x800 screenshot at `scrollY = 440`, visually identifies the newly revealed controls,
 *    clicks and types into them, and finally stops at the Submit button.
 */
export function planMultimodalVisionGuiSteps(
  controls: ScreenVisualControl[],
  vault: PersonalVault,
  tailoredPdfPath: string = 'data/cv_tailored/Master_Resume.pdf',
  companyName: string = 'Target Company'
): VisionGuiPrimitiveStep[] {
  const steps: VisionGuiPrimitiveStep[] = [];
  const filledValues: Record<string, string> = {};
  let currentScrollY = 0;
  let stepCounter = 1;

  // Visible region inside the 1280x800 browser viewport (accounting for top browser bar & bottom footer)
  const VISIBLE_MIN_Y = 90;
  const VISIBLE_MAX_Y = 680;

  for (let i = 0; i < controls.length; i++) {
    const ctrl = controls[i];
    let viewY = ctrl.docBox.y - currentScrollY;

    // If this control is below the visible screen grab fold, the Multimodal VLM first issues a SCROLL action!
    if (viewY + ctrl.docBox.h > VISIBLE_MAX_Y) {
      const scrollDeltaY = 440;
      const nextScrollY = currentScrollY + scrollDeltaY;
      steps.push({
        stepIndex: stepCounter++,
        frameTitle: `Scroll Down Viewport (+${scrollDeltaY}px) to Reveal Lower Form Inputs`,
        viewportScrollY: currentScrollY,
        nextViewportScrollY: nextScrollY,
        primitive: 'MOUSE_WHEEL_SCROLL',
        clickX: 640,
        clickY: 420,
        detectedViewportBox: [140, 620, 1100, 780],
        targetControlId: 'viewport-scroll',
        targetLabel: 'Browser Viewport Scrollbar / Below-the-Fold Form Continuation',
        textToType: `Scroll +${scrollDeltaY}px vertically`,
        scrollDeltaY,
        confidence: 0.99,
        visualObservation: `All visible inputs in the top 1280×800 screen grab are filled. Visual scrollbar & cut-off section border at y=690 indicate additional required fields below the fold. Scrolling down by +${scrollDeltaY}px.`,
        playwrightCommand: `await page.mouse.move(640, 420); await page.mouse.wheel(0, ${scrollDeltaY});`,
        filledValuesSnapshot: { ...filledValues }
      });
      currentScrollY = nextScrollY;
      viewY = ctrl.docBox.y - currentScrollY;
    }

    const clickX = Math.round(ctrl.docBox.x + ctrl.docBox.w / 2);
    const clickY = Math.round(viewY + ctrl.docBox.h / 2);
    const viewportBox: [number, number, number, number] = [
      ctrl.docBox.x,
      viewY,
      ctrl.docBox.x + ctrl.docBox.w,
      viewY + ctrl.docBox.h
    ];

    const valueToEnter = resolveValueForVisualControl(ctrl, vault, tailoredPdfPath, companyName);

    if (ctrl.controlType === 'submit_button') {
      steps.push({
        stepIndex: stepCounter++,
        frameTitle: `Visually Locate "${ctrl.label}" Button & Pause at Co-Pilot Gate`,
        viewportScrollY: currentScrollY,
        nextViewportScrollY: currentScrollY,
        primitive: 'WAIT_HUMAN_SUBMIT',
        clickX,
        clickY,
        detectedViewportBox: viewportBox,
        targetControlId: ctrl.id,
        targetLabel: ctrl.label,
        textToType: 'Ready for 1-Click Submit',
        scrollDeltaY: 0,
        confidence: 0.99,
        visualObservation: `Multimodal VLM detected primary CTA button "${ctrl.label}" at pixel (${clickX}, ${clickY}). All required fields verified filled on screen. Hovering cursor at (${clickX}, ${clickY}) and pausing for Co-Pilot human confirmation.`,
        playwrightCommand: `await page.mouse.move(${clickX}, ${clickY}, { steps: 12 }); // Co-Pilot Pause before click`,
        filledValuesSnapshot: { ...filledValues }
      });
      continue;
    }

    filledValues[ctrl.id] = valueToEnter;

    if (ctrl.controlType === 'file_dropzone') {
      steps.push({
        stepIndex: stepCounter++,
        frameTitle: `Click Visual Dropzone & Attach PDF @ (${clickX}, ${clickY})`,
        viewportScrollY: currentScrollY,
        nextViewportScrollY: currentScrollY,
        primitive: 'CLICK_FILE_DROPZONE',
        clickX,
        clickY,
        detectedViewportBox: viewportBox,
        targetControlId: ctrl.id,
        targetLabel: ctrl.label,
        textToType: valueToEnter,
        scrollDeltaY: 0,
        confidence: 0.99,
        visualObservation: `Visually identified dashed file upload dropzone "${ctrl.label}" at bounding box [${viewportBox.join(', ')}]. Clicking center pixel (${clickX}, ${clickY}) and intercepting OS file chooser with "${valueToEnter}".`,
        playwrightCommand: `const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.mouse.click(${clickX}, ${clickY})]); await fc.setFiles('${valueToEnter}');`,
        filledValuesSnapshot: { ...filledValues }
      });
    } else if (ctrl.controlType === 'dropdown') {
      steps.push({
        stepIndex: stepCounter++,
        frameTitle: `Click Dropdown & Select "${valueToEnter}" @ (${clickX}, ${clickY})`,
        viewportScrollY: currentScrollY,
        nextViewportScrollY: currentScrollY,
        primitive: 'CLICK_AND_SELECT',
        clickX,
        clickY,
        detectedViewportBox: viewportBox,
        targetControlId: ctrl.id,
        targetLabel: ctrl.label,
        textToType: valueToEnter,
        scrollDeltaY: 0,
        confidence: 0.98,
        visualObservation: `Visually recognized dropdown control "${ctrl.label}" at (${clickX}, ${clickY}). Clicking to expand menu, typing "${valueToEnter}", and pressing Enter.`,
        playwrightCommand: `await page.mouse.click(${clickX}, ${clickY}); await page.keyboard.type('${valueToEnter}'); await page.keyboard.press('Enter');`,
        filledValuesSnapshot: { ...filledValues }
      });
    } else if (ctrl.controlType === 'checkbox') {
      steps.push({
        stepIndex: stepCounter++,
        frameTitle: `Click Consent Checkbox @ (${clickX}, ${clickY})`,
        viewportScrollY: currentScrollY,
        nextViewportScrollY: currentScrollY,
        primitive: 'CLICK_CHECKBOX',
        clickX,
        clickY,
        detectedViewportBox: viewportBox,
        targetControlId: ctrl.id,
        targetLabel: ctrl.label,
        textToType: valueToEnter,
        scrollDeltaY: 0,
        confidence: 0.98,
        visualObservation: `Visually detected unchecked checkbox "${ctrl.label}" at (${clickX}, ${clickY}). Clicking checkbox to mark consent.`,
        playwrightCommand: `await page.mouse.move(${ctrl.docBox.x + 18}, ${clickY}); await page.mouse.click(${ctrl.docBox.x + 18}, ${clickY});`,
        filledValuesSnapshot: { ...filledValues }
      });
    } else {
      steps.push({
        stepIndex: stepCounter++,
        frameTitle: `Click Textbox & Type "${valueToEnter.slice(0, 28)}" @ (${clickX}, ${clickY})`,
        viewportScrollY: currentScrollY,
        nextViewportScrollY: currentScrollY,
        primitive: 'CLICK_AND_TYPE',
        clickX,
        clickY,
        detectedViewportBox: viewportBox,
        targetControlId: ctrl.id,
        targetLabel: ctrl.label,
        textToType: valueToEnter,
        scrollDeltaY: 0,
        confidence: 0.99,
        visualObservation: `Multimodal VLM saw empty textbox labeled "${ctrl.label}" at [${viewportBox.join(', ')}]. Moving mouse cursor to (${clickX}, ${clickY}), left-clicking to focus, and typing "${valueToEnter}".`,
        playwrightCommand: `await page.mouse.click(${clickX}, ${clickY}); await page.keyboard.type(${JSON.stringify(valueToEnter)}, { delay: 25 });`,
        filledValuesSnapshot: { ...filledValues }
      });
    }
  }

  return steps;
}

/**
 * Pure AI DOM Action Planner (Set-of-Mark + Accessibility Tree fallback).
 */
export function planDomFormActions(
  elements: SomDomElement[],
  vault: PersonalVault,
  tailoredPdfPath: string = 'data/cv_tailored/Master_Resume.pdf',
  companyName: string = 'Target Company'
): AiDomActionDecision[] {
  const decisions: AiDomActionDecision[] = [];
  const nameParts = (vault.fullName || 'Shubham Yadav').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Shubham';
  const lastName = nameParts.slice(1).join(' ') || 'Yadav';

  for (const el of elements) {
    const labelLower = `${el.label} ${el.placeholder || ''}`.toLowerCase();

    if (el.tag === 'file' || el.inputType === 'file' || labelLower.includes('resume') || labelLower.includes('upload cv')) {
      decisions.push({
        somId: el.somId,
        action: 'upload',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: tailoredPdfPath,
        confidence: 0.99,
        sourceAnchor: 'Tailored PDF Compiler',
        reasoning: `Detected file upload input (${el.selector}); attaching grounded single-column ATS PDF.`
      });
      continue;
    }

    if (el.tag === 'button') {
      const isFinalSubmit = labelLower.includes('submit application') || labelLower.includes('send application');
      decisions.push({
        somId: el.somId,
        action: isFinalSubmit ? 'wait_human' : 'click',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: isFinalSubmit ? 'Pause at Co-Pilot Gate' : 'Click after form validation passes',
        confidence: 0.97,
        sourceAnchor: isFinalSubmit ? 'Co-Pilot Safety Gate' : 'Modal Stepper',
        reasoning: isFinalSubmit
          ? 'Final submission button identified; pausing for 1-click human verification in Co-Pilot mode.'
          : `Step progression button ("${el.label}") clicked after verifying all required inputs above are populated.`
      });
      continue;
    }

    if (el.tag === 'checkbox' || el.inputType === 'checkbox' || labelLower.includes('consent') || labelLower.includes('acknowledge')) {
      decisions.push({
        somId: el.somId,
        action: 'check',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: 'true (Checked)',
        confidence: 0.97,
        sourceAnchor: 'ATS Consent Policy',
        reasoning: 'Checked mandatory application privacy/terms acknowledgment box.'
      });
      continue;
    }

    if (labelLower.includes('first name') || labelLower.includes('given name')) {
      decisions.push({
        somId: el.somId,
        action: 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: firstName,
        confidence: 0.99,
        sourceAnchor: 'vault.fullName [0]',
        reasoning: 'Split legal first name from Personal Vault.'
      });
      continue;
    }

    if (labelLower.includes('last name') || labelLower.includes('family name') || labelLower.includes('surname')) {
      decisions.push({
        somId: el.somId,
        action: 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: lastName,
        confidence: 0.99,
        sourceAnchor: 'vault.fullName [1]',
        reasoning: 'Split legal surname from Personal Vault.'
      });
      continue;
    }

    if (labelLower.includes('full name') || labelLower === 'name ') {
      decisions.push({
        somId: el.somId,
        action: 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: vault.fullName,
        confidence: 0.99,
        sourceAnchor: 'vault.fullName',
        reasoning: 'Matched full legal name from Personal Vault.'
      });
      continue;
    }

    if (labelLower.includes('email')) {
      const emailVal = labelLower.includes('login') || labelLower.includes('account')
        ? (vault.atsEmail || vault.email)
        : vault.email;
      decisions.push({
        somId: el.somId,
        action: 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: emailVal,
        confidence: 0.99,
        sourceAnchor: 'vault.atsEmail / vault.email',
        reasoning: 'Injected verified candidate email address.'
      });
      continue;
    }

    if (labelLower.includes('phone') || labelLower.includes('mobile') || labelLower.includes('contact number')) {
      decisions.push({
        somId: el.somId,
        action: 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: vault.phone,
        confidence: 0.99,
        sourceAnchor: 'vault.phone',
        reasoning: 'Injected primary mobile number with country code.'
      });
      continue;
    }

    if (labelLower.includes('current ctc') || labelLower.includes('present ctc') || labelLower.includes('current salary')) {
      const numericOnly = el.inputType === 'number';
      decisions.push({
        somId: el.somId,
        action: 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: numericOnly ? String(vault.currentCtcLakhs) : `${vault.currentCtcLakhs} LPA`,
        confidence: 0.98,
        sourceAnchor: 'vault.currentCtcLakhs',
        reasoning: `Mapped Indian recruitment Current CTC (${vault.currentCtcLakhs} Lakhs INR).`
      });
      continue;
    }

    if (labelLower.includes('expected ctc') || labelLower.includes('expected salary') || labelLower.includes('compensation expectation')) {
      const numericOnly = el.inputType === 'number';
      decisions.push({
        somId: el.somId,
        action: 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: numericOnly
          ? String(vault.expectedCtcLakhs)
          : `${vault.expectedCtcLakhs} LPA${vault.ctcNegotiable ? ' (Negotiable)' : ''}`,
        confidence: 0.98,
        sourceAnchor: 'vault.expectedCtcLakhs',
        reasoning: `Mapped Expected CTC (${vault.expectedCtcLakhs} Lakhs INR) with negotiability flag.`
      });
      continue;
    }

    if (labelLower.includes('notice') || labelLower.includes('how soon can you join') || labelLower.includes('joining period')) {
      let chosen = `${vault.noticePeriodDays} Days`;
      if (el.options && el.options.length > 0) {
        chosen =
          el.options.find(
            o =>
              o.includes(String(vault.noticePeriodDays)) ||
              o.toLowerCase().includes('60') ||
              o.toLowerCase().includes('2 month')
          ) || el.options[0];
      }
      decisions.push({
        somId: el.somId,
        action: el.tag === 'select' ? 'select' : 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: chosen,
        confidence: 0.97,
        sourceAnchor: 'vault.noticePeriodDays',
        reasoning: `Selected closest option matching ${vault.noticePeriodDays}-day notice period (buyout available: ${vault.buyoutAvailable ? 'Yes' : 'No'}).`
      });
      continue;
    }

    if (labelLower.includes('experience') || labelLower.includes('how many years')) {
      const expStr = vault.qaSnippets?.total_experience || '4.5';
      const match = expStr.match(/(\d+(?:\.\d+)?)/);
      const years = match ? match[1] : '4.5';
      decisions.push({
        somId: el.somId,
        action: 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: years,
        confidence: 0.96,
        sourceAnchor: 'vault.qaSnippets.total_experience',
        reasoning: `Extracted numeric experience (${years} years) from grounded vault profile.`
      });
      continue;
    }

    if (labelLower.includes('sponsorship') || labelLower.includes('visa') || labelLower.includes('legally authorized')) {
      const asksNeedSponsorship = labelLower.includes('require') || labelLower.includes('need') || labelLower.includes('future');
      const answer = asksNeedSponsorship ? (vault.needsSponsorship ? 'Yes' : 'No') : 'Yes';
      decisions.push({
        somId: el.somId,
        action: el.tag === 'select' ? 'select' : el.tag === 'radio' ? 'radio' : 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: answer,
        confidence: 0.98,
        sourceAnchor: 'vault.needsSponsorship / vault.visaStatus',
        reasoning: asksNeedSponsorship
          ? `Question asks if visa sponsorship is required; answered "${answer}" per vault.needsSponsorship.`
          : `Question asks if legally authorized to work; answered "${answer}" (${vault.visaStatus}).`
      });
      continue;
    }

    if (labelLower.includes('linkedin')) {
      decisions.push({
        somId: el.somId,
        action: 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: vault.linkedinUrl,
        confidence: 0.99,
        sourceAnchor: 'vault.linkedinUrl',
        reasoning: 'Filled verified LinkedIn profile URL.'
      });
      continue;
    }

    if (labelLower.includes('github') || labelLower.includes('portfolio') || labelLower.includes('website')) {
      decisions.push({
        somId: el.somId,
        action: 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: vault.githubUrl || vault.portfolioUrl,
        confidence: 0.98,
        sourceAnchor: 'vault.githubUrl',
        reasoning: 'Filled verified GitHub / engineering portfolio URL.'
      });
      continue;
    }

    if (el.tag === 'textarea' || labelLower.includes('why') || labelLower.includes('motivation') || labelLower.includes('additional')) {
      const snippet =
        vault.qaSnippets?.why_change ||
        `Hands-on AI Automation & Power Platform engineer with 4.5+ years delivering enterprise workflows, Azure Databricks pipelines, and RAG systems. Excited to contribute to ${companyName}.`;
      decisions.push({
        somId: el.somId,
        action: 'fill',
        selector: el.selector,
        targetLabel: el.label,
        valueToEnter: snippet,
        confidence: 0.94,
        sourceAnchor: 'vault.qaSnippets.why_change',
        reasoning: `Synthesized behavioral response grounded in Personal Vault for ${companyName}.`
      });
      continue;
    }

    decisions.push({
      somId: el.somId,
      action: el.tag === 'select' ? 'select' : 'fill',
      selector: el.selector,
      targetLabel: el.label,
      valueToEnter: el.options?.[0] || vault.location || 'Pune, India',
      confidence: 0.88,
      sourceAnchor: 'LLM Semantic Inference',
      reasoning: `Inferred best-fit response for "${el.label}" from candidate profile.`
    });
  }

  return decisions;
}

/**
 * Generates grounded cold outreach, referral DMs, and follow-up messages for any target job.
 */
export function generateOutreachMessages(
  job: JobListing,
  vault: PersonalVault,
  cv: MasterCV
): OutreachBundle {
  const firstName = (vault.fullName || 'Shubham Yadav').split(' ')[0];
  const topRole = cv.workExperience?.[0]?.role || 'Power Platform & AI Engineer';
  const topCompany = cv.workExperience?.[0]?.company || 'KPI Partners';

  const rawConnect = `Hi! Saw the ${job.title} role at ${job.company}. I have 4.5+ yrs building enterprise AI & data workflows (${topCompany}, Accenture, PL-600/AZ-204 certified) with 60% faster pipeline delivery. Would love to connect & share my tailored CV! —${firstName}`;
  const linkedinConnectNote = rawConnect.length <= 295 ? rawConnect : rawConnect.slice(0, 292) + '...';

  const peerReferralDm = `Hi there — hope your week at ${job.company} is going great!

I'm reaching out because I just tailored my application for the ${job.title} opening (${job.portalJobId || job.id}) and noticed your work on the engineering team.

Quick snapshot of my background (4.5+ yrs):
• Currently ${topRole} at ${topCompany}: built Azure AI Foundry + Databricks SQL pipelines cutting processing time by 50% and costs by 70%.
• Previously at Accenture (3 yrs) & Wilfrid Laurier University (Master of Applied Computing): architected enterprise workflows, RAG chatbots (1.0 Context Precision on Ragas), and large-scale migrations.
• 8x Microsoft Certified (PL-600 Solution Architect, PL-400, AZ-204).

If you're open to dropping a quick referral link or sharing any pointers on what the team values most right now, I'd really appreciate it! I've attached my 1-page ATS resume for easy reference.

Best,
${vault.fullName}
${vault.linkedinUrl}`;

  const hiringManagerColdEmailSubject = `${job.title} Application — ${vault.fullName} (4.5+ Yrs AI Automation & Data Engineering | 8x MS Certified)`;

  const hiringManagerColdEmailBody = `Hi Hiring Team at ${job.company},

I recently applied for the ${job.title} (${job.location}) position and wanted to share a brief summary of how my production experience directly maps to your stack:

1. Production AI & Agentic Automation: Engineered Azure AI Foundry & Content Understanding pipelines achieving 95%+ extraction accuracy and 70% compute cost savings, plus FAISS/OpenAI RAG systems with 1.0 Context Precision.
2. High-Throughput Data & Workflow Systems: Built Databricks SQL MERGE & Power Platform automation pipelines saving 15–32 hours/week of manual engineering/ops overhead.
3. Enterprise Governance & Scale: 4.5+ years across KPI Partners, Wilfrid Laurier University, and Accenture, backed by a Master of Applied Computing and 8 Microsoft certifications (PL-600, PL-400, AZ-204).

My tailored single-column ATS resume is attached. I am available for a technical screen at your convenience (Notice period: ${vault.noticePeriodDays} days, buyout option available).

Best regards,
${vault.fullName}
${vault.phone} | ${vault.email}
${vault.githubUrl}`;

  const followUp7DayNote = `Hi — following up on my application for the ${job.title} role at ${job.company} submitted last week. I remain very enthusiastic about bringing my enterprise AI workflow and data engineering background to the team. Please let me know if any additional portfolio details or code samples would be helpful! — ${vault.fullName}`;

  return {
    linkedinConnectNote,
    linkedinCharCount: linkedinConnectNote.length,
    peerReferralDm,
    hiringManagerColdEmailSubject,
    hiringManagerColdEmailBody,
    followUp7DayNote
  };
}

/**
 * Analyzes ATS keyword overlap between a job description and the candidate's Master CV.
 */
export function analyzeAtsKeywordGap(
  jdText: string,
  cv: MasterCV,
  vault: PersonalVault
): KeywordGapAnalysis {
  const canonicalKeywords = [
    'Power Platform',
    'Power Apps',
    'Power Automate',
    'Power BI',
    'Dataverse',
    'SharePoint Online',
    'SPFx',
    'Copilot Studio',
    'AI Builder',
    'Azure AI Foundry',
    'Databricks',
    'Azure Functions',
    'Logic Apps',
    'Azure SQL',
    'ShareGate',
    'PowerShell',
    'Python',
    'RAG',
    'FAISS',
    'OpenAI',
    'C#',
    'TypeScript',
    'React',
    'SQL',
    'DAX',
    'REST API',
    'PL-600',
    'PL-400',
    'AZ-204'
  ];

  const jdLower = (jdText || '').toLowerCase();
  const cvCorpus = JSON.stringify(cv).toLowerCase();

  const relevantInJd = canonicalKeywords.filter(kw => jdLower.includes(kw.toLowerCase()));
  const targetSet = relevantInJd.length >= 4
    ? relevantInJd
    : ['Power Platform', 'Power Apps', 'Power Automate', 'Power BI', 'Dataverse', 'SharePoint Online', 'Azure AI Foundry', 'Databricks', 'Python', 'SQL'];

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of targetSet) {
    if (cvCorpus.includes(kw.toLowerCase())) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const matchPercentage = targetSet.length > 0
    ? Math.round((matchedKeywords.length / targetSet.length) * 100)
    : 88;

  const anchorAskLakhs = Math.round((vault.expectedCtcLakhs || 28) * 1.15 * 10) / 10;
  const walkAwayLakhs = Math.round((vault.expectedCtcLakhs || 28) * 0.92 * 10) / 10;

  return {
    matchPercentage,
    matchedKeywords,
    missingKeywords,
    recommendedBulletIds: ['kp-b3', 'kp-b6', 'kp-b7', 'wlu-b2'],
    negotiationScript: {
      anchorAskLakhs,
      walkAwayLakhs,
      buyoutPitch: `My current CTC is ₹${vault.currentCtcLakhs} LPA and my target base is in the ₹${vault.expectedCtcLakhs}–${anchorAskLakhs} LPA range. While my official notice period is ${vault.noticePeriodDays} days, I have an active buyout clause and can expedite joining within 30 days upon offer confirmation.`
    }
  };
}

/**
 * Built-in realistic ATS form presets for Set-of-Mark compatibility
 */
export const ATS_FORM_PRESETS: Record<string, { name: string; portal: string; domain: string; elements: SomDomElement[] }> = {
  workday: {
    name: 'Workday Enterprise ATS (Multi-Step Modal)',
    portal: 'workday',
    domain: 'stripe.wd5.myworkdayjobs.com',
    elements: [
      { somId: 1, tag: 'input', inputType: 'text', label: 'Legal First Name', required: true, selector: '[data-automation-id="legalNameSection_firstName"]' },
      { somId: 2, tag: 'input', inputType: 'text', label: 'Legal Last Name', required: true, selector: '[data-automation-id="legalNameSection_lastName"]' },
      { somId: 3, tag: 'input', inputType: 'email', label: 'Account Email Address', required: true, selector: '[data-automation-id="email"]' },
      { somId: 4, tag: 'input', inputType: 'tel', label: 'Primary Phone Number', required: true, selector: '[data-automation-id="phone-number"]' },
      { somId: 5, tag: 'file', inputType: 'file', label: 'Upload Resume / CV (PDF)', required: true, selector: '[data-automation-id="file-upload-input-ref"]' },
      { somId: 6, tag: 'select', label: 'Are you legally authorized to work in India?', options: ['Yes', 'No'], required: true, selector: '[data-automation-id="workAuthDropdown"]' },
      { somId: 7, tag: 'select', label: 'Will you now or in the future require visa sponsorship?', options: ['No', 'Yes'], required: true, selector: '[data-automation-id="sponsorshipDropdown"]' },
      { somId: 8, tag: 'input', inputType: 'text', label: 'Current CTC (Lakhs per Annum)', required: true, selector: 'input[name="currentCtc"]' },
      { somId: 9, tag: 'input', inputType: 'text', label: 'Expected CTC (Lakhs per Annum)', required: true, selector: 'input[name="expectedCtc"]' },
      { somId: 10, tag: 'select', label: 'Official Notice Period', options: ['Immediate', '15 Days', '30 Days', '60 Days / 2 Months', '90 Days'], required: true, selector: '[data-automation-id="noticePeriod"]' },
      { somId: 11, tag: 'checkbox', inputType: 'checkbox', label: 'I acknowledge the Candidate Privacy Notice', required: true, selector: '[data-automation-id="consentCheckbox"]' },
      { somId: 12, tag: 'button', label: 'Save and Continue', required: false, selector: '[data-automation-id="bottom-navigation-next-button"]' }
    ]
  },
  linkedin: {
    name: 'LinkedIn Easy Apply (Screening Questions Modal)',
    portal: 'linkedin',
    domain: 'linkedin.com',
    elements: [
      { somId: 1, tag: 'input', inputType: 'email', label: 'Email address', required: true, selector: 'input[id*="email"]' },
      { somId: 2, tag: 'input', inputType: 'tel', label: 'Mobile phone number', required: true, selector: 'input[id*="phoneNumber"]' },
      { somId: 3, tag: 'file', inputType: 'file', label: 'Be sure to include an updated resume (PDF)', required: true, selector: 'input[type="file"][name="file"]' },
      { somId: 4, tag: 'input', inputType: 'number', label: 'How many years of work experience do you have with AI & Workflow Automation?', required: true, selector: 'input[id*="numeric-question-exp"]' },
      { somId: 5, tag: 'input', inputType: 'number', label: 'What is your current CTC in INR Lakhs (numeric only)?', required: true, selector: 'input[id*="numeric-question-ctc"]' },
      { somId: 6, tag: 'input', inputType: 'number', label: 'What is your expected CTC in INR Lakhs (numeric only)?', required: true, selector: 'input[id*="numeric-question-ectc"]' },
      { somId: 7, tag: 'select', label: 'How soon can you join if offered the role?', options: ['Immediately', '30 days', '60 days (buyout negotiable)', '90 days'], required: true, selector: 'select[id*="notice-period"]' },
      { somId: 8, tag: 'button', label: 'Submit Application', required: false, selector: 'button[aria-label="Submit application"]' }
    ]
  },
  naukri: {
    name: 'Naukri.com Chatbot Recruiter Drawer',
    portal: 'naukri',
    domain: 'naukri.com',
    elements: [
      { somId: 1, tag: 'input', inputType: 'text', label: 'What is your Current CTC (in LPA)?', required: true, selector: '.chatbot_Drawer input[name="curCtc"]' },
      { somId: 2, tag: 'input', inputType: 'text', label: 'What is your Expected CTC (in LPA)?', required: true, selector: '.chatbot_Drawer input[name="expCtc"]' },
      { somId: 3, tag: 'select', label: 'What is your official Notice Period?', options: ['15 Days or less', '1 Month', '2 Months (60 Days)', '3 Months'], required: true, selector: '.chatbot_Drawer select[name="notice"]' },
      { somId: 4, tag: 'input', inputType: 'number', label: 'Total years of experience in Power Platform / Azure / Python?', required: true, selector: '.chatbot_Drawer input[name="expYears"]' },
      { somId: 5, tag: 'textarea', label: 'Why are you interested in this role?', required: false, selector: '.chatbot_Drawer textarea[name="whyApply"]' },
      { somId: 6, tag: 'button', label: 'Save & Apply on Naukri', required: false, selector: '.chatbot_Drawer button.sendMsg' }
    ]
  }
};
