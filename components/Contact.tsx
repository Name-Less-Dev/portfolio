import Link from "next/link";
import type { BackdropDie } from "./hero/dice";
import { RestingDie } from "./hero/scene";
import SectionAtmosphere from "./SectionAtmosphere";

const EMAIL = "matheusdearaujobezerra@gmail.com";

const links = [
  { label: "GitHub", href: "https://github.com/Name-Less-Dev" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/matheus-araujo-bezerra" },
];

// Mesma lógica do Sobre: cantos e margens laterais, longe do conteúdo centralizado.
// Na tela: x = 50% + nx·40%, y = 50% − ny·37% da seção.
const DICE: BackdropDie[] = [
  { shape: 0, scale: 0.3, rest: [-1.08, 1.12, -7] }, // canto superior esquerdo
  { shape: 3, scale: 0.28, rest: [1.12, 0.05, -8] }, // margem direita, meio
  { shape: 4, scale: 0.3, rest: [1.06, -1.2, -7.5] }, // canto inferior direito
];

/**
 * Contato: seção curta e centralizada (a única, além da Hero). Um d20 em repouso
 * fecha o ciclo que a Hero abre com 6 dados girando.
 */
export default function Contact() {
  return (
    <section id="contato" aria-labelledby="contato-title" className="relative scroll-mt-16 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <SectionAtmosphere
          // Glow centralizado atrás do dado único
          glows={[{ at: { x: 50, y: 28 }, w: 26, h: 28, strength: 9 }]}
          dice={DICE}
          diceFrom="md"
        />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-20 pb-10 text-center md:px-12 md:pt-24">
        <RestingDie className="size-28" />

        <h2 id="contato-title" className="mt-6 font-display text-h2">
          Contato
        </h2>
        <p className="mt-4 max-w-[46ch] text-fg/80">
          Se você chegou até aqui, já viu o que eu faço — bora conversar sobre o que você está
          construindo?
        </p>

        {/*
          ATENÇÃO: este é o ÚNICO elemento do site com fundo sólido em --accent.
          É a ação principal da página inteira. Não replicar em outros botões/elementos:
          no resto do site o âmbar aparece só como texto, borda, glow ou brilho de aresta.
        */}
        <a
          href={`mailto:${EMAIL}`}
          className="mt-10 inline-block rounded-md bg-accent px-8 py-4 font-medium text-bg transition duration-200 hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--accent)_86%,black)]"
        >
          Me mande um e-mail
        </a>
        <p className="mt-3 text-small break-all text-fg/50">{EMAIL}</p>

        <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-small">
          {links.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg/70 transition-colors hover:text-accent"
              >
                {label}
              </a>
            </li>
          ))}
          {/* Mesmo peso visual de GitHub/LinkedIn; interno, então abre na mesma aba */}
          <li>
            <Link href="/critico" className="text-fg/70 transition-colors hover:text-accent">
              Jogar Crítico Natural
            </Link>
          </li>
        </ul>

        <footer className="mt-20 text-small text-muted">
          Feito com Next.js e React Three Fiber. © {new Date().getFullYear()}
        </footer>
      </div>
    </section>
  );
}
