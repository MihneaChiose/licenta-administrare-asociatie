import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { getSession } from "@/lib/session";
import { createApartmentAction } from "./actions";

type NewApartmentPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewApartmentPage({
  searchParams,
}: NewApartmentPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const params = await searchParams;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/apartamente"
          className="text-sm text-gray-600 hover:text-black"
        >
          Inapoi la apartamente
        </Link>

        <div className="mt-6 rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-gray-900">
            Adauga apartament
          </h1>

          <p className="mt-2 text-gray-600">
            Creeaza un locatar nou si asociaza-l cu un apartament din asociatia
            administrata.
          </p>

          {params.error && (
            <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {params.error}
            </div>
          )}

          <form action={createApartmentAction} className="mt-8 space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Date locatar
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Nume locatar
                  </label>
                  <input
                    name="tenantName"
                    type="text"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                    placeholder="Ex: Popescu Andrei"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email locatar
                  </label>
                  <input
                    name="tenantEmail"
                    type="email"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                    placeholder="locatar@email.com"
                  />
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-500">
                Parola initiala pentru locatar va fi:{" "}
                <span className="font-medium text-gray-800">locatar123</span>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Date apartament
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Numar apartament
                  </label>
                  <input
                    name="apartmentNumber"
                    type="text"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                    placeholder="Ex: 12"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Etaj
                  </label>
                  <input
                    name="floor"
                    type="number"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                    placeholder="Ex: 3"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Suprafata mp
                  </label>
                  <input
                    name="surface"
                    type="number"
                    step="0.01"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                    placeholder="Ex: 55.5"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Numar persoane
                  </label>
                  <input
                    name="numberOfResidents"
                    type="number"
                    min="1"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                    placeholder="Ex: 2"
                  />
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
              <Link
                href="/admin/apartamente"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Anuleaza
              </Link>

              <button
                type="submit"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Salveaza apartamentul
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
