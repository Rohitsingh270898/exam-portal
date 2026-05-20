import { Clock, Camera, Award } from "lucide-react";

interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
}

function StatBadge({ icon, label }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-1 text-white/80 text-sm shrink-0 min-w-0">
      <span className="text-white/60 shrink-0">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}

export default function HeroStats() {
  return (
    <div className="flex items-center gap-x-3 gap-y-0 mt-4 sm:mt-6 min-w-0">
      <StatBadge icon={<Clock className="size-4" />} label="5 min exam" />
      <span className="text-white/30 text-xs shrink-0">•</span>
      <StatBadge icon={<Camera className="size-4" />} label="Proctored" />
      <span className="text-white/30 text-xs shrink-0">•</span>
      <StatBadge icon={<Award className="size-4" />} label="Merit-based" />
    </div>
  );
}
