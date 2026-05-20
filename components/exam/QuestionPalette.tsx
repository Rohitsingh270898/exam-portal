import { cn } from "@/lib/utils";
import type { QuestionStatus } from "@/lib/types";

interface QuestionPaletteProps {
  total: number;
  current: number;
  statuses: Record<number, QuestionStatus>;
  onNavigate: (index: number) => void;
}

const STATUS_STYLES: Record<QuestionStatus, string> = {
  unanswered: "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
  answered: "border-green-500 bg-green-500 text-white",
  marked: "border-amber-400 bg-amber-400 text-white",
};

export default function QuestionPalette({
  total,
  current,
  statuses,
  onNavigate,
}: QuestionPaletteProps) {
  return (
    <aside className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        Question Palette
      </h3>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: total }, (_, i) => {
          const status = statuses[i] ?? "unanswered";
          const isActive = i === current;
          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              aria-label={`Go to question ${i + 1}`}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "size-8 rounded-lg border text-xs font-semibold transition-all",
                STATUS_STYLES[status],
                isActive && "ring-2 ring-blue-600 ring-offset-1"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-row sm:flex-col gap-1.5 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-sm bg-green-500" />
          Answered
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-sm bg-amber-400" />
          Marked for review
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-sm border border-gray-200 bg-white" />
          Not answered
        </div>
      </div>
    </aside>
  );
}
