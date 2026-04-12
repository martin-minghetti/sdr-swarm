"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setAnimating(true);
      setDisplayChildren(children);
    });
    const timer = setTimeout(() => setAnimating(false), 350);
    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div className={animating ? "animate-page-enter" : ""}>
      {displayChildren}
    </div>
  );
}
