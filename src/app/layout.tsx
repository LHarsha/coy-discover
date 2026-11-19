import type { Metadata, Viewport } from "next";
import { TabBar } from "@/components/TabBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coy · Discover",
  description: "Swipe to discover people. Likes stay private until they're mutual.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f43f6b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex h-dvh max-w-md flex-col bg-white shadow-sm">
          <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
          <TabBar />
        </div>
      </body>
    </html>
  );
}
