import {
  ENEMY_SPECS,
  INVULNERABLE_TIME,
  PLAYER_MAX_HP,
  PLAYER_RADIUS,
  createGame,
  resetGame,
  spawnEnemy,
  step,
  tryAttack,
  type GameState,
} from "./engine";

const arena = { w: 800, h: 600 };
const still = { x: 0, y: 0 };
const noSpawn = (g: GameState) => ((g.spawnTimer = Infinity), g);
const contact = PLAYER_RADIUS + ENEMY_SPECS.d4.radius;

/** d4 parado a `distance` px à direita do jogador. */
function d4At(game: GameState, distance: number) {
  const e = spawnEnemy(game, arena, "d4");
  Object.assign(e, { x: game.player.x + distance, y: game.player.y, speed: 0 });
  return e;
}

describe("vida e contato com inimigo", () => {
  it("começa com vida cheia", () => {
    expect(createGame().hp).toBe(PLAYER_MAX_HP);
  });

  it("encostar tira 1 de vida e o inimigo some junto (contato mútuo, não conta como derrota)", () => {
    const game = noSpawn(createGame());
    const e = d4At(game, contact - 1);
    step(game, 1 / 60, still, arena);
    expect(game.hp).toBe(PLAYER_MAX_HP - 1);
    expect(game.enemies).not.toContain(e);
    expect(game.kills).toBe(0);
    expect(game.events).toContainEqual(expect.objectContaining({ type: "kill", by: "contact" }));
    expect(game.events).toContainEqual({ type: "player-hit", hpLeft: PLAYER_MAX_HP - 1 });
  });

  it("sem folga extra: a soma exata dos raios é o limite", () => {
    const game = noSpawn(createGame());
    d4At(game, contact + 1);
    step(game, 1 / 60, still, arena);
    expect(game.hp).toBe(PLAYER_MAX_HP);
  });

  it("invencibilidade de 1 s: novos contatos não tiram vida (e o inimigo atravessa)", () => {
    const game = noSpawn(createGame());
    d4At(game, 0);
    step(game, 1 / 60, still, arena);
    expect(game.invulnerable).toBe(INVULNERABLE_TIME);

    const second = d4At(game, 0);
    step(game, 0.5, still, arena);
    expect(game.hp).toBe(PLAYER_MAX_HP - 1);
    expect(game.enemies).toContain(second);

    step(game, INVULNERABLE_TIME, still, arena); // acabou: o mesmo inimigo agora acerta
    expect(game.hp).toBe(PLAYER_MAX_HP - 2);
  });
});

describe("game over", () => {
  function playUntilDeath() {
    const game = noSpawn(createGame());
    game.kills = 5; // como se tivesse derrubado 5 antes
    for (let i = 0; i < PLAYER_MAX_HP; i++) {
      game.invulnerable = 0;
      d4At(game, 0);
      step(game, 0.25, still, arena);
    }
    return game;
  }

  it("vida zerada encerra a partida com tempo sobrevivido e derrotas", () => {
    const game = playUntilDeath();
    expect(game.hp).toBe(0);
    expect(game.over).toBe(true);
    expect(game.events).toContainEqual({ type: "game-over", elapsed: 0.75, kills: 5 });
  });

  it("depois do fim nada se mexe: nem spawn, nem inimigos, nem cronômetro; e não dá pra atirar", () => {
    const game = playUntilDeath();
    game.spawnTimer = 0;
    const leftover = d4At(game, 300);
    leftover.speed = 95;
    const snapshot = JSON.stringify({ enemies: game.enemies, elapsed: game.elapsed });
    step(game, 2, { x: 1, y: 0 }, arena);
    expect(JSON.stringify({ enemies: game.enemies, elapsed: game.elapsed })).toBe(snapshot);
    expect(game.player).toEqual({ x: 0, y: 0 });
    expect(tryAttack(game, { x: 100, y: 0 })).toBeNull();
  });

  it("o cronômetro corre durante a partida", () => {
    const game = noSpawn(createGame());
    for (let i = 0; i < 90; i++) step(game, 1 / 60, still, arena);
    expect(game.elapsed).toBeCloseTo(1.5);
  });

  it("derrotas contam só inimigos derrubados por projétil", () => {
    const game = noSpawn(createGame(() => 0.99)); // próximo disparo = 20
    const e = d4At(game, 200);
    tryAttack(game, { x: 100, y: 0 });
    for (let i = 0; i < 30; i++) step(game, 1 / 60, still, arena);
    expect(game.enemies).not.toContain(e);
    expect(game.kills).toBe(1);
  });
});

describe("jogar de novo", () => {
  it("reseta tudo e despausa, avisando o renderizador pela rodada", () => {
    const game = noSpawn(createGame());
    Object.assign(game, { hp: 0, over: true, kills: 7, elapsed: 42, player: { x: 120, y: -80 } });
    d4At(game, 300);
    game.projectiles.push({ id: 99, x: 0, y: 0, vx: 1, vy: 0, damage: 3 });

    resetGame(game);
    expect(game).toMatchObject({
      hp: PLAYER_MAX_HP,
      over: false,
      kills: 0,
      elapsed: 0,
      invulnerable: 0,
      player: { x: 0, y: 0 },
      enemies: [],
      projectiles: [],
      round: 1,
    });
    step(game, 0.1, { x: 1, y: 0 }, arena);
    expect(game.player.x).toBeGreaterThan(0); // voltou a andar
  });
});
