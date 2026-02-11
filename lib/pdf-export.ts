import { jsPDF } from "jspdf";
import type { ParsedResume, ScoringResult, ScreeningQuestion } from "./types";

export function exportPDFReport({
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
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const colors = {
    purple: [139, 92, 246] as [number, number, number],
    blue: [59, 130, 246] as [number, number, number],
    green: [16, 185, 129] as [number, number, number],
    amber: [245, 158, 11] as [number, number, number],
    red: [239, 68, 68] as [number, number, number],
    dark: [15, 16, 22] as [number, number, number],
    muted: [120, 130, 150] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  };

  function checkPageBreak(needed: number) {
    if (y + needed > 270) {
      doc.addPage();
      y = 20;
    }
  }

  function drawLine() {
    doc.setDrawColor(...colors.muted);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  }

  // ── Header ──
  doc.setFillColor(19, 20, 31);
  doc.rect(0, 0, pageWidth, 45, "F");
  doc.setFillColor(...colors.purple);
  doc.roundedRect(margin, 10, 8, 8, 2, 2, "F");
  doc.setTextColor(...colors.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TalentFlow AI", margin + 12, 17);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.muted);
  doc.text("Candidate Assessment Report", margin + 12, 22);
  doc.setFontSize(7);
  doc.text(`Generated ${new Date().toLocaleDateString()} • Model: ${model}`, margin + 12, 27);
  y = 55;

  // ── Candidate Info ──
  doc.setTextColor(30, 30, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(parsedResume.name || "Unknown Candidate", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.muted);
  const contactParts: string[] = [];
  if (parsedResume.email) contactParts.push(parsedResume.email);
  if (parsedResume.phone) contactParts.push(parsedResume.phone);
  if (parsedResume.location) contactParts.push(parsedResume.location);
  if (contactParts.length) {
    doc.text(contactParts.join("  |  "), margin, y);
    y += 8;
  }

  // Summary
  if (parsedResume.summary) {
    doc.setTextColor(60, 60, 70);
    doc.setFontSize(9);
    const summaryLines = doc.splitTextToSize(parsedResume.summary, contentWidth);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 4.5 + 4;
  }

  drawLine();

  // ── Skills ──
  if (parsedResume.skills.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 40);
    doc.text("SKILLS", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 90);
    const skillText = parsedResume.skills.join("  •  ");
    const skillLines = doc.splitTextToSize(skillText, contentWidth);
    doc.text(skillLines, margin, y);
    y += skillLines.length * 4 + 6;
    drawLine();
  }

  // ── Score ──
  if (scoring) {
    checkPageBreak(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 40);
    doc.text("SCORING RESULTS", margin, y);
    y += 8;

    // Overall score
    const scoreColor =
      scoring.overallScore >= 80 ? colors.green : scoring.overallScore >= 60 ? colors.amber : colors.red;
    doc.setFillColor(...scoreColor);
    doc.roundedRect(margin, y - 2, 20, 12, 3, 3, "F");
    doc.setTextColor(...colors.white);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${scoring.overallScore}`, margin + 10, y + 6, { align: "center" });

    doc.setTextColor(30, 30, 40);
    doc.setFontSize(10);
    doc.text(`/ 100 — ${scoring.recommendation === "strong_match" ? "Strongly Recommended" : scoring.recommendation === "potential_match" ? "Potential Match" : "Not Recommended"}`, margin + 24, y + 6);
    y += 16;

    // Summary
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 90);
    const sumLines = doc.splitTextToSize(scoring.summary, contentWidth);
    doc.text(sumLines, margin, y);
    y += sumLines.length * 4 + 6;

    // Breakdown
    for (const item of scoring.breakdown) {
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 60);
      doc.text(item.category, margin + 2, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${item.score}/${item.maxScore}`, pageWidth - margin, y, { align: "right" });

      y += 4;
      // Progress bar
      const barWidth = contentWidth - 4;
      doc.setFillColor(230, 230, 235);
      doc.roundedRect(margin + 2, y, barWidth, 3, 1, 1, "F");
      const fillColor =
        item.score >= 8 ? colors.green : item.score >= 5 ? colors.amber : colors.red;
      doc.setFillColor(...fillColor);
      doc.roundedRect(margin + 2, y, barWidth * (item.score / item.maxScore), 3, 1, 1, "F");
      y += 5;

      doc.setFontSize(7);
      doc.setTextColor(...colors.muted);
      const reasonLines = doc.splitTextToSize(item.reasoning, contentWidth - 4);
      doc.text(reasonLines, margin + 2, y);
      y += reasonLines.length * 3.5 + 4;
    }

    // Strengths & Gaps
    checkPageBreak(30);
    drawLine();

    const colWidth = (contentWidth - 10) / 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colors.green);
    doc.text("STRENGTHS", margin, y);
    doc.setTextColor(...colors.amber);
    doc.text("GAPS", margin + colWidth + 10, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const maxItems = Math.max(scoring.strengths.length, scoring.gaps.length);
    for (let i = 0; i < maxItems; i++) {
      checkPageBreak(10);
      if (scoring.strengths[i]) {
        doc.setTextColor(60, 60, 70);
        const sLines = doc.splitTextToSize(`✓  ${scoring.strengths[i]}`, colWidth);
        doc.text(sLines, margin, y);
      }
      if (scoring.gaps[i]) {
        doc.setTextColor(80, 80, 90);
        const gLines = doc.splitTextToSize(`△  ${scoring.gaps[i]}`, colWidth);
        doc.text(gLines, margin + colWidth + 10, y);
      }
      y += 6;
    }
    drawLine();
  }

  // ── Questions ──
  if (questions.length > 0) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 40);
    doc.text("SCREENING QUESTIONS", margin, y);
    y += 8;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      checkPageBreak(30);

      // Difficulty badge
      const badgeColor =
        q.difficulty === "easy" ? colors.green : q.difficulty === "medium" ? colors.amber : colors.red;
      doc.setFillColor(...badgeColor);
      doc.roundedRect(margin, y - 2, 16, 5, 1.5, 1.5, "F");
      doc.setTextColor(...colors.white);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text(q.difficulty.toUpperCase(), margin + 8, y + 1.5, { align: "center" });

      doc.setTextColor(30, 30, 40);
      doc.setFontSize(7);
      doc.text(`Q${i + 1}`, pageWidth - margin, y + 1.5, { align: "right" });
      y += 6;

      // Question text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 50);
      const qLines = doc.splitTextToSize(q.question, contentWidth);
      doc.text(qLines, margin, y);
      y += qLines.length * 4.5 + 3;

      // Purpose & Look for
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);

      doc.setTextColor(...colors.purple);
      doc.setFont("helvetica", "bold");
      doc.text("Purpose: ", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.muted);
      const purposeW = doc.getTextWidth("Purpose: ");
      const pLines = doc.splitTextToSize(q.purpose, contentWidth - purposeW);
      doc.text(pLines, margin + purposeW, y);
      y += pLines.length * 3.5 + 2;

      doc.setTextColor(...colors.green);
      doc.setFont("helvetica", "bold");
      doc.text("Look for: ", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.muted);
      const lookW = doc.getTextWidth("Look for: ");
      const lLines = doc.splitTextToSize(q.lookFor, contentWidth - lookW);
      doc.text(lLines, margin + lookW, y);
      y += lLines.length * 3.5 + 8;
    }
  }

  // ── Footer on each page ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.text(
      `TalentFlow AI Report — Page ${p} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  const safeName = (parsedResume.name || "candidate").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  doc.save(`talentflow-${safeName}-report.pdf`);
}
