"use client";

import { motion } from "framer-motion";
import {
  Upload,
  Brain,
  BarChart3,
  MessageSquareText,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Upload,
    title: "Resume Parsing",
    description:
      "Upload any resume (PDF/TXT) and watch AI extract structured data — skills, experience, education, contact info — in seconds.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: BarChart3,
    title: "Smart Scoring",
    description:
      "AI compares the parsed resume against your job description across 6 dimensions, producing a detailed fit score with explanations.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: MessageSquareText,
    title: "Screening Questions",
    description:
      "Auto-generates 8 tailored screening questions targeting the candidate's specific gaps and strengths — easy, medium, and hard.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
];

const stats = [
  { icon: Zap, label: "Processing Time", value: "< 30s", desc: "Full pipeline" },
  { icon: Shield, label: "Accuracy", value: "6-Axis", desc: "Scoring dimensions" },
  { icon: Clock, label: "Time Saved", value: "Hours", desc: "Per candidate" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-x-0 border-t-0 rounded-none px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">TalentFlow</span>
            <span className="text-purple-400 text-sm font-mono">AI</span>
          </div>
          <Link
            href="/pipeline"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-sm font-medium hover:from-purple-500 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-purple-500/20"
          >
            Launch Pipeline <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm mb-8">
              <Brain className="w-4 h-4" />
              AI-Powered Recruiting Pipeline
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Screen Smarter.
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Hire Faster.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload a resume. Get structured data, match scores, and tailored
              screening questions — all powered by AI, in under 30 seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pipeline"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-lg font-semibold hover:from-purple-500 hover:to-blue-500 transition-all duration-300 shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
              >
                Try the Pipeline <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>

          {/* Pipeline visualization */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20 flex items-center justify-center gap-4 md:gap-6 flex-wrap"
          >
            {[
              { icon: Upload, label: "Upload", color: "from-purple-500 to-purple-700" },
              { icon: Brain, label: "Parse", color: "from-blue-500 to-blue-700" },
              { icon: BarChart3, label: "Score", color: "from-cyan-500 to-cyan-700" },
              { icon: MessageSquareText, label: "Questions", color: "from-green-500 to-green-700" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-4 md:gap-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.15, type: "spring", stiffness: 200 }}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${step.color} flex flex-col items-center justify-center gap-1 shadow-lg`}
                >
                  <step.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  <span className="text-[10px] md:text-xs text-white/80 font-medium">
                    {step.label}
                  </span>
                </motion.div>
                {i < 3 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.7 + i * 0.15, duration: 0.4 }}
                    className="hidden md:block w-12 h-0.5 bg-gradient-to-r from-white/30 to-white/10"
                  />
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="glass-card p-6 text-center"
            >
              <stat.icon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <div className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-[var(--text-secondary)] mt-1">
                {stat.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-16"
          >
            The Complete Pipeline
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="glass-card-solid p-8 hover:border-purple-500/30 transition-all duration-300 group"
              >
                <div
                  className={`w-14 h-14 rounded-xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
                >
                  <f.icon className={`w-7 h-7 ${f.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass-card p-12 border-gradient"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to streamline recruiting?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 text-lg">
            Upload a resume and watch the AI pipeline in action.
          </p>
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-lg font-semibold hover:from-purple-500 hover:to-blue-500 transition-all duration-300 shadow-xl shadow-purple-500/25"
          >
            Launch Pipeline <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold">TalentFlow AI</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Built by Mark Kenneth Badilla — AI-powered recruiting for WeAssist.io
          </p>
        </div>
      </footer>
    </div>
  );
}
