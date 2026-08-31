"use client";

import {
  Bell,
  Building2,
  Calculator,
  CircleGauge,
  ClipboardList,
  CreditCard,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { SidebarLink } from "./SidebarLink";

type AppRole = "admin" | "tenant";

type AppShellProps = {
  role: AppRole;
  children: ReactNode;
  title?: string;
  description?: string;
};

const adminNavigation = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/apartamente",
    label: "Apartamente",
    icon: Building2,
  },
  {
    href: "/admin/consumuri",
    label: "Indexuri contoare",
    icon: Gauge,
  },
  {
    href: "/admin/cheltuieli",
    label: "Cheltuieli",
    icon: ReceiptText,
  },
  {
    href: "/admin/intretinere",
    label: "Intretinere",
    icon: Calculator,
  },
  {
    href: "/admin/plati",
    label: "Plati",
    icon: CreditCard,
  },
  {
    href: "/admin/sesizari",
    label: "Sesizari",
    icon: ClipboardList,
  },
  {
    href: "/admin/avizier",
    label: "Avizier",
    icon: Megaphone,
  },
];

const tenantNavigation = [
  {
    href: "/locatar/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/locatar/consum",
    label: "Indexuri contoare",
    icon: CircleGauge,
  },
  {
    href: "/locatar/intretinere",
    label: "Intretinere si plati",
    icon: WalletCards,
  },
  {
    href: "/locatar/sesizari",
    label: "Sesizari",
    icon: ClipboardList,
  },
  {
    href: "/locatar/avizier",
    label: "Avizier virtual",
    icon: Megaphone,
  },
];

export function AppShell({
  role,
  children,
  title,
  description,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = role === "admin";

  const navigation = isAdmin ? adminNavigation : tenantNavigation;

  const roleLabel = isAdmin ? "Administrator" : "Locatar";

  const panelLabel = isAdmin ? "Management workspace" : "Resident workspace";

  return (
    <div className="app-theme-dark min-h-screen bg-[#070b14] text-slate-100">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Inchide meniul"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col overflow-hidden border-r border-white/[0.06] bg-[#090d1a] transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-cyan-400/[0.08] blur-3xl" />

        <div className="relative flex h-full flex-col p-5">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-[0_8px_30px_rgba(105,92,246,0.3)]">
                <Building2 size={22} strokeWidth={1.8} className="text-white" />

                <div className="absolute inset-[1px] rounded-[15px] border border-white/20" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold tracking-tight text-white">
                    Administrare
                  </p>

                  <Sparkles size={13} className="text-violet-300" />
                </div>

                <p className="truncate text-xs font-medium tracking-[0.16em] text-slate-500">
                  ASOCIATIE
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
              aria-label="Inchide meniul"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-400/10 text-violet-200">
                {isAdmin ? <ShieldCheck size={19} /> : <UserRound size={19} />}
              </div>

              <div>
                <p className="text-xs text-slate-500">Modul curent</p>

                <p className="text-sm font-medium text-slate-200">
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex-1 overflow-y-auto pr-1">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Navigatie
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </nav>
          </div>

          <div className="mt-5 border-t border-white/[0.07] pt-4">
            <SidebarLink
              href="/logout"
              label="Deconectare"
              icon={LogOut}
              tone="danger"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="mt-4 px-3">
              <p className="text-[11px] leading-5 text-slate-600">
                Smart property management
              </p>

              <p className="text-[10px] text-slate-700">v1.0</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[286px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#090e1a]/80 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.07] hover:text-white lg:hidden"
                aria-label="Deschide meniul"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">
                  {panelLabel}
                </p>

                <p className="truncate text-sm font-medium text-slate-500">
                  Platforma administrare digitala
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Notificari"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-slate-400 transition hover:border-violet-400/20 hover:bg-violet-500/[0.07] hover:text-violet-300"
              >
                <Bell size={18} strokeWidth={1.8} />

                <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-violet-400 ring-2 ring-[#090e1a]" />
              </button>

              <div className="hidden items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] py-1.5 pl-2 pr-3 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-semibold text-white">
                  {isAdmin ? "A" : "L"}
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {roleLabel}
                  </p>

                  <p className="text-[10px] text-slate-500">Cont activ</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="app-workspace-background min-h-[calc(100vh-72px)]">
          <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
            {(title || description) && (
              <section className="animate-page-enter relative mb-8 overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#10182a]/70 px-6 py-6 shadow-[0_22px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:px-8 sm:py-7">
                <div className="pointer-events-none absolute right-0 top-0 h-36 w-56 bg-gradient-to-bl from-violet-500/[0.09] via-cyan-400/[0.035] to-transparent" />

                <div className="relative">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(105,92,246,0.7)]" />

                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {roleLabel}
                    </span>
                  </div>

                  {title && (
                    <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-50 sm:text-3xl">
                      {title}
                    </h1>
                  )}

                  {description && (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-[15px]">
                      {description}
                    </p>
                  )}
                </div>
              </section>
            )}

            <div className="animate-page-enter">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
