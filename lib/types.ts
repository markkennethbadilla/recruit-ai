export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  certifications: string[];
}

export interface ScoringResult {
  overallScore: number;
  breakdown: {
    category: string;
    score: number;
    maxScore: number;
    reasoning: string;
  }[];
  strengths: string[];
  gaps: string[];
  recommendation: "strong_match" | "potential_match" | "weak_match";
  summary: string;
}

export interface ScreeningQuestion {
  question: string;
  purpose: string;
  lookFor: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  uploadedAt: string;
  parsedResume: ParsedResume;
  scoring?: ScoringResult;
  screeningQuestions?: ScreeningQuestion[];
  jobDescription?: string;
}

export interface PipelineState {
  step: "upload" | "parsing" | "parsed" | "scoring" | "scored" | "generating" | "complete";
  resumeText?: string;
  parsedResume?: ParsedResume;
  scoring?: ScoringResult;
  screeningQuestions?: ScreeningQuestion[];
  jobDescription?: string;
  error?: string;
}
