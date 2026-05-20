"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react";

import { CameraGate } from "./CameraFeed";
import QuestionCard from "./QuestionCard";
import QuestionPalette from "./QuestionPalette";

import { cn, shuffleArray } from "@/lib/utils";
import { getTotalMarks } from "@/lib/exams";
import type { ExamConfig } from "@/lib/exams";
import type { ExamResult, Question, QuestionStatus, UserData } from "@/lib/types";

const MAX_TAB_SWITCHES = 3;

interface ExamClientProps {
  config: ExamConfig;
}

// ─── Fisher-Yates shuffle for options ────────────────────────────────────────
function shuffleQuestion(q: Question): Question {
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
  const questions = useMemo<Question[]>(() => {
    return shuffleArray(config.questions).map(shuffleQuestion);
  }, [config]);

  const totalMarks = useMemo(() => getTotalMarks(config), [config]);
  const totalQuestions = questions.length;

  // ── Exam state ────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [statuses, setStatuses] = useState<Record<number, QuestionStatus>>({});
  const [timeLeft, setTimeLeft] = useState(config.durationSeconds);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hasVisitedLast, setHasVisitedLast] = useState(totalQuestions === 1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const startedAt = useRef(Date.now());

  // ── Track when user reaches the last question ─────────────────────────────
  useEffect(() => {
    if (currentIndex === totalQuestions - 1) setHasVisitedLast(true);
  }, [currentIndex, totalQuestions]);

  // ── Submit exam ───────────────────────────────────────────────────────────
  const submitExam = useCallback(
    (cause: "manual" | "timer" | "tab") => {
      if (submitted) return;
      setSubmitted(true);

      const userData = (() => {
        try {
          return JSON.parse(sessionStorage.getItem("examUser") ?? "null") as UserData | null;
        } catch {
          return null;
        }
      })();

      let score = 0;
      const answerRecord: Record<number, string | null> = {};

      questions.forEach((q, idx) => {
        const selected = answers[idx] ?? null;
        answerRecord[idx] = selected;
        if (selected === q.correctAnswer) {
          score += q.marks;
        }
      });

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
      router.replace(`/${config.slug}/result`);
    },
    [submitted, questions, answers, totalMarks, config, router]
  );

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraStream || submitted) return;

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          submitExam("timer");
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
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
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
          return next;
        });
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
    setAnswers((prev) => ({ ...prev, [currentIndex]: answer }));
    setStatuses((prev) => ({
      ...prev,
      [currentIndex]:
        prev[currentIndex] === "marked" ? "marked" : "answered",
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
    setCurrentIndex(Math.max(0, Math.min(index, totalQuestions - 1)));
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
            <span className="hidden sm:inline rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 capitalize">
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
        <div className="sticky top-14.25 z-30 flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm font-medium text-amber-800">
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
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>
            <button
              disabled={isLast}
              onClick={() => goTo(currentIndex + 1)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
              disabled={!hasVisitedLast}
              onClick={() => setShowConfirmModal(true)}
              className="w-full rounded-lg bg-blue-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {hasVisitedLast ? "Submit Exam" : "Go to last question first"}
            </button>
          </div>
        </div>
      </main>

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
