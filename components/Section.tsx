type Props = {
  id: string;
  title: string;
  children: React.ReactNode;
  /** Camada decorativa atrás do conteúdo, ocupando a largura inteira da seção. */
  backdrop?: React.ReactNode;
};

/**
 * Casca comum das seções: o MESMO container central (max-w-6xl, mesmo padding
 * lateral) usado pela Hero, Navbar e Contato — nada de recuo próprio aqui.
 */
export default function Section({ id, title, children, backdrop }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative scroll-mt-16 overflow-hidden">
      {backdrop && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {backdrop}
        </div>
      )}
      <div className="relative mx-auto max-w-6xl px-6 py-24 md:px-12 md:py-32">
        <h2 id={`${id}-title`} className="font-display text-h2">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
