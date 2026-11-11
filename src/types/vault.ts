export interface PersonalVault {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;

  // Canadian Profile & Work Permit Fields
  phoneCanada?: string; // +1 289-890-3999
  locationCanada?: string; // Waterloo / Toronto, ON, Canada
  workPermitCanada?: string; // Canadian Open Work Permit (No LMIA / Sponsorship Required)
  expectedCompCad?: string; // CAD $115,000 - $135,000

  // ATS Account & Login Automation Credentials
  atsEmail?: string;
  atsPassword?: string;
  atsAuthStrategy?: 'smart_detect' | 'login_first' | 'signup_first' | 'try_login_then_signup' | 'copilot_confirm';

  // Indian Specific Recruitment Fields
  currentCtcLakhs: number; // e.g. 18.0 (INR Lakhs per Annum)
  expectedCtcLakhs: number; // e.g. 28.0
  ctcNegotiable: boolean;
  noticePeriodDays: number; // e.g. 60
  lastWorkingDay?: string;
  buyoutAvailable: boolean;
  preferredLocations: string[]; // ["Pune", "Bengaluru", "Toronto, ON", "Waterloo, ON", "Remote"]
  relocationWilling: boolean;

  // Global Authorization & EEO
  authorizedCountries: string[]; // ["IN", "CA"]
  needsSponsorship: boolean;
  visaStatus: string;
  gender: string;
  disabilityStatus: string;
  veteranStatus: string;
  eeoEthnicity: string;

  // Behavioral & narrative snippets (Why us, Leadership, Transition, etc.)
  qaSnippets: Record<string, string>;
  updatedAt: string;
}

export interface AtsAccountRecord {
  id: string | number;
  domain: string;
  portalType: string;
  emailUsed: string;
  accountStatus: string;
  lastLoginAt: string;
  createdAt: string;
}

export interface BulletPoint {
  id: string;
  text: string;
  metrics?: string;
  tags: string[];
}

export interface WorkExperience {
  company: string;
  role: string;
  location: string;
  dates: string;
  bullets: BulletPoint[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  year: string;
  description?: string;
}

export interface Certification {
  title: string;
  issuer: string;
  year: string;
  url?: string;
}

export interface Project {
  name: string;
  description: string;
  tech: string[];
  bullets: string[];
  url?: string;
}

export interface Award {
  title: string;
  org: string;
  year: string;
}

export interface MasterCV {
  id: string;
  version: number;
  title: string;
  isActive: boolean;
  summaryVariants: {
    aiEngineer?: string;
    lead?: string;
    fullstack?: string;
    general?: string;
    powerPlatform?: string;
    dataEngineering?: string;
    aiAutomation?: string;
    [key: string]: string | undefined;
  };
  skillsTaxonomy: {
    languages: string[];
    frameworks: string[];
    aiLlm: string[];
    cloudDevops: string[];
    databases?: string[];
    tools?: string[];
    sharepointMigration?: string[];
    toolsVersionControl?: string[];
    certificationsList?: string[];
    [key: string]: string[] | undefined;
  };
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  awards: Award[];
  createdAt: string;
  updatedAt: string;
}
