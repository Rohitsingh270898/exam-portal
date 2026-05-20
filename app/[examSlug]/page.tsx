import { notFound } from "next/navigation";
import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";

import RegistrationForm from "@/components/home/RegistrationForm";
import HeroStats from "@/components/home/HeroStats";
import FeatureSection from "@/components/home/FeatureSection";
import { getExamConfig, getAllExamSlugs } from "@/lib/exams";

interface Props {
  params: Promise<{ examSlug: string }>;
}

export function generateStaticParams() {
  return getAllExamSlugs().map((slug) => ({ examSlug: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { examSlug } = await params;
  const exam = getExamConfig(examSlug);
  if (!exam) return { title: "Not Found" };
  return {
    title: `${exam.name} — Win Your Scholarship Through Merit`,
    description: exam.description,
  };
}

export default async function ExamHomePage({ params }: Props) {
  const { examSlug } = await params;
  const exam = getExamConfig(examSlug);
  if (!exam) notFound();

  return (
    <main className="flex-1">
      {/* ── Hero / Registration ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#05005a] px-4 pt-3 pb-10 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.25) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-6 sm:gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left – headline */}
          <div>
            <div className="sm:mb-6 mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm">
              <GraduationCap className="size-4" />
              {exam.name}
            </div>

            <h1 className="text-xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
              Win Your{" "}
              <span className="text-blue-400">Scholarship </span>
              Through Merit
            </h1>

            <p className="sm:mt-5 mt-1 max-w-lg text-base leading-relaxed text-white/70">
              {exam.description}
            </p>

            <HeroStats />
          </div>

          {/* Right – registration card */}
          <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-black/30">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Register &amp; Start</h2>
              <p className="mt-1 text-sm text-gray-500">Fill in your details to begin the exam.</p>
            </div>
            <RegistrationForm examSlug={examSlug} />
          </div>
        </div>
      </section>

      <FeatureSection />
    </main>
  );
}
