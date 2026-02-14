"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import {
  Upload,
  User,
  Mail,
  Phone,
  Briefcase,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Send,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

const OPEN_POSITIONS = [
  { id: "ai-engineer", title: "AI Engineer", team: "Engineering", location: "Remote" },
  { id: "fullstack-dev", title: "Full-Stack Developer", team: "Engineering", location: "Remote" },
  { id: "product-manager", title: "Product Manager", team: "Product", location: "Remote" },
  { id: "data-analyst", title: "Data Analyst", team: "Data", location: "Remote" },
];

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function ApplyPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [resultMessage, setResultMessage] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [showPositions, setShowPositions] = useState(false);
  const { theme } = useTheme();

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !position || !file) {
      setSubmitState("error");
      setResultMessage("Please fill in all required fields and upload your resume.");
      return;
    }

    setSubmitState("submitting");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("position", position);
      formData.append("coverNote", coverNote.trim());
      formData.append("resume", file);

      const res = await fetch("/api/apply", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setSubmitState("success");
      setResultMessage(data.message);
      setApplicationId(data.applicationId || "");
    } catch (err: unknown) {
      setSubmitState("error");
      setResultMessage(err instanceof Error ? err.message : "Submission failed. Please try again.");
    }
  }

  const selectedPosition = OPEN_POSITIONS.find((p) => p.title === position);

  if (submitState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="gradient-bg opacity-50" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card-solid p-8 sm:p-12 max-w-md w-full text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-3">Application Received!</h2>
          <p className="text-[var(--text-secondary)] mb-4">{resultMessage}</p>
          {applicationId && (
            <div className="text-xs text-[var(--text-muted)] bg-white/5 rounded-lg px-3 py-2 mb-6 font-mono">
              Reference: {applicationId}
            </div>
          )}
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Our AI pipeline will analyze your profile and a recruiter will reach out if there is a match. Hang tight!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10 selection:bg-purple-500/30 overflow-x-hidden">
      <div className="gradient-bg opacity-50" />

      {/* Nav */}
      <div className="fixed top-3 sm:top-4 left-3 sm:left-5 z-50">
        <Link
          href="/"
          className="glass-chip flex items-center gap-2 px-3 py-2 rounded-xl transition-all group hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-sm hidden sm:inline">TalentFlow</span>
        </Link>
      </div>

      {/* Main Form */}
      <div className="max-w-2xl mx-auto pt-20 sm:pt-24 px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4 bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-3 h-3" /> AI-Powered Screening
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Apply to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              WeAssist
            </span>
          </h1>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto text-sm sm:text-base">
            Submit your resume and our AI pipeline will match you to the best-fit role.
            You will hear back from a real recruiter, not a bot.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="glass-card-solid p-6 sm:p-8 space-y-6"
        >
          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mark Kenneth Badilla"
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--glass-border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mark@example.com"
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--glass-border)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--glass-border)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Position Selector */}
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Position <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPositions(!showPositions)}
                className="w-full px-3 py-2.5 rounded-lg text-sm text-left flex items-center justify-between transition-colors"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--glass-border)", color: position ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                {selectedPosition ? (
                  <span>{selectedPosition.title} <span className="text-[var(--text-muted)]">- {selectedPosition.team}</span></span>
                ) : (
                  "Select a position..."
                )}
                <ChevronDown className={cn("w-4 h-4 transition-transform", showPositions && "rotate-180")} />
              </button>
              <AnimatePresence>
                {showPositions && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full mt-1 left-0 right-0 z-20 glass-card-solid p-1.5 shadow-xl"
                  >
                    {OPEN_POSITIONS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setPosition(p.title); setShowPositions(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg text-sm flex justify-between items-center transition-colors",
                          position === p.title
                            ? "bg-purple-500/20 text-purple-300"
                            : "hover:bg-white/5 text-[var(--text-secondary)]"
                        )}
                      >
                        <span>{p.title}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{p.team} - {p.location}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Resume Upload */}
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Resume <span className="text-red-400">*</span>
            </label>
            <div
              {...getRootProps()}
              className={cn(
                "rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all",
                isDragActive
                  ? "border-purple-500 bg-purple-500/5"
                  : file
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-[var(--glass-border)] hover:border-purple-500/30"
              )}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    {isDragActive ? "Drop your resume here!" : "Drag & drop your resume, or click to browse"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">PDF or TXT, max 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Cover Note */}
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Quick Note (optional)
            </label>
            <textarea
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="Anything you'd like us to know? A sentence or two is fine."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors resize-none"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--glass-border)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {submitState === "error" && resultMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {resultMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitState === "submitting"}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
              submitState === "submitting"
                ? "bg-purple-600/50 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-purple-500/25"
            )}
          >
            {submitState === "submitting" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Application
              </>
            )}
          </button>

          <p className="text-[10px] text-[var(--text-muted)] text-center">
            By submitting, you agree that your resume will be analyzed by our AI screening pipeline.
            A human recruiter makes all final decisions.
          </p>
        </motion.form>

        {/* Footer link to pipeline for recruiters */}
        <div className="text-center mt-8">
          <Link
            href="/pipeline"
            className="text-xs text-[var(--text-muted)] hover:text-purple-400 transition-colors"
          >
            Recruiter? Go to the Pipeline Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
