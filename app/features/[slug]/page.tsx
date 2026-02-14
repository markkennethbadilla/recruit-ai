"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import {
  Upload,
  Brain,
  BarChart3,
  MessageSquareText,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
  FileText,
  Target,
  Layers,
  Shield,
  Clock,
  type LucideIcon,
} from "lucide-react";

interface FeatureDetail {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  glowColor: string;
  description: string;
  howItWorks: { step: string; detail: string }[];
  capabilities: { icon: LucideIcon; title: string; desc: string }[];
  techHighlights: string[];
}

const featureData: Record<string, FeatureDetail> = {
  "resume-parsing": {
    title: "Resume Parsing",
    subtitle: "AI-powered data extraction from any resume format",
    icon: Upload,
    color: "text-purple-400",
    gradient: "from-purple-600 to-purple-800",
    glowColor: "rgba(139, 92, 246, 0.3)",
    description:
      "Our AI parsing engine uses advanced language models to read and understand resumes in PDF or TXT format. It doesn't just extract text - it comprehends context, identifies sections, and structures raw content into clean, actionable candidate data you can immediately use for evaluation.",
    howItWorks: [
      {
        step: "Upload",
        detail:
          "Drag and drop or select a resume file. We support PDF and TXT formats up to 10MB.",
      },
      {
        step: "Extract",
        detail:
          "The AI reads the full document, identifying names, contact info, work history, education, skills, and certifications.",
      },
      {
        step: "Structure",
        detail:
          "Raw text is transformed into a clean, structured profile with categorized skills, timeline-ordered experience, and education details.",
      },
      {
        step: "Review",
        detail:
          "You see the parsed profile in a clean card layout, ready for the next step: scoring against a job description.",
      },
    ],
    capabilities: [
      {
        icon: FileText,
        title: "Multi-Format Support",
        desc: "Handles PDF and TXT files, parsing through varied resume layouts and styles.",
      },
      {
        icon: Brain,
        title: "Contextual Understanding",
        desc: "The AI understands job titles, company names, and duration from natural language descriptions.",
      },
      {
        icon: Layers,
        title: "Structured Output",
        desc: "Returns organized JSON with name, email, phone, location, summary, skills, experience, and education.",
      },
      {
        icon: Zap,
        title: "Fast Processing",
        desc: "Most resumes are parsed in under 10 seconds, even complex multi-page documents.",
      },
    ],
    techHighlights: [
      "Supports PDF parsing via pdf-parse library with fallback handling",
      "LLM-powered entity extraction using free models (Llama 3.3, Gemma 3, Mistral Small)",
      "Handles messy formatting, tables, columns, and non-standard layouts",
      "Extracts skills as individual tags for granular matching",
      "Groups experience entries with company, title, duration, and bullet highlights",
    ],
  },
  "smart-scoring": {
    title: "Smart Scoring",
    subtitle: "6-axis candidate evaluation against your job requirements",
    icon: BarChart3,
    color: "text-blue-400",
    gradient: "from-blue-600 to-blue-800",
    glowColor: "rgba(59, 130, 246, 0.3)",
    description:
      "Smart Scoring goes beyond keyword matching. Our AI evaluates candidates across six distinct dimensions, comparing their parsed resume against your specific job description. Each dimension gets a score out of 10 with detailed reasoning, giving you a nuanced view of how well a candidate fits the role.",
    howItWorks: [
      {
        step: "Input JD",
        detail:
          "Paste your job description or select from pre-built templates (AI Engineer, Full-Stack, PM, Data Analyst, DevOps).",
      },
      {
        step: "Analyze",
        detail:
          "The AI cross-references every skill, experience, and qualification from the resume against your JD requirements.",
      },
      {
        step: "Score",
        detail:
          "Each of the 6 axes receives a score out of 10 with specific reasoning. These combine into an overall fit score out of 100.",
      },
      {
        step: "Recommend",
        detail:
          'Based on the composite score, the system produces a recommendation: "Strong Match", "Potential Match", or "Weak Match".',
      },
    ],
    capabilities: [
      {
        icon: Target,
        title: "6-Axis Evaluation",
        desc: "Scores across Technical Skills, Experience, Education, Communication, Culture Fit, and Growth Potential.",
      },
      {
        icon: BarChart3,
        title: "Visual Breakdown",
        desc: "Color-coded progress bars and score rings make it easy to spot strengths and gaps at a glance.",
      },
      {
        icon: Shield,
        title: "Detailed Reasoning",
        desc: "Every score comes with an explanation so you understand why the candidate scored the way they did.",
      },
      {
        icon: CheckCircle2,
        title: "Strengths & Gaps",
        desc: "Automatically identifies the top 3 strengths and key gaps so you know exactly what to probe in interviews.",
      },
    ],
    techHighlights: [
      "Hybrid evaluation combining keyword matching with semantic understanding",
      "Configurable scoring axes with weighted importance",
      "JD template library for common roles (AI Engineer, Full-Stack, PM, etc.)",
      "Score normalization across different LLM providers for consistency",
      "PDF export of full scoring reports with branded formatting",
    ],
  },
  "screening-questions": {
    title: "Screening Questions",
    subtitle: "AI-generated interview questions tailored to each candidate",
    icon: MessageSquareText,
    color: "text-cyan-400",
    gradient: "from-cyan-600 to-cyan-800",
    glowColor: "rgba(6, 182, 212, 0.3)",
    description:
      "Stop using generic interview questions. TalentFlow generates 8 screening questions specifically tailored to each candidate's profile and gaps. Questions are stratified by difficulty (easy, medium, hard) and each comes with guidance on what to look for in the answer, making your interview prep effortless.",
    howItWorks: [
      {
        step: "Profile + Score",
        detail:
          "The system uses both the parsed resume and the scoring results to understand the candidate's specific strengths and gaps.",
      },
      {
        step: "Generate",
        detail:
          "The AI creates 8 questions targeting areas where the candidate needs validation - skills gaps, experience depth, and culture signals.",
      },
      {
        step: "Stratify",
        detail:
          "Questions are tagged by difficulty (Easy, Medium, Hard) so you can choose how deep to go based on interview time.",
      },
      {
        step: "Guide",
        detail:
          'Each question includes a "Purpose" (why you\'re asking) and "Look for" (what a good answer contains) to help interviewers of any experience level.',
      },
    ],
    capabilities: [
      {
        icon: MessageSquareText,
        title: "Targeted Questions",
        desc: "Questions focus on the specific gaps and strengths identified in the scoring breakdown.",
      },
      {
        icon: Layers,
        title: "Difficulty Levels",
        desc: "Easy, Medium, and Hard questions let you adapt the interview depth to your needs.",
      },
      {
        icon: Target,
        title: "Interviewer Guidance",
        desc: 'Each question includes "Purpose" and "Look for" sections so any team member can run the screen.',
      },
      {
        icon: Clock,
        title: "Copy & Export",
        desc: "One-click copy to clipboard or export the full interview guide as a branded PDF report.",
      },
    ],
    techHighlights: [
      "Questions are generated using the full context: resume, JD, and scoring results",
      "Difficulty distribution ensures a balanced mix of probing depths",
      "Look-for guidance helps non-technical interviewers evaluate technical answers",
      "Questions avoid generic templates, each set is unique to the candidate",
      "Copy-to-clipboard and PDF export for sharing with hiring panels",
    ],
  },
};

