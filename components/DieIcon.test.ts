import { Euler } from "three";
import { illustrateDie } from "./DieIcon";
import { DICE } from "./hero/dice";

const die = (name: string) => DICE.find((d) => d.name === name)!.create(1);

describe("illustrateDie", () => {
  it("cubo em ângulo oblíquo: 3 faces de frente, 9 arestas e nenhuma diagonal da triangulação", () => {
    const { faces, edges } = illustrateDie(die("d6"), new Euler(0.55, 0.75, 0));
    expect(faces).toHaveLength(6); // 3 faces quadradas = 6 triângulos
    expect(edges).toHaveLength(9);
  });

  it("todos os dados geram faces e arestas válidas", () => {
    for (const { name } of DICE) {
      const { faces, edges } = illustrateDie(die(name), new Euler(0.4, 0.5, 0.1));
      expect(faces.length).toBeGreaterThan(0);
      expect(edges.length).toBeGreaterThan(0);
      expect(JSON.stringify({ faces, edges })).not.toMatch(/NaN|null/);
    }
  });
});
