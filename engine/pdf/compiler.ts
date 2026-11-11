import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { db } from '../db';
import { MasterCV, PersonalVault } from '../../src/types/vault';
import { careerOpsEvaluator } from '../evaluator/evaluator';
import { CV_TAILOR_SYSTEM_PROMPT } from '../evaluator/prompts';
import {
  buildDefensibleTailoringPlan,
  containsForbiddenFabrication
} from '../../src/utils/cv-alignment-guard';
import {
  formatHtmlBulletWithBold,
  generateJakesResumeLatex
} from '../../src/utils/jakes-resume-generator';

export interface TailorPackageOptions {
  company: string;
  roleTitle: string;
  archetype?: string;
  generateCoverLetter?: boolean;
}

export interface CompiledPackageResult {
  cvPdfPath: string;
  latexPath?: string;
  latexSource?: string;
  coverPdfPath?: string;
  durationMs: number;
  diffSummary: Array<{
    bulletId: string;
    originalText: string;
    tailoredText: string;
    reason: string;
    interviewTalkingPoint?: string;
  }>;
}

export class ResumeCompiler {
  private cvTemplatePath = path.resolve(process.cwd(), 'engine', 'pdf', 'cv-template.html');
  private coverTemplatePath = path.resolve(process.cwd(), 'engine', 'pdf', 'cover-template.html');
  private outputDir = path.resolve(process.cwd(), 'data', 'cv_tailored');

  constructor() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Compiles a tailored CV using Jake's Resume template (https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs)
   * with strict interview-defensible tailoring (zero Playwright/Kubernetes/HyperFlow fabrications).
   * Writes both the compiled PDF and the Overleaf-ready `.tex` file.
   */
  public async compileTailoredPackage(
    jobId: string,
    vault: PersonalVault,
    masterCv: MasterCV,
    options: TailorPackageOptions
  ): Promise<CompiledPackageResult> {
    const startTime = Date.now();
    const jobRow = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(jobId) as any;

    let rawProposedMods: Array<{
      bulletId: string;
      originalText: string;
      tailoredText: string;
      reason: string;
    }> = [];

    if (jobRow) {
      try {
        const llmPlan = await this.generateTailoringPlanWithLlm(jobRow, masterCv);
        if (Array.isArray(llmPlan?.bulletModifications)) {
          rawProposedMods = llmPlan.bulletModifications;
        }
      } catch (err: any) {
        console.log(
          `[Resume Compiler] Using deterministic interview-defensible tailoring engine (${err.message})`
        );
      }
    }

    const defensible = buildDefensibleTailoringPlan(
      {
        title: jobRow?.title || options.roleTitle,
        company: jobRow?.company || options.company,
        rawJdText: jobRow?.raw_jd_text || ''
      },
      masterCv,
      rawProposedMods
    );

    const safeName = (vault.fullName || 'Shubham Yadav').replace(/[^a-zA-Z0-9]/g, '_');
    const safeComp = options.company.replace(/[^a-zA-Z0-9]/g, '_');
    const cvFilename = `${safeName}_${safeComp}_CV.pdf`;
    const texFilename = `${safeName}_${safeComp}_JakesResume.tex`;
    const cvPdfPath = path.join(this.outputDir, cvFilename);
    const texFilePath = path.join(this.outputDir, texFilename);

    // 1. Generate Overleaf-ready Jake's Resume LaTeX (.tex) source
    const latexSource = generateJakesResumeLatex(
      vault,
      masterCv,
      defensible.bulletModifications,
      masterCv.title
    );
    fs.writeFileSync(texFilePath, latexSource, 'utf-8');

    // 2. Render Jake's Resume PDF
    await this.renderCvPdf(vault, masterCv, options, defensible.bulletModifications, cvPdfPath);

    let coverPdfPath: string | undefined;
    if (options.generateCoverLetter) {
      const coverFilename = `${safeName}_${safeComp}_CoverLetter.pdf`;
      coverPdfPath = path.join(this.outputDir, coverFilename);
      await this.compileCoverLetter(vault, masterCv, options, coverPdfPath);
    }

    const durationMs = Date.now() - startTime;
    const relativeCvPath = `data/cv_tailored/${cvFilename}`;
    const relativeTexPath = `data/cv_tailored/${texFilename}`;

    db.prepare(`
      INSERT OR REPLACE INTO tailored_documents (
        id, job_id, doc_type, file_path, payload_json, diff_json, compiled_at
      ) VALUES (
        @id, @jobId, 'cv', @filePath, @payloadJson, @diffJson, datetime('now')
      )
    `).run({
      id: `doc-${jobId}-cv`,
      jobId,
      filePath: relativeCvPath,
      payloadJson: JSON.stringify({
        company: options.company,
        roleTitle: options.roleTitle,
        template: 'jakes-resume (Overleaf syzfjbzwjncs)',
        latexPath: relativeTexPath,
        interviewDefensible: true
      }),
      diffJson: JSON.stringify(defensible.bulletModifications)
    });

    db.prepare(`
      UPDATE evaluations
      SET block_e_personalization = ?
      WHERE job_id = ?
    `).run(JSON.stringify(defensible.blockEPersonalization), jobId);

    db.prepare(
      "UPDATE job_listings SET status = 'tailored' WHERE id = ? AND status IN ('discovered', 'evaluated')"
    ).run(jobId);

    return {
      cvPdfPath: relativeCvPath,
      latexPath: relativeTexPath,
      latexSource,
      coverPdfPath: coverPdfPath ? `data/cv_tailored/${path.basename(coverPdfPath)}` : undefined,
      durationMs,
      diffSummary: defensible.bulletModifications
    };
  }

