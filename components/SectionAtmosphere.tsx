import type { BackdropDie } from "./hero/dice";
import { BackdropCanvas } from "./hero/scene";

/**
 * Assinatura visual das seções (a Hero tem a sua versão interativa): glow âmbar
 * estático + silhuetas de dados ao fundo. Posição, tamanho e densidade variam
 * por seção — mesma família, composição diferente em cada uma.
 *
 * As silhuetas são a MESMA camada de fundo da Hero (<BackdropLayer> via
 * <BackdropCanvas>): mesmo material, luzes e movimento, num canvas leve que só
 * renderiza na tela e fica parado com prefers-reduced-motion.
 */

const PRESETS = {
  left: { x: 22, y: 45 },
  right: { x: 78, y: 45 },
  center: { x: 50, y: 50 },
} as const;

export type Glow = {
  /** centro do glow: preset ou x/y em % da seção */
  at: keyof typeof PRESETS | { x: number; y: number };
  /** raios da elipse, em % da seção */
  w?: number;
  h?: number;
  /** opacidade do âmbar no centro, em % (5–10 no glow principal) */
  strength?: number;
};

type Props = {
  /**
   * Um glow centralizado, ou vários para equilibrar composições assimétricas
   * (o principal mais forte de um lado, um bem mais fraco do lado oposto).
   */
  glows?: Glow[];
  /** silhuetas de dados (x/y normalizados −1…1 na seção, z = profundidade) */
  dice?: BackdropDie[];
  /**
   * A partir de qual breakpoint mostrar os dados. Em seções densas, telas estreitas não
   * têm margem livre para eles; escondido, o canvas fica fora da tela e não renderiza.
   */
  diceFrom?: "md" | "lg";
};

const SHOW_FROM = { md: "hidden md:block", lg: "hidden lg:block" } as const;

/**
 * A seção corta o que passa das bordas (overflow-hidden). Nas laterais isso
 * coincide com a borda da tela, mas em cima/embaixo viraria um corte reto entre
 * seções — então o centro é puxado para que a elipse caiba inteira na vertical.
 */
export function glowGradient({ at, w = 46, h = 36, strength = 9 }: Glow) {
  const { x, y } = typeof at === "string" ? PRESETS[at] : at;
  const contained = h >= 50 ? 50 : Math.min(Math.max(y, h), 100 - h);
  return `radial-gradient(ellipse ${w}% ${h}% at ${x}% ${contained}%, color-mix(in srgb, var(--accent) ${strength}%, transparent), transparent 100%)`;
}

export default function SectionAtmosphere({ glows = [{ at: "center" }], dice = [], diceFrom }: Props) {
  return (
    <>
      {glows.length > 0 && <div className="absolute inset-0" style={{ background: glows.map(glowGradient).join(", ") }} />}
      {dice.length > 0 && (
        <BackdropCanvas items={dice} className={`absolute inset-0 ${diceFrom ? SHOW_FROM[diceFrom] : ""}`} />
      )}
    </>
  );
}
