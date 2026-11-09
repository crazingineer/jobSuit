import { db } from '../db';
import { CAREER_OPS_SYSTEM_PROMPT, buildEvaluationPrompt } from './prompts';
import { ResumeCompiler } from '../pdf/compiler';
import { EvaluationReport } from '../../src/types/evaluation';
import { JobListing } from '../../src/types/job';
import { PersonalVault, MasterCV } from '../../src/types/vault';

export interface EvaluatorOptions {
  provider?: 'gemini' | 'anthropic' | 'openai' | 'ollama';
  apiKey?: string;
  model?: string;
}

export class CareerOpsEvaluator {
  private compiler: ResumeCompiler;

  constructor() {
    this.compiler = new ResumeCompiler();
  }

  /**
   * Evaluates a job listing from the database and persists Blocks A-H in SQLite
   */
  public async evaluateJob(jobId: string, options: EvaluatorOptions = {}): Promise<EvaluationReport> {
    const job = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(jobId) as any;
    if (!job) {
      throw new Error(`Job not found with id: ${jobId}`);
    }

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

    // Run structured evaluation
    console.log(`[career-ops] Running evaluation for job: ${job.title} @ ${job.company}`);
    const evaluationData = await this.executeEvaluation(job, masterCv, vault, options);

    // Persist to SQLite
    const evalId = `eval-${jobId}`;
    db.prepare(`
      INSERT OR REPLACE INTO evaluations (
        id, job_id, score, final_decision, archetype, legitimacy_tier, work_auth_tier,
        cv_match_score, north_star_score, comp_score, culture_score, red_flags_deduction,
        evidence_confidence, confidence_gaps, hard_stops, soft_gaps, top_strengths,
        block_a_summary, block_b_requirements, block_c_strategy, block_d_comp,
        block_e_personalization, block_f_interview, block_g_legitimacy, block_h_answers,
        risk_summary, score_evidence, machine_summary_yaml, full_markdown_report, evaluated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, datetime('now')
      )
    `).run(
      evalId,
      jobId,
      evaluationData.score,
      evaluationData.finalDecision,
      evaluationData.archetype,
      evaluationData.legitimacyTier,
      evaluationData.workAuthTier,
      evaluationData.cvMatchScore,
      evaluationData.northStarScore,
      evaluationData.compScore,
      evaluationData.cultureScore,
      evaluationData.redFlagsDeduction,
      evaluationData.evidenceConfidence,
      JSON.stringify(evaluationData.confidenceGaps),
      JSON.stringify(evaluationData.hardStops),
      JSON.stringify(evaluationData.softGaps),
      JSON.stringify(evaluationData.topStrengths),
      JSON.stringify(evaluationData.blockASummary),
      JSON.stringify(evaluationData.blockBRequirements),
      JSON.stringify(evaluationData.blockCStrategy),
      JSON.stringify(evaluationData.blockDComp),
      JSON.stringify(evaluationData.blockEPersonalization),
      JSON.stringify(evaluationData.blockFInterview),
      JSON.stringify(evaluationData.blockGLegitimacy),
      JSON.stringify(evaluationData.blockHAnswers || {}),
      JSON.stringify(evaluationData.riskSummary),
      JSON.stringify(evaluationData.scoreEvidence),
      evaluationData.machineSummaryYaml,
      evaluationData.fullMarkdownReport
    );

    // If score >= 4.0, automatically compile tailored CV & cover letter
    if (evaluationData.score >= 4.0 && evaluationData.finalDecision === 'Apply') {
      console.log(`[career-ops] Score ${evaluationData.score} >= 4.0. Triggering grounded PDF compilation...`);
      const tailoringPlan = {
        company: job.company,
        roleTitle: job.title,
        summaryOverride: evaluationData.blockASummary.tldr ? `${masterCv.summaryVariants.aiEngineer} ${evaluationData.blockASummary.tldr}` : undefined,
        bulletModifications: evaluationData.blockEPersonalization.map(item => ({
          id: item.id,
          section: item.section,
          originalText: item.currentState,
          tailoredText: item.proposedChange,
          reason: item.why
        }))
      };

      await this.compiler.compileTailoredPackage(jobId, vault, masterCv, tailoringPlan);

      db.prepare(`
        UPDATE job_listings
        SET status = 'queued'
        WHERE id = ?
      `).run(jobId);
    } else {
      db.prepare(`
        UPDATE job_listings
        SET status = 'evaluated'
        WHERE id = ?
      `).run(jobId);
    }

    return evaluationData;
  }

