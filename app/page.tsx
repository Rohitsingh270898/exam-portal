import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import { EXAM_CONFIGS } from "@/lib/exams";
import FeatureSection from "@/components/home/FeatureSection";

export default function HomePage() {
  const exams = Object.values(EXAM_CONFIGS);

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-[#05005a] px-4 py-16 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.25) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm">
            <GraduationCap className="size-4" />
            Scholarship Program 2026
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            Win Your{" "}
            <span className="text-blue-400">Scholarship</span>
            <br />
            Through Merit
          </h1>

          <p className="mt-5 mx-auto max-w-lg text-base leading-relaxed text-white/70">
            Select an exam below to register and begin your proctored online MCQ test.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {exams.map((exam) => (
              <Link
                key={exam.slug}
                href={`/${exam.slug}`}
                className="group relative flex flex-col items-start rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                  {exam.slug}
                </span>
                <h2 className="mt-2 text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  {exam.name}
                </h2>
                <p className="mt-1 text-sm text-white/60">{exam.subtitle}</p>
                <p className="mt-3 text-xs text-white/40">{exam.questions.length} questions</p>
                <ArrowRight className="mt-4 size-4 text-white/40 group-hover:text-blue-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FeatureSection />
    </main>
  );
}

