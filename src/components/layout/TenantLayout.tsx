import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import { AppShell } from "./AppShell";

type TenantLayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export async function TenantLayout({
  children,
  title,
  description,
}: TenantLayoutProps) {
  const session = await getSession();

  return (
    <AppShell
      role="tenant"
      userName={session?.name}
      title={title}
      description={description}
    >
      {children}
    </AppShell>
  );
}
