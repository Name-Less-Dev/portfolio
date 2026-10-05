"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  techs: string[];
  /** ilustração do dado (renderizada no servidor) */
  icon: React.ReactNode;
};

/**
 * Carta com flip em CSS (perspective + rotateY), sem canvas.
 * - Mouse: hover vira (o `hover:` do Tailwind só vale em dispositivos com hover real).
 * - Toque/teclado: tap ou Enter/Espaço alterna; tocar fora desvira.
 * - O verso fica sempre no DOM, então leitores de tela leem as tecnologias sem virar nada.
 */
export default function SkillCard({ name, techs, icon }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [turning, setTurning] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const lastPointer = useRef<string | null>(null);

  useEffect(() => {
    if (!flipped) return;
    const onOutside = (e: PointerEvent) => {
      if (!card.current?.contains(e.target as Node)) setFlipped(false);
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [flipped]);

  return (
    <div
      ref={card}
      tabIndex={0}
      data-flipped={flipped}
      aria-label={`${name}: ${techs.join(", ")}`}
      className="group h-72 cursor-pointer rounded-xl perspective-[1000px] focus-visible:outline-accent"
      onPointerDown={(e) => (lastPointer.current = e.pointerType)}
      onClick={() => {
        // Com mouse quem vira é o hover; o clique só alterna em toque/caneta
        if (lastPointer.current !== "mouse") setFlipped((f) => !f);
        lastPointer.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
    >
      <div
        className={`relative h-full w-full transition-transform duration-[450ms] ease-[cubic-bezier(.3,.7,.3,1)] transform-3d motion-reduce:transition-none group-hover:rotate-y-180 ${flipped ? "rotate-y-180" : ""}`}
        onTransitionRun={(e) => e.target === e.currentTarget && setTurning(true)}
        onTransitionEnd={(e) => e.target === e.currentTarget && setTurning(false)}
        onTransitionCancel={(e) => e.target === e.currentTarget && setTurning(false)}
      >
        {/* Frente */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-xl border bg-surface/[0.18] p-6 text-center backface-hidden transition-[border-color,box-shadow] duration-300 ${turning ? "border-accent/60 shadow-[0_0_22px_-6px_color-mix(in_srgb,var(--accent)_45%,transparent)]" : "border-muted/30"}`}
        >
          {icon}
          <h3 className="font-display text-h3 font-semibold">{name}</h3>
        </div>

        {/* Verso */}
        <div
          className={`absolute inset-0 flex rotate-y-180 flex-col justify-center rounded-xl border bg-surface p-6 backface-hidden transition-[border-color,box-shadow] duration-300 ${turning ? "border-accent/60 shadow-[0_0_22px_-6px_color-mix(in_srgb,var(--accent)_45%,transparent)]" : "border-muted/40"}`}
        >
          <p className="text-small text-fg/60">{name}</p>
          <ul className="mt-2 space-y-1 text-fg">
            {techs.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
