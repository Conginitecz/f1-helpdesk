import type { Metadata } from "next";
import { AuthNavigation } from "@/components/auth-navigation";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "F1 Help Desk",
  description: "F1 Help Desk — Admin & Super Admin dashboard",
};

/*
 * All three design type families are self-hosted through next/font (see
 * fonts.ts) and every icon is a self-hosted subset (src/styles/icons.css), so
 * there is no runtime request to Google Fonts and no third-party stylesheet in
 * the document head.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface-base font-body text-body-md text-text-primary">
        <AuthNavigation />
        {children}
      </body>
    </html>
  );
}


