import type { ReactNode } from "react";
import { Cormorant_Garamond, Great_Vibes, Special_Elite } from "next/font/google";
import { AppShellFooter } from "@/components/app-shell-footer";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-special-elite",
  display: "swap",
});

export default function StoriesLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${cormorant.variable} ${greatVibes.variable} ${specialElite.variable}`}
    >
      {children}
      <AppShellFooter />
    </div>
  );
}
