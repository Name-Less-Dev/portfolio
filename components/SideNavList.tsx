"use client";

import { useEffect, useState } from "react";

export type SideNavItem = { id: string; label: string; icon: React.ReactNode };

/**
 * Lista da navegação lateral. A seção ativa é a que cruza a faixa do meio da
 * viewport (IntersectionObserver com margem de −45% em cima e embaixo).
 * Os links são âncoras comuns: a rolagem suave (e o "sem animação" do
 * prefers-reduced-motion) já vem do CSS global.
 */
export default function SideNavList({ items }: { items: SideNavItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <ul className="flex flex-col items-center gap-4">
      {items.map(({ id, label, icon }) => {
        const isActive = id === active;
        return (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-label={label}
              aria-current={isActive ? "location" : undefined}
              data-active={isActive}
              className={`group relative flex size-8 items-center justify-center rounded-md focus-visible:outline-accent ${
                isActive ? "" : "[--die-edge:var(--muted)] [--die-glow:none]"
              }`}
            >
              <span
                className={`block transition-[transform,opacity] duration-300 motion-reduce:transition-none ${
                  isActive ? "scale-100 opacity-100" : "scale-75 opacity-60 group-hover:opacity-100"
                }`}
              >
                {icon}
              </span>
              {/* Tooltip: só no hover/foco, sem label visível por padrão */}
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full ml-3 rounded-md border border-muted/30 bg-surface px-2.5 py-1 text-small whitespace-nowrap text-fg opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {label}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
