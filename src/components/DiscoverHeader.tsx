"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENTS = [
  { href: "/discover", label: "People" },
  { href: "/discover/matches", label: "Matches" },
];

export function DiscoverHeader() {
  const pathname = usePathname();
  return (
    <header className="flex items-center justify-between px-5 pt-4 pb-3">
      <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
      <div className="flex rounded-full bg-black/5 p-1 text-sm font-medium">
        {SEGMENTS.map((s) => {
          const active = pathname === s.href;
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 transition-colors ${
                active ? "bg-white text-ink shadow-sm" : "text-black/50 hover:text-black/70"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
