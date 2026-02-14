"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  Upload,
  Brain,
  Menu,
  X,
  BarChart3,
  MessageSquareText,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
  Sun,
  Moon,
  User,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/theme";

/* ── Lightweight IntersectionObserver hook (replaces framer-motion whileInView) ── */
function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in-view");
          obs.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── FadeUp component for scroll-triggered sections ── */
function FadeUp({
  children,
  className = "",
  delay = 0,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useInView();
  return (
    <div
      ref={ref}
      className={`fade-up ${className}`}
      style={{ transitionDelay: `${delay}s` }}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── ScaleIn component for CTA ── */
function ScaleIn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useInView();
  return (
    <div ref={ref} className={`scale-in ${className}`}>
      {children}
    </div>
  );
}

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

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen selection:bg-purple-500/30 overflow-x-hidden">
      
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3 sm:py-5 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center justify-between" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-lg tracking-tight">TalentFlow</span>
                <span className="text-purple-400 text-xs font-mono font-medium">AI RECRUITING</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] hover:bg-[var(--glass-hover)] transition-all"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-500" />}
              </button>
              <Link
                href="/automations"
                className="hidden md:flex items-center gap-2 px-5 py-3 bg-[var(--glass)] hover:bg-[var(--glass-hover)] border border-[var(--glass-border)] rounded-full text-sm font-medium transition-all duration-300 group"
              >
                <Zap className="w-4 h-4 text-purple-400" />
                Automations
              </Link>
              <Link
                href="/apply"
                className="hidden md:flex items-center gap-2 px-5 py-3 bg-[var(--glass)] hover:bg-[var(--glass-hover)] border border-[var(--glass-border)] rounded-full text-sm font-medium transition-all duration-300 group"
              >
                <User className="w-4 h-4 text-cyan-400" />
                Apply
              </Link>
              <Link
                href="/guide"
                className="hidden md:flex items-center gap-2 px-5 py-3 bg-[var(--glass)] hover:bg-[var(--glass-hover)] border border-[var(--glass-border)] rounded-full text-sm font-medium transition-all duration-300 group"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Guide
              </Link>
              <Link
                href="/eval"
                className="hidden lg:flex items-center gap-2 px-5 py-3 bg-[var(--glass)] hover:bg-[var(--glass-hover)] border border-[var(--glass-border)] rounded-full text-sm font-medium transition-all duration-300 group"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                AI Ethics
              </Link>
              <Link
                href="/pipeline"
                className="hidden md:flex items-center gap-2 px-7 py-3 bg-[var(--glass)] hover:bg-[var(--glass-hover)] border border-[var(--glass-border)] rounded-full text-sm font-medium transition-all duration-300 group"
              >
                Launch Pipeline 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] hover:bg-[var(--glass-hover)] transition-all"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 rounded-2xl border border-[var(--glass-border)] p-3 space-y-1 shadow-xl" style={{ background: theme === 'dark' ? '#13141f' : '#ffffff', backdropFilter: 'none' }}>
              <Link
                href="/pipeline"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--glass-hover)] transition-all"
              >
                <ArrowRight className="w-4 h-4 text-purple-400" />
                <span className="font-medium text-sm">Launch Pipeline</span>
              </Link>
              <Link
                href="/automations"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--glass-hover)] transition-all"
              >
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="font-medium text-sm">Automations</span>
              </Link>
              <Link
                href="/apply"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--glass-hover)] transition-all"
              >
                <User className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-sm">Apply</span>
              </Link>
              <Link
                href="/guide"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--glass-hover)] transition-all"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-sm">Guide</span>
              </Link>
              <Link
                href="/eval"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--glass-hover)] transition-all"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-sm">AI Ethics</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 pt-28 sm:pt-32 md:pt-40 pb-12 sm:pb-20 overflow-hidden">
        {/* Decorative elements — static gradients instead of blur-[100px] for GPU perf */}
        <div className="absolute top-1/4 -left-20 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-gradient-to-br from-purple-600/15 to-transparent rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-gradient-to-bl from-blue-600/15 to-transparent rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto w-full z-10">
          <div className="hero-fade-in text-center">
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 sm:mb-10 leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-b from-[var(--text-primary)] via-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
                Screen Smarter.
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent glow-text">
                Hire Faster.
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2 sm:px-0">
              Transform your hiring process with autonomous AI. Upload a resume and get 
              <span className="text-[var(--text-primary)] font-medium"> structured data</span>, 
              <span className="text-[var(--text-primary)] font-medium"> fit scores</span>, and 
              <span className="text-[var(--text-primary)] font-medium"> tailored questions</span> in under 30 seconds.
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
          </div>

          {/* Pipeline visualization */}
          <div className="mt-14 sm:mt-24 md:mt-32">
            <div className="hero-fade-in-delayed glass-card p-5 sm:p-8 md:p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5" />
              
              <div className="relative flex flex-wrap justify-center items-center gap-4 sm:gap-8 md:gap-14">
                {[
                  { icon: Upload, label: "Upload", color: "from-purple-500 to-purple-700", delay: 0 },
                  { icon: Brain, label: "Parse", color: "from-blue-500 to-blue-700", delay: 0.2 },
                  { icon: BarChart3, label: "Score", color: "from-cyan-500 to-cyan-700", delay: 0.4 },
                  { icon: MessageSquareText, label: "Interview", color: "from-emerald-500 to-emerald-700", delay: 0.6 },
                ].map((step, i, arr) => (
                    <div key={step.label} className="flex items-center gap-2 sm:gap-4 md:gap-8 group">
                    <div
                      className="step-pop-in relative"
                      style={{ animationDelay: `${0.6 + step.delay}s` }}
                    >
                      <div className={`w-16 h-16 sm:w-22 sm:h-22 md:w-28 md:h-28 rounded-xl sm:rounded-2xl bg-gradient-to-br ${step.color} flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 shadow-lg z-10 relative group-hover:translate-y-[-5px] transition-transform duration-300`}
                      >
                        <step.icon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white drop-shadow-md" />
                        <span className="text-[8px] sm:text-[10px] md:text-xs text-white/90 font-semibold uppercase tracking-wide">
                          {step.label}
                        </span>
                      </div>
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.color} blur-xl opacity-40 group-hover:opacity-60 transition-opacity`} />
                    </div>
                    
                    {i < arr.length - 1 && (
                      <div
                        className="line-grow hidden md:block flex-1 min-w-[60px]"
                        style={{ animationDelay: `${0.8 + step.delay}s` }}
                      >
                         <div className="h-0.5 bg-gradient-to-r from-white/20 via-white/40 to-white/20 w-full rounded-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <FadeUp
              key={stat.label}
              delay={i * 0.1}
              className="glass-card p-6 sm:p-8 md:p-10 text-center hover:bg-white/[0.04] transition-colors group"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 sm:mb-6 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <stat.icon className="w-5 h-5 sm:w-7 sm:h-7 text-purple-400 group-hover:text-purple-300 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                {stat.label}
              </h3>
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <p className="text-[var(--text-secondary)]">
                {stat.desc}
              </p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-[var(--bg-secondary)] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] to-transparent h-32" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-14 md:mb-20">
            <FadeUp className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Complete Candidate Analysis
            </FadeUp>
            <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto px-2 sm:px-0">
              Everything you need to evaluate candidates effectively, powered by advanced LLMs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((f, i) => (
              <Link key={f.title} href={`/features/${f.slug}`}>
                <FadeUp
                  delay={i * 0.1}
                  className="glass-card-solid p-6 sm:p-8 md:p-10 group hover:-translate-y-2 transition-transform duration-300 cursor-pointer h-full"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl ${f.bg} ${f.border} border flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}
                  >
                    <f.icon className={`w-8 h-8 ${f.color}`} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-5 text-[var(--text-primary)] group-hover:text-purple-400 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-base sm:text-lg">
                    {f.description}
                  </p>
                  
                  <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[var(--border)] flex items-center text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                    <span className="mr-2">Learn more</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </FadeUp>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* n8n Automation Section */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-14 md:mb-20">
            <FadeUp className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs sm:text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              <span>Powered by n8n Orchestration</span>
            </FadeUp>
            <FadeUp delay={0.1} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Modular Workflow Automation
            </FadeUp>
            <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
              5 independent n8n workflows orchestrate the entire pipeline. Enable, disable, or extend any module without touching code.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Zap, label: "Candidate Intake", desc: "Auto-routes by score, builds Slack/email alerts", color: "text-purple-400", bg: "bg-purple-500/10" },
              { icon: Upload, label: "Smart Outreach", desc: "Personalized emails + Kokoro voice scripts", color: "text-blue-400", bg: "bg-blue-500/10" },
              { icon: BarChart3, label: "Data Sync", desc: "NocoDB/CRM-ready flat records, auto-pushed", color: "text-cyan-400", bg: "bg-cyan-500/10" },
              { icon: Shield, label: "Health Monitor", desc: "Cron checks every 5 min, alerts on AI failures", color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { icon: Brain, label: "Pipeline Reports", desc: "Weekly analytics: top skills, gaps, rates", color: "text-amber-400", bg: "bg-amber-500/10" },
              { icon: CheckCircle2, label: "Modular Design", desc: "Toggle any workflow on/off. Zero code changes.", color: "text-pink-400", bg: "bg-pink-500/10" },
            ].map((item, i) => (
              <FadeUp
                key={item.label}
                delay={i * 0.1}
                className="glass-card p-6 sm:p-8 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.label}</h3>
                <p className="text-[var(--text-secondary)] text-sm">{item.desc}</p>
              </FadeUp>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/automations"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full text-base font-semibold text-white shadow-xl shadow-purple-600/20 hover:shadow-purple-600/40 hover:scale-105 transition-all duration-300"
            >
              <Zap className="w-5 h-5" />
              View Automations Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none" />
        
        <ScaleIn className="max-w-4xl mx-auto text-center glass-card p-8 sm:p-12 md:p-16 lg:p-20 relative overflow-hidden border-t border-white/10">
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
        </ScaleIn>
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
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-[var(--text-muted)]">
            <Link href="/automations" className="hover:text-[var(--text-primary)] transition-colors">Automations</Link>
            <Link href="/pipeline" className="hover:text-[var(--text-primary)] transition-colors">Pipeline</Link>
            <Link href="/guide" className="hover:text-[var(--text-primary)] transition-colors">Guide</Link>
            <Link href="/eval" className="hover:text-[var(--text-primary)] transition-colors">AI Ethics</Link>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
