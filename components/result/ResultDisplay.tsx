"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Award, BookOpen, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExamResult } from "@/lib/types";

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "green" | "red" | "blue" | "gray";
}) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-gray-50 text-gray-600",
  };
  const color = colors[accent ?? "gray"];

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={cn("flex size-10 items-center justify-center rounded-xl", color)}>{icon}</div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function ResultDisplay() {
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("examResult");
      if (raw) setResult(JSON.parse(raw) as ExamResult);
    } catch {
      // Invalid data – leave as null
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <XCircle className="size-12 text-gray-300" />
        <p className="text-lg font-semibold text-gray-500">No result found.</p>
        <Link
          href="/"
          className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const { user, score, totalMarks, percentage, passed, timeTaken } = result;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;
  const timeDisplay =
    minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Result hero card */}
        <div
          className={cn(
            "rounded-2xl p-8 text-center shadow-sm border",
            passed
              ? "bg-linear-to-br from-green-600 to-emerald-700 border-green-700"
              : "bg-linear-to-br from-red-600 to-rose-700 border-red-700"
          )}
        >
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-white/10">
            {passed ? (
              <CheckCircle2 className="size-10 text-white" />
            ) : (
              <XCircle className="size-10 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white">
            {passed ? "Congratulations!" : "Better luck next time"}
          </h1>
          <p className="mt-1 text-white/80 text-sm">
            {fullName ? `Well done, ${fullName}!` : ""}{" "}
            {passed
              ? "You have qualified for the merit-based scholarship."
              : "You need 50% or above to qualify."}
          </p>

          {/* Score ring */}
          <div className="mt-8 flex flex-col items-center">
            <div className="relative flex size-32 items-center justify-center rounded-full border-8 border-white/20 bg-white/10">
              <div className="text-center">
                <span className="text-4xl font-extrabold text-white">{percentage}%</span>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-white/70">
              {score} / {totalMarks} marks
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Award className="size-5" />}
            label="Score"
            value={`${score}/${totalMarks}`}
            accent={passed ? "green" : "red"}
          />
          <StatCard
            icon={<CheckCircle2 className="size-5" />}
            label="Percentage"
            value={`${percentage}%`}
            accent={passed ? "green" : "red"}
          />
          <StatCard
            icon={<Clock className="size-5" />}
            label="Time taken"
            value={timeDisplay}
            accent="blue"
          />
          <StatCard
            icon={<BookOpen className="size-5" />}
            label="Level"
            value={user.examSlug}
            accent="gray"
          />
        </div>

        {/* Status badge */}
        <div
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border p-4 font-semibold",
            passed
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {passed ? (
            <>
              <CheckCircle2 className="size-5" />
              Scholarship Qualified — Merit 50%+ achieved
            </>
          ) : (
            <>
              <XCircle className="size-5" />
              Not qualified — Score below 50%
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/${user.examSlug}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RotateCcw className="size-4" />
            Retake exam
          </Link>
          <button
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors shadow-sm"
          >
            <Award className="size-4" />
            Save / Print result
          </button>
        </div>
      </div>
    </div>
  );
}
