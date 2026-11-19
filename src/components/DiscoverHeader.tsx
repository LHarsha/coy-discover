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
    <div className="flex items-center justify-between gap-3 px-5 pt-1 pb-4 short:pb-2">
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-[-0.03em] short:text-[1.625rem]">Discover</h1>
      <div className="flex rounded-full bg-soft p-1 text-[0.875rem] font-bold">
        {SEGMENTS.map((s) => {
          const active = pathname === s.href;
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border-2 px-3.5 py-1.5 transition-colors ${
                active ? "border-ink bg-white text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
