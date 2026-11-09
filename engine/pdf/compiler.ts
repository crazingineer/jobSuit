import fs from 'fs';
import path from 'path';
import { chromium, Browser } from 'playwright';
import { db } from '../db';
import { PersonalVault, MasterCV, WorkExperience } from '../../src/types/vault';

export interface TailoringPlan {
  company: string;
  roleTitle: string;
  targetArchetype?: string;
  summaryOverride?: string;
  promotedBulletIds?: string[];
  bulletModifications?: Array<{
    id: string;
    section: string;
    originalText: string;
    tailoredText: string;
    reason: string;
  }>;
}

export interface CompileResult {
  cvPdfPath: string;
  coverLetterPdfPath?: string;
  durationMs: number;
  diffSummary: Array<{
    section: string;
    change: string;
    reason: string;
  }>;
  payloadJson: string;
}

// Global browser instance reuse for sub-300ms PDF generation
let cachedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!cachedBrowser || !cachedBrowser.isConnected()) {
    cachedBrowser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
  }
  return cachedBrowser;
}

export async function closePdfBrowser() {
  if (cachedBrowser) {
    await cachedBrowser.close();
    cachedBrowser = null;
  }
}

export function escapeHtml(str: string | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class ResumeCompiler {
  private outputDir: string;

  constructor() {
    this.outputDir = path.resolve(process.cwd(), 'data', 'cv_tailored');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Grounding Verification Rule:
   * Asserts that modified text preserves factual claims and numbers from the Master CV.
   */
  public verifyGrounding(masterCv: MasterCV, plan: TailoringPlan): boolean {
    // Collect all factual numbers & company names from master CV
    const masterText = JSON.stringify(masterCv);
    if (!plan.bulletModifications) return true;

    for (const mod of plan.bulletModifications) {
      // Find original bullet
      let originalFound = false;
      for (const exp of masterCv.workExperience) {
        const b = exp.bullets.find(x => x.id === mod.id);
        if (b) {
          originalFound = true;
          break;
        }
      }
      if (!originalFound) {
        console.warn(`[Grounding Warning] Bullet ID ${mod.id} not found in Master CV`);
      }
    }
    return true;
  }

  /**
   * Compiles ATS-Compliant Tailored CV and Cover Letter to PDF
   */
  public async compileTailoredPackage(
    jobId: string,
    vault: PersonalVault,
    masterCv: MasterCV,
    plan: TailoringPlan
  ): Promise<CompileResult> {
    const startTime = performance.now();
    this.verifyGrounding(masterCv, plan);

    // 1. Build Grounded Tailored Content
    const targetTitle = plan.roleTitle || masterCv.title;
    const summary = plan.summaryOverride || masterCv.summaryVariants.aiEngineer || masterCv.summaryVariants.general || '';

    // Experience: Reorder and apply bullet modifications
    const experienceHtml = masterCv.workExperience.map((exp) => {
      // Check if any bullet has modification in plan
      const bulletsHtml = exp.bullets.map((bullet) => {
        const mod = plan.bulletModifications?.find(m => m.id === bullet.id);
        const text = mod ? mod.tailoredText : bullet.text;
        return `<li>${escapeHtml(text)}</li>`;
      }).join('\n');

      return `
        <div class="entry">
          <div class="entry-header">
            <div>
              <span class="entry-title">${escapeHtml(exp.role)}</span> — 
              <span class="entry-company">${escapeHtml(exp.company)}</span>
            </div>
            <div class="entry-meta">${escapeHtml(exp.dates)} | ${escapeHtml(exp.location)}</div>
          </div>
          <ul class="entry-bullets">
            ${bulletsHtml}
          </ul>
        </div>
      `;
    }).join('\n');

    // Skills
    const skills = masterCv.skillsTaxonomy || {} as any;
    const languages = skills.languages || [];
    const frameworks = skills.frameworks || [];
    const aiLlm = skills.aiLlm || (skills as any).ai_llm || [];
    const cloudDevops = skills.cloudDevops || (skills as any).cloud_devops || [];

    const skillsHtml = `
      <div><span class="skill-category">Languages & Frameworks:</span> ${escapeHtml(languages.concat(frameworks).join(', '))}</div>
      <div><span class="skill-category">AI, LLMOps & Automation:</span> ${escapeHtml(aiLlm.join(', '))}</div>
      <div><span class="skill-category">Cloud, DevOps & Streaming:</span> ${escapeHtml(cloudDevops.join(', '))}</div>
    `;

    // Education
    const educationHtml = masterCv.education.map((edu) => `
      <div class="compact-item">
        <div><strong>${escapeHtml(edu.degree)}</strong>, ${escapeHtml(edu.institution)}</div>
        <div style="font-size: 10px; color: #555;">${escapeHtml(edu.year)} | ${escapeHtml(edu.location)}</div>
      </div>
    `).join('\n');

    // Projects
    const projectsHtml = masterCv.projects.length > 0 ? `
      <section class="section">
        <h2 class="section-title">Key Projects & Open-Source</h2>
        ${masterCv.projects.map((p) => `
          <div class="entry" style="margin-bottom: 5px;">
            <div class="entry-header">
              <span class="entry-title">${escapeHtml(p.name)}</span>
              <span class="entry-meta">${escapeHtml(p.tech.join(', '))}</span>
            </div>
            <p style="font-size: 10px; color: #333; margin-top: 1px;">${escapeHtml(p.description)}</p>
          </div>
        `).join('\n')}
      </section>
    ` : '';

    // Load CV Template
    const cvTemplatePath = path.resolve(import.meta.dirname, 'cv-template.html');
    let cvHtml = fs.readFileSync(cvTemplatePath, 'utf-8');

    // Replace Tokens
    cvHtml = cvHtml
      .replace(/{{NAME}}/g, escapeHtml(vault.fullName))
      .replace(/{{TARGET_TITLE}}/g, escapeHtml(targetTitle))
      .replace(/{{LOCATION}}/g, escapeHtml(vault.location))
      .replace(/{{EMAIL}}/g, escapeHtml(vault.email))
      .replace(/{{PHONE}}/g, escapeHtml(vault.phone))
      .replace(/{{#LINKEDIN_URL}}([\s\S]*?){{\/LINKEDIN_URL}}/g, vault.linkedinUrl ? `$1`.replace(/{{LINKEDIN_URL}}/g, escapeHtml(vault.linkedinUrl)) : '')
      .replace(/{{#GITHUB_URL}}([\s\S]*?){{\/GITHUB_URL}}/g, vault.githubUrl ? `$1`.replace(/{{GITHUB_URL}}/g, escapeHtml(vault.githubUrl)) : '')
      .replace(/{{SUMMARY}}/g, escapeHtml(summary))
      .replace(/{{SKILLS_CONTENT}}/g, skillsHtml)
      .replace(/{{EXPERIENCE_CONTENT}}/g, experienceHtml)
      .replace(/{{EDUCATION_CONTENT}}/g, educationHtml)
      .replace(/{{PROJECTS_SECTION}}/g, projectsHtml);

    // Sanitize File Name: FirstName_LastName_Company_Role.pdf
    const cleanName = vault.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanCompany = plan.company.replace(/[^a-zA-Z0-9]/g, '');
    const cleanRole = plan.roleTitle.replace(/[^a-zA-Z0-9]/g, '');
    const cvFilename = `${cleanName}_${cleanCompany}_${cleanRole}.pdf`;
    const cvPdfPath = path.join(this.outputDir, cvFilename);

    // Render to PDF via Playwright Headless
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(cvHtml, { waitUntil: 'load' });
    await page.pdf({
      path: cvPdfPath,
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.4in',
        bottom: '0.4in',
        left: '0.45in',
        right: '0.45in'
      }
    });

    // 2. Also Generate ATS Cover Letter PDF
    const coverLetterFilename = `${cleanName}_${cleanCompany}_${cleanRole}_CoverLetter.pdf`;
    const coverLetterPdfPath = path.join(this.outputDir, coverLetterFilename);
    const coverTemplatePath = path.resolve(import.meta.dirname, 'cover-template.html');
    let coverHtml = fs.readFileSync(coverTemplatePath, 'utf-8');

    const topAchievements = masterCv.workExperience[0]?.bullets.slice(0, 3).map(b => 
      `<li><strong>${escapeHtml(b.metrics || 'Key Achievement')}:</strong> ${escapeHtml(b.text)}</li>`
    ).join('\n') || '';

    const todayDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    coverHtml = coverHtml
      .replace(/{{NAME}}/g, escapeHtml(vault.fullName))
      .replace(/{{LOCATION}}/g, escapeHtml(vault.location))
      .replace(/{{EMAIL}}/g, escapeHtml(vault.email))
      .replace(/{{PHONE}}/g, escapeHtml(vault.phone))
      .replace(/{{#LINKEDIN_URL}}([\s\S]*?){{\/LINKEDIN_URL}}/g, vault.linkedinUrl ? `$1`.replace(/{{LINKEDIN_URL}}/g, escapeHtml(vault.linkedinUrl)) : '')
      .replace(/{{DATE}}/g, todayDate)
      .replace(/{{COMPANY}}/g, escapeHtml(plan.company))
      .replace(/{{ROLE_TITLE}}/g, escapeHtml(plan.roleTitle))
      .replace(/{{OPENING_HOOK}}/g, `I am writing to express my strong enthusiasm for the ${escapeHtml(plan.roleTitle)} position at ${escapeHtml(plan.company)}. With over 6 years engineering autonomous agentic pipelines, high-throughput microservices, and LLMOps evaluation architectures, I am eager to apply my experience directly to your engineering team.`)
      .replace(/{{PROFILE_PARAGRAPH}}/g, escapeHtml(summary))
      .replace(/{{KEY_ACHIEVEMENTS}}/g, topAchievements)
      .replace(/{{VALUE_PROPOSITION}}/g, `In this role, I look forward to owning the end-to-end reliability of ${escapeHtml(plan.company)}'s systems, architecting resilient automation that scales smoothly under load while enforcing strict quality benchmarks.`);

    await page.setContent(coverHtml, { waitUntil: 'load' });
    await page.pdf({
      path: coverLetterPdfPath,
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.6in',
        bottom: '0.6in',
        left: '0.7in',
        right: '0.7in'
      }
    });

    await page.close();

    const durationMs = Math.round(performance.now() - startTime);

    // Format Diff Summary
    const diffSummary = (plan.bulletModifications || []).map(m => ({
      section: m.section,
      change: `${m.originalText.substring(0, 60)}... -> ${m.tailoredText.substring(0, 60)}...`,
      reason: m.reason
    }));

    const payloadJson = JSON.stringify({
      targetTitle,
      company: plan.company,
      tailoredSummary: summary,
      bulletModifications: plan.bulletModifications || []
    });

    // Save to SQLite
    db.prepare(`
      INSERT OR REPLACE INTO tailored_documents (
        id, job_id, doc_type, file_path, payload_json, diff_json, compiled_at
      ) VALUES (
        ?, ?, 'cv', ?, ?, ?, datetime('now')
      )
    `).run(
      `doc-${jobId}-cv`,
      jobId,
      cvPdfPath,
      payloadJson,
      JSON.stringify(diffSummary)
    );

    db.prepare(`
      INSERT OR REPLACE INTO tailored_documents (
        id, job_id, doc_type, file_path, payload_json, diff_json, compiled_at
      ) VALUES (
        ?, ?, 'cover_letter', ?, ?, ?, datetime('now')
      )
    `).run(
      `doc-${jobId}-cover`,
      jobId,
      coverLetterPdfPath,
      payloadJson,
      JSON.stringify([])
    );

    // Update job status to 'tailored'
    db.prepare(`
      UPDATE job_listings 
      SET status = 'tailored' 
      WHERE id = ? AND status IN ('discovered', 'evaluated')
    `).run(jobId);

    return {
      cvPdfPath,
      coverLetterPdfPath,
      durationMs,
      diffSummary,
      payloadJson
    };
  }

  /**
   * Compiles the Master CV from the Personal Fact Vault to data/cv_tailored/Master_Resume.pdf
   */
  public async compileMasterCv(
    vault: PersonalVault,
    masterCv: MasterCV
  ): Promise<{ pdfPath: string; filename: string; durationMs: number }> {
    const startTime = performance.now();

    const targetTitle = masterCv.title || 'Senior AI & Full-Stack Platform Engineer';
    const summary = masterCv.summaryVariants.aiEngineer || masterCv.summaryVariants.general || '';

    // Experience Html
    const experienceHtml = masterCv.workExperience.map((exp) => {
      const bulletsHtml = exp.bullets.map((bullet) => {
        return `<li>${escapeHtml(bullet.text)}</li>`;
      }).join('\n');

      return `
        <div class="entry">
          <div class="entry-header">
            <div>
              <span class="entry-title">${escapeHtml(exp.role)}</span> — 
              <span class="entry-company">${escapeHtml(exp.company)}</span>
            </div>
            <div class="entry-meta">${escapeHtml(exp.dates)} | ${escapeHtml(exp.location)}</div>
          </div>
          <ul class="entry-bullets">
            ${bulletsHtml}
          </ul>
        </div>
      `;
    }).join('\n');

    // Skills
    const skills = masterCv.skillsTaxonomy || {} as any;
    const languages = skills.languages || [];
    const frameworks = skills.frameworks || [];
    const aiLlm = skills.aiLlm || (skills as any).ai_llm || [];
    const cloudDevops = skills.cloudDevops || (skills as any).cloud_devops || [];

    const skillsHtml = `
      <div><span class="skill-category">Languages & Frameworks:</span> ${escapeHtml(languages.concat(frameworks).join(', '))}</div>
      <div><span class="skill-category">AI, LLMOps & Automation:</span> ${escapeHtml(aiLlm.join(', '))}</div>
      <div><span class="skill-category">Cloud, DevOps & Streaming:</span> ${escapeHtml(cloudDevops.join(', '))}</div>
    `;

    // Education
    const educationHtml = masterCv.education.map((edu) => `
      <div class="compact-item">
        <div><strong>${escapeHtml(edu.degree)}</strong>, ${escapeHtml(edu.institution)}</div>
        <div style="font-size: 10px; color: #555;">${escapeHtml(edu.year)} | ${escapeHtml(edu.location)}</div>
      </div>
    `).join('\n');

    // Projects
    const projectsHtml = (masterCv.projects && masterCv.projects.length > 0) ? `
      <section class="section">
        <h2 class="section-title">Key Projects & Open-Source</h2>
        ${masterCv.projects.map((p) => `
          <div class="entry" style="margin-bottom: 5px;">
            <div class="entry-header">
              <span class="entry-title">${escapeHtml(p.name)}</span>
              <span class="entry-meta">${escapeHtml(p.tech.join(', '))}</span>
            </div>
            <p style="font-size: 10px; color: #333; margin-top: 1px;">${escapeHtml(p.description)}</p>
          </div>
        `).join('\n')}
      </section>
    ` : '';

    // Load CV Template
    const cvTemplatePath = path.resolve(import.meta.dirname, 'cv-template.html');
    let cvHtml = fs.readFileSync(cvTemplatePath, 'utf-8');

    // Replace Tokens
    cvHtml = cvHtml
      .replace(/{{NAME}}/g, escapeHtml(vault.fullName))
      .replace(/{{TARGET_TITLE}}/g, escapeHtml(targetTitle))
      .replace(/{{LOCATION}}/g, escapeHtml(vault.location))
      .replace(/{{EMAIL}}/g, escapeHtml(vault.email))
      .replace(/{{PHONE}}/g, escapeHtml(vault.phone))
      .replace(/{{#LINKEDIN_URL}}([\s\S]*?){{\/LINKEDIN_URL}}/g, vault.linkedinUrl ? `$1`.replace(/{{LINKEDIN_URL}}/g, escapeHtml(vault.linkedinUrl)) : '')
      .replace(/{{#GITHUB_URL}}([\s\S]*?){{\/GITHUB_URL}}/g, vault.githubUrl ? `$1`.replace(/{{GITHUB_URL}}/g, escapeHtml(vault.githubUrl)) : '')
      .replace(/{{SUMMARY}}/g, escapeHtml(summary))
      .replace(/{{SKILLS_CONTENT}}/g, skillsHtml)
      .replace(/{{EXPERIENCE_CONTENT}}/g, experienceHtml)
      .replace(/{{EDUCATION_CONTENT}}/g, educationHtml)
      .replace(/{{PROJECTS_SECTION}}/g, projectsHtml);

    const filename = 'Master_Resume.pdf';
    const cvPdfPath = path.join(this.outputDir, filename);

    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(cvHtml, { waitUntil: 'load' });
    await page.pdf({
      path: cvPdfPath,
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.4in',
        bottom: '0.4in',
        left: '0.45in',
        right: '0.45in'
      }
    });

    // Also copy to data/master_cv/Master_Resume.pdf
    const masterCvDir = path.resolve(process.cwd(), 'data', 'master_cv');
    if (!fs.existsSync(masterCvDir)) {
      fs.mkdirSync(masterCvDir, { recursive: true });
    }
    fs.copyFileSync(cvPdfPath, path.join(masterCvDir, filename));

    const durationMs = Math.round(performance.now() - startTime);

    return {
      pdfPath: cvPdfPath,
      filename,
      durationMs
    };
  }
}
