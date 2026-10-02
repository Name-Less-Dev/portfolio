/**
 * Regras do jogo, sem React nem three — puro estado + funções, testável no jsdom.
 *   Etapa 1/2: movimento do d20, dano pré-rolado, disparo na direção do clique.
 *   Etapa 3: inimigos perseguidores (d4/d6), spawn nas bordas, colisão projétil × inimigo.
 *   Etapa 4: vida do jogador, contato com inimigo + invencibilidade, game over e reinício.
 *   Etapa 5: dificuldade progressiva (spawn mais frequente + tipos d4→d20 liberados com o tempo).
 *
 * Coordenadas da arena: origem no centro, x para a direita, y para CIMA,
 * 1 unidade = 1 px de CSS (a câmera ortográfica usa a mesma escala).
 */

export type Vec = { x: number; y: number };
export type Arena = { w: number; h: number };
type Rng = () => number;

export type Projectile = { id: number; x: number; y: number; vx: number; vy: number; damage: number };

export type EnemyKind = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
/** `speed` vem do tipo ao nascer, mas é por inimigo (permite variações futuras). */
export type Enemy = { id: number; kind: EnemyKind; x: number; y: number; hp: number; maxHp: number; speed: number };

/** Eventos do quadro, para o renderizador dar feedback visual (ele esvazia a lista). */
export type GameEvent =
  | { type: "hit"; enemyId: number; damage: number; hpLeft: number; x: number; y: number }
  /** `by`: derrubado por projétil (conta como derrota) ou consumido no contato com o jogador */
  | { type: "kill"; enemyId: number; kind: EnemyKind; x: number; y: number; by: "projectile" | "contact" }
  | { type: "player-hit"; hpLeft: number }
  | { type: "game-over"; elapsed: number; kills: number };

export type GameState = {
  player: Vec;
  projectiles: Projectile[];
  enemies: Enemy[];
  events: GameEvent[];
  /** segundos até poder disparar de novo */
  cooldown: number;
  /** segundos até o próximo inimigo nascer */
  spawnTimer: number;
  nextId: number;
  /** dano do PRÓXIMO disparo: já rolado e visível, gasto quando o jogador atira */
  nextRoll: number;
  /** vida do jogador */
  hp: number;
  /** segundos de invencibilidade restantes após levar dano */
  invulnerable: number;
  /** tempo sobrevivido nesta partida (s) */
  elapsed: number;
  /** inimigos derrotados por projétil nesta partida */
  kills: number;
  /** vida zerou: tudo parado até reiniciar */
  over: boolean;
  /** quantas vezes a partida foi reiniciada (o renderizador usa para limpar efeitos) */
  round: number;
};

export const PLAYER_RADIUS = 26;
export const PLAYER_SPEED = 340; // px/s
export const PLAYER_MAX_HP = 3;
export const INVULNERABLE_TIME = 1; // s
export const PROJECTILE_SPEED = 900; // px/s
export const PROJECTILE_RADIUS = 6;
export const ATTACK_COOLDOWN = 0.25; // s

/**
 * Vida = número de lados. Quanto mais lados, maior, mais resistente e mais lento
 * (todos abaixo da velocidade do jogador: dá pra fugir e mirar).
 * A ordem aqui é a ordem em que os tipos entram na partida.
 */
export const ENEMY_SPECS: Record<EnemyKind, { hp: number; radius: number; speed: number; unlockAt: number }> = {
  d4: { hp: 4, radius: 20, speed: 115, unlockAt: 0 },
  d6: { hp: 6, radius: 22, speed: 108, unlockAt: 10 },
  d8: { hp: 8, radius: 23, speed: 102, unlockAt: 20 },
  d10: { hp: 10, radius: 24, speed: 96, unlockAt: 35 },
  d12: { hp: 12, radius: 26, speed: 90, unlockAt: 50 },
  d20: { hp: 20, radius: 28, speed: 82, unlockAt: 70 },
};
export const ENEMY_KINDS = Object.keys(ENEMY_SPECS) as EnemyKind[];
/** Folga extra na colisão: a mira é manual, então o acerto é um pouco mais generoso que o visual. */
export const HIT_TOLERANCE = 8;
export const FIRST_SPAWN = 1; // s

/* ---------------------------- Dificuldade ---------------------------- */
// Tudo em função do tempo sobrevivido. Ajuste fino de balanceamento: só estes números.

/** Intervalo entre spawns: começa em 1,8 s e cai em linha reta até o piso de 0,5 s aos 90 s. */
export const SPAWN_START = 1.8; // s
export const SPAWN_FLOOR = 0.5; // s
export const SPAWN_RAMP = 90; // s até chegar no piso
/** Teto de inimigos simultâneos: protege a performance se o jogador só fugir. */
export const MAX_ENEMIES = 60;

