import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DashboardActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export function DashboardActionCard({
  href,
  title,
  description,
  icon: Icon,
}: DashboardActionCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[20px] border border-white/[0.065] bg-white/[0.025] p-5 transition duration-200 hover:-translate-y-1 hover:border-violet-400/20 hover:bg-violet-500/[0.045] hover:shadow-[0_20px_55px_rgba(0,0,0,0.18)]"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/[0.05] blur-3xl transition duration-300 group-hover:bg-violet-500/[0.1]" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/[0.06] bg-white/[0.04] text-slate-400 transition duration-200 group-hover:border-violet-400/15 group-hover:bg-violet-500/[0.1] group-hover:text-violet-300">
            <Icon size={20} strokeWidth={1.8} />
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition duration-200 group-hover:bg-white/[0.04] group-hover:text-violet-300">
            <ArrowUpRight
              size={17}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
        </div>

        <h3 className="mt-5 font-semibold tracking-[-0.02em] text-slate-200 transition group-hover:text-white">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </Link>
  );
}
