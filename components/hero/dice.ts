import {
  BoxGeometry,
  BufferGeometry,
  DodecahedronGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  OctahedronGeometry,
  TetrahedronGeometry,
  Vector3,
} from "three";

/**
 * d10 aproximado: bipirâmide pentagonal (duas pirâmides unidas pela base).
 * Não indexada — cada face tem os próprios vértices, então o flat shading fica nítido.
 */
export function createD10Geometry(radius = 1): BufferGeometry {
  const top = new Vector3(0, radius * 1.15, 0);
  const bottom = new Vector3(0, -radius * 1.15, 0);
  const ring = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2;
    return new Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  });

  const vertices: number[] = [];
  for (let i = 0; i < 5; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % 5];
    vertices.push(...top.toArray(), ...b.toArray(), ...a.toArray()); // pirâmide de cima
    vertices.push(...bottom.toArray(), ...a.toArray(), ...b.toArray()); // pirâmide de baixo
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export type DieSpec = {
  name: string;
  radius: number;
  create: (radius: number) => BufferGeometry;
  /** posição de repouso: x/y normalizados em relação à viewport (−1…1), z em unidades do mundo */
  rest: [number, number, number];
};

// Aglomerado coeso em volta do nome: nada encostando nos cantos, mas sem grade nem anel
export const DICE: DieSpec[] = [
  { name: "d4", radius: 0.9, create: (r) => new TetrahedronGeometry(r), rest: [-0.6, 0.44, -0.3] },
  { name: "d6", radius: 0.78, create: (r) => new BoxGeometry(r * 1.15, r * 1.15, r * 1.15), rest: [0.56, 0.48, -1] },
  { name: "d8", radius: 0.82, create: (r) => new OctahedronGeometry(r), rest: [-0.34, -0.52, 0.4] },
  { name: "d10", radius: 0.75, create: createD10Geometry, rest: [0.6, -0.32, 0.2] },
  { name: "d12", radius: 0.82, create: (r) => new DodecahedronGeometry(r), rest: [-0.72, -0.06, -1.8] },
  { name: "d20", radius: 0.85, create: (r) => new IcosahedronGeometry(r), rest: [0.12, 0.64, -2.2] },
];

export type BackdropDie = {
  /** índice em DICE: reaproveita a mesma geometria, só que bem menor */
  shape: number;
  /** escala relativa ao dado principal da mesma forma */
  scale: number;
  rest: [number, number, number];
};

// Segunda camada: silhuetas pequenas e fundas, textura de fundo sem competir com os protagonistas
export const BACKDROP: BackdropDie[] = [
  { shape: 5, scale: 0.34, rest: [-0.86, 0.72, -6.5] },
  { shape: 1, scale: 0.3, rest: [-0.3, 0.9, -7.5] },
  { shape: 3, scale: 0.36, rest: [0.42, 0.86, -5.5] },
  { shape: 0, scale: 0.32, rest: [0.95, 0.36, -7] },
  { shape: 4, scale: 0.3, rest: [0.86, -0.72, -6] },
  { shape: 2, scale: 0.34, rest: [0.2, -0.88, -7.5] },
  { shape: 5, scale: 0.28, rest: [-0.46, -0.8, -5.5] },
  { shape: 1, scale: 0.3, rest: [-1.02, -0.4, -7] },
  { shape: 4, scale: 0.26, rest: [-0.08, 0.2, -8.5] },
];
