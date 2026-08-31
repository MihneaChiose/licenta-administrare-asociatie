import {
  CalendarDays,
  CircleDollarSign,
  Info,
  Layers3,
  Plus,
  ReceiptText,
  Split,
  Tags,
  WalletCards,
} from "lucide-react";
import { redirect } from "next/navigation";
import {
  ExpenseCategory,
  ExpenseDistributionMethod,
  UserRole,
} from "@/generated/prisma/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createExpenseAction } from "./actions";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_OPTIONS,
} from "@/lib/expenses";

type ExpensesPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const monthNames: Record<number, string> = {
  1: "Ianuarie",
  2: "Februarie",
  3: "Martie",
  4: "Aprilie",
  5: "Mai",
  6: "Iunie",
  7: "Iulie",
  8: "August",
  9: "Septembrie",
  10: "Octombrie",
  11: "Noiembrie",
  12: "Decembrie",
};

const distributionMethodLabels: Record<ExpenseDistributionMethod, string> = {
  PER_APARTMENT: "Per apartament",
  PER_PERSON: "Per persoana",
  BY_CONSUMPTION: "Dupa consum",
  BY_SURFACE: "Dupa suprafata",
  CUSTOM: "Custom",
};

const distributionMethodStyles: Record<ExpenseDistributionMethod, string> = {
  PER_APARTMENT: "border-violet-400/10 bg-violet-500/[0.07] text-violet-300",

  PER_PERSON: "border-cyan-400/10 bg-cyan-400/[0.06] text-cyan-300",

  BY_CONSUMPTION: "border-blue-400/10 bg-blue-400/[0.06] text-blue-300",

  BY_SURFACE: "border-emerald-400/10 bg-emerald-400/[0.06] text-emerald-300",

  CUSTOM: "border-amber-400/10 bg-amber-400/[0.06] text-amber-300",
};

