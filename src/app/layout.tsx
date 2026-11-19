import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { Providers } from "@/components/Providers";
import { TabBar } from "@/components/TabBar";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });

export const metadata: Metadata = {
  title: "Coy · Discover",
  description: "Swipe to discover people. Likes stay private until they're mutual.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body>
        <Providers>
          <div className="mx-auto flex h-dvh max-w-[480px] flex-col bg-white">
            <header className="flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))] pb-2">
              <span className="inline-flex items-baseline gap-0.5 text-[1.75rem] leading-none font-extrabold tracking-[-0.04em]">
                coy
                <span className="h-[0.32em] w-[0.32em] rounded-full bg-pink" />
              </span>
            </header>
            <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
            <TabBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
