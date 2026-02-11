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
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Upload,
    title: "Resume Parsing",
    slug: "resume-parsing",
    description:
      "Upload any resume (PDF/TXT) and watch AI extract structured data — skills, experience, education, contact info — in seconds.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    icon: BarChart3,
    title: "Smart Scoring",
    slug: "smart-scoring",
    description:
      "AI compares the parsed resume against your job description across 6 dimensions, producing a detailed fit score with explanations.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: MessageSquareText,
    title: "Screening Questions",
    slug: "screening-questions",
    description:
      "Auto-generates 8 tailored screening questions targeting the candidate's specific gaps and strengths — easy, medium, and hard.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
];

const avatars = [
  { initials: "JR", from: "from-purple-500", to: "to-pink-500" },
  { initials: "AK", from: "from-blue-500", to: "to-cyan-500" },
  { initials: "SM", from: "from-emerald-500", to: "to-teal-500" },
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
    <div className="min-h-screen selection:bg-purple-500/30">
      
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3 sm:py-5 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center justify-between" style={{ background: 'rgba(15, 16, 22, 0.85)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-lg tracking-tight">TalentFlow</span>
                <span className="text-purple-400 text-xs font-mono font-medium">AI RECRUITING</span>
              </div>
            </div>
            <Link
              href="/pipeline"
              className="hidden md:flex items-center gap-2 px-7 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all duration-300 group"
            >
              Launch Pipeline 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 pt-28 sm:pt-32 md:pt-40 pb-12 sm:pb-20 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto w-full z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs sm:text-sm font-medium mb-6 sm:mb-10 hover:bg-purple-500/20 transition-colors cursor-default"
            >
              <Brain className="w-4 h-4" />
              <span>Next-Gen AI Recruiting Pipeline</span>
            </motion.div>

            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 sm:mb-10 leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent">
                Screen Smarter.
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent glow-text">
                Hire Faster.
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2 sm:px-0">
              Transform your hiring process with autonomous AI. Upload a resume and get 
              <span className="text-white font-medium"> structured data</span>, 
              <span className="text-white font-medium"> fit scores</span>, and 
              <span className="text-white font-medium"> tailored questions</span> in under 30 seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/pipeline"
                className="group relative inline-flex items-center gap-2 sm:gap-3 px-7 py-4 sm:px-10 sm:py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-base sm:text-lg font-semibold text-white shadow-xl shadow-purple-600/20 hover:shadow-purple-600/40 hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span>Try the Pipeline</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                <div className="flex -space-x-2">
                  {avatars.map((a) => (
                    <div key={a.initials} className={`w-8 h-8 rounded-full border-2 border-[var(--bg-primary)] bg-gradient-to-br ${a.from} ${a.to} flex items-center justify-center text-[10px] font-bold text-white`}>
                      {a.initials}
                    </div>
                  ))}
                </div>
                <span>Trusted by recruiters</span>
              </div>
            </div>
          </motion.div>

          {/* Pipeline visualization */}
          <div className="mt-14 sm:mt-24 md:mt-32">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card p-5 sm:p-8 md:p-12 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5" />
              
              <div className="relative flex flex-wrap justify-center items-center gap-4 sm:gap-8 md:gap-14">
                {[
                  { icon: Upload, label: "Upload", color: "from-purple-500 to-purple-700", delay: 0 },
                  { icon: Brain, label: "Parse", color: "from-blue-500 to-blue-700", delay: 0.2 },
                  { icon: BarChart3, label: "Score", color: "from-cyan-500 to-cyan-700", delay: 0.4 },
                  { icon: MessageSquareText, label: "Interview", color: "from-emerald-500 to-emerald-700", delay: 0.6 },
                ].map((step, i, arr) => (
                    <div key={step.label} className="flex items-center gap-2 sm:gap-4 md:gap-8 group">
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.6 + step.delay, type: "spring", stiffness: 200 }}
                      className="relative"
                    >
                      <div className={`w-16 h-16 sm:w-22 sm:h-22 md:w-28 md:h-28 rounded-xl sm:rounded-2xl bg-gradient-to-br ${step.color} flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 shadow-lg z-10 relative group-hover:translate-y-[-5px] transition-transform duration-300`}
                      >
                        <step.icon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white drop-shadow-md" />
                        <span className="text-[8px] sm:text-[10px] md:text-xs text-white/90 font-semibold uppercase tracking-wide">
                          {step.label}
                        </span>
                      </div>
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.color} blur-xl opacity-40 group-hover:opacity-60 transition-opacity`} />
                    </motion.div>
                    
                    {i < arr.length - 1 && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        transition={{ delay: 0.8 + step.delay, duration: 0.5 }}
                        className="hidden md:block flex-1 min-w-[60px]"
                      >
                         <div className="h-0.5 bg-gradient-to-r from-white/20 via-white/40 to-white/20 w-full rounded-full" />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="glass-card p-6 sm:p-8 md:p-10 text-center hover:bg-white/[0.04] transition-colors group"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 sm:mb-6 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <stat.icon className="w-5 h-5 sm:w-7 sm:h-7 text-purple-400 group-hover:text-purple-300 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                {stat.label}
              </h3>
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <p className="text-[var(--text-secondary)]">
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-[var(--bg-secondary)] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] to-transparent h-32" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-14 md:mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6"
            >
              Complete Candidate Analysis
            </motion.h2>
            <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto px-2 sm:px-0">
              Everything you need to evaluate candidates effectively, powered by advanced LLMs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((f, i) => (
              <Link key={f.title} href={`/features/${f.slug}`}>
                <motion.div
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="glass-card-solid p-6 sm:p-8 md:p-10 group hover:-translate-y-2 transition-transform duration-300 cursor-pointer h-full"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl ${f.bg} ${f.border} border flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}
                  >
                    <f.icon className={`w-8 h-8 ${f.color}`} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-5 text-white group-hover:text-purple-300 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-base sm:text-lg">
                    {f.description}
                  </p>
                  
                  <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[var(--border)] flex items-center text-sm font-medium text-[var(--text-muted)] group-hover:text-white transition-colors">
                    <span className="mr-2">Learn more</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center glass-card p-8 sm:p-12 md:p-16 lg:p-20 relative overflow-hidden border-t border-white/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5" />
          
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
              Ready to streamline recruiting?
            </h2>
            <p className="text-[var(--text-secondary)] mb-6 sm:mb-10 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
              Join thousands of recruiters using AI to save hours every single day.
            </p>
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 sm:gap-3 px-8 py-4 sm:px-12 sm:py-5 bg-white text-black rounded-full text-base sm:text-lg font-bold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
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
            © 2026 TalentFlow AI. Built with ❤️ for WeAssist.io
          </p>
          <div className="flex gap-6 text-[var(--text-muted)]">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
