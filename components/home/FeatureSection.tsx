import { Camera, ShieldCheck, Shuffle } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: <Camera className="size-5" />,
    title: "Camera proctored",
    description: "Webcam stays on for the full exam.",
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: "Tab-switch guard",
    description: "Switching windows 3 times auto-submits.",
  },
  {
    icon: <Shuffle className="size-5" />,
    title: "Randomized",
    description: "Questions and options reshuffle every attempt.",
  },
] as const;

export default function FeatureSection() {
  return (
    <section className="bg-gray-50 pt-6 pb-10 sm:py-15 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="text-center sm:mb-12 mb-4">
          <h2 className="sm:text-3xl text-2xl text-left font-bold text-gray-900">How the exam works</h2>
          <p className="sm:mt-2 mt-1 text-gray-500 text-[12px] sm:text-sm text-left">A secure, proctored exam built for fairness.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
