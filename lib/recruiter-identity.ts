/**
 * Recruiter Identity — localStorage-backed session identity.
 * 
 * Allows the recruiter using TalentFlow to define who they are
 * so outreach emails have the correct reply-to and signature.
 */

const STORAGE_KEY = "talentflow-recruiter";

export interface RecruiterIdentity {
  name: string;
  email: string;
}

export function getRecruiterIdentity(): RecruiterIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed?.name && parsed?.email?.includes("@")) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setRecruiterIdentity(identity: RecruiterIdentity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearRecruiterIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
}
