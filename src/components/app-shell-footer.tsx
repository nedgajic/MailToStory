import { MarketingHomeFooter } from "@/components/landing/marketing-home-footer";
import "@/app/marketing-home.css";

/** Homepage-style footer for logged-in app pages (dashboard, stories, settings). */
export function AppShellFooter() {
  return <MarketingHomeFooter hashPrefix="/" variant="app" />;
}
