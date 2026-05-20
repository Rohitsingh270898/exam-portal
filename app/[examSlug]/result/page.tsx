import { getAllExamSlugs } from "@/lib/exams";
import ResultDisplay from "@/components/result/ResultDisplay";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Result",
};

export function generateStaticParams() {
  return getAllExamSlugs().map((slug) => ({ examSlug: slug }));
}

export default function ResultPage() {
  return <ResultDisplay />;
}
