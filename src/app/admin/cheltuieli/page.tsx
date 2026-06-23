import { redirect } from "next/navigation";
import { ExpenseDistributionMethod, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createExpenseAction } from "./actions";
import { AdminLayout } from "@/components/layout/AdminLayout";

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

  return (
    <AdminLayout
      title="Cheltuieli lunare"
      description="Introdu si vizualizeaza cheltuielile lunare ale asociatiei."
    >
      <div className="mx-auto max-w-7xl">
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          <section className="rounded-2xl bg-white p-8 shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Adauga cheltuiala
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Completeaza datele pentru o cheltuiala lunara.
            </p>

            {params.error && (
              <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {params.error}
              </div>
            )}

            {params.success && (
              <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                {params.success}
              </div>
            )}

            <form action={createExpenseAction} className="mt-8 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Luna
                  </label>
                  <select
                    name="month"
                    defaultValue={currentMonth}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  >
                    {Object.entries(monthNames).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    An
                  </label>
                  <input
                    name="year"
                    type="number"
                    defaultValue={currentYear}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Tip cheltuiala
                </label>
                <select
                  name="type"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  defaultValue="Apa rece"
                >
                  <option value="Apa rece">Apa rece</option>
                  <option value="Apa calda">Apa calda</option>
                  <option value="Gaze">Gaze</option>
                  <option value="Electricitate">Electricitate</option>
                  <option value="Caldura">Caldura</option>
                  <option value="Curatenie">Curatenie</option>
                  <option value="Lift">Lift</option>
                  <option value="Fond rulment">Fond rulment</option>
                  <option value="Fond reparatii">Fond reparatii</option>
                  <option value="Administrare">Administrare</option>
                  <option value="Altele">Altele</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Descriere
                </label>
                <input
                  name="description"
                  type="text"
                  required
                  placeholder="Ex: Factura apa rece luna curenta"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Suma totala RON
                </label>
                <input
                  name="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="Ex: 1200"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Metoda de impartire
                </label>
                <select
                  name="distributionMethod"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
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
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
              >
                Adauga cheltuiala
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white shadow">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Cheltuieli introduse
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Total inregistrari: {expenses.length}
              </p>
            </div>

            {expenses.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">
                Nu exista cheltuieli introduse.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-6 py-3 font-medium">Luna</th>
                      <th className="px-6 py-3 font-medium">Tip</th>
                      <th className="px-6 py-3 font-medium">Descriere</th>
                      <th className="px-6 py-3 font-medium">Suma</th>
                      <th className="px-6 py-3 font-medium">Impartire</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {monthNames[expense.month]} {expense.year}
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {expense.type}
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {expense.description}
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {expense.totalAmount.toString()} RON
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {distributionMethodLabels[expense.distributionMethod]}
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