export function spawnInterval(elapsed: number) {
  const progress = Math.min(1, Math.max(0, elapsed / SPAWN_RAMP));
  return SPAWN_START + (SPAWN_FLOOR - SPAWN_START) * progress;
}

/** Tipos já liberados nesse momento da partida, do mais fraco ao mais forte. */
export function availableKinds(elapsed: number): EnemyKind[] {
  return ENEMY_KINDS.filter((kind) => elapsed >= ENEMY_SPECS[kind].unlockAt);
}

/**
 * Sorteia o tipo do próximo inimigo entre os liberados. Peso 1/(posição+1): o d4
 * continua o mais comum a partida toda e os mais fortes vão ficando mais raros
 * (com os 6 liberados: d4 ≈ 41%, d6 ≈ 20%, d8 ≈ 14%, d10 ≈ 10%, d12 ≈ 8%, d20 ≈ 7%).
 */
export function pickKind(elapsed: number, rng: Rng = Math.random): EnemyKind {
  const kinds = availableKinds(elapsed);
  const weights = kinds.map((_, i) => 1 / (i + 1));
  let roll = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < kinds.length; i++) {
    roll -= weights[i];
    if (roll < 0) return kinds[i];
  }
  return kinds[kinds.length - 1];
}

export function createGame(rng: Rng = Math.random): GameState {
  return {
    player: { x: 0, y: 0 },
    projectiles: [],
    enemies: [],
    events: [],
    cooldown: 0,
    spawnTimer: FIRST_SPAWN,
    nextId: 1,
    nextRoll: rollD20(rng),
    hp: PLAYER_MAX_HP,
    invulnerable: 0,
    elapsed: 0,
    kills: 0,
    over: false,
    round: 0,
  };
}

/** "Jogar de novo": tudo do zero (vida, posição, inimigos, projéteis, cronômetro, derrotas). */
export function resetGame(state: GameState, rng: Rng = Math.random) {
  Object.assign(state, createGame(rng), { round: state.round + 1 });
}

/** Teclas pressionadas → direção unitária (diagonal não anda mais rápido). */
export function inputDirection(keys: ReadonlySet<string>): Vec {
  const x = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  const y = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
  const len = Math.hypot(x, y);
  return len ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}

const clamp = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v));

/** Inimigo novo numa borda aleatória, logo FORA da arena (entra andando). */
export function spawnEnemy(state: GameState, arena: Arena, kind: EnemyKind = "d4", rng: Rng = Math.random): Enemy {
  const { hp, radius, speed } = ENEMY_SPECS[kind];
  const halfW = arena.w / 2 + radius;
  const halfH = arena.h / 2 + radius;
  const along = rng() * 2 - 1; // posição ao longo da borda, −1…1
  const [x, y] = [
    [along * (arena.w / 2), halfH], // topo
    [halfW, along * (arena.h / 2)], // direita
    [along * (arena.w / 2), -halfH], // base
    [-halfW, along * (arena.h / 2)], // esquerda
  ][Math.min(3, Math.floor(rng() * 4))];
  const enemy: Enemy = { id: state.nextId++, kind, x, y, hp, maxHp: hp, speed };
  state.enemies.push(enemy);
  return enemy;
}

/** Distância do ponto `c` ao segmento a→b (o trecho que o projétil percorreu no quadro). */
function distanceToSegment(c: Vec, a: Vec, b: Vec) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  const t = len2 ? Math.max(0, Math.min(1, ((c.x - a.x) * abx + (c.y - a.y) * aby) / len2)) : 0;
  return Math.hypot(c.x - (a.x + abx * t), c.y - (a.y + aby * t));
}

