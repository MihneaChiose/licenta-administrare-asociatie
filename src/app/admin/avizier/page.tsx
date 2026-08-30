import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CreateAnnouncementForm } from "./CreateAnnouncementForm";
import { WithdrawAnnouncementButton } from "./WithdrawAnnouncementButton";
import { EditAnnouncementForm } from "./EditAnnouncementForm";

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

  const associations = await prisma.association.findMany({
    where: {
      adminId: session.id,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

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

  const activeAnnouncements = announcements.filter(
    (announcement) => announcement.withdrawnAt === null,
  );

  const withdrawnAnnouncements = announcements.filter(
    (announcement) => announcement.withdrawnAt !== null,
  );

  return (
    <AdminLayout
      title="Avizier virtual"
      description="Publica si administreaza anunturile vizibile pentru locatarii din asociatiile administrate."
    >
      <div className="mx-auto max-w-6xl">
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

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Total anunturi</p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {announcements.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Active</p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {activeAnnouncements.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Retrase</p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {withdrawnAnnouncements.length}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
          <section className="rounded-2xl bg-white p-8 shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Publica anunt
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Selecteaza asociatia si completeaza continutul anuntului.
            </p>

            {associations.length === 0 ? (
              <div className="mt-8 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
                Nu exista nicio asociatie administrata de acest cont.
              </div>
            ) : (
              <CreateAnnouncementForm associations={associations} />
            )}
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
                {announcements.map((announcement) => {
                  const isWithdrawn = announcement.withdrawnAt !== null;

                  return (
                    <article
                      key={announcement.id}
                      className={`rounded-2xl border p-5 ${
                        isWithdrawn
                          ? "border-gray-200 bg-gray-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {announcement.title}
                            </h3>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                isWithdrawn
                                  ? "bg-gray-200 text-gray-700"
                                  : "bg-green-50 text-green-700"
                              }`}
                            >
                              {isWithdrawn ? "Retras" : "Activ"}
                            </span>
                          </div>

                          <p className="mt-1 text-sm font-medium text-gray-600">
                            {announcement.association.name}
                          </p>
                        </div>

                        <span className="text-sm text-gray-500">
                          {announcement.createdAt.toLocaleDateString("ro-RO")}
                        </span>
                      </div>

                      <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
                        {announcement.content}
                      </p>

                      {announcement.withdrawnAt && (
                        <p className="mt-4 text-xs text-gray-500">
                          Retras la{" "}
                          {announcement.withdrawnAt.toLocaleDateString("ro-RO")}
                        </p>
                      )}

                      {!isWithdrawn && (
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <EditAnnouncementForm
                              announcementId={announcement.id}
                              initialTitle={announcement.title}
                              initialContent={announcement.content}
                            />

                            <WithdrawAnnouncementButton
                              announcementId={announcement.id}
                            />
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
