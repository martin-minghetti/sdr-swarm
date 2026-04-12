"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    queueMicrotask(() => {
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    });
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="btn-neu w-9 h-9 rounded-xl flex items-center justify-center shadow-[var(--shadow-neu-sm)] hover:shadow-[var(--shadow-neu-raised)] text-text-secondary hover:text-text-primary text-sm"
    >
      {dark ? "\u2600\uFE0F" : "\u263E"}
    </button>
  );
}
