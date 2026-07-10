import type { Metadata } from "next";
import { DM_Mono, Lora } from "next/font/google";
import "./theme-tokens.css";
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
  metadataBase: new URL("https://gmailstory.com"),
  title: "Gmail Story — Turn email threads into calm reading",
  description:
    "Sign in with Google and turn Gmail threads into structured stories: narrative, timeline, open actions, and exports.",
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
            __html: `(function(){try{document.documentElement.setAttribute("data-theme","light");}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
