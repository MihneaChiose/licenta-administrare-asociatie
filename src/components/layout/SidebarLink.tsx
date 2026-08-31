"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

type SidebarLinkProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  tone?: "default" | "danger";
};

export function SidebarLink({
  href,
  label,
  icon: Icon,
  onClick,
  tone = "default",
}: SidebarLinkProps) {
  const pathname = usePathname();

  const isActive =
    pathname === href ||
    (href !== "/logout" && pathname.startsWith(`${href}/`));

  if (tone === "danger") {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] transition group-hover:bg-red-500/10">
          <Icon size={18} strokeWidth={1.8} />
        </span>

        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
      }`}
    >
      {isActive && (
        <>
          <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gradient-to-b from-violet-400 to-cyan-400" />

          <span className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.08] to-transparent" />
        </>
      )}

      <span
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-br from-violet-500/25 to-cyan-400/10 text-violet-200"
            : "bg-white/[0.035] text-slate-500 group-hover:text-slate-200"
        }`}
      >
        <Icon size={18} strokeWidth={1.8} />
      </span>

      <span className="relative">{label}</span>
    </Link>
  );
}