export default function FeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const feature = featureData[slug];

  if (!feature) {
    notFound();
  }

  const Icon = feature.icon;

  return (
    <div className="min-h-screen selection:bg-purple-500/30 overflow-x-hidden">
      <div className="gradient-bg opacity-50" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3 sm:py-5 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div
            className="glass-card px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center justify-between"
            style={{ background: 'var(--bg-card)' }}
          >
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity group cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4 text-[var(--text-muted)] group-hover:text-white" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">TalentFlow</span>
              </div>
            </Link>
            <Link
              href="/pipeline"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-sm font-semibold text-white hover:scale-105 transition-all cursor-pointer"
            >
              Try it now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-36 md:pt-44 pb-12 sm:pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div
          className="absolute top-1/4 -left-20 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 rounded-full pointer-events-none opacity-30"
          style={{ background: `radial-gradient(circle, ${feature.glowColor}, transparent 70%)` }}
        />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-8 shadow-lg`}
            >
              <Icon className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
              {feature.title}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl leading-relaxed">
              {feature.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Description */}
      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
            {feature.description}
          </p>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12"
          >
            How it works
          </motion.h2>

          <div className="space-y-6 sm:space-y-8">
            {feature.howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 sm:gap-6"
              >
                <div className="shrink-0">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg`}
                  >
                    {i + 1}
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    {item.step}
                  </h3>
                  <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center"
          >
            Key Capabilities
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {feature.capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-solid p-6 sm:p-8 group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shrink-0`}
                  >
                    <cap.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-base sm:text-lg">
                      {cap.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Highlights */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12"
          >
            Under the Hood
          </motion.h2>

          <div className="space-y-4">
            {feature.techHighlights.map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed"
              >
                <CheckCircle2
                  className={`w-5 h-5 ${feature.color} shrink-0 mt-0.5`}
                />
                <span>{h}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass-card p-8 sm:p-12 md:p-16 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              See it in action
            </h2>
            <p className="text-[var(--text-secondary)] mb-6 sm:mb-8 text-base sm:text-lg">
              Try {feature.title.toLowerCase()} now with our full AI pipeline.
            </p>
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 bg-white text-black rounded-full text-base sm:text-lg font-bold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:scale-105 cursor-pointer"
            >
              Launch Pipeline <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">TalentFlow AI</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            &copy; 2026 TalentFlow AI. Built with ❤️ for WeAssist.io
          </p>
        </div>
      </footer>
    </div>
  );
}
