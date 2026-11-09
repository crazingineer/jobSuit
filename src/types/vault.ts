export interface PersonalVault {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;

  // Indian Specific Recruitment Fields
  currentCtcLakhs: number; // e.g. 26.0 (INR Lakhs per Annum)
  expectedCtcLakhs: number; // e.g. 38.0
  ctcNegotiable: boolean;
  noticePeriodDays: number; // e.g. 60 or 90
  lastWorkingDay?: string; // Date string or undefined
  buyoutAvailable: boolean;
  preferredLocations: string[]; // ["Bengaluru", "Hyderabad", "Remote"]
  relocationWilling: boolean;

  // Global Authorization & EEO
  authorizedCountries: string[]; // ["IN", "US"]
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