  /**
   * Compiles the baseline Master Resume PDF (Jake's Resume template)
   */
  public async compileMasterCv(
    vault: PersonalVault,
    masterCv: MasterCV
  ): Promise<{ pdfPath: string; latexPath: string; latexSource: string; durationMs: number }> {
    const startTime = Date.now();
    const masterOutPath = path.join(this.outputDir, 'Master_Resume.pdf');
    const masterTexPath = path.join(this.outputDir, 'Master_JakesResume.tex');
    const masterBackupDir = path.resolve(process.cwd(), 'data', 'master_cv');
    if (!fs.existsSync(masterBackupDir)) {
      fs.mkdirSync(masterBackupDir, { recursive: true });
    }
    const masterBackupPath = path.join(masterBackupDir, 'Master_Resume.pdf');

    const latexSource = generateJakesResumeLatex(vault, masterCv, [], masterCv.title);
    fs.writeFileSync(masterTexPath, latexSource, 'utf-8');

    await this.renderCvPdf(
      vault,
      masterCv,
      {
        company: 'Master',
        roleTitle:
          masterCv.title ||
          'Power Platform and SharePoint Developer | Power Apps, Power Automate, Data Engineering'
      },
      [],
      masterOutPath
    );

    try {
      fs.copyFileSync(masterOutPath, masterBackupPath);
    } catch {}

    return {
      pdfPath: 'data/cv_tailored/Master_Resume.pdf',
      latexPath: 'data/cv_tailored/Master_JakesResume.tex',
      latexSource,
      durationMs: Date.now() - startTime
    };
  }

  private async generateTailoringPlanWithLlm(jobRow: any, masterCv: MasterCV): Promise<any> {
    const config = careerOpsEvaluator.getLlmConfig();
    const userPrompt = `
### TARGET JOB
- **Role:** ${jobRow.title}
- **Company:** ${jobRow.company}
- **Job Description:**
${jobRow.raw_jd_text}

### CANDIDATE MASTER CV (GROUND TRUTH — SHUBHAM YADAV)
${JSON.stringify(masterCv, null, 2)}

Generate an interview-defensible tailoring plan for Jake's Resume template. Remember: NEVER add Playwright, Puppeteer, Selenium, Kubernetes, Golang, or HyperFlow.`;

    const rawText = await careerOpsEvaluator.callLlm(config, CV_TAILOR_SYSTEM_PROMPT, userPrompt);
    return careerOpsEvaluator.parseJsonSafely(rawText);
  }

