import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createAnnouncementAction } from "./actions";

type AdminAnnouncementsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminAnnouncementsPage({
  searchParams,
}: AdminAnnouncementsPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const params = await searchParams;

  const announcements = await prisma.announcement.findMany({
    where: {
      association: {
        adminId: session.id,
      },
    },
    include: {
      association: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/dashboard"
          className="text-sm text-gray-600 hover:text-black"
        >
          Inapoi la dashboard
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
          <section className="rounded-2xl bg-white p-8 shadow">
            <h1 className="text-3xl font-bold text-gray-900">Publica anunt</h1>

            <p className="mt-2 text-gray-600">
              Creeaza anunturi vizibile pentru locatarii din asociatia
              administrata.
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

            <form action={createAnnouncementAction} className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Titlu
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Ex: Oprire apa calda"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Continut
                </label>
                <textarea
                  name="content"
                  required
                  rows={8}
                  placeholder="Scrie anuntul pentru locatari..."
                  className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
              >
                Publica anuntul
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white shadow">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Anunturi publicate
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Total anunturi: {announcements.length}
              </p>
            </div>

            {announcements.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">
                Nu exista anunturi publicate.
              </div>
            ) : (
              <div className="space-y-4 p-6">
                {announcements.map((announcement) => (
                  <article
                    key={announcement.id}
                    className="rounded-2xl border border-gray-200 p-5"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {announcement.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Publicat la{" "}
                      {announcement.createdAt.toLocaleDateString("ro-RO")}
                    </p>

                    <p className="mt-4 whitespace-pre-line text-sm text-gray-700">
                      {announcement.content}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
