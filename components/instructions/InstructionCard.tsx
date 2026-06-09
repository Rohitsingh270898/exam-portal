import type { LucideIcon } from "lucide-react";

interface InstructionCardProps {
  Icon: LucideIcon;
  title: string;
  description: string;
}

export default function InstructionCard({ Icon, title, description }: InstructionCardProps) {
  return (
    <div className="flex gap-4 items-start rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="mt-0.5 sm:text-sm text-[12px] text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
