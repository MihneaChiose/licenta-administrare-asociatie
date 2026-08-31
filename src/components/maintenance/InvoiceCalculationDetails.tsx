import {
  Calculator,
  CircleDollarSign,
  Info,
  Percent,
  Scale,
} from "lucide-react";
import {
  ExpenseCategory,
  ExpenseDistributionMethod,
} from "@/generated/prisma/client";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_DISTRIBUTION_METHOD_LABELS,
} from "@/lib/expenses";

type DecimalLike = {
  toString(): string;
};

type CalculationItem = {
  id: string;
  description: string;
  amount: DecimalLike;

  expenseCategory: ExpenseCategory | null;

  distributionMethod: ExpenseDistributionMethod | null;

  sourceAmount: DecimalLike | null;

  basisValue: DecimalLike | null;

  basisTotal: DecimalLike | null;

  sharePercentage: DecimalLike | null;

  basisUnit: string | null;
};

type InvoiceCalculationDetailsProps = {
  items: CalculationItem[];
};

const moneyFormatter = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const percentageFormatter = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

export function InvoiceCalculationDetails({
  items,
}: InvoiceCalculationDetailsProps) {
  return (
    <div className="min-w-0 space-y-3">
      {items.map((item) => {
        const hasSnapshot =
          item.expenseCategory !== null &&
          item.distributionMethod !== null &&
          item.sourceAmount !== null &&
          item.basisValue !== null &&
          item.basisTotal !== null &&
          item.sharePercentage !== null &&
          item.basisUnit !== null;

        return (
          <div
            key={item.id}
            className="relative min-w-0 overflow-hidden rounded-2xl border border-white/[0.065] bg-[#0b1220]/80 p-4 shadow-[0_14px_35px_rgba(0,0,0,0.15)]"
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-violet-500/[0.05] blur-3xl" />

            <div className="relative flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/[0.08] text-violet-300 ring-1 ring-violet-400/10">
                    <Calculator size={15} />
                  </div>

                  <p className="break-words font-medium text-slate-200">
                    {item.description}
                  </p>
                </div>

                {hasSnapshot && (
                  <p className="ml-10 mt-1 text-xs text-slate-500">
                    {EXPENSE_CATEGORY_LABELS[item.expenseCategory!]}
                  </p>
                )}
              </div>

              <div className="shrink-0 sm:text-right">
                <p className="text-xs uppercase tracking-[0.1em] text-slate-600">
                  Repartizat
                </p>

                <p className="mt-1 font-semibold tabular-nums text-slate-100">
                  {moneyFormatter.format(Number(item.amount.toString()))}{" "}
                  <span className="text-xs font-medium text-slate-500">
                    RON
                  </span>
                </p>
              </div>
            </div>

            {!hasSnapshot ? (
              <div className="relative mt-4 flex items-start gap-2.5 rounded-xl border border-amber-400/10 bg-amber-400/[0.045] p-3 text-sm leading-5 text-amber-200/80">
                <Info size={16} className="mt-0.5 shrink-0 text-amber-300" />
                Detaliile formulei de calcul nu sunt disponibile pentru această
                poziție istorică.
              </div>
            ) : (
              <>
                <dl className="relative mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                    <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                      <Scale size={12} />
                      Metodă
                    </dt>

                    <dd className="mt-1.5 text-sm font-medium text-slate-300">
                      {
                        EXPENSE_DISTRIBUTION_METHOD_LABELS[
                          item.distributionMethod!
                        ]
                      }
                    </dd>
                  </div>

                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                      Bază apartament
                    </dt>

                    <dd className="mt-1.5 text-sm font-medium tabular-nums text-slate-300">
                      {quantityFormatter.format(
                        Number(item.basisValue!.toString()),
                      )}{" "}
                      <span className="text-xs text-slate-500">
                        {item.basisUnit}
                      </span>
                    </dd>
                  </div>

                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                      Bază totală
                    </dt>

                    <dd className="mt-1.5 text-sm font-medium tabular-nums text-slate-300">
                      {quantityFormatter.format(
                        Number(item.basisTotal!.toString()),
                      )}{" "}
                      <span className="text-xs text-slate-500">
                        {item.basisUnit}
                      </span>
                    </dd>
                  </div>

                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                    <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                      <Percent size={12} />
                      Pondere
                    </dt>

                    <dd className="mt-1.5 text-sm font-medium tabular-nums text-cyan-300">
                      {percentageFormatter.format(
                        Number(item.sharePercentage!.toString()),
                      )}
                      %
                    </dd>
                  </div>

                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                    <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                      <CircleDollarSign size={12} />
                      Cheltuială totală
                    </dt>

                    <dd className="mt-1.5 text-sm font-medium tabular-nums text-slate-300">
                      {moneyFormatter.format(
                        Number(item.sourceAmount!.toString()),
                      )}{" "}
                      <span className="text-xs text-slate-500">RON</span>
                    </dd>
                  </div>

                  <div className="rounded-xl border border-violet-400/10 bg-violet-500/[0.045] p-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-400/70">
                      Sumă repartizată
                    </dt>

                    <dd className="mt-1.5 text-sm font-semibold tabular-nums text-violet-200">
                      {moneyFormatter.format(Number(item.amount.toString()))}{" "}
                      <span className="text-xs font-medium text-violet-300/60">
                        RON
                      </span>
                    </dd>
                  </div>
                </dl>

                <div className="relative mt-3 rounded-xl border border-cyan-400/[0.08] bg-cyan-400/[0.025] p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-400/60">
                    Formula aplicată
                  </p>

                  <p className="mt-2 break-words text-sm leading-6 text-slate-400">
                    <span className="font-medium text-slate-300">
                      {moneyFormatter.format(
                        Number(item.sourceAmount!.toString()),
                      )}{" "}
                      RON
                    </span>{" "}
                    ×{" "}
                    <span className="font-medium text-cyan-300">
                      {percentageFormatter.format(
                        Number(item.sharePercentage!.toString()),
                      )}
                      %
                    </span>{" "}
                    ≈{" "}
                    <span className="font-semibold text-violet-300">
                      {moneyFormatter.format(Number(item.amount.toString()))}{" "}
                      RON
                    </span>
                  </p>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
