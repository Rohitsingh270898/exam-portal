import { notFound } from "next/navigation";
import { GraduationCap, Clock, Camera, ShieldCheck, Shuffle, LayoutGrid, Award } from "lucide-react";
import type { Metadata } from "next";

import InstructionCard from "@/components/instructions/InstructionCard";
import StartExamSection from "@/components/instructions/StartExamSection";
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
  return { title: `Instructions — ${exam.name}` };
}

export default async function InstructionsPage({ params }: Props) {
  const { examSlug } = await params;
  const exam = getExamConfig(examSlug);
  if (!exam) notFound();

  const durationSeconds = exam.durationSeconds;
  const durationLabel =
    durationSeconds >= 60
      ? `${durationSeconds / 60} minute${durationSeconds / 60 > 1 ? "s" : ""}`
      : `${durationSeconds} seconds`;

  const instructions = [
    {
      Icon: Clock,
      title: "Duration",
      description: `You have exactly ${durationLabel}. The timer auto-submits at zero.`,
    },
    {
      Icon: Camera,
      title: "Webcam required",
      description: "Your webcam stays on for the entire session.",
    },
    {
      Icon: ShieldCheck,
      title: "Tab-switch guard",
      description: "Leaving the tab 3 times will auto-submit your exam.",
    },
    {
      Icon: Shuffle,
      title: "Randomized",
      description: "Questions and options are shuffled each attempt.",
    },
  ] as const;

  const conductRules = [
    "No external help, notes, or additional devices.",
    "Stay in front of the camera for the full duration.",
    "Do not refresh the page — your attempt will be lost.",
    "By proceeding you certify the responses are your own.",
  ];

  return (
    <main className="min-h-screen bg-white py-4 sm:py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="sm:mb-10 mb-4 text-center">
          <div className="sm:mb-4 mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-blue-700">
            <GraduationCap className="size-4" />
            {exam.name}
          </div>
          <h1 className="sm:text-3xl text-xl font-extrabold text-gray-900">Exam Instructions</h1>
          <p className="sm:mt-2 mt-0 text-sm text-gray-500">{exam.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {instructions.map((item) => (
            <InstructionCard key={item.title} Icon={item.Icon} title={item.title} description={item.description} />
          ))}
        </div>

        <div className="sm:mt-8 mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-3">Code of Conduct</h3>
          <ul className="flex flex-col gap-2">
            {conductRules.map((rule) => (
              <li key={rule} className="flex items-start gap-2 text-[12px] sm:text-sm text-gray-600">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gray-400" />
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <StartExamSection examSlug={examSlug} />
      </div>
    </main>
  );
}
