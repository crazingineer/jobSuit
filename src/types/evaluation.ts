export type Archetype = 
  | 'AI Platform / LLMOps Engineer'
  | 'Agentic Workflows / Automation'
  | 'Technical AI Product Manager'
  | 'AI Solutions Architect'
  | 'AI Forward Deployed Engineer'
  | 'AI Transformation Lead'
  | string;

export type WorkAuthTier = 'Sponsors' | 'Not needed' | 'Unstated' | 'No sponsorship';
export type LegitimacyTier = 'High Confidence' | 'Proceed with Caution' | 'Suspicious';
export type FinalDecision = 'Apply' | 'Consider' | 'Research first' | 'Skip';
export type MatchStatus = 'strong' | 'partial' | 'missing' | 'na';
export type ImportanceBand = 'critical' | 'high' | 'meaningful' | 'preferred' | 'low_signal';
export type EvidenceTier = 'stated' | 'structural' | 'inferred';

export interface RequirementRow {
  requirement: string;
  importance: ImportanceBand;
  evidence: EvidenceTier;
  match: MatchStatus;
  jdSignal?: string | null;
  gap?: string | null;
  mitigation?: string | null;
}

export interface PersonalizationItem {
  id: string;
  section: string;
  currentState: string;
  proposedChange: string;
  why: string;
}

export interface StarStory {
  id: number;
  requirement: string;
  story: string;
  s: string;
  t: string;
  a: string;
  r: string;
  reflection: string;
}

export interface BlockGSignals {
  postingFreshness: string;
  descriptionQuality: string;
  repostSignals: string;
  aiBuzzwordMismatch: string;
  payTransparency: string;
  recruiterVerification: string;
  agencyLicensing?: string;
  jurisdictionProhibited?: string;
  minimumWage?: string;
  aiScreeningDisclosure?: string;
  fixedTermContract?: string;
  relocationPurchasingPower?: string;
}

export interface EvaluationReport {
  id: string;
  jobId: string;
  score: number; // 1.0 to 5.0
  finalDecision: FinalDecision;
  archetype: Archetype;
  legitimacyTier: LegitimacyTier;
  workAuthTier: WorkAuthTier;

  // 5 Dimensional Scores
  cvMatchScore: number;
  northStarScore: number;
  compScore: number;
  cultureScore: number;
  redFlagsDeduction: number;

  evidenceConfidence: 'High' | 'Medium' | 'Low';
  confidenceGaps: string[];
  hardStops: string[];
  softGaps: string[];
  topStrengths: string[];

  // Blocks A-H
  blockASummary: {
    archetype: string;
    domain: string;
    seniority: string;
    workMode: string;
    teamSize: string;
    workAuth: string;
    tldr?: string;
  };
  blockBRequirements: RequirementRow[];
  blockCStrategy: {
    levelFit: string;
    positioning: string;
    downlevelDefense: string;
  };
  blockDComp: {
    companyType: string;
    compReliability: string;
    advertisedComp: string;
    guaranteedBase?: string;
    variable?: string;
    marketPercentile?: string;
  };
  blockEPersonalization: PersonalizationItem[];
  blockFInterview: {
    starStories: StarStory[];
    caseStudy: string;
    redFlagQa: Array<{ q: string; a: string }>;
  };
  blockGLegitimacy: BlockGSignals;
  blockHAnswers?: Record<string, string>; // Only generated if score >= 4.0

  riskSummary: Record<string, string>;
  scoreEvidence: Record<string, string>;
  machineSummaryYaml: string;
  fullMarkdownReport: string;
  evaluatedAt: string;
}
