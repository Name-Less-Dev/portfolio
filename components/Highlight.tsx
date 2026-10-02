/**
 * Destaque inline reutilizável: a ÚNICA diferença para o texto ao redor é a cor
 * (--accent) — mesma fonte, tamanho e peso, sem itálico nem ícone. Usa <mark>
 * pela semântica de "trecho em destaque", sem o fundo amarelo padrão.
 */
export default function Highlight({ children }: { children: React.ReactNode }) {
  return <mark className="bg-transparent text-accent">{children}</mark>;
}
