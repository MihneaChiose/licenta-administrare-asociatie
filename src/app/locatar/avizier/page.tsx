import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function TenantAnnouncementsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.TENANT) {
    redirect("/admin/dashboard");
  }

  const apartment = await prisma.apartment.findFirst({
    where: {
      ownerId: session.id,
    },
    include: {
      association: true,
    },
  });

  if (!apartment) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/locatar/dashboard"
            className="text-sm text-gray-600 hover:text-black"
          >
            Inapoi la dashboard
          </Link>

          <div className="mt-6 rounded-2xl bg-white p-8 shadow">
            <h1 className="text-2xl font-bold text-gray-900">
              Avizier virtual
            </h1>
            <p className="mt-4 text-gray-600">
              Nu exista niciun apartament asociat contului tau.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      associationId: apartment.associationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/locatar/dashboard"
          className="text-sm text-gray-600 hover:text-black"
        >
          Inapoi la dashboard
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900">Avizier virtual</h1>

          <p className="mt-2 text-gray-600">
            Anunturi pentru Apartamentul {apartment.number},{" "}
            {apartment.association.name}
          </p>
        </div>

        <section className="mt-8 rounded-2xl bg-white shadow">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Anunturi recente
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Total anunturi: {announcements.length}
            </p>
          </div>

          {announcements.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              Nu exista anunturi publicate momentan.
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="rounded-2xl border border-gray-200 p-6"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {announcement.title}
                    </h3>

                    <span className="text-sm text-gray-500">
                      {announcement.createdAt.toLocaleDateString("ro-RO")}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-700">
                    {announcement.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