  private async renderCvPdf(
    vault: PersonalVault,
    masterCv: MasterCV,
    options: TailorPackageOptions,
    bulletMods: Array<{ bulletId: string; originalText: string; tailoredText: string }>,
    outputPath: string
  ): Promise<void> {
    let html = fs.readFileSync(this.cvTemplatePath, 'utf-8');

    const linkedinClean = (vault.linkedinUrl || 'linkedin.com/in/shubhambhagwatyadav')
      .replace(/^https?:\/\/(www\.)?/, '')
      .replace(/\/$/, '');

    const phone = vault.phone || '+91 7276085461';
    const email = vault.email || 'shubhambhagwatyadav@gmail.com';

    // Exact Jake's Resume underlined contact line separated by |
    const contactLineHtml = `${phone}<span class="pipe">|</span><a href="mailto:${email}">${email}</a><span class="pipe">|</span><a href="https://${linkedinClean}">${linkedinClean}</a>`;

    const baseHeadline =
      masterCv.title ||
      'Power Platform and SharePoint Developer | Power Apps, Power Automate, Data Engineering';

    // Jake's Resume Technical Skills block
    const skillsRowsHtml = `
      <div class="jakes-skill-line"><span class="jakes-skill-cat">Power Platform &amp; AI:</span> Power Apps (Canvas, Model-Driven), Power Automate (Cloud, Desktop RPA), Power BI (DAX, Power Query), Dataverse, Power Fx, Power Pages, Copilot Studio, AI Builder, Custom Connectors</div>
      <div class="jakes-skill-line"><span class="jakes-skill-cat">Cloud, Database &amp; Data Engineering:</span> Azure AI Foundry (Content Understanding, Document Intelligence), Azure Databricks (SQL), Azure Functions, Azure Logic Apps, Azure SQL, SSMS, Fabric Capacity (KQL), SharePoint Lists</div>
      <div class="jakes-skill-line"><span class="jakes-skill-cat">SharePoint &amp; Migration:</span> SharePoint Online, SharePoint Server (2013/2016/2019), SPFx, PnP Framework, ShareGate, InfoPath, Nintex, PowerShell</div>
      <div class="jakes-skill-line"><span class="jakes-skill-cat">Languages:</span> C#, JavaScript, TypeScript (React, JSX), Python, SQL, HTML, CSS, XML, JSON</div>
      <div class="jakes-skill-line"><span class="jakes-skill-cat">Tools &amp; Version Control:</span> Git, GitHub, Azure DevOps, JIRA, ServiceNow, Visual Studio, VS Code, Postman</div>
      <div class="jakes-skill-line"><span class="jakes-skill-cat">Certifications:</span> PL-600, PL-400, AZ-204, PL-900, MS-900, AZ-900, AI-900, SC-900</div>
    `;

    // Jake's Resume \resumeSubheading for Education
    const eduLocations: Record<string, string> = {
      'Wilfrid Laurier University': 'Waterloo, Canada',
      'Pune University': 'Pune, India'
    };
    const educationHtml = (masterCv.education || [])
      .map((edu) => {
        const loc = eduLocations[edu.institution] || 'India';
        return `
      <div class="resume-subheading">
        <div class="subheading-row-1">
          <span class="left-bold">${edu.institution}</span>
          <span class="right-regular">${loc}</span>
        </div>
        <div class="subheading-row-2">
          <span>${edu.degree}</span>
          <span>${edu.year}</span>
        </div>
      </div>`;
      })
      .join('\n');

    // Validated bullet modifications (strictly zero forbidden fabrications)
    const modMap = new Map<string, string>();
    for (const mod of bulletMods) {
      if (mod.bulletId && mod.tailoredText && !containsForbiddenFabrication(mod.tailoredText)) {
        modMap.set(mod.bulletId, mod.tailoredText);
      }
    }

    // Jake's Resume \resumeSubheading + \resumeItemListStart for Experience
    const workExpHtml = (masterCv.workExperience || [])
      .map((exp) => {
        const bulletsHtml = (exp.bullets || [])
          .map((b) => {
            const finalBulletText = modMap.get(b.id) || b.text;
            return `<li>${formatHtmlBulletWithBold(finalBulletText)}</li>`;
          })
          .join('\n');

        return `
      <div class="resume-subheading">
        <div class="subheading-row-1">
          <span class="left-bold">${exp.role}</span>
          <span class="right-regular">${exp.dates}</span>
        </div>
        <div class="subheading-row-2">
          <span>${exp.company}</span>
          <span>${exp.location}</span>
        </div>
        <ul class="resume-item-list">
          ${bulletsHtml}
        </ul>
      </div>`;
      })
      .join('\n');

    // Jake's Resume \resumeProjectHeading + \resumeItemListStart for Technical Projects
    const projectDates: Record<string, string> = {
      'Context-Aware Institutional RAG Chatbot': 'Feb 2026 – Mar 2026',
      'CMS Consolidation and Migration': 'Apr 2023 – Aug 2024',
      'Employee Churn Prediction': 'Sep 2024 – Dec 2024'
    };

    const projectsHtml = (masterCv.projects || [])
      .map((proj) => {
        const dateStr = projectDates[proj.name] || '2024 – 2026';
        const techList = (proj.tech || []).join(', ');
        const allBullets = [proj.description, ...(proj.bullets || [])].filter(Boolean);
        const projBulletsHtml = allBullets
          .map((bt) => `<li>${formatHtmlBulletWithBold(bt)}</li>`)
          .join('\n');

        return `
      <div class="resume-project-heading">
        <div class="project-row-1">
          <span><strong>${proj.name}</strong> | <em>${techList}</em></span>
          <span>${dateStr}</span>
        </div>
        <ul class="resume-item-list">
          ${projBulletsHtml}
        </ul>
      </div>`;
      })
      .join('\n');

    html = html
      .replace(/{{FULL_NAME}}/g, vault.fullName || 'Shubham Yadav')
      .replace(/{{TARGET_ROLE_TITLE}}/g, baseHeadline)
      .replace(/{{CONTACT_LINE_HTML}}/g, contactLineHtml)
      .replace(/{{SKILLS_ROWS_HTML}}/g, skillsRowsHtml)
      .replace(/{{EDUCATION_HTML}}/g, educationHtml)
      .replace(/{{WORK_EXPERIENCE_HTML}}/g, workExpHtml)
      .replace(/{{PROJECTS_HTML}}/g, projectsHtml);

    await this.printHtmlToPdf(html, outputPath);
  }

