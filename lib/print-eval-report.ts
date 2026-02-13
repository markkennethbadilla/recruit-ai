import type { EvalReport, EvalCategory, EvalResult } from "./ai-eval";

/**
 * Opens a beautifully designed, print-optimized HTML report for AI Ethics Evaluation.
 * Designed for letter-size paper (8.5" x 11") with proper margins.
 * Uses Inter font from Google Fonts.
 */
export function openEvalPrintReport(report: EvalReport) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const grade = report.overallScore >= 90 ? "A+" : report.overallScore >= 80 ? "A" : report.overallScore >= 70 ? "B" : report.overallScore >= 60 ? "C" : report.overallScore >= 50 ? "D" : "F";
  const gradeColor = report.overallScore >= 80 ? "#059669" : report.overallScore >= 60 ? "#d97706" : "#dc2626";
  const passRate = Math.round((report.passed / report.totalTests) * 100);

  const categoryMeta: Record<EvalCategory, { label: string; icon: string; color: string }> = {
    fairness:      { label: "Fairness",      icon: "⚖", color: "#3b82f6" },
    safety:        { label: "Safety",        icon: "🛡", color: "#ef4444" },
    quality:       { label: "Quality",       icon: "📊", color: "#a855f7" },
    performance:   { label: "Performance",   icon: "⚡", color: "#06b6d4" },
    transparency:  { label: "Transparency",  icon: "👁", color: "#f59e0b" },
    inclusivity:   { label: "Inclusivity",   icon: "🤝", color: "#10b981" },
  };

  const categoryCards = (Object.entries(report.categoryScores) as [EvalCategory, { score: number; passed: number; total: number }][])
    .filter(([, data]) => data.total > 0)
    .map(([cat, data]) => {
      const meta = categoryMeta[cat];
      const scoreColor = data.score >= 80 ? "#059669" : data.score >= 60 ? "#d97706" : "#dc2626";
      return `
        <div class="category-card" style="border-left: 4px solid ${meta.color}">
          <div class="category-header">
            <span class="category-icon">${meta.icon}</span>
            <span class="category-label">${meta.label}</span>
            <span class="category-score" style="color: ${scoreColor}">${data.score}/100</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${data.score}%; background: ${scoreColor}"></div>
          </div>
          <div class="category-stats">${data.passed}/${data.total} tests passed</div>
        </div>`;
    })
    .join("");

  const testGroup = (category: EvalCategory, results: EvalResult[]) => {
    const meta = categoryMeta[category];
    const rows = results
      .map(r => {
        const statusIcon = r.passed ? "✓" : "✗";
        const statusColor = r.passed ? "#059669" : "#dc2626";
        const scoreColor = r.score >= 80 ? "#059669" : r.score >= 60 ? "#d97706" : "#dc2626";
        return `
          <tr>
            <td style="color: ${statusColor}; font-weight: 700; text-align: center; width: 30px">${statusIcon}</td>
            <td>
              <div class="test-name">${esc(r.testName)}</div>
              <div class="test-details">${esc(r.details)}</div>
            </td>
            <td class="test-score" style="color: ${scoreColor}">${r.score}</td>
          </tr>`;
      })
      .join("");

    return `
      <div class="test-group">
        <h3 style="color: ${meta.color}">
          <span class="test-group-icon">${meta.icon}</span> ${meta.label}
        </h3>
        <table class="test-table">
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  };

  // Group results by category
  const grouped = new Map<EvalCategory, EvalResult[]>();
  for (const r of report.results) {
    if (!grouped.has(r.category)) grouped.set(r.category, []);
    grouped.get(r.category)!.push(r);
  }

  const testGroupsHTML = Array.from(grouped.entries())
    .map(([cat, results]) => testGroup(cat, results))
    .join("");

  const recommendationsHTML = report.recommendations
    .map(r => `<li>${esc(r)}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>TalentFlow AI Ethics Report — ${new Date(report.timestamp).toLocaleDateString()}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    color: #1a1a2e;
    background: #fff;
    font-size: 11px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @page { margin: 0.6in 0.5in; size: letter; }
  @media print {
    body { font-size: 10px; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 16px;
    border-bottom: 2px solid #e5e5e5;
    margin-bottom: 20px;
  }
  .header-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .header-logo {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 16px; font-weight: 800;
  }
  .header-title { font-size: 18px; font-weight: 800; }
  .header-subtitle { font-size: 10px; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; }
  .header-meta { text-align: right; font-size: 10px; color: #6b7280; }

  /* Overall Score */
  .score-banner {
    display: flex;
    align-items: center;
    gap: 24px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 20px;
  }
  .score-circle {
    width: 90px; height: 90px;
    border-radius: 50%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    border: 4px solid;
    flex-shrink: 0;
  }
  .score-number { font-size: 28px; font-weight: 800; }
  .score-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }
  .score-grade { font-size: 24px; font-weight: 800; }
  .score-stats { display: flex; gap: 16px; flex-wrap: wrap; }
  .stat-box {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 16px;
    text-align: center;
    min-width: 80px;
  }
  .stat-value { font-size: 18px; font-weight: 700; }
  .stat-label { font-size: 9px; color: #6b7280; text-transform: uppercase; }

  /* Category Cards */
  .categories { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .category-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    background: #fafafa;
  }
  .category-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
  .category-icon { font-size: 14px; }
  .category-label { font-weight: 600; font-size: 11px; flex: 1; }
  .category-score { font-weight: 700; font-size: 12px; }
  .category-stats { font-size: 9px; color: #6b7280; margin-top: 4px; }

  /* Progress Bar */
  .progress-bar {
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
  }
  .progress-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }

  /* Test Results Table */
  .test-group { margin-bottom: 16px; }
  .test-group h3 { font-size: 13px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .test-group-icon { font-size: 14px; }
  .test-table { width: 100%; border-collapse: collapse; }
  .test-table td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .test-name { font-weight: 600; font-size: 10px; }
  .test-details { font-size: 9px; color: #6b7280; margin-top: 2px; }
  .test-score { font-weight: 700; font-size: 11px; text-align: right; white-space: nowrap; width: 40px; }

  /* Recommendations */
  .recommendations {
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
  }
  .recommendations h3 { font-size: 12px; font-weight: 700; margin-bottom: 8px; color: #92400e; }
  .recommendations ul { padding-left: 18px; }
  .recommendations li { font-size: 10px; color: #78350f; margin-bottom: 4px; }

  /* Footer */
  .footer {
    border-top: 1px solid #e5e5e5;
    padding-top: 10px;
    margin-top: 20px;
    text-align: center;
    font-size: 9px;
    color: #9ca3af;
  }

  /* Print button */
  .print-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #059669, #06b6d4);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(5,150,105,0.3);
    z-index: 100;
  }
  .print-btn:hover { opacity: 0.9; }
</style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save PDF</button>

  <!-- Header -->
  <div class="header">
    <div class="header-brand">
      <div class="header-logo">TF</div>
      <div>
        <div class="header-title">AI Ethics Evaluation Report</div>
        <div class="header-subtitle">TalentFlow AI — Transparent Ethical Assessment</div>
      </div>
    </div>
    <div class="header-meta">
      <div>${new Date(report.timestamp).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
      <div>${new Date(report.timestamp).toLocaleTimeString()}</div>
      <div>Duration: ${(report.duration / 1000).toFixed(1)}s</div>
    </div>
  </div>

  <!-- Overall Score -->
  <div class="score-banner">
    <div class="score-circle" style="border-color: ${gradeColor}">
      <div class="score-number" style="color: ${gradeColor}">${report.overallScore}</div>
      <div class="score-label">Score</div>
    </div>
    <div>
      <div class="score-grade" style="color: ${gradeColor}">Grade: ${grade}</div>
      <div class="score-stats">
        <div class="stat-box">
          <div class="stat-value" style="color: #059669">${report.passed}</div>
          <div class="stat-label">Passed</div>
        </div>
        <div class="stat-box">
          <div class="stat-value" style="color: #dc2626">${report.failed}</div>
          <div class="stat-label">Failed</div>
        </div>
        <div class="stat-box">
          <div class="stat-value" style="color: #3b82f6">${report.totalTests}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-box">
          <div class="stat-value" style="color: #f59e0b">${passRate}%</div>
          <div class="stat-label">Pass Rate</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Categories -->
  <div class="categories">${categoryCards}</div>

  ${report.recommendations.length > 0 ? `
  <!-- Recommendations -->
  <div class="recommendations">
    <h3>Recommendations for Improvement</h3>
    <ul>${recommendationsHTML}</ul>
  </div>` : ""}

  <!-- Detailed Results -->
  <div class="page-break"></div>
  ${testGroupsHTML}

  <!-- Footer -->
  <div class="footer">
    TalentFlow AI Ethics Report — Generated automatically by the AI Evaluation Suite<br/>
    Inspired by OpenAI Evals, MLCommons AI Safety, and IBM AI Fairness 360
  </div>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
