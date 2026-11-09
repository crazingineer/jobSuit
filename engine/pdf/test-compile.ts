import { ResumeCompiler, closePdfBrowser } from './compiler';
import { db, initDatabase } from '../db';
import { PersonalVault, MasterCV } from '../../src/types/vault';

async function main() {
  initDatabase();

  const vaultRow = db.prepare('SELECT * FROM personal_vault WHERE id = 1').get() as any;
  const cvRow = db.prepare("SELECT * FROM master_cv WHERE id = 'cv-master-v1'").get() as any;

  const vault: PersonalVault = {
    id: vaultRow.id,
    fullName: vaultRow.full_name,
    email: vaultRow.email,
    phone: vaultRow.phone,
    location: vaultRow.location,
    linkedinUrl: vaultRow.linkedin_url,
    githubUrl: vaultRow.github_url,
    portfolioUrl: vaultRow.portfolio_url,
    currentCtcLakhs: vaultRow.current_ctc_lakhs,
    expectedCtcLakhs: vaultRow.expected_ctc_lakhs,
    ctcNegotiable: Boolean(vaultRow.ctc_negotiable),
    noticePeriodDays: vaultRow.notice_period_days,
    lastWorkingDay: vaultRow.last_working_day,
    buyoutAvailable: Boolean(vaultRow.buyout_available),
    preferredLocations: JSON.parse(vaultRow.preferred_locations),
    relocationWilling: Boolean(vaultRow.relocation_willing),
    authorizedCountries: JSON.parse(vaultRow.authorized_countries),
    needsSponsorship: Boolean(vaultRow.needs_sponsorship),
    visaStatus: vaultRow.visa_status,
    gender: vaultRow.gender,
    disabilityStatus: vaultRow.disability_status,
    veteranStatus: vaultRow.veteran_status,
    eeoEthnicity: vaultRow.eeo_ethnicity,
    qaSnippets: JSON.parse(vaultRow.qa_snippets),
    updatedAt: vaultRow.updated_at
  };

  const masterCv: MasterCV = {
    id: cvRow.id,
    version: cvRow.version,
    title: cvRow.title,
    isActive: Boolean(cvRow.is_active),
    summaryVariants: JSON.parse(cvRow.summary_variants),
    skillsTaxonomy: JSON.parse(cvRow.skills_taxonomy),
    workExperience: JSON.parse(cvRow.work_experience),
    education: JSON.parse(cvRow.education),
    certifications: JSON.parse(cvRow.certifications),
    projects: JSON.parse(cvRow.projects),
    awards: JSON.parse(cvRow.awards),
    createdAt: cvRow.created_at,
    updatedAt: cvRow.updated_at
  };

  const compiler = new ResumeCompiler();

  console.log('--- Starting ATS PDF Compilation ---');
  const result = await compiler.compileTailoredPackage('job-101', vault, masterCv, {
    company: 'Anthropic Labs Partner',
    roleTitle: 'Lead AI Platform / Agentic Workflows Engineer',
    summaryOverride: 'Lead AI & Agentic Workflows Architect with 6+ years designing scalable autonomous agent systems, Playwright CDP automation, and LLMOps evaluation pipelines.',
    bulletModifications: [
      {
        id: 'b1',
        section: 'HyperFlow Tech (Bullet 1)',
        originalText: 'Architected multi-agent customer support automation platform...',
        tailoredText: 'Architected enterprise multi-agent automation platform using Playwright CDP and Gemini 1.5 JSON schema validation, deflecting 42% of manual tier-1 tickets and saving $180k/year in operational overhead.',
        reason: 'Emphasize Playwright CDP and schema-grounded tool calling required by Anthropic Partner'
      }
    ]
  });

  console.log(`[Success] CV PDF generated: ${result.cvPdfPath}`);
  console.log(`[Success] Cover Letter PDF: ${result.coverLetterPdfPath}`);
  console.log(`[Performance] Compilation took: ${result.durationMs}ms`);

  const docs = db.prepare("SELECT * FROM tailored_documents WHERE job_id = 'job-101'").all();
  console.log(`[Database] Tailored documents recorded in SQLite: ${docs.length} items`);

  await closePdfBrowser();
  process.exit(0);
}

main().catch(err => {
  console.error('[Error]', err);
  process.exit(1);
});
