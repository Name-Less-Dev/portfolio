import Link from "next/link";

export const navLinks = [
  { href: "#projetos", label: "Projetos" },
  { href: "#habilidades", label: "Habilidades" },
  { href: "#sobre", label: "Sobre" },
  { href: "#contato", label: "Contato" },
];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-muted/30 bg-bg/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-12">
        {/*
          Atalho para o jogo: o ▶ fica absoluto ao lado do "MB" (não empurra nada da navbar).
          Com mouse, aparece no hover do logo (ou no foco do teclado); em telas de toque,
          onde não existe hover, fica sempre visível.
        */}
        {/* Em toque o ▶ é fixo: reserva o espaço dele (mr) para não cobrir o primeiro link */}
        <span className="group relative flex items-center [@media(hover:none)]:mr-7">
          <a href="#" className="font-display text-h3 leading-none transition-colors hover:text-accent">
            MB
          </a>
          <Link
            href="/critico"
            aria-label="Jogar Crítico Natural"
            className="group/play absolute top-1/2 left-full ml-1.5 flex size-5 -translate-y-1/2 scale-75 items-center justify-center rounded-sm text-accent opacity-0 transition-[opacity,scale] duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 focus-visible:scale-100 focus-visible:opacity-100 focus-visible:outline-accent [@media(hover:none)]:scale-100 [@media(hover:none)]:opacity-80"
          >
            <svg viewBox="0 0 10 12" aria-hidden className="h-2.5 w-2" fill="currentColor">
              <path d="M0 0.8v10.4a.8.8 0 0 0 1.2.7l8.3-5.2a.8.8 0 0 0 0-1.4L1.2.1A.8.8 0 0 0 0 .8z" />
            </svg>
            {/* Tooltip "Jogar": no foco do teclado (e no hover do próprio ícone) */}
            <span
              role="tooltip"
              className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-md border border-muted/30 bg-surface px-2 py-0.5 text-small whitespace-nowrap text-fg opacity-0 transition-opacity duration-150 group-hover/play:opacity-100 group-focus-visible/play:opacity-100"
            >
              Jogar
            </span>
          </Link>
        </span>
        <ul className="flex gap-3 text-small text-fg/70 sm:gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-accent">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
