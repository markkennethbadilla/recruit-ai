"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

export default function PrivacyPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-[var(--glass-border)] backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors">
              <ArrowLeft className="w-4 h-4 text-[var(--text-muted)]" />
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">Privacy Policy</h1>
            </div>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors">
            {theme === "dark" ? <Sun className="w-4 h-4 text-[var(--text-muted)]" /> : <Moon className="w-4 h-4 text-[var(--text-muted)]" />}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="glass-card p-8 sm:p-12 space-y-8">
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-2">Last updated: February 14, 2026</p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              TalentFlow AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting the privacy and security of all users, candidates, and recruiters who interact with our platform. This policy explains what data we collect, how we use it, and your rights.
            </p>
          </div>

          <Section title="1. Information We Collect">
            <Subsection title="Candidate Data (submitted via /apply or pipeline)">
              <ul className="list-disc pl-5 space-y-1 text-[var(--text-secondary)]">
                <li>Name, email address, phone number</li>
                <li>Resume content (parsed text, not raw file storage)</li>
                <li>Position applied for and cover notes</li>
                <li>AI-generated evaluation scores and screening questions</li>
              </ul>
            </Subsection>
            <Subsection title="Recruiter/User Data">
              <ul className="list-disc pl-5 space-y-1 text-[var(--text-secondary)]">
                <li>No user accounts or authentication are currently required</li>
                <li>No cookies are used for tracking</li>
                <li>Theme preferences are stored locally in your browser (localStorage only)</li>
              </ul>
            </Subsection>
            <Subsection title="Automatically Collected">
              <ul className="list-disc pl-5 space-y-1 text-[var(--text-secondary)]">
                <li>Standard server logs (IP address, browser type, timestamps) via Vercel hosting</li>
                <li>No analytics, tracking pixels, or third-party cookies are used</li>
              </ul>
            </Subsection>
          </Section>

          <Section title="2. How We Use Your Data">
            <ul className="list-disc pl-5 space-y-2 text-[var(--text-secondary)]">
              <li><strong>Resume Evaluation:</strong> Your resume text is sent to AI language models (via OpenRouter) for scoring and question generation. The AI evaluates qualifications only and is programmed to ignore demographic information.</li>
              <li><strong>Outreach Communication:</strong> If an email address is detected in your resume, the system may send a recruiter outreach email to that address. Email content and voice message scripts are AI-generated.</li>
              <li><strong>Voice Messages:</strong> AI-generated voice messages are synthesized using Kokoro TTS (text-to-speech). These are attached to outreach emails. The voice is AI-synthesized, not a real person.</li>
              <li><strong>CRM Storage:</strong> Candidate records may be stored in NocoDB (self-hosted CRM) for recruiter review. This includes name, email, score, and parsed qualifications.</li>
              <li><strong>Integration Workflows:</strong> n8n workflows may process candidate data for intake notifications, outreach triggers, and pipeline reporting.</li>
            </ul>
          </Section>

          <Section title="3. AI Transparency">
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              TalentFlow AI uses artificial intelligence extensively. We believe in full transparency about where AI is involved:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--text-secondary)]">
              <li><strong>Resume Scoring:</strong> AI models evaluate resumes across 6 dimensions. The specific model used is logged for auditability.</li>
              <li><strong>Screening Questions:</strong> Interview questions are AI-generated based on the candidate&apos;s resume and job requirements.</li>
              <li><strong>Outreach Emails:</strong> Email body text is AI-generated by large language models.</li>
              <li><strong>Voice Messages:</strong> Voice recordings attached to emails are AI-synthesized audio, not human recordings.</li>
              <li><strong>Guide Assistant:</strong> The in-app help chat uses AI to answer questions about the platform.</li>
              <li><strong>Ethics Evaluation:</strong> We run 24 automated ethics tests across all AI components to monitor for bias, discrimination, and safety issues.</li>
            </ul>
          </Section>

          <Section title="4. AI Fairness and Bias Prevention">
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              We take active measures to prevent AI bias in our recruiting pipeline:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--text-secondary)]">
              <li>All scoring prompts require gender-neutral language and demographic-blind evaluation</li>
              <li>Name-blind scoring consistency is tested across culturally diverse candidate names</li>
              <li>AI-generated outreach is tested for tone equity across different demographics</li>
              <li>Regular ethics evaluations monitor for bias drift over time</li>
              <li>Screening questions are tested to ensure they never touch protected characteristics</li>
              <li>AI systems are explicitly instructed to reject discriminatory requests</li>
            </ul>
          </Section>

          <Section title="5. Third-Party Services">
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              Your data may be processed by these third-party services:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--text-secondary)]">
              <li><strong>OpenRouter:</strong> Routes AI requests to various language models (Google Gemma, Meta LLaMA, DeepSeek, Qwen, OpenAI GPT-4o-mini). Resume text is sent for evaluation.</li>
              <li><strong>Resend:</strong> Email delivery service for outreach emails (from recruiting@talentflow.elunari.uk).</li>
              <li><strong>Vercel:</strong> Application hosting and serverless function execution.</li>
              <li><strong>Cloudflare:</strong> DNS, CDN, and tunnel services for infrastructure.</li>
              <li><strong>Self-hosted services (NocoDB, n8n, Kokoro TTS):</strong> Run on private infrastructure, data does not leave our control.</li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <ul className="list-disc pl-5 space-y-2 text-[var(--text-secondary)]">
              <li>Candidate records in NocoDB are retained until manually deleted by the recruiter</li>
              <li>AI evaluation results are stored in-memory during server runtime and are not persisted to disk</li>
              <li>Outreach emails are sent via Resend and subject to their retention policy</li>
              <li>Server logs are managed by Vercel per their data retention policy</li>
              <li>No resume files are permanently stored. Only parsed text is retained in the CRM.</li>
            </ul>
          </Section>

          <Section title="7. Your Rights">
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--text-secondary)]">
              <li><strong>Right to Access:</strong> Request a copy of any data we hold about you</li>
              <li><strong>Right to Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Deletion:</strong> Request deletion of your data from our systems</li>
              <li><strong>Right to Object:</strong> Object to AI-based decision-making about your candidacy</li>
              <li><strong>Right to Explanation:</strong> Request a human review of any AI-generated evaluation</li>
            </ul>
            <p className="text-[var(--text-secondary)] mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:recruiting@talentflow.elunari.uk" className="text-purple-400 hover:underline">
                recruiting@talentflow.elunari.uk
              </a>.
            </p>
          </Section>

          <Section title="8. Data Security">
            <ul className="list-disc pl-5 space-y-2 text-[var(--text-secondary)]">
              <li>All data is transmitted over HTTPS (TLS encryption in transit)</li>
              <li>API endpoints are protected with security headers (HSTS, CSP, X-Frame-Options)</li>
              <li>No passwords or credentials are stored in client-side code</li>
              <li>Self-hosted services run on private infrastructure behind Cloudflare tunnels</li>
              <li>API keys and secrets are stored as environment variables, never in source code</li>
            </ul>
          </Section>

          <Section title="9. Children's Privacy">
            <p className="text-[var(--text-secondary)] leading-relaxed">
              TalentFlow AI is not intended for use by individuals under 16 years of age. We do not knowingly collect personal data from children. If you believe we have inadvertently collected such data, please contact us immediately.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We may update this policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="11. Contact">
            <p className="text-[var(--text-secondary)] leading-relaxed">
              For privacy inquiries, data requests, or concerns about AI fairness, contact us at{" "}
              <a href="mailto:recruiting@talentflow.elunari.uk" className="text-purple-400 hover:underline">
                recruiting@talentflow.elunari.uk
              </a>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-1">{title}</h3>
      {children}
    </div>
  );
}
