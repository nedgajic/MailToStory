import type { Metadata } from "next";
import { DM_Mono, Lora } from "next/font/google";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";
import "./theme-tokens.css";
import "./globals.css";
import { GoogleAnalytics } from "@/components/google-analytics";
import { Providers } from "@/components/providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BRAND_URL),
  title: `${BRAND_NAME} — Forward a thread, read the story`,
  description:
    "Sign up with any email. Forward threads to a private address and get structured stories, timelines, and action lists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="light"
      className={`${lora.variable} ${dmMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
      </head>
      <body>
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
