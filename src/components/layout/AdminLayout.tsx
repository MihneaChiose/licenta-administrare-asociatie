import { ReactNode } from "react";
import { SidebarLink } from "./SidebarLink";

type AdminLayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function AdminLayout({
  children,
  title,
  description,
}: AdminLayoutProps) {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-gray-200 bg-white p-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Administrare Asociatie
            </h1>
            <p className="mt-1 text-sm text-gray-500">Panou administrator</p>
          </div>

          <nav className="mt-8 space-y-1">
            <SidebarLink href="/admin/dashboard" label="Dashboard" />
            <SidebarLink href="/admin/apartamente" label="Apartamente" />
            <SidebarLink href="/admin/consumuri" label="Indexuri contoare" />
            <SidebarLink href="/admin/cheltuieli" label="Cheltuieli" />
            <SidebarLink href="/admin/intretinere" label="Intretinere" />
            <SidebarLink href="/admin/plati" label="Plati" />
            <SidebarLink href="/admin/sesizari" label="Sesizari" />
            <SidebarLink href="/admin/avizier" label="Avizier" />
          </nav>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <SidebarLink href="/logout" label="Logout" />
          </div>
        </aside>

        <section className="p-8">
          {(title || description) && (
            <div className="mb-8">
              {title && (
                <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
              )}

              {description && (
                <p className="mt-2 text-gray-600">{description}</p>
              )}
            </div>
          )}

          {children}
        </section>
      </div>
    </main>
  );
}
