import type { ReactNode } from "react";
import { AppShell } from "./AppShell";

type TenantLayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function TenantLayout({
  children,
  title,
  description,
}: TenantLayoutProps) {
  return (
    <AppShell role="tenant" title={title} description={description}>
      {children}
    </AppShell>
  );
}
