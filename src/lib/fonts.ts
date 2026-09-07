import {
  Cormorant_Garamond,
  DM_Mono,
  Great_Vibes,
  Lora,
  Special_Elite,
} from "next/font/google";

export const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
});

export const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-special-elite",
  display: "swap",
});

export const fontVariableClassNames = [
  lora.variable,
  dmMono.variable,
  cormorant.variable,
  greatVibes.variable,
  specialElite.variable,
].join(" ");
