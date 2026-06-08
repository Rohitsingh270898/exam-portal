/**
 * lib/pdf.ts — IIDE Exam Response Sheet PDF Generator
 *
 * Design language:
 *  - IIDE brand navy blue (#1E3B8A) as the primary accent
 *  - Clean white cards with light-grey borders
 *  - Sentence-case normalisation on all question text
 *  - No score summary bar
 *  - Sections grouped with a blue accent strip + number badge
 *  - Answer rows: "Your Answer" (red bg if wrong) | "Correct Answer" (blue tint bg)
 *  - Open-ended answers in a warm-grey card
 *  - Slim footer on every page
 */

import type { ExamResult } from "./types";
import type { ExamConfig } from "./exams";

// ─── Exam title overrides ─────────────────────────────────────────────────────
const EXAM_TITLE_MAP: Record<string, string> = {
  ugdbe: "UGDBE Admission Test",
  "tech-scholarship": "Tech Scholarship Test",
  "science-scholarship": "Science Scholarship Test",
  "management-scholarship": "Management Scholarship Test",
};

// ─── Section grouping (UGDBE only) ───────────────────────────────────────────
interface SectionInfo { number: string; name: string }

function getSectionInfo(questionId: number, slug: string): SectionInfo | null {
  if (slug !== "ugdbe") return null;
  if (questionId <= 4)  return { number: "1", name: "Decision Making" };
  if (questionId <= 7)  return { number: "2", name: "Business Instinct" };
  if (questionId <= 10) return { number: "3", name: "Numbers That Matter" };
  if (questionId <= 13) return { number: "4", name: "Digital Thinking" };
  if (questionId <= 16) return { number: "5", name: "Builder Mindset" };
  return { number: "6", name: "Open-Ended Questions" };
}

