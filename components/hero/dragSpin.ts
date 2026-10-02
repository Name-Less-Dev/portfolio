/**
 * Física do "girar arrastando" do d20 do Contato, sem dependência de three/DOM
 * (testável no jsdom). Velocidades em rad/s; x = giro no eixo X (arrasto
 * vertical), y = giro no eixo Y (arrasto horizontal).
 */

export type Spin = { x: number; y: number };

/** Quanto o dado gira por pixel arrastado. */
export const RAD_PER_PX = 0.012;
/** Teto da velocidade herdada ao soltar (um "peteleco" forte não vira hélice). */
export const MAX_SPIN = 10;
/** Taxa de desaceleração da inércia (1/s): ~95% da velocidade some em ~1,2 s. */
export const FRICTION = 2.5;
/** Se o dedo/mouse ficou parado antes de soltar, não há inércia. */
export const STILL_BEFORE_RELEASE_MS = 80;
/** Abaixo disso a inércia é considerada encerrada. */
export const REST_THRESHOLD = 0.02;

/** Arrasto em px → incremento de rotação (rad). Arrastar para a direita gira para a direita. */
export function dragToRotation(dx: number, dy: number): Spin {
  return { x: dy * RAD_PER_PX, y: dx * RAD_PER_PX };
}

const clamp = (v: number) => Math.max(-MAX_SPIN, Math.min(MAX_SPIN, v));

/** Atualiza a velocidade estimada com o último movimento (média móvel, para suavizar o ruído). */
export function trackVelocity(prev: Spin, rotation: Spin, dtMs: number): Spin {
  if (dtMs <= 0) return prev;
  const dt = dtMs / 1000;
  return { x: clamp(prev.x * 0.4 + (rotation.x / dt) * 0.6), y: clamp(prev.y * 0.4 + (rotation.y / dt) * 0.6) };
}

/** Velocidade que fica ao soltar: zero se o gesto parou antes de soltar. */
export function releaseVelocity(velocity: Spin, msSinceLastMove: number): Spin {
  return msSinceLastMove > STILL_BEFORE_RELEASE_MS ? { x: 0, y: 0 } : velocity;
}

/** Um passo de inércia: desacelera exponencialmente (independente de FPS). */
export function decay(velocity: Spin, dt: number): Spin {
  const k = Math.exp(-FRICTION * dt);
  const next = { x: velocity.x * k, y: velocity.y * k };
  return Math.hypot(next.x, next.y) < REST_THRESHOLD ? { x: 0, y: 0 } : next;
}
