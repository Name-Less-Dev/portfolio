import {
  ENEMY_KINDS,
  ENEMY_SPECS,
  MAX_ENEMIES,
  SPAWN_FLOOR,
  SPAWN_RAMP,
  SPAWN_START,
  availableKinds,
  createGame,
  pickKind,
  spawnInterval,
  step,
  type EnemyKind,
} from "./engine";

const arena = { w: 1200, h: 800 };
const still = { x: 0, y: 0 };

describe("intervalo de spawn", () => {
  it("começa no intervalo inicial, cai com o tempo e nunca passa do piso", () => {
    expect(spawnInterval(0)).toBe(SPAWN_START);
    expect(spawnInterval(60)).toBeLessThan(spawnInterval(30));
    expect(spawnInterval(SPAWN_RAMP)).toBeCloseTo(SPAWN_FLOOR);
    expect(spawnInterval(10 * 60)).toBe(SPAWN_FLOOR);
    expect(SPAWN_FLOOR).toBeGreaterThanOrEqual(0.4); // piso: nunca vira spawn instantâneo
  });

  it("numa partida longa a frequência de spawn aumenta de verdade", () => {
    const game = createGame();
    game.hp = Infinity; // sobrevive a tudo, só pra contar
    const spawnsPerMinute: number[] = [];
    let lastId = game.nextId;
    for (let minute = 0; minute < 4; minute++) {
      for (let i = 0; i < 60 * 30; i++) {
        step(game, 1 / 30, still, arena);
        game.enemies = []; // remove pra não bater no teto
      }
      spawnsPerMinute.push(game.nextId - lastId);
      lastId = game.nextId;
    }
    expect(spawnsPerMinute[1]).toBeGreaterThan(spawnsPerMinute[0]);
    expect(spawnsPerMinute[2]).toBeGreaterThan(spawnsPerMinute[1]);
    // 4º minuto (180–240 s) já todo no piso: ~60/SPAWN_FLOOR spawns
    expect(spawnsPerMinute[3]).toBeGreaterThanOrEqual(60 / SPAWN_FLOOR - 2);
  });
});

describe("tipos de inimigo", () => {
  it("vida = número de lados, na ordem d4 → d20", () => {
    expect(ENEMY_KINDS).toEqual(["d4", "d6", "d8", "d10", "d12", "d20"]);
    for (const kind of ENEMY_KINDS) expect(ENEMY_SPECS[kind].hp).toBe(Number(kind.slice(1)));
  });

  it("cada tipo entra no seu tempo, na ordem, e nunca antes", () => {
    expect(availableKinds(0)).toEqual(["d4"]);
    ENEMY_KINDS.forEach((kind, i) => {
      const at = ENEMY_SPECS[kind].unlockAt;
      if (i > 0) expect(at).toBeGreaterThan(ENEMY_SPECS[ENEMY_KINDS[i - 1]].unlockAt);
      expect(availableKinds(at)).toEqual(ENEMY_KINDS.slice(0, i + 1));
      if (at > 0) expect(availableKinds(at - 0.1)).not.toContain(kind);
    });
  });

  it("todos os tipos já estão liberados antes do segundo minuto", () => {
    expect(availableKinds(120)).toEqual(ENEMY_KINDS);
  });

  it("só sorteia tipos já liberados", () => {
    for (let i = 0; i < 300; i++) expect(availableKinds(40)).toContain(pickKind(40));
  });

  it("os mais fracos continuam frequentes: com todos liberados, d4 é o mais comum e d20 o mais raro", () => {
    const count: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      const kind = pickKind(200, () => i / 1000); // varre o rng uniformemente
      count[kind] = (count[kind] ?? 0) + 1;
    }
    const share = (k: EnemyKind) => count[k] / 1000;
    expect(share("d4")).toBeCloseTo(0.41, 1);
    expect(share("d20")).toBeCloseTo(0.07, 1);
    for (let i = 1; i < ENEMY_KINDS.length; i++) {
      expect(count[ENEMY_KINDS[i]]).toBeLessThanOrEqual(count[ENEMY_KINDS[i - 1]]);
    }
  });

  it("numa partida simulada os tipos fortes só aparecem depois dos seus tempos", () => {
    const game = createGame();
    game.hp = Infinity;
    const firstSeen: Partial<Record<EnemyKind, number>> = {};
    for (let i = 0; i < 160 * 30; i++) {
      step(game, 1 / 30, still, arena);
      for (const e of game.enemies) firstSeen[e.kind] ??= game.elapsed;
      game.enemies = [];
    }
    for (const kind of ENEMY_KINDS) {
      expect(firstSeen[kind]).toBeDefined();
      expect(firstSeen[kind]!).toBeGreaterThanOrEqual(ENEMY_SPECS[kind].unlockAt);
    }
  });
});

describe("teto de inimigos", () => {
  it("não passa de MAX_ENEMIES na tela (o spawn espera abrir espaço)", () => {
    const game = createGame();
    game.hp = Infinity;
    game.player = { x: 0, y: 0 };
    for (let i = 0; i < 240 * 30; i++) {
      step(game, 1 / 30, still, arena);
      game.invulnerable = 999; // inimigos se acumulam em volta sem consumir o jogador
    }
    expect(game.enemies.length).toBe(MAX_ENEMIES);
  });
});
