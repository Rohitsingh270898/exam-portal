"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StartExamSectionProps {
  examSlug: string;
}

export default function StartExamSection({ examSlug }: StartExamSectionProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  return (
    <>
      {/* Spacer so page content isn't hidden behind the sticky footer on mobile */}
      <div className="h-28 sm:hidden" aria-hidden />

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-100 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <div className="flex flex-col gap-3">
          {/* Agreement checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer sr-only"
              />
              <div
                className={cn(
                  "size-5 rounded border-2 flex items-center justify-center transition-colors",
                  agreed
                    ? "border-blue-600 bg-blue-600"
                    : "border-gray-300 bg-white group-hover:border-blue-400"
                )}
              >
                {agreed && (
                  <svg className="size-3 text-white" viewBox="0 0 12 10" fill="none">
                    <path
                      d="M1 5l3.5 3.5L11 1"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-700 leading-snug">
              I have read and agree to follow all exam rules and the code of conduct.
            </span>
          </label>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push(`/${examSlug}`)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>

            <button
              type="button"
              disabled={!agreed}
              onClick={() => router.push(`/${examSlug}/exam`)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all",
                agreed
                  ? "bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              Start Exam
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
