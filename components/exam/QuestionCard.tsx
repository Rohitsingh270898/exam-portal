import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelect,
}: QuestionCardProps) {
  const labels = ["A", "B", "C", "D"];

  return (
    <div className="flex flex-col sm:gap-6 gap-2">
      {/* Question header */}
      <div className="flex items-start gap-3">
        <span className="shrink-0 rounded-full bg-blue-700 px-2.5 py-0.5 text-xs font-bold text-white">
          Q{questionNumber}
        </span>
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-400 mb-1 hidden">
            Question {questionNumber} of {totalQuestions} • {question.marks}{" "}
            {question.marks === 1 ? "mark" : "marks"}
          </p>
          <p className="sm:text-base  text-sm font-medium text-gray-900 leading-relaxed">{question.text}</p>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={cn(
                "flex items-center gap-4 rounded-xl border-2 px-4 sm:py-3 py-2 text-left transition-all",
                isSelected
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-gray-100 bg-white text-gray-800 hover:border-blue-200 hover:bg-blue-50/50"
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors",
                  isSelected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 text-gray-500"
                )}
              >
                {labels[idx]}
              </span>
              <span className="sm:text-sm text-xs font-medium">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
