import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import { AppShell } from "./AppShell";

type AdminLayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export async function AdminLayout({
  children,
  title,
  description,
}: AdminLayoutProps) {
  const session = await getSession();

  return (
    <AppShell
      role="admin"
      userName={session?.name}
      title={title}
      description={description}
    >
      {children}
    </AppShell>
  );
}
