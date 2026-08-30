import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { TenantLayout } from "@/components/layout/TenantLayout";

export default async function TenantAnnouncementsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.TENANT) {
    redirect("/admin/dashboard");
  }

  const apartments = await prisma.apartment.findMany({
    where: {
      ownerId: session.id,
    },
    include: {
      association: true,
    },
    orderBy: {
      number: "asc",
    },
  });

  if (apartments.length === 0) {
    return (
      <TenantLayout
        title="Informatii indisponibile"
        description="Contul tau nu este asociat momentan unui apartament."
      >
        <div className="rounded-2xl bg-white p-8 shadow">
          <p className="text-gray-600">
            Contul tau nu este asociat niciunui apartament. Contacteaza
            administratorul asociatiei.
          </p>
        </div>
      </TenantLayout>
    );
  }

  const associationIds = [
    ...new Set(apartments.map((apartment) => apartment.associationId)),
  ];

  const announcements = await prisma.announcement.findMany({
    where: {
      associationId: {
        in: associationIds,
      },

      withdrawnAt: null,
    },

    include: {
      association: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <TenantLayout
      title="Avizier virtual"
      description="Anunturile asociatiilor din care fac parte apartamentele tale."
    >
      <div className="mx-auto max-w-5xl">
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
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {announcement.title}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-gray-600">
                        {announcement.association.name}
                      </p>
                    </div>

                    <span className="text-sm text-gray-500">
                      {announcement.createdAt.toLocaleDateString("ro-RO")}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {announcement.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </TenantLayout>
  );
}