// ─── Sentence-case helper ─────────────────────────────────────────────────────
// Capitalises the very first character of a string, leaves the rest untouched
// (preserves acronyms like HTTP, DNS, etc.)
function toSentenceCase(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Replaces Unicode characters that jsPDF's built-in Helvetica cannot render.
// When jsPDF hits an unmapped glyph it silently falls back to Courier,
// making that whole text block appear in monospace — this prevents that.
function sanitize(text: string): string {
  return text
    .replace(/₹/g, "Rs.")   // Rupee sign → Rs.
    .replace(/\u2013/g, "-")  // en-dash
    .replace(/\u2014/g, "-")  // em-dash
    .replace(/\u2018|\u2019/g, "'") // smart single quotes
    .replace(/\u201c|\u201d/g, '"') // smart double quotes
    .replace(/\u2026/g, "...")      // ellipsis
    .replace(/\u00d7/g, "x")        // multiplication sign
    .replace(/[^\x00-\x7F]/g, "");  // strip any remaining non-ASCII
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateExamPDF(
  result: ExamResult,
  config: ExamConfig,
  shuffledQuestions: Array<{
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    marks: number;
    type?: "mcq" | "open";
  }>
): Promise<string> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const PW  = 210;        // page width
  const PH  = 297;        // page height
  const M   = 14;         // side margin
  const CW  = PW - M * 2; // content width

  // ── IIDE brand palette — primary navy blue #1E3B8A ────────────────────────
  const IIDE_BLUE:   [number, number, number] = [30,  59, 138];  // #1E3B8A — primary
  const IIDE_BLUE_D: [number, number, number] = [20,  40,  98];  // #142862 — darker for header
  const IIDE_BLUE_L: [number, number, number] = [232, 237, 248]; // #E8EDF8 — very light tint
  const WRONG_BG:    [number, number, number] = [255, 235, 235]; // wrong answer bg
  const WRONG_TEXT:  [number, number, number] = [180, 30,  30];  // wrong answer text
  const RIGHT_BG:    [number, number, number] = [232, 237, 248]; // correct answer bg (IIDE light)
  const RIGHT_TEXT:  [number, number, number] = [30,  59, 138];  // correct answer text (IIDE blue)
  const SKIP_BG:     [number, number, number] = [245, 245, 245]; // unanswered bg
  const SKIP_TEXT:   [number, number, number] = [140, 140, 140];
  const OPEN_BG:     [number, number, number] = [248, 248, 248];
  const GREY_50:     [number, number, number] = [250, 250, 250];
  const GREY_100:    [number, number, number] = [242, 242, 242];
  const GREY_200:    [number, number, number] = [218, 218, 218];
  const GREY_400:    [number, number, number] = [160, 160, 160];
  const GREY_700:    [number, number, number] = [80,  80,  80];
  const DARK:        [number, number, number] = [22,  22,  22];
  const WHITE:       [number, number, number] = [255, 255, 255];

  let y = 0;

  // ── Primitive helpers ───────────────────────────────────────────────────────
  function font(
    style: "normal" | "bold" | "italic",
    size: number,
    color: [number, number, number]
  ) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  }

  function rect(
    x: number, ry: number, w: number, h: number,
    fill: [number, number, number],
    strokeColor?: [number, number, number],
    lw = 0.25
  ) {
    doc.setFillColor(...fill);
    if (strokeColor) {
      doc.setDrawColor(...strokeColor);
      doc.setLineWidth(lw);
      doc.rect(x, ry, w, h, "FD");
    } else {
      doc.rect(x, ry, w, h, "F");
    }
  }

  function hLine(x1: number, x2: number, ly: number, color: [number, number, number], lw = 0.2) {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.line(x1, ly, x2, ly);
  }

  function vLine(lx: number, y1: number, y2: number, color: [number, number, number], lw = 0.2) {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.line(lx, y1, lx, y2);
  }

  // Page-break guard — adds a new page and draws a mini header if needed
  function needsPage(neededH: number) {
    if (y + neededH > PH - 14) {
      doc.addPage();
      y = 0;
      drawMiniHeader();
    }
  }

  // ── Mini header (continuation pages) ──────────────────────────────────────
  function drawMiniHeader() {
    const examTitle = EXAM_TITLE_MAP[config.slug] ?? config.name;
    rect(0, 0, PW, 9, IIDE_BLUE_D);
    font("bold", 7.5, WHITE);
    doc.text(`${examTitle}  ·  Response Sheet (continued)`, PW / 2, 5.8, { align: "center" });
    y = 12;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — HEADER
  // ═══════════════════════════════════════════════════════════════════════════
  const examTitle = EXAM_TITLE_MAP[config.slug] ?? config.name;
  const HEADER_H = 32;

  // Main IIDE blue banner
  rect(0, 0, PW, HEADER_H, IIDE_BLUE_D);

  // Thin white inner border inset
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.rect(M - 2, 4, CW + 4, HEADER_H - 8);

  // "IIDE" label — top-left pill
  rect(M + 1, 5.5, 14, 6, WHITE);
  font("bold", 6.5, IIDE_BLUE_D);
  doc.text("IIDE", M + 1 + 7, 9.8, { align: "center" });

  // Exam title
  font("bold", 17, WHITE);
  doc.text(examTitle, PW / 2, 16, { align: "center" });

  // Subtitle
  font("normal", 8, [180, 200, 240]);
  doc.text(`${config.subtitle}  ·  Response Sheet`, PW / 2, 23, { align: "center" });

  y = HEADER_H + 6;

  // ═══════════════════════════════════════════════════════════════════════════
  // CANDIDATE INFO CARD
  // ═══════════════════════════════════════════════════════════════════════════
  const fullName =
    [result.user.firstName, result.user.lastName].filter(Boolean).join(" ") || "—";

  const INFO_H = 20;
  rect(M, y, CW, INFO_H, WHITE, GREY_200);

  // Left IIDE blue accent bar
  rect(M, y, 3, INFO_H, IIDE_BLUE);

  const infoFields = [
    { label: "CANDIDATE NAME", value: fullName },
    { label: "MOBILE",         value: result.user.phone || "—" },
    { label: "EMAIL",          value: result.user.email || "—" },
  ];
  const colW = CW / 3;

  infoFields.forEach((f, i) => {
    const cx = M + colW * i;
    if (i > 0) vLine(cx, y + 3, y + INFO_H - 3, GREY_200);
    font("bold", 5.5, GREY_400);
    doc.text(f.label, cx + (i === 0 ? 7 : 4), y + 6.5);
    font("bold", 9.5, DARK);
    const val = f.value.length > 26 ? f.value.slice(0, 24) + "…" : f.value;
    doc.text(val, cx + (i === 0 ? 7 : 4), y + 14);
  });

  y += INFO_H + 7;

  // ═══════════════════════════════════════════════════════════════════════════
  // QUESTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  let lastSection = "";

  shuffledQuestions.forEach((q, idx) => {
    const isOpen    = q.type === "open";
    const selected  = result.answers[idx] ?? null;
    const isCorrect = !isOpen && selected === q.correctAnswer;
    const isWrong   = !isOpen && selected !== null && !isCorrect;
    const isSkipped = !isOpen && selected === null;

    // ── Section strip ─────────────────────────────────────────────────────────
    const sec    = getSectionInfo(q.id, config.slug);
    const secKey = sec?.name ?? "";

    if (sec && secKey !== lastSection) {
      needsPage(18);
      lastSection = secKey;

      const SEC_H = 9;
      rect(M, y, CW, SEC_H, IIDE_BLUE_L);

      // Left accent bar
      rect(M, y, 3, SEC_H, IIDE_BLUE);

      // Number badge (circle-ish square)
      const BX = M + 6;
      const BY = y + 1.5;
      const BS = 6;
      rect(BX, BY, BS, BS, IIDE_BLUE);
      font("bold", 7, WHITE);
      doc.text(sec.number, BX + BS / 2, BY + 4.5, { align: "center" });

      font("bold", 9, IIDE_BLUE_D);
      doc.text(sec.name.toUpperCase(), BX + BS + 4, y + 5.9);
      y += SEC_H + 4;
    }

    // ── Question text ─────────────────────────────────────────────────────────
    const qText  = sanitize(toSentenceCase(q.text));
    const qLines: string[] = doc.splitTextToSize(qText, CW - 18);
    const qTextH = qLines.length * 4.8;
    const QB_H   = 7 + qTextH + 4;      // question block height
    const ANS_H  = 9;                    // answer row height

    // Rough total height check (options + answer row)
    const optRowH    = 6;
    const optRows    = isOpen ? 0 : Math.ceil(q.options.length / 2);
    const optTotalH  = optRows * optRowH;
    const openH      = isOpen ? 18 : 0;
    const totalBlock = QB_H + optTotalH + ANS_H + openH + 5;
    needsPage(totalBlock);

    // Question card background
    rect(M, y, CW, QB_H, WHITE, GREY_200);

    // Left accent bar (thin stripe matching section color)
    rect(M, y, 2.5, QB_H, GREY_200);

    // Q-number badge
    const QBX = M + 5;
    const QBY = y + QB_H / 2 - 3.5;
    rect(QBX, QBY, 8, 7, IIDE_BLUE);
    font("bold", 6.5, WHITE);
    doc.text(`Q${idx + 1}`, QBX + 4, QBY + 4.8, { align: "center" });

    // Question text — normal weight, consistent size across all questions
    font("normal", 8.5, DARK);
    doc.text(qLines, M + 17, y + 7);
    y += QB_H;

    if (!isOpen) {
      // ── Options (2 per row) ─────────────────────────────────────────────────
      const HALF = CW / 2;
      const letters = ["A", "B", "C", "D"];

      rect(M, y, CW, optTotalH, GREY_50, GREY_200);

      q.options.forEach((opt, oi) => {
        const col = oi % 2;
        const row = Math.floor(oi / 2);
        const ox  = M + col * HALF;
        const oy  = y + row * optRowH;

        if (col === 1) vLine(ox, oy, oy + optRowH, GREY_200);
        if (row > 0)   hLine(ox, ox + HALF, oy, GREY_200);

        // Letter badge
        font("bold", 7, IIDE_BLUE_D);
        doc.text(letters[oi] + ".", ox + 4, oy + 4);

        font("normal", 7.5, DARK);
        const optText = sanitize(opt.length > 38 ? opt.slice(0, 36) + "..." : opt);
        doc.text(optText, ox + 11, oy + 4);
      });
      y += optTotalH;

      // ── Answer comparison row ───────────────────────────────────────────────
      const HALF_ANS = CW / 2;

      // Your Answer cell
      const yourBg:   [number, number, number] = isCorrect ? RIGHT_BG  : isWrong ? WRONG_BG  : SKIP_BG;
      const yourText: [number, number, number] = isCorrect ? RIGHT_TEXT : isWrong ? WRONG_TEXT : SKIP_TEXT;
      rect(M, y, HALF_ANS, ANS_H, yourBg, GREY_200);
      font("bold", 6.5, yourText);
      doc.text("Your Answer:", M + 3, y + 5.8);
      font("normal", 7, yourText);
      const yourAnsText = sanitize(
        selected
          ? (selected.length > 26 ? selected.slice(0, 24) + "..." : selected)
          : "Not answered"
      );
      doc.text(yourAnsText, M + 24, y + 5.8);

      // Correct Answer cell
      rect(M + HALF_ANS, y, HALF_ANS, ANS_H, RIGHT_BG, GREY_200);
      font("bold", 6.5, RIGHT_TEXT);
      doc.text("Correct Answer:", M + HALF_ANS + 3, y + 5.8);
      font("normal", 7, RIGHT_TEXT);
      const corrText = sanitize(
        q.correctAnswer.length > 26
          ? q.correctAnswer.slice(0, 24) + "..."
          : q.correctAnswer
      );
      doc.text(corrText, M + HALF_ANS + 27, y + 5.8);

      y += ANS_H + 5;

    } else {
      // ── Open-ended response card ────────────────────────────────────────────
      const openAns   = (result.answers[idx] as string | null) ?? "";
      const ansLines: string[] = openAns
        ? doc.splitTextToSize(openAns, CW - 10)
        : ["(No response provided)"];
      const CARD_H = Math.max(16, ansLines.length * 4.5 + 10);
      needsPage(CARD_H + 5);
      rect(M, y, CW, CARD_H, OPEN_BG, GREY_200);
      rect(M, y, 2.5, CARD_H, GREY_400);          // left stripe
      font("bold", 6.5, GREY_700);
      doc.text("Response:", M + 6, y + 6.5);
      font("normal", 8, DARK);
      doc.text(ansLines, M + 6, y + 12);
      y += CARD_H + 5;
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER — every page
  // ═══════════════════════════════════════════════════════════════════════════
  const totalPages = (
    doc as unknown as { internal: { getNumberOfPages: () => number } }
  ).internal.getNumberOfPages();

  const timestamp = new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Thin top-of-footer separator
    hLine(M, PW - M, PH - 10, GREY_200, 0.3);

    font("normal", 6, GREY_400);
    doc.text(
      `IIDE  ·  ${examTitle}  ·  Generated on ${timestamp}`,
      M,
      PH - 5.5
    );
    font("normal", 6, GREY_400);
    doc.text(`Page ${p} of ${totalPages}`, PW - M, PH - 5.5, { align: "right" });
  }

  return doc.output("datauristring");
}
