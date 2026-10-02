import type { Metadata } from "next";
import Link from "next/link";
import Game from "@/components/game/Game";

// "Crítico Natural": acessível pelo ícone de play da Navbar e pelo link no Contato
export const metadata: Metadata = {
  title: "Crítico Natural — Matheus Bezerra",
  description: "Um bullet hell onde você é um d20 rolando dano contra dados inimigos.",
};

export default function CriticoPage() {
  return (
    <main className="flex h-svh flex-col gap-3 p-4 md:p-6">
      <Link href="/" className="self-start text-small text-fg/70 transition-colors hover:text-accent">
        ← Voltar pro portfólio
      </Link>
      {/* Arena: delimitada por uma borda fina, mesma linguagem dos painéis do site */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-muted/30 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,color-mix(in_srgb,var(--accent)_6%,transparent),transparent_100%)]">
        <Game />
      </div>
    </main>
  );
}