const moneyFormatter = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default async function AdminExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const params = await searchParams;

  const expenses = await prisma.expense.findMany({
    where: {
      association: {
        adminId: session.id,
      },
    },

    include: {
      association: true,
    },

    orderBy: [
      {
        year: "desc",
      },
      {
        month: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const currentDate = new Date();

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const currentMonthExpenses = expenses.filter(
    (expense) => expense.month === currentMonth && expense.year === currentYear,
  );

  const currentMonthTotal = currentMonthExpenses.reduce(
    (total, expense) => total + Number(expense.totalAmount.toString()),
    0,
  );

  const totalRegisteredAmount = expenses.reduce(
    (total, expense) => total + Number(expense.totalAmount.toString()),
    0,
  );

  const categoryCount = new Set(expenses.map((expense) => expense.category))
    .size;

  return (
    <AdminLayout
      title="Cheltuieli lunare"
      description="Introdu si vizualizeaza cheltuielile lunare ale asociatiei."
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Financiar
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
              Situatie cheltuieli
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Imagine de ansamblu asupra cheltuielilor inregistrate.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Inregistrari
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {expenses.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Cheltuieli introduse
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <ReceiptText size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/[0.07] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Luna curenta
                  </p>

                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-50">
                    {moneyFormatter.format(currentMonthTotal)}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    RON in {monthNames[currentMonth]}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/10">
                  <CalendarDays size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-400/[0.07] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Total inregistrat
                  </p>

                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-50">
                    {moneyFormatter.format(totalRegisteredAmount)}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    RON in istoricul disponibil
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-blue-400/10 text-blue-300 ring-1 ring-blue-400/10">
                  <CircleDollarSign size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/[0.06] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Categorii utilizate
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {categoryCount}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Tipuri de cheltuieli
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/10">
                  <Tags size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.88fr_1.45fr]">
          <section className="app-card relative overflow-hidden">
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-violet-500/[0.05] blur-3xl" />

            <div className="relative border-b border-white/[0.07] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <Plus size={19} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />

                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                      Inregistrare
                    </p>
                  </div>

                  <h2 className="mt-1 text-lg font-semibold text-slate-100">
                    Adauga cheltuiala
                  </h2>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Completeaza datele necesare pentru o cheltuiala lunara.
              </p>
            </div>

            <div className="relative p-6">
              {params.error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.08] p-4 text-sm text-rose-300">
                  <Info size={18} className="mt-0.5 shrink-0" />

                  <p>{params.error}</p>
                </div>
              )}

              {params.success && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.08] p-4 text-sm text-emerald-300">
                  <ReceiptText size={18} className="mt-0.5 shrink-0" />

                  <p>{params.success}</p>
                </div>
              )}

              <form action={createExpenseAction} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="month"
                      className="text-sm font-medium text-slate-300"
                    >
                      Luna
                    </label>

                    <select
                      id="month"
                      name="month"
                      defaultValue={currentMonth}
                      className="app-input mt-2 px-3 py-3"
                    >
                      {Object.entries(monthNames).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="year"
                      className="text-sm font-medium text-slate-300"
                    >
                      An
                    </label>

                    <input
                      id="year"
                      name="year"
                      type="number"
                      defaultValue={currentYear}
                      required
                      className="app-input mt-2 px-3 py-3"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="text-sm font-medium text-slate-300"
                  >
                    Categorie cheltuiala
                  </label>

                  <select
                    id="category"
                    name="category"
                    className="app-input mt-2 px-3 py-3"
                    defaultValue={ExpenseCategory.COLD_WATER}
                  >
                    {EXPENSE_CATEGORY_OPTIONS.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="text-sm font-medium text-slate-300"
                  >
                    Descriere
                  </label>

                  <input
                    id="description"
                    name="description"
                    type="text"
                    required
                    placeholder="Ex: Factura apa rece luna curenta"
                    className="app-input mt-2 px-3 py-3"
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalAmount"
                    className="text-sm font-medium text-slate-300"
                  >
                    Suma totala
                  </label>

                  <div className="relative mt-2">
                    <WalletCards
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      id="totalAmount"
                      name="totalAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="Ex: 1200"
                      className="app-input py-3 pl-11 pr-16"
                    />

                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600">
                      RON
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="distributionMethod"
                    className="text-sm font-medium text-slate-300"
                  >
                    Metoda de impartire
                  </label>

                  <select
                    id="distributionMethod"
                    name="distributionMethod"
                    className="app-input mt-2 px-3 py-3"
                    defaultValue={ExpenseDistributionMethod.PER_APARTMENT}
                  >
                    <option value={ExpenseDistributionMethod.PER_APARTMENT}>
                      Per apartament
                    </option>

                    <option value={ExpenseDistributionMethod.PER_PERSON}>
                      Per persoana
                    </option>

                    <option value={ExpenseDistributionMethod.BY_CONSUMPTION}>
                      Dupa consum
                    </option>

                    <option value={ExpenseDistributionMethod.BY_SURFACE}>
                      Dupa suprafata
                    </option>

                    <option value={ExpenseDistributionMethod.CUSTOM}>
                      Custom
                    </option>
                  </select>

                  <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-blue-400/10 bg-blue-400/[0.04] p-3.5">
                    <Info size={16} className="mt-0.5 shrink-0 text-blue-300" />

                    <p className="text-xs leading-5 text-slate-500">
                      Metoda &quot;Dupa consum&quot; poate fi folosita doar
                      pentru utilitatile care au contor: apa rece, apa calda,
                      gaze, electricitate si caldura.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="app-button-primary inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
                >
                  <Plus size={17} />
                  Adauga cheltuiala
                </button>
              </form>
            </div>
          </section>

          <section className="app-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.65)]" />

                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                    Registru financiar
                  </p>
                </div>

                <h2 className="mt-2 text-lg font-semibold text-slate-100">
                  Cheltuieli introduse
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Total inregistrari: {expenses.length}
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-slate-500">
                <Layers3 size={15} />
                Evidenta lunara
              </div>
            </div>

            {expenses.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-slate-500">
                  <ReceiptText size={24} strokeWidth={1.7} />
                </div>

                <h3 className="mt-4 font-medium text-slate-300">
                  Nu exista cheltuieli
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Cheltuielile introduse pentru asociatie vor fi afisate aici.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Perioada
                      </th>

                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Categorie
                      </th>

                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Descriere
                      </th>

                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Suma
                      </th>

                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Impartire
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.055]">
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="transition-colors duration-150 hover:bg-violet-500/[0.035]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                              <CalendarDays size={16} />
                            </div>

                            <div>
                              <p className="font-medium text-slate-200">
                                {monthNames[expense.month]}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {expense.year}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-xs font-medium text-slate-300">
                            <Tags size={12} className="text-slate-500" />

                            {EXPENSE_CATEGORY_LABELS[expense.category]}
                          </span>
                        </td>

                        <td className="max-w-[320px] px-6 py-4">
                          <p className="truncate text-slate-400">
                            {expense.description}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold tabular-nums text-slate-200">
                              {moneyFormatter.format(
                                Number(expense.totalAmount.toString()),
                              )}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-600">RON</p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                              distributionMethodStyles[
                                expense.distributionMethod
                              ]
                            }`}
                          >
                            <Split size={12} />

                            {
                              distributionMethodLabels[
                                expense.distributionMethod
                              ]
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
