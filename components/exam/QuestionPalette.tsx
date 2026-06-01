"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionStatus } from "@/lib/types";

interface QuestionPaletteProps {
  total: number;
  current: number;
  statuses: Record<number, QuestionStatus>;
  onNavigate: (index: number) => void;
}

const WINDOW_SIZE = 10;
const SLIDE_AMOUNT = 5;

export default function QuestionPalette({
  total,
  current,
  statuses,
  onNavigate,
}: QuestionPaletteProps) {
  const [windowStart, setWindowStart] = useState(0);

  // Auto-slide the window to keep `current` always visible
  useEffect(() => {
    if (total <= WINDOW_SIZE) return;
    if (current >= windowStart + WINDOW_SIZE) {
      setWindowStart(Math.min(current - WINDOW_SIZE + 1, total - WINDOW_SIZE));
    } else if (current < windowStart) {
      setWindowStart(Math.max(current, 0));
    }
  }, [current, total, windowStart]);

  const isPaginated = total > WINDOW_SIZE;
  const visibleQuestions = Array.from(
    { length: isPaginated ? Math.min(WINDOW_SIZE, total - windowStart) : total },
    (_, i) => (isPaginated ? windowStart + i : i)
  );

  const canGoPrev = windowStart > 0;
  const canGoNext = windowStart + WINDOW_SIZE < total;
  const windowEnd = Math.min(windowStart + WINDOW_SIZE, total);

  const answeredCount = Object.values(statuses).filter((s) => s === "answered").length;
  const markedCount   = Object.values(statuses).filter((s) => s === "marked").length;
  const unansweredCount = total - answeredCount - markedCount;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          Questions
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
          {answeredCount}&thinsp;/&thinsp;{total}
        </span>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${(answeredCount / total) * 100}%` }}
        />
      </div>

      {/* ── Pagination nav ───────────────────────────────────────────────── */}
      {isPaginated && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWindowStart((s) => Math.max(0, s - SLIDE_AMOUNT))}
            disabled={!canGoPrev}
            aria-label="Show previous questions"
            className="flex size-6 shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-gray-400
                       transition hover:border-gray-300 hover:text-gray-600
                       disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="size-3" />
          </button>

          <p className="flex-1 text-center text-[11px] font-medium text-gray-400">
            Q{windowStart + 1}–Q{windowEnd}
            <span className="text-gray-300"> / {total}</span>
          </p>

          <button
            onClick={() =>
              setWindowStart((s) => Math.min(total - WINDOW_SIZE, s + SLIDE_AMOUNT))
            }
            disabled={!canGoNext}
            aria-label="Show next questions"
            className="flex size-6 shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-gray-400
                       transition hover:border-gray-300 hover:text-gray-600
                       disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="size-3" />
          </button>
        </div>
      )}

      {/* ── Question grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-1.5">
        {visibleQuestions.map((i) => {
          const status = statuses[i] ?? "unanswered";
          const isActive = i === current;
          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              aria-label={`Question ${i + 1}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "size-9 rounded-lg text-xs font-semibold transition-all duration-100 focus:outline-none",
                // inactive states — soft tints
                !isActive && status === "unanswered" && "bg-gray-100 text-gray-500 hover:bg-gray-200",
                !isActive && status === "answered"   && "bg-green-100 text-green-700 hover:bg-green-200",
                !isActive && status === "marked"     && "bg-amber-100 text-amber-700 hover:bg-amber-200",
                // active states — saturated + ring
                isActive && status === "unanswered" && "bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-1",
                isActive && status === "answered"   && "bg-green-500 text-white ring-2 ring-green-500 ring-offset-1",
                isActive && status === "marked"     && "bg-amber-400 text-white ring-2 ring-amber-400 ring-offset-1"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className="space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
        {[
          { dot: "bg-green-400", label: "Answered",   count: answeredCount   },
          { dot: "bg-amber-400", label: "Marked",     count: markedCount     },
          { dot: "bg-gray-200",  label: "Unanswered", count: unansweredCount },
        ].map(({ dot, label, count }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("size-2 rounded-full", dot)} />
              {label}
            </div>
            <span className="font-semibold text-gray-600">{count}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

