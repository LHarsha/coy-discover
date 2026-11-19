"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/home",
    label: "Home",
    icon: (
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    ),
  },
  {
    href: "/discover",
    label: "Discover",
    icon: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="3" />
        <path d="M12 15.5s-3.5-2.1-3.5-4.6A2 2 0 0 1 12 9.6a2 2 0 0 1 3.5 1.3c0 2.5-3.5 4.6-3.5 4.6Z" />
      </>
    ),
  },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="border-t border-black/5 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="flex">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  active ? "text-brand" : "text-black/40 hover:text-black/60"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
                  {tab.icon}
                </svg>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
