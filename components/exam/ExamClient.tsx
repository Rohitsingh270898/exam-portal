"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BookmarkCheck, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { CameraGate } from "./CameraFeed";
import QuestionCard from "./QuestionCard";
import QuestionPalette from "./QuestionPalette";

import { cn, shuffleArray } from "@/lib/utils";
import { getTotalMarks } from "@/lib/exams";
import type { ExamConfig } from "@/lib/exams";
import type { ExamResult, Question, QuestionStatus, UserData } from "@/lib/types";
import { generateExamPDF } from "@/lib/pdf";

// ─── Make.com webhook ────────────────────────────────────────────────────────
const MAKE_WEBHOOK_URL =
  "https://hook.eu1.make.com/ibe96ktgegkyscev9ee54t7r7cxvfk2m";

/**
 * Send data to Make.com webhook.
 * Uses sendBeacon (fire-and-forget, survives page navigation) as primary,
 * falls back to fetch if beacon is unavailable or payload is too large.
 */
async function postToWebhook(
  user: UserData,
  courseName: string,
  pdfUrl: string,
  pdfDataUri: string
): Promise<void> {
  const rawBase64 = pdfDataUri.replace(/^data:application\/pdf;.*base64,/, "");
  const payload = JSON.stringify({
    Mobile: user.phone,
    Email: user.email,
    "Course Name": courseName,
    "Entrance Test Link": pdfUrl,
    "PDF Base64": rawBase64,
  });

  console.log("[Webhook] Posting data to Make.com webhook...");
  try {
    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    if (res.ok) {
      console.log("[Webhook] Webhook POST succeeded");
    } else {
      console.error("[Webhook] Webhook POST failed with status:", res.status);
    }
  } catch (err) {
    console.error("[Webhook] Webhook POST request failed:", err);
  }
}

const MAX_TAB_SWITCHES = 3;

interface ExamClientProps {
  config: ExamConfig;
}

// ─── Fisher-Yates shuffle for options (skip open-ended questions) ────────────
function shuffleQuestion(q: Question): Question {
  if (q.type === "open" || q.options.length === 0) return q;
  const shuffledOptions = shuffleArray(q.options);
  return { ...q, options: shuffledOptions };
}

