import type { ReactNode } from "react";
import { AppShell } from "./AppShell";

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
    <AppShell role="admin" title={title} description={description}>
      {children}
    </AppShell>
  );
}
