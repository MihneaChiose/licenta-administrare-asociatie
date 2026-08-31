import {
  Building2,
  CircleGauge,
  ClipboardList,
  Droplets,
  Megaphone,
  ReceiptText,
  TriangleAlert,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { TenantLayout } from "@/components/layout/TenantLayout";
import { StatisticsCard } from "@/components/dashboard/StatisticsCard";
import { DashboardActionCard } from "@/components/dashboard/DashboardActionCard";
import { getSession } from "@/lib/session";
import { getTenantDashboardStatistics } from "@/lib/dashboard/tenant-statistics";

export default async function TenantDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.TENANT) {
    redirect("/admin/dashboard");
  }

  const statistics = await getTenantDashboardStatistics(session.id);

  if (!statistics) {
    return (
      <TenantLayout
        title="Dashboard locatar"
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
                Apartament indisponibil
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Contul dumneavoastra nu este asociat momentan unui apartament.
              </p>
            </div>
          </div>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout
      title="Dashboard locatar"
      description={`Bine ai venit, ${session.name}. Ai aici situatia curenta a apartamentului tau.`}
    >
      <div className="space-y-10">
        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                  Apartamentul meu
                </p>
              </div>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
                Situatie curenta
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              Informatii actualizate despre apartament
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatisticsCard
              title="Apartament"
              value={statistics.apartmentNumber}
              description={`Etajul ${statistics.floor}`}
              icon={Building2}
              accent="violet"
            />

            <StatisticsCard
              title="Locatari"
              value={statistics.numberOfResidents}
              description="Persoane declarate in apartament"
              icon={UsersRound}
              accent="cyan"
            />

            <StatisticsCard
              title="Indexuri lunare"
              value={
                statistics.meterReadingsSubmitted ? "Transmise" : "Netransmise"
              }
              description="Indexuri pentru luna curenta"
              icon={Droplets}
              accent={statistics.meterReadingsSubmitted ? "emerald" : "amber"}
            />

            <StatisticsCard
              title="Intretinere curenta"
              value={`${Number(statistics.currentMaintenanceAmount).toFixed(
                2,
              )} RON`}
              description="Total pentru luna curenta"
              icon={ReceiptText}
              accent="blue"
            />

            <StatisticsCard
              title="Facturi restante"
              value={statistics.unpaidInvoices}
              description="Facturi neachitate"
              icon={WalletCards}
              accent={statistics.unpaidInvoices > 0 ? "rose" : "emerald"}
            />

            <StatisticsCard
              title="Sesizari active"
              value={statistics.activeTickets}
              description="Sesizari deschise sau aflate in lucru"
              icon={ClipboardList}
              accent={statistics.activeTickets > 0 ? "amber" : "emerald"}
            />
          </div>
        </section>

        <section>
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.65)]" />

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                Navigare rapida
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
              Acces rapid
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Cele mai utilizate functionalitati ale contului tau.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DashboardActionCard
              href="/locatar/consum"
              title="Indexuri contoare"
              description="Transmite indexurile contoarelor pentru luna curenta."
              icon={CircleGauge}
            />

            <DashboardActionCard
              href="/locatar/intretinere"
              title="Intretinere si plati"
              description="Consulta intretinerea si gestioneaza platile."
              icon={WalletCards}
            />

            <DashboardActionCard
              href="/locatar/sesizari"
              title="Sesizari"
              description="Trimite o sesizare si urmareste starea acesteia."
              icon={ClipboardList}
            />

            <DashboardActionCard
              href="/locatar/avizier"
              title="Avizier virtual"
              description="Consulta anunturile publicate de administrator."
              icon={Megaphone}
            />
          </div>
        </section>
      </div>
    </TenantLayout>
  );
}
