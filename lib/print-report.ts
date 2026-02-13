import type { ParsedResume, ScoringResult, ScreeningQuestion } from "./types";

/**
 * Opens a beautifully designed, print-optimized HTML report in a new window.
 * Designed to fit on letter-size paper (8.5" x 11") with proper margins.
 * Uses Inter font from Google Fonts for a clean, modern look.
 */
export function openPrintReport({
  parsedResume,
  scoring,
  questions,
  jobDescription,
  model,
}: {
  parsedResume: ParsedResume;
  scoring: ScoringResult | null;
  questions: ScreeningQuestion[];
  jobDescription: string;
  model: string;
}) {
  const scoreColor =
    scoring && scoring.overallScore >= 80
      ? "#059669"
      : scoring && scoring.overallScore >= 60
        ? "#d97706"
        : "#dc2626";

  const scoreLabel =
    scoring?.recommendation === "strong_match"
      ? "Strongly Recommended"
      : scoring?.recommendation === "potential_match"
        ? "Potential Match"
        : "Not Recommended";

  const scoreBadgeBg =
    scoring?.recommendation === "strong_match"
      ? "#ecfdf5"
      : scoring?.recommendation === "potential_match"
        ? "#fffbeb"
        : "#fef2f2";

  const scoreBadgeBorder =
    scoring?.recommendation === "strong_match"
      ? "#a7f3d0"
      : scoring?.recommendation === "potential_match"
        ? "#fde68a"
        : "#fecaca";

  const diffColor = (d: string) =>
    d === "easy" ? "#059669" : d === "medium" ? "#d97706" : "#dc2626";

  const diffBg = (d: string) =>
    d === "easy" ? "#ecfdf5" : d === "medium" ? "#fffbeb" : "#fef2f2";

  const barColor = (score: number) =>
    score >= 8 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";

  const contactParts: string[] = [];
  if (parsedResume.email) contactParts.push(`✉ ${parsedResume.email}`);
  if (parsedResume.phone) contactParts.push(`☎ ${parsedResume.phone}`);
  if (parsedResume.location) contactParts.push(`⌖ ${parsedResume.location}`);

  const breakdownHTML = scoring
    ? scoring.breakdown
        .map(
          (item) => `
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span class="breakdown-category">${esc(item.category)}</span>
            <span class="breakdown-score" style="color: ${barColor(item.score)}">${item.score}/${item.maxScore}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(item.score / item.maxScore) * 100}%; background: ${barColor(item.score)}"></div>
          </div>
          <p class="breakdown-reason">${esc(truncate(item.reasoning, 120))}</p>
        </div>
      `
        )
        .join("")
    : "";

  const strengthsHTML = scoring
    ? scoring.strengths
        .slice(0, 4)
        .map((s) => `<li>${esc(truncate(s, 80))}</li>`)
        .join("")
    : "";

  const gapsHTML = scoring
    ? scoring.gaps
        .slice(0, 4)
        .map((g) => `<li>${esc(truncate(g, 80))}</li>`)
        .join("")
    : "";

  const questionsHTML = questions
    .map(
      (q, i) => `
      <div class="question-item">
        <div class="question-header">
          <span class="question-number">Q${i + 1}</span>
          <span class="difficulty-badge" style="color: ${diffColor(q.difficulty)}; background: ${diffBg(q.difficulty)}">${q.difficulty.toUpperCase()}</span>
        </div>
        <p class="question-text">${esc(q.question)}</p>
        <div class="question-meta">
          <span><strong style="color: #7c3aed">Purpose:</strong> ${esc(truncate(q.purpose, 100))}</span>
          <span><strong style="color: #059669">Look for:</strong> ${esc(truncate(q.lookFor, 100))}</span>
        </div>
      </div>
    `
    )
    .join("");

  const skillsHTML = parsedResume.skills
    .slice(0, 12)
    .map((s) => `<span class="skill-tag">${esc(s)}</span>`)
    .join("");

  const experienceHTML = parsedResume.experience
    .slice(0, 3)
    .map(
      (exp) => `
      <div class="exp-item">
        <div class="exp-header">
          <strong>${esc(exp.title)}</strong>
          <span class="exp-meta">${esc(exp.company)} · ${esc(exp.duration)}</span>
        </div>
        ${exp.highlights.length > 0 ? `<ul class="exp-highlights">${exp.highlights.slice(0, 3).map((h) => `<li>${esc(truncate(h, 90))}</li>`).join("")}</ul>` : ""}
      </div>
    `
    )
    .join("");

  const educationHTML = parsedResume.education
    .slice(0, 2)
    .map(
      (edu) => `
      <div class="edu-item">
        <strong>${esc(edu.degree)}</strong>
        <span class="edu-meta">${esc(edu.institution)} · ${esc(edu.year)}</span>
      </div>
    `
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TalentFlow Report — ${esc(parsedResume.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: letter;
      margin: 0.4in 0.5in;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 9px;
      line-height: 1.45;
      color: #1e293b;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 7.5in;
      max-width: 7.5in;
      margin: 0 auto;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 10px;
      border-bottom: 2px solid #7c3aed;
      margin-bottom: 10px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 3px;
    }

    .brand-icon {
      width: 22px;
      height: 22px;
      background: linear-gradient(135deg, #7c3aed, #3b82f6);
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 9px;
      letter-spacing: -0.5px;
    }

    .brand-text {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.3px;
    }

    .report-meta {
      font-size: 7.5px;
      color: #94a3b8;
      margin-top: 2px;
    }

    .score-circle {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 3px solid ${scoreColor};
      background: white;
    }

    .score-number {
      font-size: 18px;
      font-weight: 700;
      color: ${scoreColor};
      line-height: 1;
    }

    .score-label-sm {
      font-size: 6px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Candidate Info ── */
    .candidate-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .candidate-name {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.3px;
      margin-bottom: 3px;
    }

    .contact-row {
      display: flex;
      gap: 14px;
      font-size: 7.5px;
      color: #64748b;
      flex-wrap: wrap;
    }

    .recommendation-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 10px;
      font-size: 8px;
      font-weight: 600;
      color: ${scoreColor};
      background: ${scoreBadgeBg};
      border: 1px solid ${scoreBadgeBorder};
      white-space: nowrap;
    }

    /* ── Summary ── */
    .summary-text {
      font-size: 8.5px;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 8px;
    }

    /* ── Skills ── */
    .skills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 10px;
    }

    .skill-tag {
      display: inline-block;
      padding: 2px 7px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 7px;
      color: #475569;
      font-weight: 500;
    }

    /* ── Section Headers ── */
    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
    }

    .section-header h2 {
      font-size: 10px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .section-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    /* ── Two Column Layout ── */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 10px;
    }

    .three-col {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }

    /* ── Score Breakdown ── */
    .breakdown-item {
      margin-bottom: 6px;
    }

    .breakdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }

    .breakdown-category {
      font-size: 8px;
      font-weight: 600;
      color: #334155;
    }

    .breakdown-score {
      font-size: 8.5px;
      font-weight: 700;
      font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: #f1f5f9;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 2px;
    }

    .progress-fill {
      height: 100%;
      border-radius: 2px;
      transition: none;
    }

    .breakdown-reason {
      font-size: 7px;
      color: #94a3b8;
      line-height: 1.4;
    }

    /* ── Strengths & Gaps ── */
    .sg-column h3 {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 4px;
    }

    .sg-column ul {
      list-style: none;
      padding: 0;
    }

    .sg-column ul li {
      font-size: 7.5px;
      color: #475569;
      padding: 2px 0;
      padding-left: 10px;
      position: relative;
      line-height: 1.4;
    }

    .sg-column ul li::before {
      position: absolute;
      left: 0;
      font-weight: 700;
    }

    .strengths-list li::before {
      content: "✓";
      color: #059669;
    }

    .gaps-list li::before {
      content: "△";
      color: #d97706;
    }

    /* ── Experience ── */
    .exp-item {
      margin-bottom: 5px;
      padding-left: 8px;
      border-left: 2px solid #e2e8f0;
    }

    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 8.5px;
      color: #0f172a;
    }

    .exp-meta {
      font-size: 7px;
      color: #94a3b8;
      font-weight: 400;
    }

    .exp-highlights {
      list-style: none;
      padding: 0;
      margin-top: 2px;
    }

    .exp-highlights li {
      font-size: 7px;
      color: #64748b;
      padding-left: 10px;
      position: relative;
      line-height: 1.5;
    }

    .exp-highlights li::before {
      content: "•";
      position: absolute;
      left: 2px;
      color: #94a3b8;
    }

    /* ── Education ── */
    .edu-item {
      font-size: 8.5px;
      color: #0f172a;
      margin-bottom: 3px;
    }

    .edu-meta {
      font-size: 7px;
      color: #94a3b8;
      margin-left: 6px;
      font-weight: 400;
    }

    /* ── Questions ── */
    .question-item {
      margin-bottom: 8px;
      padding: 6px 8px;
      background: #fafbfc;
      border: 1px solid #f1f5f9;
      border-radius: 5px;
      page-break-inside: avoid;
    }

    .question-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 3px;
    }

    .question-number {
      font-size: 7px;
      font-weight: 700;
      color: #94a3b8;
      font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
    }

    .difficulty-badge {
      font-size: 6.5px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      letter-spacing: 0.5px;
    }

    .question-text {
      font-size: 8.5px;
      font-weight: 500;
      color: #1e293b;
      line-height: 1.45;
      margin-bottom: 3px;
    }

    .question-meta {
      display: flex;
      flex-direction: column;
      gap: 1px;
      font-size: 7px;
      color: #64748b;
      line-height: 1.4;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 7px;
      color: #94a3b8;
    }

    /* ── Page Break ── */
    .page-break {
      page-break-before: always;
      break-before: page;
    }

    /* ── Divider ── */
    .divider {
      border: none;
      border-top: 1px solid #f1f5f9;
      margin: 8px 0;
    }

    /* ── Print Button (hidden on print) ── */
    .print-actions {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 8px;
      z-index: 100;
    }

    .print-btn {
      padding: 10px 24px;
      background: linear-gradient(135deg, #7c3aed, #3b82f6);
      color: white;
      border: none;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
    }

    .print-btn:hover { opacity: 0.9; }

    .close-btn {
      padding: 10px 18px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }

    @media print {
      .print-actions { display: none !important; }
      body { background: white; }
    }

    /* ── Screen Preview Wrapper ── */
    @media screen {
      body {
        background: #f8fafc;
        padding: 20px;
      }
      .page {
        background: white;
        padding: 0.4in 0.5in;
        box-shadow: 0 2px 20px rgba(0,0,0,0.08);
        border-radius: 4px;
        margin-bottom: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand">
          <div class="brand-icon">TF</div>
          <span class="brand-text">TalentFlow AI</span>
        </div>
        <div class="report-meta">Candidate Screening Report · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Model: ${esc(model)}</div>
      </div>
      ${scoring ? `
        <div class="score-circle">
          <span class="score-number">${scoring.overallScore}</span>
          <span class="score-label-sm">Score</span>
        </div>
      ` : ""}
    </div>

    <!-- Candidate Info -->
    <div class="candidate-section">
      <div>
        <div class="candidate-name">${esc(parsedResume.name || "Unknown Candidate")}</div>
        <div class="contact-row">${contactParts.map((c) => `<span>${esc(c)}</span>`).join("")}</div>
      </div>
      ${scoring ? `<div class="recommendation-badge">${esc(scoreLabel)}</div>` : ""}
    </div>

    ${parsedResume.summary ? `<p class="summary-text">${esc(truncate(parsedResume.summary, 280))}</p>` : ""}

    ${parsedResume.skills.length > 0 ? `<div class="skills-row">${skillsHTML}</div>` : ""}

    <hr class="divider">

    ${scoring ? `
      <!-- Score Breakdown -->
      <div class="section-header">
        <div class="section-dot" style="background: #7c3aed"></div>
        <h2>Score Breakdown</h2>
      </div>
      <div class="two-col">
        <div>${scoring.breakdown.slice(0, Math.ceil(scoring.breakdown.length / 2)).map((item) => `
          <div class="breakdown-item">
            <div class="breakdown-header">
              <span class="breakdown-category">${esc(item.category)}</span>
              <span class="breakdown-score" style="color: ${barColor(item.score)}">${item.score}/${item.maxScore}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(item.score / item.maxScore) * 100}%; background: ${barColor(item.score)}"></div>
            </div>
            <p class="breakdown-reason">${esc(truncate(item.reasoning, 120))}</p>
          </div>
        `).join("")}</div>
        <div>${scoring.breakdown.slice(Math.ceil(scoring.breakdown.length / 2)).map((item) => `
          <div class="breakdown-item">
            <div class="breakdown-header">
              <span class="breakdown-category">${esc(item.category)}</span>
              <span class="breakdown-score" style="color: ${barColor(item.score)}">${item.score}/${item.maxScore}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(item.score / item.maxScore) * 100}%; background: ${barColor(item.score)}"></div>
            </div>
            <p class="breakdown-reason">${esc(truncate(item.reasoning, 120))}</p>
          </div>
        `).join("")}</div>
      </div>

      <!-- Strengths & Gaps -->
      <div class="two-col" style="margin-bottom: 6px;">
        <div class="sg-column">
          <h3 style="color: #059669">✓ Strengths</h3>
          <ul class="strengths-list">${strengthsHTML}</ul>
        </div>
        <div class="sg-column">
          <h3 style="color: #d97706">△ Areas to Explore</h3>
          <ul class="gaps-list">${gapsHTML}</ul>
        </div>
      </div>

      <hr class="divider">
    ` : ""}

    <!-- Experience & Education side by side -->
    ${parsedResume.experience.length > 0 || parsedResume.education.length > 0 ? `
      <div class="two-col">
        ${parsedResume.experience.length > 0 ? `
          <div>
            <div class="section-header">
              <div class="section-dot" style="background: #3b82f6"></div>
              <h2>Experience</h2>
            </div>
            ${experienceHTML}
          </div>
        ` : "<div></div>"}
        <div>
          ${parsedResume.education.length > 0 ? `
            <div class="section-header">
              <div class="section-dot" style="background: #06b6d4"></div>
              <h2>Education</h2>
            </div>
            ${educationHTML}
          ` : ""}
          ${parsedResume.certifications && parsedResume.certifications.length > 0 ? `
            <div class="section-header" style="margin-top: 6px;">
              <div class="section-dot" style="background: #f59e0b"></div>
              <h2>Certifications</h2>
            </div>
            <div style="font-size: 7.5px; color: #475569;">${parsedResume.certifications.slice(0, 4).map((c) => `<div style="padding: 1.5px 0;">• ${esc(c)}</div>`).join("")}</div>
          ` : ""}
        </div>
      </div>
      <hr class="divider">
    ` : ""}

    <!-- Interview Questions -->
    ${questions.length > 0 ? `
      <div class="section-header">
        <div class="section-dot" style="background: #10b981"></div>
        <h2>Interview Questions</h2>
      </div>
      ${questionsHTML}
    ` : ""}

    <!-- Footer -->
    <div class="footer">
      <span>Generated by TalentFlow AI · talentflow-ai.elunari.uk</span>
      <span>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
    </div>
  </div>

  <!-- Print/Close Actions (hidden on print) -->
  <div class="print-actions">
    <button class="close-btn" onclick="window.close()">Close</button>
    <button class="print-btn" onclick="window.print()">⎙ Print / Save PDF</button>
  </div>

  <script>
    // Auto-trigger print after fonts load
    document.fonts.ready.then(() => {
      // Small delay to ensure rendering
      setTimeout(() => {}, 300);
    });
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

// ─── Helpers ───

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + "…";
}