// ─── Timer display ────────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ExamClient({ config }: ExamClientProps) {
  const router = useRouter();

  // ── Camera state ──────────────────────────────────────────────────────────
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // ── Load + shuffle questions once on mount ────────────────────────────────
  // MCQ questions are shuffled; open-ended questions stay fixed at the end.
  const questions = useMemo<Question[]>(() => {
    const mcq = config.questions.filter((q) => q.type !== "open");
    const open = config.questions.filter((q) => q.type === "open");
    return [...shuffleArray(mcq).map(shuffleQuestion), ...open];
  }, [config]);

  const totalMarks = useMemo(() => getTotalMarks(config), [config]);
  const totalQuestions = questions.length;

  // ── Exam state ────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [statuses, setStatuses] = useState<Record<number, QuestionStatus>>({});
  const [timeLeft, setTimeLeft] = useState(config.durationSeconds);

  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hasVisitedLast, setHasVisitedLast] = useState(totalQuestions === 1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const tabSwitchCount = useRef(0);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const [submitVisible, setSubmitVisible] = useState(false);
  const isSubmitting = useRef(false);



  // ── Observe submit button visibility for scroll hint ─────────────────────
  useEffect(() => {
    function checkVisibility() {
      const el = submitBtnRef.current;
      if (!el) {
        setSubmitVisible(false);
        return;
      }
      const rect = el.getBoundingClientRect();
      const inView =
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      setSubmitVisible(inView);
    }

    checkVisibility();
    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility, { passive: true });
    return () => {
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
    };
  }, []);

  // ── Submit exam ───────────────────────────────────────────────────────────
  const submitExam = useCallback(
    async (cause: "manual" | "timer" | "tab") => {
      if (submitted || isSubmitting.current) {
        console.log(`[ExamClient] Submission already in progress or completed. Ignoring submit call from cause: ${cause}`);
        return;
      }
      isSubmitting.current = true;
      console.log(`[ExamClient] Submitting exam. Cause: ${cause}`);
      setSubmitted(true);

      const userData = (() => {
        try {
          const rawUser = sessionStorage.getItem("examUser");
          console.log("[ExamClient] Raw examUser from sessionStorage:", rawUser);
          return JSON.parse(rawUser ?? "null") as UserData | null;
        } catch (e) {
          console.error("[ExamClient] Failed to parse examUser:", e);
          return null;
        }
      })();

      const answerRecord: Record<number, string | null> = Object.fromEntries(
        questions.map((_, idx) => [idx, answers[idx] ?? null])
      );

      const score = questions.reduce(
        (sum, q, idx) => sum + (answers[idx] === q.correctAnswer ? q.marks : 0),
        0
      );

      const percentage = Math.round((score / totalMarks) * 100);
      const timeTaken = Math.round((Date.now() - startedAt.current) / 1000);

      const result: ExamResult = {
        user: userData ?? {
          firstName: "Guest",
          lastName: "",
          email: "",
          phone: "",
          examSlug: config.slug,
        },
        score,
        totalMarks,
        percentage,
        passed: percentage >= 50,
        answers: answerRecord,
        timeTaken,
        submittedAt: new Date().toISOString(),
      };

      sessionStorage.setItem("examResult", JSON.stringify(result));
      sessionStorage.removeItem("examUser");

      // ── Generate PDF, store it, then post to Make.com ─────────────────────
      // We await PDF generation so:
      //   1. The PDF data URI is saved to sessionStorage (result page can download it)
      //   2. sendBeacon is called before router.replace (survives navigation)
      try {
        const pdfDataUri = await generateExamPDF(result, config, questions);
        // Store PDF for the result page's download button
        sessionStorage.setItem("examPDF", pdfDataUri);
        console.log(
          "[PDF] Generated successfully, size:",
          Math.round(pdfDataUri.length / 1024),
          "KB"
        );

        let linkToSend = pdfDataUri;
        try {
          const sanitizedEmail = (result.user.email || "guest").replace(/[^a-zA-Z0-9]/g, "_");
          const fileName = `exam_${config.slug}_${sanitizedEmail}_${Date.now()}.pdf`;

          console.log("[PDF] Uploading to server as:", fileName);
          const uploadRes = await fetch(`/api/upload/${fileName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUri: pdfDataUri }),
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            linkToSend = uploadData.url;
            console.log("[PDF] Uploaded successfully, URL:", linkToSend);
          } else {
            console.error(`[PDF] Upload failed with status ${uploadRes.status}`);
          }
        } catch (uploadErr) {
          console.error("[PDF] Upload request failed:", uploadErr);
        }

        // Post to webhook BEFORE navigating (await ensures transmission)
        const courseName = config.slug === "ugdbe" ? "Undergraduate Program" : config.name;
        await postToWebhook(result.user, courseName, linkToSend, pdfDataUri);
      } catch (err) {
        console.error("[PDF/Webhook] Failed:", err);
      }

      router.replace(`/${config.slug}/result`);
    },
    [submitted, questions, answers, totalMarks, config, router]
  );

  // ── Stop camera when exam is submitted ───────────────────────────────────
  useEffect(() => {
    if (submitted && cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
  }, [submitted, cameraStream]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraStream || submitted) return;

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          if (!isSubmitting.current && !submitted) {
            submitExam("timer");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [cameraStream, submitted, submitExam]);

  // ── Tab-switch guard ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraStream || submitted) return;

    const handleVisibilityChange = () => {
      if (submitted || isSubmitting.current) return;
      if (document.hidden) {
        tabSwitchCount.current += 1;
        const next = tabSwitchCount.current;
        if (next >= MAX_TAB_SWITCHES) {
          setWarningMessage("Auto-submitted: you left the tab too many times.");
          submitExam("tab");
        } else {
          setWarningMessage(
            `Warning: You left the tab (${next}/${MAX_TAB_SWITCHES}). Leaving ${
              MAX_TAB_SWITCHES - next
            } more time(s) will auto-submit.`
          );
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [cameraStream, submitted, submitExam]);

  // ── Prevent accidental refresh / close ────────────────────────────────────
  useEffect(() => {
    if (!cameraStream || submitted) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [cameraStream, submitted]);

  // ── Answer & navigation helpers ───────────────────────────────────────────
  const handleSelectAnswer = useCallback((answer: string) => {
    // Treat empty string (cleared textarea) as null so it counts as unanswered
    const value = answer || null;
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
    setStatuses((prev) => ({
      ...prev,
      [currentIndex]:
        prev[currentIndex] === "marked"
          ? "marked"
          : value
          ? "answered"
          : "unanswered",
    }));
  }, [currentIndex]);

  const toggleMark = useCallback(() => {
    setStatuses((prev) => ({
      ...prev,
      [currentIndex]:
        prev[currentIndex] === "marked"
          ? answers[currentIndex]
            ? "answered"
            : "unanswered"
          : "marked",
    }));
  }, [currentIndex, answers]);

  const goTo = useCallback((index: number) => {
    const target = Math.max(0, Math.min(index, totalQuestions - 1));
    setCurrentIndex(target);
    if (target === totalQuestions - 1) setHasVisitedLast(true);
  }, [totalQuestions]);

  // ── Before camera is granted, show gate ──────────────────────────────────
  if (!cameraStream) {
    return <CameraGate onStreamReady={(s) => setCameraStream(s)} />;
  }

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = answers[currentIndex] ?? null;
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const markedCount = Object.values(statuses).filter((s) => s === "marked").length;
  const unansweredCount = totalQuestions - answeredCount;
  const isLast = currentIndex === totalQuestions - 1;
  const isFirst = currentIndex === 0;
  const timerDanger = timeLeft <= 15;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Left: Title + exam name */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 capitalize">
              {config.name}
            </span>
            <span className="hidden sm:inline rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 capitalize">
              {config.slug}
            </span>
          </div>

          {/* Center: Progress */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <span>
              {answeredCount}/{totalQuestions} answered
            </span>
            <div className="h-1.5 w-32 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Right: Timer */}
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-bold transition-colors",
              timerDanger
                ? "bg-red-50 text-red-600 animate-pulse"
                : "bg-gray-100 text-gray-700"
            )}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      {/* ── Tab warning banner ───────────────────────────────────────────── */}
      {warningMessage && (
        <div className="sticky sm:text-[14px] text-[12px] top-14.25 z-30 flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm font-medium text-amber-800">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{warningMessage}</span>
          <button
            onClick={() => setWarningMessage(null)}
            className="ml-auto text-amber-600 hover:text-amber-900 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-2 sm:gap-6 p-2 lg:flex-row lg:p-6">
        {/* Question area */}
        <div className="flex flex-1 flex-col gap-2 sm:gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-2 sm:p-6 shadow-sm">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={totalQuestions}
              selectedAnswer={selectedAnswer}
              onSelect={handleSelectAnswer}
            />
          </div>

          {/* Navigation bar — Previous / Next only */}
          <div className="flex items-center justify-between gap-3">
            <button
              disabled={isFirst}
              onClick={() => goTo(currentIndex - 1)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 sm:text-sm text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>
            <button
              disabled={isLast}
              onClick={() => goTo(currentIndex + 1)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 sm:text-sm text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Sidebar: palette + actions — stacks below on mobile, fixed sidebar on desktop */}
        <div className="flex flex-col lg:w-56 lg:shrink-0">
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:sticky lg:top-18.25">
            <QuestionPalette
              total={totalQuestions}
              current={currentIndex}
              statuses={statuses}
              onNavigate={goTo}
            />

            {/* Mark for review */}
            <button
              onClick={toggleMark}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                statuses[currentIndex] === "marked"
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              <BookmarkCheck className="size-4" />
              {statuses[currentIndex] === "marked" ? "Marked" : "Mark for review"}
            </button>

            {/* Submit — only enabled after visiting the last question */}
            <button
              ref={submitBtnRef}
              disabled={!hasVisitedLast}
              onClick={() => setShowConfirmModal(true)}
              className="w-full rounded-lg bg-blue-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </main>

      {/* ── Scroll-to-submit hint (last question, submit off-screen, mobile) ── */}
      {isLast && !submitVisible && (
        <button
          onClick={() => submitBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-300 animate-bounce"
        >
          <ChevronDown className="size-4" />
          Scroll to Submit
        </button>
      )}

      {/* Camera stream kept alive for proctoring — preview intentionally hidden */}

      {/* ── Submit confirmation modal ───────────────────────────────────── */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-blue-700 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Submit Exam?</h2>
              <p className="mt-0.5 text-sm text-blue-100">
                This action cannot be undone.
              </p>
            </div>

            {/* Stats */}
            <div className="flex divide-x divide-gray-100 border-b border-gray-100">
              <div className="flex flex-1 flex-col items-center py-4 gap-1">
                <span className="text-2xl font-bold text-gray-900">{answeredCount}</span>
                <span className="text-xs text-gray-500">Answered</span>
              </div>
              <div className="flex flex-1 flex-col items-center py-4 gap-1">
                <span className={cn("text-2xl font-bold", unansweredCount > 0 ? "text-red-500" : "text-gray-900")}>
                  {unansweredCount}
                </span>
                <span className="text-xs text-gray-500">Unanswered</span>
              </div>
              <div className="flex flex-1 flex-col items-center py-4 gap-1">
                <span className={cn("text-2xl font-bold", markedCount > 0 ? "text-amber-500" : "text-gray-900")}>
                  {markedCount}
                </span>
                <span className="text-xs text-gray-500">For Review</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="px-6 pt-4 text-sm text-red-600 font-medium">
                ⚠ You have {unansweredCount} unanswered question{unansweredCount > 1 ? "s" : ""}.
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 p-6 pt-4">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  submitExam("manual");
                }}
                className="w-full rounded-xl bg-blue-700 py-3 text-sm font-bold text-white hover:bg-blue-800 transition-colors"
              >
                Yes, Submit Exam
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Stay &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
