import { render, screen } from "@testing-library/react";
import Navbar from "./Navbar";

describe("Navbar", () => {
  it("renderiza os 3 links âncora das seções", () => {
    render(<Navbar />);

    expect(screen.getByRole("link", { name: "Sobre" })).toHaveAttribute("href", "#sobre");
    expect(screen.getByRole("link", { name: "Projetos" })).toHaveAttribute("href", "#projetos");
    expect(screen.getByRole("link", { name: "Contato" })).toHaveAttribute("href", "#contato");
  });

  it("o ▶ ao lado do MB leva ao jogo, com rótulo e tooltip 'Jogar'", () => {
    render(<Navbar />);
    const play = screen.getByRole("link", { name: "Jogar Crítico Natural" });
    expect(play).toHaveAttribute("href", "/critico");
    expect(play).toHaveClass("absolute"); // não desloca o resto da navbar
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent("Jogar");
  });
});
