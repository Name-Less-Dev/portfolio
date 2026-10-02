import { Euler, Vector3, type BufferGeometry } from "three";
import { DICE } from "./hero/dice";

/**
 * Ilustração 2D de um dado a partir da MESMA geometria three.js da Hero.
 * Calculada no servidor (zero WebGL, zero JS no cliente): faces de frente
 * preenchidas em tons de --surface, só as arestas reais em --accent.
 */

type Segment = { x1: number; y1: number; x2: number; y2: number };
export type Illustration = { faces: { points: string; light: number }[]; edges: Segment[] };

const LIGHT = new Vector3(-0.45, 0.65, 0.6).normalize();
const key = (v: Vector3) => `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;

export function illustrateDie(geometry: BufferGeometry, rotation: Euler): Illustration {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = flat.getAttribute("position");
  const faces: Illustration["faces"] = [];
  // aresta → triângulos de frente que a usam (pela posição original, antes de girar)
  const edgeMap = new Map<string, { a: Vector3; b: Vector3; normals: Vector3[] }>();

  for (let i = 0; i < pos.count; i += 3) {
    const original = [0, 1, 2].map((k) => new Vector3().fromBufferAttribute(pos, i + k));
    const [a, b, c] = original.map((v) => v.clone().applyEuler(rotation));
    const normal = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a)).normalize();
    // Sólido convexo centrado na origem: a normal externa aponta para longe do centro
    if (normal.dot(a.clone().add(b).add(c)) < 0) normal.negate();
    if (normal.z <= 1e-3) continue; // de costas

    faces.push({
      points: [a, b, c].map((v) => `${v.x.toFixed(3)},${(-v.y).toFixed(3)}`).join(" "),
      light: Math.max(0, normal.dot(LIGHT)),
    });

    const rotated = [a, b, c];
    for (let k = 0; k < 3; k++) {
      const [p, q] = [original[k], original[(k + 1) % 3]];
      const id = [key(p), key(q)].sort().join("|");
      const entry = edgeMap.get(id) ?? { a: rotated[k], b: rotated[(k + 1) % 3], normals: [] };
      entry.normals.push(normal);
      edgeMap.set(id, entry);
    }
  }

  // Aresta real = contorno (só 1 face de frente) ou dobra (2 faces com normais diferentes).
  // Diagonais internas da triangulação (2 faces coplanares) ficam de fora.
  const edges = [...edgeMap.values()]
    .filter(({ normals }) => normals.length === 1 || normals[0].dot(normals[1]) < 0.9999)
    .map(({ a, b }) => ({ x1: a.x, y1: -a.y, x2: b.x, y2: -b.y }));

  return { faces, edges };
}

/** Tom da face: --surface clareado em direção ao --fg nas faces iluminadas, afundado no --bg nas outras. */
function faceFill(light: number) {
  return light > 0.5
    ? `color-mix(in srgb, var(--surface) ${Math.round(100 - (light - 0.5) * 40)}%, var(--fg))`
    : `color-mix(in srgb, var(--surface) ${Math.round(100 - (0.5 - light) * 90)}%, var(--bg))`;
}

// Ângulos escolhidos para cada dado mostrar uma silhueta reconhecível
const POSES: Record<string, [number, number, number]> = {
  d4: [0.6, -0.75, 0], // 3 faces equilibradas, ponta para cima
  d6: [0.55, 0.75, 0],
  d8: [0.3, 0.55, 0],
  d10: [0.75, 0.3, 0.15], // inclinado para mostrar a coroa pentagonal (e não parecer o d8)
  d12: [0.45, 0.35, 0.15],
  d20: [0.3, 0.45, 0.1],
};

export default function DieIcon({ die, className }: { die: string; className?: string }) {
  const spec = DICE.find((d) => d.name === die);
  if (!spec) return null;
  const { faces, edges } = illustrateDie(spec.create(1), new Euler(...(POSES[die] ?? [0.4, 0.5, 0])));

  return (
    <svg viewBox="-1.3 -1.3 2.6 2.6" aria-hidden className={className}>
      {faces.map((f, i) => {
        const fill = faceFill(f.light);
        // traço da mesma cor esconde a emenda entre triângulos coplanares
        return <polygon key={i} points={f.points} fill={fill} stroke={fill} strokeWidth={0.01} />;
      })}
      {/*
        Aresta e brilho vêm de variáveis CSS com o âmbar como padrão: quem usa o ícone pode
        apagá-lo (ex.: SideNav inativo: --die-edge: var(--muted); --die-glow: none), com transição.
      */}
      <g
        strokeWidth={1.25}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{
          stroke: "var(--die-edge, var(--accent))",
          filter: "var(--die-glow, drop-shadow(0 0 3px color-mix(in srgb, var(--accent) 60%, transparent)))",
          transition: "stroke 300ms, filter 300ms",
        }}
      >
        {edges.map((e, i) => (
          <line key={i} {...e} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}