  private async compileCoverLetter(
    vault: PersonalVault,
    masterCv: MasterCV,
    options: TailorPackageOptions,
    outputPath: string
  ): Promise<void> {
    let html = fs.readFileSync(this.coverTemplatePath, 'utf-8');

    const contactLine = [vault.location, vault.phone, vault.email, vault.linkedinUrl]
      .filter(Boolean)
      .join(' | ');

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const openingHook = `With 4.5+ years of experience engineering enterprise Microsoft Power Platform solutions, SharePoint Online architectures, Azure AI Foundry document pipelines, and Azure Databricks ETL workflows across KPI Partners, Wilfrid Laurier University, and Accenture, I am writing to express my strong interest in the ${options.roleTitle} role at ${options.company}.`;

    const bodyParagraph1 = `In my current role as Power Platform and AI Developer at KPI Partners, I architected a clinical study intake and regulatory tracking platform using Power Apps, SharePoint Online, and Power Automate that reduced processing time by 60%, and engineered an automated financial invoice extraction pipeline using Azure AI Foundry (Content Understanding) achieving 95%+ accuracy while reducing compute costs by 70%.`;

    const bodyParagraph2 = `Previously at Accenture and Wilfrid Laurier University (where I completed my Master of Applied Computing), I led 15+ TB SharePoint migrations using ShareGate and PowerShell with 99.9% data fidelity, modernized 40+ InfoPath/Nintex workflows into Power Apps and Power Automate Desktop RPA flows, and built a Python/FAISS/OpenAI RAG system achieving a 1.0 Context Precision score on Ragas. Backed by 8 Microsoft certifications including PL-600 (Solution Architect Expert), PL-400, and AZ-204, I am ready to deliver immediate impact at ${options.company}.`;

    html = html
      .replace(/{{FULL_NAME}}/g, vault.fullName || 'Shubham Yadav')
      .replace(/{{TARGET_ROLE_TITLE}}/g, masterCv.title)
      .replace(/{{CONTACT_LINE}}/g, contactLine)
      .replace(/{{DATE}}/g, today)
      .replace(/{{COMPANY_NAME}}/g, options.company)
      .replace(/{{OPENING_HOOK}}/g, openingHook)
      .replace(/{{BODY_PARAGRAPH_1}}/g, bodyParagraph1)
      .replace(/{{BODY_PARAGRAPH_2}}/g, bodyParagraph2);

    await this.printHtmlToPdf(html, outputPath);
  }

  private async printHtmlToPdf(htmlContent: string, outputPath: string): Promise<void> {
    try {
      const candidateBins = [
        '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell',
        '/ms-playwright/chromium-1247/chrome-linux/chrome'
      ];
      const executablePath = candidateBins.find((p) => fs.existsSync(p));
      const browser = await chromium.launch({
        headless: true,
        ...(executablePath ? { executablePath } : {})
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
      await page.pdf({
        path: outputPath,
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '0.4in',
          bottom: '0.4in',
          left: '0.48in',
          right: '0.48in'
        }
      });
      await browser.close();
    } catch (err: any) {
      console.warn(
        `[Resume Compiler] Playwright PDF print fallback triggered (${err.message}); copying attached baseline PDF.`
      );
      const attachedResumePath = path.resolve(
        process.cwd(),
        'public',
        'assets',
        'aistudio',
        'ShubhamYadav_Resume_2bb95baf.pdf'
      );
      if (fs.existsSync(attachedResumePath)) {
        fs.copyFileSync(attachedResumePath, outputPath);
      }
    }
  }
}
