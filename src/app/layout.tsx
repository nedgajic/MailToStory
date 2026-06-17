import type { Metadata } from "next";
import { DM_Mono, Lora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";

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
  title: "Gmail Digest",
  description: "Readable digests for Gmail threads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeBoot =
    '(function(){document.documentElement.setAttribute("data-theme","light");})();';

  return (
    <html lang="en" suppressHydrationWarning data-theme="light">
      <body className={`${lora.variable} ${dmMono.variable}`}>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
