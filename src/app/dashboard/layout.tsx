import type { ReactNode } from "react";
import { AppShellFooter } from "@/components/app-shell-footer";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AppShellFooter />
    </>
  );
}
