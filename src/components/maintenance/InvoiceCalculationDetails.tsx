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
    <div className="min-w-0 space-y-4">
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
            className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="wrap-break-word font-medium text-gray-900">
                  {item.description}
                </p>

                {hasSnapshot && (
                  <p className="mt-1 text-sm text-gray-500">
                    {EXPENSE_CATEGORY_LABELS[item.expenseCategory!]}
                  </p>
                )}
              </div>

              <p className="shrink-0 font-semibold text-gray-900">
                {moneyFormatter.format(Number(item.amount.toString()))} RON
              </p>
            </div>

            {!hasSnapshot ? (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                Detaliile formulei de calcul nu sunt disponibile pentru această
                poziție istorică.
              </div>
            ) : (
              <>
                <dl className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Metodă
                    </dt>

                    <dd className="mt-1 text-sm text-gray-900">
                      {
                        EXPENSE_DISTRIBUTION_METHOD_LABELS[
                          item.distributionMethod!
                        ]
                      }
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Bază apartament
                    </dt>

                    <dd className="mt-1 text-sm text-gray-900">
                      {quantityFormatter.format(
                        Number(item.basisValue!.toString()),
                      )}{" "}
                      {item.basisUnit}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Bază totală
                    </dt>

                    <dd className="mt-1 text-sm text-gray-900">
                      {quantityFormatter.format(
                        Number(item.basisTotal!.toString()),
                      )}{" "}
                      {item.basisUnit}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Pondere
                    </dt>

                    <dd className="mt-1 text-sm text-gray-900">
                      {percentageFormatter.format(
                        Number(item.sharePercentage!.toString()),
                      )}
                      %
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Cheltuială totală
                    </dt>

                    <dd className="mt-1 text-sm text-gray-900">
                      {moneyFormatter.format(
                        Number(item.sourceAmount!.toString()),
                      )}{" "}
                      RON
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Sumă repartizată
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-gray-900">
                      {moneyFormatter.format(Number(item.amount.toString()))}{" "}
                      RON
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  Calcul proporțional:{" "}
                  {moneyFormatter.format(Number(item.sourceAmount!.toString()))}{" "}
                  RON ×{" "}
                  {percentageFormatter.format(
                    Number(item.sharePercentage!.toString()),
                  )}
                  % ≈{" "}
                  <span className="font-medium text-gray-900">
                    {moneyFormatter.format(Number(item.amount.toString()))} RON
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
