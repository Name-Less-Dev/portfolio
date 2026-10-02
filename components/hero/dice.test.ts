import { BACKDROP, DICE, createD10Geometry } from "./dice";

describe("createD10Geometry", () => {
  it("é uma bipirâmide pentagonal: 10 faces triangulares", () => {
    const position = createD10Geometry().getAttribute("position");
    expect(position.count).toBe(10 * 3);
    expect(Array.from(position.array).every(Number.isFinite)).toBe(true);
  });
});

describe("DICE", () => {
  it("tem os 6 dados, sem nenhum dominando no tamanho", () => {
    expect(DICE.map((d) => d.name)).toEqual(["d4", "d6", "d8", "d10", "d12", "d20"]);
    const radii = DICE.map((d) => d.radius);
    expect(Math.max(...radii) / Math.min(...radii)).toBeLessThan(1.3);
  });
});

describe("BACKDROP", () => {
  it("tem 8–10 formas bem menores e mais ao fundo que os 6 principais", () => {
    expect(BACKDROP.length).toBeGreaterThanOrEqual(8);
    expect(BACKDROP.length).toBeLessThanOrEqual(10);
    const deepestMain = Math.min(...DICE.map((d) => d.rest[2]));
    for (const b of BACKDROP) {
      expect(DICE[b.shape]).toBeDefined();
      expect(b.scale).toBeLessThan(0.5);
      expect(b.rest[2]).toBeLessThan(deepestMain);
    }
  });
});
