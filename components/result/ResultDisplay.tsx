"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Award, BookOpen, RotateCcw, MessageCircle, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExamResult } from "@/lib/types";

// ─── UGDBE Confirmation Banner ────────────────────────────────────────────────
function UGDBEConfirmationCard({ name }: { name: string }) {
  const waMessage = encodeURIComponent(
    `Hi! 👋\n\nI am signing up for an *Undergraduate Program in Digital Business & Entrepreneurship* with IIDE.\n\nIf it interests you, check it out: iide.in/UG-Program-in-Digital-Business-and-Entrepreneurship`
  );
  const waUrl = `https://wa.me/?text=${waMessage}`;

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl border border-blue-100">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-blue-400/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-indigo-400/20 blur-2xl" />

      {/* Header */}
      <div className="relative bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 sm:px-6 px-3 py-5 sm:py-10 text-center">
        {/* Animated ring */}
        <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/20">
          <div className="flex size-14 items-center justify-center rounded-full bg-white shadow-lg">
            <CheckCircle2 className="size-8 text-blue-600" strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="sm:text-3xl text-[21px] font-extrabold tracking-tight text-white">Thank You{name ? `, ${name}` : ""}! 🎉</h2>
        <p className="mt-2 text-sm font-medium text-blue-100">
          Your application for <span className="font-bold text-white">UGDBE 2026</span> has been received.
        </p>

        {/* Step pill */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25">
          <span className="flex size-4 items-center justify-center rounded-full bg-green-400 text-[10px] font-black text-white">✓</span>
          Step 1 — Successfully Completed
        </div>
      </div>

      {/* Body */}
      <div className="relative bg-white px-3 sm:px-6 sm:py-8  py-5 space-y-6">

        {/* Info items */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <Mail className="mt-0.5 size-4 shrink-0 text-blue-500" />
            <p>
              You should have received a <strong>confirmation email</strong>. If not, please check your spam or promotions folder.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Phone className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <p>
              Our <strong>admissions team</strong> will call you within <strong>24 hours</strong> for a quick interview to know you better and verify your details.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Share &amp; Spread the Word</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        {/* Share prompt */}
        <div className="text-center">
          <p className="text-sm text-gray-600 leading-relaxed">
            Meanwhile, <strong className="text-gray-800">share the Undergraduate Program</strong> with your friends and family who may be interested!
          </p>
        </div>

        {/* WhatsApp button */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#25D366] py-4 text-sm font-bold text-white shadow-lg shadow-green-300 transition-all duration-300 hover:shadow-xl hover:shadow-green-400 hover:scale-[1.02] active:scale-[0.97]"
        >
          {/* Animated shimmer sweep */}
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

          {/* Pulsing ring behind icon */}
          <span className="relative flex shrink-0 items-center justify-center">
            <span className="absolute size-9 animate-ping rounded-full bg-white/30" />
            <svg className="relative size-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </span>

          <span className="text-base tracking-wide">Share on WhatsApp</span>
        </a>

        {/* Program link */}
        <p className="text-center text-xs text-gray-400">
          Program details at{" "}
          <a
            href="https://iide.in/UG-Program-in-Digital-Business-and-Entrepreneurship"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
          >
            iide.in/UG-Program-in-Digital-Business-and-Entrepreneurship
          </a>
        </p>
      </div>
    </div>
  );
}

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

  // UGDBE exam: skip score display, show only the confirmation card
  if (user.examSlug === "ugdbe") {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-12 px-4">
        <div className="mx-auto max-w-lg">
          <UGDBEConfirmationCard name={user.firstName} />
        </div>
      </div>
    );
  }

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