/** Avança o jogo `dt` segundos. Muta o estado (roda a cada quadro). */
export function step(state: GameState, dt: number, direction: Vec, arena: Arena, rng: Rng = Math.random) {
  // Fim de jogo: nada mais se mexe (spawn, inimigos, projéteis, cronômetro)
  if (state.over) return;
  state.elapsed += dt;
  state.invulnerable = Math.max(0, state.invulnerable - dt);

  const { player } = state;
  // O d20 inteiro fica dentro da arena
  player.x = clamp(player.x + direction.x * PLAYER_SPEED * dt, arena.w / 2 - PLAYER_RADIUS);
  player.y = clamp(player.y + direction.y * PLAYER_SPEED * dt, arena.h / 2 - PLAYER_RADIUS);

  state.cooldown = Math.max(0, state.cooldown - dt);

  // Spawn: cada vez mais frequente e com tipos mais fortes conforme o tempo passa.
  // No teto de inimigos o spawn espera (o relógio continua, então volta assim que houver espaço).
  state.spawnTimer -= dt;
  while (state.spawnTimer <= 0) {
    if (state.enemies.length < MAX_ENEMIES) spawnEnemy(state, arena, pickKind(state.elapsed, rng), rng);
    state.spawnTimer += spawnInterval(state.elapsed);
  }

  // Perseguição direta: direção recalculada a cada quadro. Tocar o jogador ainda não faz nada.
  for (const e of state.enemies) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    const move = Math.min(e.speed * dt, dist); // não passa do alvo
    if (dist > 1e-6) {
      e.x += (dx / dist) * move;
      e.y += (dy / dist) * move;
    }
  }

  // Projéteis: andam em linha reta, acertam o primeiro inimigo no caminho ou saem da arena
  const marginX = arena.w / 2 + PROJECTILE_RADIUS;
  const marginY = arena.h / 2 + PROJECTILE_RADIUS;
  state.projectiles = state.projectiles.filter((p) => {
    const from = { x: p.x, y: p.y };
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const target = state.enemies.find(
      (e) => distanceToSegment(e, from, p) < PROJECTILE_RADIUS + ENEMY_SPECS[e.kind].radius + HIT_TOLERANCE,
    );
    if (target) {
      target.hp -= p.damage;
      state.events.push({ type: "hit", enemyId: target.id, damage: p.damage, hpLeft: Math.max(0, target.hp), x: target.x, y: target.y });
      if (target.hp <= 0) {
        state.enemies = state.enemies.filter((e) => e !== target);
        state.kills++;
        state.events.push({ type: "kill", enemyId: target.id, kind: target.kind, x: target.x, y: target.y, by: "projectile" });
      }
      return false; // o projétil se desfaz no impacto
    }
    return Math.abs(p.x) <= marginX && Math.abs(p.y) <= marginY;
  });

  // Contato jogador × inimigo (depois dos projéteis: um tiro que derruba o inimigo neste
  // mesmo quadro salva o jogador). Sem folga extra: a tolerância generosa vale pra mira,
  // não pra levar dano. Durante a invencibilidade, inimigos atravessam sem efeito.
  if (state.invulnerable > 0) return;
  const touching = state.enemies.find(
    (e) => Math.hypot(e.x - player.x, e.y - player.y) < PLAYER_RADIUS + ENEMY_SPECS[e.kind].radius,
  );
  if (!touching) return;

  // Os dois "se consomem": o inimigo some (não conta como derrota) e o jogador perde 1 de vida
  state.enemies = state.enemies.filter((e) => e !== touching);
  state.events.push({ type: "kill", enemyId: touching.id, kind: touching.kind, x: touching.x, y: touching.y, by: "contact" });
  state.hp -= 1;
  state.events.push({ type: "player-hit", hpLeft: state.hp });

  if (state.hp <= 0) {
    state.over = true;
    state.events.push({ type: "game-over", elapsed: state.elapsed, kills: state.kills });
  } else {
    state.invulnerable = INVULNERABLE_TIME;
  }
}

/** 1 a 20, uniforme. `rng` injetável para teste. */
export function rollD20(rng: Rng = Math.random) {
  return Math.min(20, Math.floor(rng() * 20) + 1);
}

/**
 * Clique/toque em `target`: se o cooldown permitir, dispara um projétil na
 * direção EXATA do ponto carregando o dano já rolado (`nextRoll`) e rola o
 * próximo. Retorna o dano gasto e o novo valor, ou null se ainda em cooldown.
 */
export function tryAttack(
  state: GameState,
  target: Vec,
  rng: Rng = Math.random,
): { damage: number; nextRoll: number; projectile: Projectile } | null {
  if (state.over || state.cooldown > 0) return null;
  const dx = target.x - state.player.x;
  const dy = target.y - state.player.y;
  const len = Math.hypot(dx, dy);
  // Clique em cima do próprio d20: sem direção definida, dispara para cima
  const [ux, uy] = len > 1e-6 ? [dx / len, dy / len] : [0, 1];

  const projectile: Projectile = {
    id: state.nextId++,
    // nasce na borda do d20, não no centro
    x: state.player.x + ux * PLAYER_RADIUS,
    y: state.player.y + uy * PLAYER_RADIUS,
    vx: ux * PROJECTILE_SPEED,
    vy: uy * PROJECTILE_SPEED,
    damage: state.nextRoll,
  };
  state.projectiles.push(projectile);
  state.cooldown = ATTACK_COOLDOWN;
  state.nextRoll = rollD20(rng);
  return { damage: projectile.damage, nextRoll: state.nextRoll, projectile };
}
