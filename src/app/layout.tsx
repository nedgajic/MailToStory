import type { Metadata } from "next";
import { BRAND_NAME, BRAND_OG_PATH, BRAND_URL } from "@/lib/brand";
import { getGaMeasurementId } from "@/lib/ga-measurement-id";
import { fontVariableClassNames } from "@/lib/fonts";
import { googleAuthEnabled } from "@/lib/google-auth-enabled";
import "./theme-tokens.css";
import "./globals.css";
import "./cookie-consent.css";
import "./auth-modal.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND_URL),
  title: `${BRAND_NAME} — Long threads, pleasant to read`,
  description:
    "Forward email threads to a private address and get flowing stories, timelines, and action lists — a unique, enjoyable way through long mail.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BRAND_URL,
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — Long threads, pleasant to read`,
    description:
      "Forward email threads to a private address and get flowing stories, timelines, and action lists — a unique, enjoyable way through long mail.",
    images: [
      {
        url: BRAND_OG_PATH,
        width: 1200,
        height: 630,
        alt: `${BRAND_NAME} — email threads turned into readable stories`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — Long threads, pleasant to read`,
    description:
      "Forward email threads to a private address and get flowing stories, timelines, and action lists — a unique, enjoyable way through long mail.",
    images: [BRAND_OG_PATH],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId = getGaMeasurementId();

  return (
    <html lang="en" className={fontVariableClassNames}>
      <body>
        <Providers
          googleEnabled={googleAuthEnabled()}
          gaMeasurementId={gaMeasurementId}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
