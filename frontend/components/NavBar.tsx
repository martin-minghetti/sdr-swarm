"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/new", label: "New Research" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="bg-surface-0 h-16 flex items-center">
      <div className="mx-auto max-w-5xl w-full flex items-center justify-between px-6">
        <Link
          href="/"
          className="btn-neu shadow-[var(--shadow-neu-sm)] rounded-xl px-4 py-2 hover:shadow-[var(--shadow-neu-raised)]"
        >
          <span className="text-base font-bold text-text-primary tracking-tight">
            SDR Swarm
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link rounded-xl px-3.5 py-2 text-sm font-medium ${
                    isActive
                      ? "shadow-[var(--shadow-neu-inset)] text-accent font-semibold"
                      : "text-text-secondary hover:shadow-[var(--shadow-neu-sm)] hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
