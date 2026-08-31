import {
  BellRing,
  Building2,
  Calculator,
  ClipboardList,
  CreditCard,
  Gauge,
  Megaphone,
  ReceiptText,
  TriangleAlert,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatisticsCard } from "@/components/dashboard/StatisticsCard";
import { DashboardActionCard } from "@/components/dashboard/DashboardActionCard";
import { getSession } from "@/lib/session";
import { getAdminDashboardStatistics } from "@/lib/dashboard/admin-statistics";

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const statistics = await getAdminDashboardStatistics(session.id);

  if (!statistics) {
    return (
      <AdminLayout
        title="Dashboard administrator"
        description={`Bine ai venit, ${session.name}.`}
      >
        <div className="app-card relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-400/[0.06] blur-3xl" />

          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/10">
              <TriangleAlert size={22} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Asociatie indisponibila
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Contul dumneavoastra de administrator nu este asociat momentan
                unei asociatii.
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Dashboard administrator"
      description={`Bine ai venit, ${session.name}. Ai aici o imagine de ansamblu asupra activitatii asociatiei.`}
    >
      <div className="space-y-10">
        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                  Overview
                </p>
              </div>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
                Situatie generala
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              Indicatorii principali ai asociatiei
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatisticsCard
              title="Apartamente"
              value={statistics.totalApartments}
              description="Apartamente administrate"
              icon={Building2}
              accent="violet"
            />

            <StatisticsCard
              title="Locatari"
              value={statistics.totalResidents}
              description="Persoane declarate in apartamente"
              icon={UsersRound}
              accent="cyan"
            />

            <StatisticsCard
              title="Cheltuieli luna aceasta"
              value={`${Number(statistics.totalExpenses).toFixed(2)} RON`}
              description="Total cheltuieli in luna curenta"
              icon={ReceiptText}
              accent="blue"
            />

            <StatisticsCard
              title="Facturi restante"
              value={statistics.unpaidInvoices}
              description="Facturi care nu au fost achitate"
              icon={WalletCards}
              accent={statistics.unpaidInvoices > 0 ? "rose" : "emerald"}
            />

            <StatisticsCard
              title="Plati in asteptare"
              value={statistics.pendingPayments}
              description="Plati care necesita verificare"
              icon={CreditCard}
              accent={statistics.pendingPayments > 0 ? "amber" : "emerald"}
            />

            <StatisticsCard
              title="Sesizari active"
              value={statistics.openTickets}
              description="Sesizari deschise sau aflate in lucru"
              icon={BellRing}
              accent={statistics.openTickets > 0 ? "amber" : "emerald"}
            />
          </div>
        </section>

        <section>
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.65)]" />

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                Management
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
              Acces rapid
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Acceseaza direct principalele zone de administrare.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DashboardActionCard
              href="/admin/apartamente"
              title="Apartamente"
              description="Gestionare apartamente si datele locatarilor."
              icon={UserRound}
            />

            <DashboardActionCard
              href="/admin/consumuri"
              title="Indexuri contoare"
              description="Vizualizeaza indexurile transmise de locatari."
              icon={Gauge}
            />

            <DashboardActionCard
              href="/admin/cheltuieli"
              title="Cheltuieli"
              description="Introdu si gestioneaza cheltuielile asociatiei."
              icon={ReceiptText}
            />

            <DashboardActionCard
              href="/admin/intretinere"
              title="Intretinere"
              description="Genereaza si gestioneaza listele lunare de plata."
              icon={Calculator}
            />

            <DashboardActionCard
              href="/admin/plati"
              title="Plati"
              description="Verifica si confirma platile transmise."
              icon={CreditCard}
            />

            <DashboardActionCard
              href="/admin/sesizari"
              title="Sesizari"
              description="Monitorizeaza solicitarile transmise de locatari."
              icon={ClipboardList}
            />

            <DashboardActionCard
              href="/admin/avizier"
              title="Avizier"
              description="Publica si administreaza anunturile locatarilor."
              icon={Megaphone}
            />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
