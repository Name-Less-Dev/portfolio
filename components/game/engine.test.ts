import {
  ATTACK_COOLDOWN,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  createGame,
  inputDirection,
  rollD20,
  step,
  tryAttack,
} from "./engine";

const arena = { w: 800, h: 600 };
const still = { x: 0, y: 0 };

describe("movimento", () => {
  it("WASD e setas viram direção unitária; diagonal não é mais rápida", () => {
    expect(inputDirection(new Set(["KeyD"]))).toEqual({ x: 1, y: 0 });
    expect(inputDirection(new Set(["ArrowUp"]))).toEqual({ x: 0, y: 1 });
    const diag = inputDirection(new Set(["KeyW", "KeyD"]));
    expect(Math.hypot(diag.x, diag.y)).toBeCloseTo(1);
    expect(inputDirection(new Set(["KeyA", "KeyD"]))).toEqual({ x: 0, y: 0 });
  });

  it("anda na velocidade certa e nunca sai da arena", () => {
    const game = createGame();
    step(game, 0.5, { x: 1, y: 0 }, arena);
    expect(game.player.x).toBeCloseTo(PLAYER_SPEED * 0.5);

    for (let i = 0; i < 200; i++) step(game, 1 / 60, { x: 1, y: 1 }, arena);
    expect(game.player.x).toBe(arena.w / 2 - PLAYER_RADIUS);
    expect(game.player.y).toBe(arena.h / 2 - PLAYER_RADIUS);
  });
});

describe("rolagem e ataque", () => {
  it("a rolagem vai de 1 a 20", () => {
    expect(rollD20(() => 0)).toBe(1);
    expect(rollD20(() => 0.999999)).toBe(20);
    for (let i = 0; i < 500; i++) {
      const r = rollD20();
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(20);
    }
  });

  it("o valor visível é exatamente o dano do disparo; ao atirar, rola o próximo", () => {
    const rolls = [0.5, 0.95, 0.0]; // → 11, 20, 1
    const rng = () => rolls.shift()!;
    const game = createGame(rng);
    expect(game.nextRoll).toBe(11); // já rolado antes de qualquer clique

    const first = tryAttack(game, { x: 10, y: 0 }, rng)!;
    expect(first.damage).toBe(11);
    expect(first.projectile.damage).toBe(11);
    expect(game.nextRoll).toBe(20);

    step(game, 1, still, arena); // passa o cooldown
    expect(tryAttack(game, { x: 10, y: 0 }, rng)!.damage).toBe(20);
    expect(game.nextRoll).toBe(1);
  });

  it("em cooldown, o valor mostrado não muda (só é gasto quando o disparo sai)", () => {
    const game = createGame(() => 0.5);
    tryAttack(game, { x: 10, y: 0 }, () => 0.95);
    expect(tryAttack(game, { x: 10, y: 0 }, () => 0)).toBeNull();
    expect(game.nextRoll).toBe(20);
  });

  it("dispara na direção EXATA do clique, a partir da borda do d20", () => {
    const game = createGame();
    game.player = { x: 100, y: -50 };
    const hit = tryAttack(game, { x: 400, y: 350 })!; // vetor (300, 400) → (0.6, 0.8)
    expect(hit.projectile.vx / hit.projectile.vy).toBeCloseTo(300 / 400);
    expect(hit.projectile.vx).toBeGreaterThan(0);
    expect(Math.hypot(hit.projectile.x - 100, hit.projectile.y + 50)).toBeCloseTo(PLAYER_RADIUS);
  });

  it("cooldown impede clique repetido instantâneo", () => {
    const game = createGame();
    expect(tryAttack(game, { x: 10, y: 0 })).not.toBeNull();
    expect(tryAttack(game, { x: 10, y: 0 })).toBeNull();
    step(game, ATTACK_COOLDOWN, still, arena);
    expect(tryAttack(game, { x: 10, y: 0 })).not.toBeNull();
    expect(game.projectiles).toHaveLength(2);
  });

  it("o projétil segue em linha reta e some ao sair da arena", () => {
    const game = createGame();
    tryAttack(game, { x: 1, y: 0 });
    step(game, 0.1, still, arena);
    expect(game.projectiles[0].y).toBeCloseTo(0);
    for (let i = 0; i < 60; i++) step(game, 1 / 60, still, arena);
    expect(game.projectiles).toHaveLength(0);
  });
});
