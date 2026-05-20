import { notFound } from "next/navigation";
import type { Metadata } from "next";

import ExamClient from "@/components/exam/ExamClient";
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
  return { title: `Exam — ${exam.name}` };
}

export default async function ExamPage({ params }: Props) {
  const { examSlug } = await params;
  const config = getExamConfig(examSlug);
  if (!config) notFound();

  return <ExamClient config={config} />;
}