  /**
   * Calls LLM provider with CAREER_OPS_SYSTEM_PROMPT and buildEvaluationPrompt
   */
  private async executeEvaluation(
    job: any,
    masterCv: MasterCV,
    vault: PersonalVault,
    options: EvaluatorOptions
  ): Promise<EvaluationReport> {
    // 1. Resolve Provider, Model, and API Key
    const settingsRow = db.prepare('SELECT * FROM system_settings WHERE id = 1').get() as any;
    const provider = options.provider || settingsRow?.llm_provider || (
      process.env.GEMINI_API_KEY ? 'gemini' :
      process.env.ANTHROPIC_API_KEY ? 'anthropic' :
      process.env.OPENAI_API_KEY ? 'openai' : 'gemini'
    );
    const model = options.model || settingsRow?.llm_model;
    const apiKey = options.apiKey || settingsRow?.llm_api_key_encrypted || (
      provider === 'gemini' ? process.env.GEMINI_API_KEY :
      provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY :
      provider === 'openai' ? process.env.OPENAI_API_KEY : ''
    );

    if (provider !== 'ollama' && (!apiKey || apiKey.trim() === '')) {
      throw new Error(`LLM API key for ${provider.toUpperCase()} not configured. Please set your API key in Settings -> BYOK (or set ${provider.toUpperCase()}_API_KEY in .env).`);
    }

    console.log(`[career-ops] Invoking ${provider.toUpperCase()} (${model || 'default'}) for evaluation...`);
    const promptText = buildEvaluationPrompt(
      job.raw_jd_text,
      JSON.stringify(masterCv, null, 2),
      JSON.stringify(vault, null, 2)
    );

    let rawJsonText = '';

    if (provider === 'gemini') {
      const geminiModel = model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }]
          }
        ],
        systemInstruction: {
          parts: [{ text: CAREER_OPS_SYSTEM_PROMPT }]
        },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errBody}`);
      }

      const data = await res.json();
      rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (provider === 'anthropic') {
      const anthropicModel = model || 'claude-3-5-sonnet-20241022';
      const endpoint = 'https://api.anthropic.com/v1/messages';
      const payload = {
        model: anthropicModel,
        max_tokens: 4096,
        system: CAREER_OPS_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `${promptText}\n\nRespond ONLY with a valid JSON object matching the requested schema.` }
        ],
        temperature: 0.1
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Anthropic API error (${res.status}): ${errBody}`);
      }

      const data = await res.json();
      rawJsonText = data.content?.[0]?.text || '';
    } else if (provider === 'openai') {
      const openaiModel = model || 'gpt-4o';
      const endpoint = 'https://api.openai.com/v1/chat/completions';
      const payload = {
        model: openaiModel,
        messages: [
          { role: 'system', content: CAREER_OPS_SYSTEM_PROMPT },
          { role: 'user', content: promptText }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenAI API error (${res.status}): ${errBody}`);
      }

      const data = await res.json();
      rawJsonText = data.choices?.[0]?.message?.content || '';
    } else if (provider === 'ollama') {
      const host = settingsRow?.ollama_host || process.env.OLLAMA_HOST || 'http://localhost:11434';
      const ollamaModel = model || 'llama3';
      const endpoint = `${host.replace(/\/+$/, '')}/api/chat`;
      const payload = {
        model: ollamaModel,
        messages: [
          { role: 'system', content: CAREER_OPS_SYSTEM_PROMPT },
          { role: 'user', content: promptText }
        ],
        format: 'json',
        stream: false
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Ollama error (${res.status}) at ${host}: ${errBody}`);
      }

      const data = await res.json();
      rawJsonText = data.message?.content || '';
    } else {
      throw new Error(`Unsupported LLM provider: ${provider}`);
    }

    if (!rawJsonText || rawJsonText.trim() === '') {
      throw new Error(`LLM provider ${provider} returned empty evaluation content.`);
    }

    // Clean JSON (strip potential markdown code fences)
    let cleaned = rawJsonText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr: any) {
      throw new Error(`Failed to parse LLM evaluation JSON: ${parseErr.message}\nRaw response:\n${cleaned.slice(0, 500)}`);
    }

    // Extract fields safely
    const score = typeof parsed.score === 'number' ? Math.max(1.0, Math.min(5.0, Number(parsed.score.toFixed(1)))) : 3.5;
    const finalDecision = parsed.final_decision || (score >= 4.0 ? 'Apply' : score >= 3.5 ? 'Consider' : 'Skip');
    const archetype = parsed.archetype || 'AI Platform / LLMOps Engineer';
    const legitimacyTier = parsed.legitimacy_tier || 'High Confidence';
    const workAuthTier = parsed.work_auth_tier || 'Not needed';

    const dims = parsed.dimension_scores || {};
    const cvMatchScore = typeof dims.cv_match === 'number' ? dims.cv_match : score;
    const northStarScore = typeof dims.north_star === 'number' ? dims.north_star : score;
    const compScore = typeof dims.compensation === 'number' ? dims.compensation : (typeof parsed.comp_score === 'number' ? parsed.comp_score : 4.0);
    const cultureScore = typeof dims.culture === 'number' ? dims.culture : 4.0;
    const redFlagsDeduction = typeof dims.red_flags_deduction === 'number' ? dims.red_flags_deduction : 0.0;

    const fullMarkdown = `# Evaluation: ${job.company} — ${job.title}

**Date:** ${new Date().toISOString().split('T')[0]}
**Archetype:** ${archetype}
**Score:** ${score}/5.0
**Decision:** ${finalDecision}
**Legitimacy:** ${legitimacyTier}
**Work Auth:** ${workAuthTier}

### Verdict & Summary
${parsed.block_a_summary?.tldr || `${finalDecision}. Evaluated under career-ops structured rubrics.`}
`;

    const machineYaml = `company: "${job.company}"
role: "${job.title}"
score: ${score}
legitimacy_tier: "${legitimacyTier}"
archetype: "${archetype}"
final_decision: "${finalDecision}"
hard_stops: ${JSON.stringify(parsed.hard_stops || [])}
soft_gaps: ${JSON.stringify(parsed.soft_gaps || [])}
top_strengths: ${JSON.stringify(parsed.top_strengths || [])}
work_auth: "${workAuthTier.toLowerCase().replace(/\s+/g, '_')}"
advertised_comp: "${job.advertised_comp || 'Unstated'}"`;

    return {
      id: `eval-${job.id}`,
      jobId: job.id,
      score,
      finalDecision,
      archetype,
      legitimacyTier,
      workAuthTier,
      cvMatchScore,
      northStarScore,
      compScore,
      cultureScore,
      redFlagsDeduction,
      evidenceConfidence: parsed.evidence_confidence || 'High',
      confidenceGaps: parsed.confidence_gaps || [],
      hardStops: parsed.hard_stops || [],
      softGaps: parsed.soft_gaps || [],
      topStrengths: parsed.top_strengths || [],
      blockASummary: parsed.block_a_summary || {
        archetype,
        domain: 'AI & Software Systems',
        seniority: 'Lead / Staff',
        workMode: job.remote_type || 'Remote',
        teamSize: 'Unstated',
        workAuth: `${workAuthTier} (${vault.location})`,
        tldr: 'Direct evaluation completed via LLM.'
      },
      blockBRequirements: (parsed.block_b_requirements || []).map((r: any) => ({
        requirement: r.requirement || 'Requirement',
        importance: r.importance || 'high',
        evidence: r.evidence || 'stated',
        match: r.match || 'strong',
        jdSignal: r.jd_signal || r.jdSignal || null,
        gap: r.gap || null,
        mitigation: r.mitigation || null
      })),
      blockCStrategy: parsed.block_c_strategy || {
        levelFit: 'Peer / Target Level',
        positioning: 'Position as a grounded practitioner with direct system ownership.',
        downlevelDefense: 'Demonstrate metrics-backed production deliverables from Master CV.'
      },
      blockDComp: parsed.block_d_comp || {
        companyType: job.company_type || 'Unstated',
        compReliability: 'Medium',
        advertisedComp: job.advertised_comp || null,
        guaranteedBase: null,
        variable: null,
        marketPercentile: 'Market rate'
      },
      blockEPersonalization: (parsed.block_e_personalization || []).map((e: any, idx: number) => ({
        id: e.id || `e${idx + 1}`,
        section: e.section || 'Work Experience',
        currentState: e.current_state || e.currentState || '',
        proposedChange: e.proposed_change || e.proposedChange || '',
        why: e.why || 'Tailored to JD keywords'
      })),
      blockFInterview: parsed.block_f_interview || {
        starStories: [],
        caseStudy: 'Technical problem analysis for target role',
        redFlagQa: []
      },
      blockGLegitimacy: parsed.block_g_legitimacy || {
        postingFreshness: 'Active',
        descriptionQuality: 'Specific requirements',
        repostSignals: 'Standard',
        aiBuzzwordMismatch: 'Low',
        payTransparency: job.advertised_comp ? 'Disclosed' : 'Unstated',
        recruiterVerification: 'Verified'
      },
      blockHAnswers: parsed.block_h_answers || (score >= 4.0 ? {
        why_apply: `I am passionate about this role at ${job.company} as it directly leverages my verified experience in ${masterCv.title}.`,
        expected_ctc: `${vault.expectedCtcLakhs} LPA (negotiable)`,
        notice_period: `${vault.noticePeriodDays} days`
      } : undefined),
      riskSummary: parsed.risk_summary || {
        legitimacy: legitimacyTier,
        classification: 'Full-time / Permanent',
        culture: 'Pass',
        interview_redflags: 'None',
        ai_infra: 'Aligned',
        fixed_term: 'Not detected'
      },
      scoreEvidence: parsed.score_evidence || {
        cv_match: 'supported',
        north_star: 'supported',
        compensation: 'supported',
        culture: 'supported',
        red_flags: 'supported'
      },
      machineSummaryYaml: machineYaml,
      fullMarkdownReport: fullMarkdown,
      evaluatedAt: new Date().toISOString()
    };
  }
}

export const careerOpsEvaluator = new CareerOpsEvaluator();
