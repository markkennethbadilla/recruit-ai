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
  const pageHeight = doc.internal.pageSize.height;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = 10;

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

  function thinLine() {
    doc.setDrawColor(200, 200, 210);
    doc.setLineWidth(0.15);
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;
  }

  // ── Compact Header ──
  doc.setFillColor(19, 20, 31);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setFillColor(...colors.purple);
  doc.roundedRect(margin, 6, 6, 6, 1.5, 1.5, "F");
  doc.setTextColor(...colors.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TalentFlow AI", margin + 9, 11);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.muted);
  doc.text(`Report • ${new Date().toLocaleDateString()} • ${model}`, margin + 9, 15.5);

  // Score badge in header (if available)
  if (scoring) {
    const scoreColor = scoring.overallScore >= 80 ? colors.green : scoring.overallScore >= 60 ? colors.amber : colors.red;
    doc.setFillColor(...scoreColor);
    doc.roundedRect(pageWidth - margin - 22, 5, 22, 14, 3, 3, "F");
    doc.setTextColor(...colors.white);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${scoring.overallScore}`, pageWidth - margin - 11, 11, { align: "center" });
    doc.setFontSize(5);
    doc.text("/100", pageWidth - margin - 11, 15, { align: "center" });
  }

  y = 33;

  // ── Candidate Name + Contact (single line) ──
  doc.setTextColor(30, 30, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(parsedResume.name || "Unknown Candidate", margin, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...colors.muted);
  const contactParts: string[] = [];
  if (parsedResume.email) contactParts.push(parsedResume.email);
  if (parsedResume.phone) contactParts.push(parsedResume.phone);
  if (parsedResume.location) contactParts.push(parsedResume.location);
  if (contactParts.length) {
    doc.text(contactParts.join("  •  "), margin, y);
    y += 4;
  }

  // Summary (truncated to 2 lines max)
  if (parsedResume.summary) {
    doc.setTextColor(60, 60, 70);
    doc.setFontSize(7);
    const summaryLines = doc.splitTextToSize(parsedResume.summary, contentWidth);
    doc.text(summaryLines.slice(0, 2), margin, y);
    y += Math.min(summaryLines.length, 2) * 3.2 + 2;
  }

  // Skills (inline, compact)
  if (parsedResume.skills.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(30, 30, 40);
    doc.text("Skills:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 90);
    const skillsW = doc.getTextWidth("Skills: ");
    const skillText = parsedResume.skills.slice(0, 15).join(", ");
    const skillLines = doc.splitTextToSize(skillText, contentWidth - skillsW);
    doc.text(skillLines.slice(0, 1), margin + skillsW, y);
    y += 4;
  }

  thinLine();

  // ── Scoring Section (compact 2-column layout) ──
  if (scoring) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 40);
    const recLabel = scoring.recommendation === "strong_match" ? "STRONGLY RECOMMENDED" : scoring.recommendation === "potential_match" ? "POTENTIAL MATCH" : "NOT RECOMMENDED";
    doc.text(`Score Breakdown`, margin, y);
    
    const recColor = scoring.recommendation === "strong_match" ? colors.green : scoring.recommendation === "potential_match" ? colors.amber : colors.red;
    doc.setFontSize(6);
    doc.setTextColor(...recColor);
    doc.text(recLabel, margin + doc.getTextWidth("Score Breakdown  ") + 5, y);
    y += 5;

    // 2-column breakdown
    const colWidth = (contentWidth - 6) / 2;
    const startY = y;
    const items = scoring.breakdown;
    const half = Math.ceil(items.length / 2);

    for (let col = 0; col < 2; col++) {
      y = startY;
      const xOff = margin + col * (colWidth + 6);
      const slice = col === 0 ? items.slice(0, half) : items.slice(half);

      for (const item of slice) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(50, 50, 60);
        doc.text(item.category, xOff, y);
        doc.setFont("helvetica", "normal");
        doc.text(`${item.score}/${item.maxScore}`, xOff + colWidth, y, { align: "right" });
        y += 2.8;

        // Thin progress bar
        doc.setFillColor(230, 230, 235);
        doc.roundedRect(xOff, y, colWidth, 1.8, 0.7, 0.7, "F");
        const fillColor = item.score >= 8 ? colors.green : item.score >= 5 ? colors.amber : colors.red;
        doc.setFillColor(...fillColor);
        doc.roundedRect(xOff, y, colWidth * (item.score / item.maxScore), 1.8, 0.7, 0.7, "F");
        y += 3;

        doc.setFontSize(5.5);
        doc.setTextColor(...colors.muted);
        const reasonLines = doc.splitTextToSize(item.reasoning, colWidth);
        doc.text(reasonLines.slice(0, 2), xOff, y);
        y += Math.min(reasonLines.length, 2) * 2.8 + 2.5;
      }
    }

    // Use the lower of the two column y positions
    y = Math.max(y, startY) + 1;

    // Strengths & Gaps in 2 columns
    thinLine();
    const sgColWidth = (contentWidth - 6) / 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...colors.green);
    doc.text("STRENGTHS", margin, y);
    doc.setTextColor(...colors.amber);
    doc.text("GAPS", margin + sgColWidth + 6, y);
    y += 3.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    const sgStartY = y;
    const maxSG = Math.max(scoring.strengths.length, scoring.gaps.length);
    for (let i = 0; i < Math.min(maxSG, 3); i++) {
      if (scoring.strengths[i]) {
        doc.setTextColor(60, 60, 70);
        const sLines = doc.splitTextToSize(`✓ ${scoring.strengths[i]}`, sgColWidth);
        doc.text(sLines.slice(0, 1), margin, y);
      }
      if (scoring.gaps[i]) {
        doc.setTextColor(80, 80, 90);
        const gLines = doc.splitTextToSize(`△ ${scoring.gaps[i]}`, sgColWidth);
        doc.text(gLines.slice(0, 1), margin + sgColWidth + 6, y);
      }
      y += 3.5;
    }
    y = Math.max(y, sgStartY) + 1;
    thinLine();
  }

  // ── Questions (compact list) ──
  if (questions.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 40);
    doc.text("Interview Questions", margin, y);
    y += 4.5;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (y > pageHeight - 15) break; // don't overflow page

      // Difficulty + number inline
      const badgeColor = q.difficulty === "easy" ? colors.green : q.difficulty === "medium" ? colors.amber : colors.red;
      doc.setFillColor(...badgeColor);
      doc.roundedRect(margin, y - 1.5, 10, 3.5, 1, 1, "F");
      doc.setTextColor(...colors.white);
      doc.setFontSize(5);
      doc.setFont("helvetica", "bold");
      doc.text(q.difficulty.toUpperCase(), margin + 5, y + 0.5, { align: "center" });

      doc.setTextColor(30, 30, 40);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      const qLines = doc.splitTextToSize(q.question, contentWidth - 14);
      doc.text(qLines.slice(0, 2), margin + 13, y);
      y += Math.min(qLines.length, 2) * 3.2 + 1;

      // Purpose + Look for on same line, tiny
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.purple);
      doc.text("Why: ", margin + 13, y);
      doc.setTextColor(...colors.muted);
      const pw = doc.getTextWidth("Why: ");
      const purposeText = doc.splitTextToSize(q.purpose, contentWidth - 14 - pw);
      doc.text(purposeText.slice(0, 1), margin + 13 + pw, y);
      y += 2.8;

      doc.setTextColor(...colors.green);
      doc.text("Look for: ", margin + 13, y);
      doc.setTextColor(...colors.muted);
      const lw = doc.getTextWidth("Look for: ");
      const lookText = doc.splitTextToSize(q.lookFor, contentWidth - 14 - lw);
      doc.text(lookText.slice(0, 1), margin + 13 + lw, y);
      y += 4.5;
    }
  }

  // ── Footer ──
  doc.setFontSize(5.5);
  doc.setTextColor(...colors.muted);
  doc.text(
    `TalentFlow AI • talentflow-ai.elunari.uk • Generated ${new Date().toLocaleDateString()}`,
    pageWidth / 2,
    pageHeight - 6,
    { align: "center" }
  );

  const safeName = (parsedResume.name || "candidate").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  doc.save(`talentflow-${safeName}-report.pdf`);
}
