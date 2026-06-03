import { Clock, Camera, Award } from "lucide-react";

interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
}

function StatBadge({ icon, label }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-1 text-white/80 text-[12px] sm:text-sm">
      <span className="text-white/60 shrink-0">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function HeroStats({ durationLabel }: { durationLabel: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 sm:mt-6">
      <StatBadge icon={<Clock className="size-4" />} label={durationLabel} />
      <span className="text-white/30 text-xs">•</span>
      <StatBadge icon={<Camera className="size-4" />} label="Proctored" />
      <span className="text-white/30 text-xs">•</span>
      <StatBadge icon={<Award className="size-4" />} label="Merit-based" />
    </div>
  );
}
