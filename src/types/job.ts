export type JobPortal = 'linkedin' | 'naukri' | 'hiringcafe' | 'workday' | 'greenhouse' | 'lever' | 'ashby' | 'other';

export type JobStatus = 
  | 'discovered' 
  | 'evaluated' 
  | 'tailored' 
  | 'queued' 
  | 'applied' 
  | 'rejected' 
  | 'interview' 
  | 'skipped';

export interface JobListing {
  id: string;
  portal: JobPortal;
  portalJobId?: string;
  url: string;
  title: string;
  company: string;
  companySlug: string;
  location: string;
  remoteType: 'Remote' | 'Hybrid' | 'Onsite';
  postedDate?: string;
  capturedAt: string;
  rawJdText: string;
  companyType?: string;
  reportsTo?: string;
  advertisedComp?: string;
  status: JobStatus;
  easyApply: boolean;
  externalApplyUrl?: string;
  atsProvider?: string;
  score?: number;
  legitimacyTier?: 'High Confidence' | 'Proceed with Caution' | 'Suspicious';
  finalDecision?: 'Apply' | 'Consider' | 'Research first' | 'Skip';
  tailoredDocPath?: string;
}

export interface ApplicationRun {
  id: string;
  jobId: string;
  portal: JobPortal;
  mode: 'auto_pilot' | 'co_pilot';
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'submitted' | 'failed' | 'cancelled';
  stepReached?: string;
  errorMessage?: string;
  screenshotPath?: string;
  formAnswersSnapshot: Record<string, any>;
  startedAt: string;
  completedAt?: string;
}

export interface NaukriBoosterLog {
  id: number;
  executedAt: string;
  status: 'success' | 'failed' | 'running';
  resumeUploaded: boolean;
  headlineModified: boolean;
  headlineBefore?: string;
  headlineAfter?: string;
  nextScheduledRun: string;
  errorMessage?: string;
  logOutput?: string;
}
