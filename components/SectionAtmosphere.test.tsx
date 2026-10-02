import { render } from "@testing-library/react";
import SectionAtmosphere, { glowGradient } from "./SectionAtmosphere";

describe("glowGradient", () => {
  it("posiciona por preset ou por x/y custom, com a opacidade pedida", () => {
    expect(glowGradient({ at: "left" })).toContain("at 22% 45%");
    expect(glowGradient({ at: { x: 62, y: 60 }, strength: 6 })).toMatch(/at 62% 60%.*var\(--accent\) 6%/);
  });

  it("mantém a elipse inteira dentro da seção na vertical (sem corte reto no topo/base)", () => {
    // centro a 16% com raio de 24% passaria do topo: é puxado para 24%
    expect(glowGradient({ at: { x: 16, y: 16 }, h: 24 })).toContain("at 16% 24%");
    expect(glowGradient({ at: { x: 50, y: 95 }, h: 20 })).toContain("at 50% 80%");
  });
});

describe("SectionAtmosphere", () => {
  it("combina vários glows numa camada só", () => {
    const { container } = render(
      <SectionAtmosphere glows={[{ at: "right", strength: 8 }, { at: "left", strength: 3 }]} />,
    );
    const background = (container.firstElementChild as HTMLElement).style.background;
    expect(background.match(/radial-gradient/g)).toHaveLength(2);
  });

  it("sem glows e sem dados, não desenha nada", () => {
    expect(render(<SectionAtmosphere glows={[]} />).container.children).toHaveLength(0);
  });
});
