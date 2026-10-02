import { render, screen } from "@testing-library/react";
import About from "./About";

describe("About", () => {
  it("tem os 3 parágrafos no fluxo normal e a timeline com os 4 marcos", () => {
    const { container } = render(<About />);

    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toHaveTextContent(/editando vídeo e imagem/);
    expect(paragraphs[1]).toHaveTextContent(/basquete/);
    expect(paragraphs[2]).toHaveTextContent(/Hex Broom.*Crítico Natural/);
    expect(container.querySelector("blockquote")).toBeNull();

    const years = [...container.querySelectorAll("ol li")].map((li) => li.textContent?.slice(0, 4));
    expect(years).toEqual(["2023", "2024", "2025", "2026"]);
  });

  it("destaca exatamente os 3 trechos, só com cor", () => {
    const { container } = render(<About />);
    const highlights = [...container.querySelectorAll("mark")];

    expect(highlights.map((m) => m.textContent)).toEqual([
      "produtos de ponta a ponta, do banco de dados à interface",
      "confiando que o resto do time cobre o resto da quadra",
      "sistemas, regras e peças que se encaixam",
    ]);
    for (const m of highlights) expect(m).toHaveClass("text-accent", "bg-transparent");
  });

  it("o link para Projetos aponta para a âncora da seção", () => {
    render(<About />);
    expect(screen.getByRole("link", { name: "Projetos" })).toHaveAttribute("href", "#projetos");
  });
});
