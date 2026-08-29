import type { ReactNode } from "react";
import { AppShellFooter } from "@/components/app-shell-footer";
import { MarketingHeader } from "@/components/landing/marketing-header";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mkt admin-shell">
      <MarketingHeader />
      {children}
      <AppShellFooter />
    </div>
  );
}
