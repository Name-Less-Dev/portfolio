import { render, screen } from "@testing-library/react";
import Contact from "./Contact";

describe("Contact", () => {
  it("o botão principal abre o e-mail e os secundários levam a GitHub e LinkedIn", () => {
    render(<Contact />);

    expect(screen.getByRole("link", { name: "Me mande um e-mail" })).toHaveAttribute(
      "href",
      "mailto:matheusdearaujobezerra@gmail.com",
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/Name-Less-Dev");
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/matheus-araujo-bezerra",
    );
  });

  it("link secundário para o jogo, interno (mesma aba)", () => {
    render(<Contact />);
    const game = screen.getByRole("link", { name: "Jogar Crítico Natural" });
    expect(game).toHaveAttribute("href", "/critico");
    expect(game).not.toHaveAttribute("target");
  });

  it("só o botão de e-mail tem fundo sólido em --accent", () => {
    const { container } = render(<Contact />);
    const solid = [...container.querySelectorAll("[class]")].filter((el) =>
      el.getAttribute("class")!.split(/\s+/).includes("bg-accent"),
    );
    expect(solid).toHaveLength(1);
    expect(solid[0]).toHaveTextContent("Me mande um e-mail");
  });

  it("rodapé com o ano atual", () => {
    render(<Contact />);
    expect(screen.getByText(new RegExp(`Feito com Next.js e React Three Fiber. © ${new Date().getFullYear()}`))).toBeInTheDocument();
  });
});
