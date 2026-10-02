import {
  ENEMY_SPECS,
  FIRST_SPAWN,
  HIT_TOLERANCE,
  PROJECTILE_RADIUS,
  SPAWN_START,
  createGame,
  spawnEnemy,
  step,
  tryAttack,
  type GameState,
} from "./engine";

const arena = { w: 800, h: 600 };
const still = { x: 0, y: 0 };
const noSpawn = (g: GameState) => ((g.spawnTimer = Infinity), g);

/** Coloca um d4 numa posição (parado, se `frozen`) e devolve o inimigo. */
function placeD4(game: GameState, x: number, y: number, frozen = false) {
  const e = spawnEnemy(game, arena, "d4");
  Object.assign(e, { x, y }, frozen ? { speed: 0 } : {});
  return e;
}

/** rng que faz o próximo disparo valer exatamente `damage`. */
const rollsTo = (damage: number) => () => (damage - 1) / 20 + 0.001;

describe("spawn", () => {
  it("o primeiro d4 nasce depois de FIRST_SPAWN e o seguinte em até SPAWN_START", () => {
    const game = createGame();
    step(game, FIRST_SPAWN - 0.01, still, arena);
    expect(game.enemies).toHaveLength(0);
    step(game, 0.02, still, arena);
    expect(game.enemies).toHaveLength(1);
    step(game, SPAWN_START, still, arena);
    expect(game.enemies).toHaveLength(2);
    expect(game.enemies.every((e) => e.kind === "d4" && e.hp === 4)).toBe(true);
  });

  it("nasce numa das 4 bordas, logo fora da arena", () => {
    const r = ENEMY_SPECS.d4.radius;
    for (let side = 0; side < 4; side++) {
      const game = noSpawn(createGame());
      const rolls = [0.3, (side + 0.5) / 4]; // posição ao longo da borda, depois o lado
      const e = spawnEnemy(game, arena, "d4", () => rolls.shift()!);
      const outsideX = Math.abs(e.x) === arena.w / 2 + r;
      const outsideY = Math.abs(e.y) === arena.h / 2 + r;
      expect(outsideX || outsideY).toBe(true);
    }
  });

  it("vida = número de lados", () => {
    const game = noSpawn(createGame());
    expect(spawnEnemy(game, arena, "d4").hp).toBe(4);
    expect(spawnEnemy(game, arena, "d6").hp).toBe(6);
  });
});

describe("perseguição", () => {
  it("anda direto para o jogador, na velocidade do tipo, recalculando a cada quadro", () => {
    const game = noSpawn(createGame());
    const e = placeD4(game, 300, 400); // jogador na origem → direção (−0.6, −0.8)
    step(game, 0.5, still, arena);
    const moved = ENEMY_SPECS.d4.speed * 0.5;
    expect(e.x).toBeCloseTo(300 - 0.6 * moved);
    expect(e.y).toBeCloseTo(400 - 0.8 * moved);

    game.player = { x: -200, y: 0 }; // jogador mudou de lugar: o inimigo corrige o rumo
    const before = { x: e.x, y: e.y };
    step(game, 0.1, still, arena);
    expect(e.x).toBeLessThan(before.x);
  });

});

describe("colisão projétil × inimigo", () => {
  /** Dispara do centro para a direita, com dano fixo, contra um d4 parado. */
  function shoot(damage: number, enemyX: number, enemyY = 0) {
    const game = noSpawn(createGame(rollsTo(damage)));
    const e = placeD4(game, enemyX, enemyY, true);
    tryAttack(game, { x: 100, y: 0 });
    for (let i = 0; i < 60; i++) step(game, 1 / 60, still, arena);
    return { game, e };
  }

  it("acerto tira exatamente o valor rolado; com hp > 0 o inimigo continua", () => {
    const { game, e } = shoot(3, 200);
    expect(e.hp).toBe(1);
    expect(game.enemies).toContain(e);
    expect(game.projectiles).toHaveLength(0); // o projétil se desfez no impacto
    expect(game.events).toContainEqual(expect.objectContaining({ type: "hit", damage: 3, hpLeft: 1 }));
  });

  it("hp chega a 0 ou menos: o inimigo é destruído (e gera evento de kill)", () => {
    const { game, e } = shoot(17, 200);
    expect(game.enemies).not.toContain(e);
    expect(game.events).toContainEqual(expect.objectContaining({ type: "kill", enemyId: e.id }));
  });

  it("dois acertos somam: 2 + 2 derrubam um d4", () => {
    const game = noSpawn(createGame(rollsTo(2)));
    const e = placeD4(game, 200, 0, true);
    tryAttack(game, { x: 100, y: 0 }, rollsTo(2));
    for (let i = 0; i < 30; i++) step(game, 1 / 60, still, arena);
    expect(e.hp).toBe(2);
    tryAttack(game, { x: 100, y: 0 }, rollsTo(2));
    for (let i = 0; i < 30; i++) step(game, 1 / 60, still, arena);
    expect(game.enemies).not.toContain(e);
  });

  it("a tolerância vale: passa raspando fora do visual e ainda acerta", () => {
    const visual = PROJECTILE_RADIUS + ENEMY_SPECS.d4.radius;
    expect(shoot(1, 200, visual + HIT_TOLERANCE - 1).e.hp).toBe(3); // dentro da folga
    expect(shoot(1, 200, visual + HIT_TOLERANCE + 1).e.hp).toBe(4); // fora: erra
  });

  it("projétil rápido não atravessa o inimigo entre um quadro e outro", () => {
    const game = noSpawn(createGame(rollsTo(1)));
    const e = placeD4(game, 120, 0, true);
    tryAttack(game, { x: 100, y: 0 });
    step(game, 0.2, still, arena); // 180 px num quadro só: pula por cima do d4
    expect(e.hp).toBe(3);
  });
});
