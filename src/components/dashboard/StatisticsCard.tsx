import type { LucideIcon } from "lucide-react";

type StatisticsCardAccent =
  | "violet"
  | "cyan"
  | "emerald"
  | "amber"
  | "rose"
  | "blue";

type StatisticsCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  accent?: StatisticsCardAccent;
};

const accentStyles: Record<
  StatisticsCardAccent,
  {
    icon: string;
    glow: string;
    line: string;
    dot: string;
  }
> = {
  violet: {
    icon: "bg-violet-500/10 text-violet-300 ring-violet-400/10",
    glow: "bg-violet-500/[0.10]",
    line: "from-violet-500/80 via-violet-400/20",
    dot: "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.75)]",
  },

  cyan: {
    icon: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/10",
    glow: "bg-cyan-400/[0.09]",
    line: "from-cyan-400/80 via-cyan-300/20",
    dot: "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.7)]",
  },

  emerald: {
    icon: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/10",
    glow: "bg-emerald-400/[0.08]",
    line: "from-emerald-400/80 via-emerald-300/20",
    dot: "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.7)]",
  },

  amber: {
    icon: "bg-amber-400/10 text-amber-300 ring-amber-400/10",
    glow: "bg-amber-400/[0.08]",
    line: "from-amber-400/80 via-amber-300/20",
    dot: "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.7)]",
  },

  rose: {
    icon: "bg-rose-400/10 text-rose-300 ring-rose-400/10",
    glow: "bg-rose-400/[0.08]",
    line: "from-rose-400/80 via-rose-300/20",
    dot: "bg-rose-300 shadow-[0_0_10px_rgba(253,164,175,0.7)]",
  },

  blue: {
    icon: "bg-blue-400/10 text-blue-300 ring-blue-400/10",
    glow: "bg-blue-400/[0.08]",
    line: "from-blue-400/80 via-blue-300/20",
    dot: "bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.7)]",
  },
};

export function StatisticsCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "violet",
}: StatisticsCardProps) {
  const styles = accentStyles[accent];

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#10182a]/75 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:p-6">
      <div
        className={`pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full blur-3xl transition-opacity duration-300 ${styles.glow}`}
      />

      <div
        className={`pointer-events-none absolute bottom-0 left-0 h-px w-3/4 bg-gradient-to-r ${styles.line} to-transparent`}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`}
              />

              <p className="truncate text-sm font-medium text-slate-400">
                {title}
              </p>
            </div>

            <p className="mt-4 break-words text-2xl font-semibold tracking-[-0.04em] text-slate-50 sm:text-3xl">
              {value}
            </p>
          </div>

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ring-1 ${styles.icon}`}
          >
            <Icon size={20} strokeWidth={1.8} />
          </div>
        </div>

        {description && (
          <p className="mt-3 text-sm leading-5 text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}
