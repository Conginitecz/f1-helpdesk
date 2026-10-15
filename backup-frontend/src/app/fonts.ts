import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

/*
 * DESIGN.md "Font Selections & Pairing":
 *   - Headings:      Hanken Grotesk
 *   - Body/controls: Inter
 *   - Telemetry/IDs: JetBrains Mono
 *
 * next/font self-hosts these: no browser request to Google and no layout
 * shift. Each exposes a CSS variable consumed by src/styles/tokens.css as
 * --font-headline / --font-body / --font-mono.
 *
 * Inter is a variable font on Google Fonts, so no `weight` is passed for it -
 * giving a variable font a discrete weight array makes next/font emit a
 * malformed query and the build fails. It ships the full 400-600 range the
 * designs use. Hanken Grotesk and JetBrains Mono list explicit weights.
 */

export const headlineFont = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--f1-headline",
  display: "swap",
});

export const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--f1-body",
  display: "swap",
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--f1-mono",
  display: "swap",
});

/** Class string for <html> so every font variable is in scope app-wide. */
export const fontVariables = `${headlineFont.variable} ${bodyFont.variable} ${monoFont.variable}`;
