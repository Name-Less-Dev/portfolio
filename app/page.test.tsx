import { render, screen } from "@testing-library/react";
import Home from "./page";

// jsdom não tem WebGL — o hero 3D é testado visualmente, não aqui
vi.mock("@/components/Hero3D", () => ({ default: () => null }));

describe("Home", () => {
  it("renderiza as 4 seções na ordem Projetos → Habilidades → Sobre → Contato", () => {
    render(<Home />);

    const order = ["Projetos", "Habilidades", "Sobre", "Contato"];
    for (const name of order) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(order);
  });

  it("lista os projetos na ordem FlowForge → Storyboard API → FoundCalc → Hex Broom", () => {
    render(<Home />);
    const projetos = screen.getByRole("region", { name: "Projetos" });
    const titles = [...projetos.querySelectorAll("article h3")].map((h) => h.textContent);
    expect(titles).toEqual(["FlowForge", "Storyboard API", "FoundCalc", "Hex Broom"]);
  });

  it("o card do Hex Broom é só o projeto em Unity: sem botão de jogo", () => {
    render(<Home />);
    expect(screen.queryByRole("link", { name: /Broom Dash/i })).toBeNull();
  });

  it("o jogo é acessível por exatamente dois pontos: o ▶ da Navbar e o link no Contato", () => {
    const { container } = render(<Home />);
    const toGame = [...container.querySelectorAll('a[href="/critico"]')];
    expect(toGame).toHaveLength(2);
    expect(container.querySelector("header")!.contains(toGame[0])).toBe(true);
    expect(screen.getByRole("region", { name: "Contato" }).contains(toGame[1])).toBe(true);

    // rotas antigas não existem mais
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs.some((h) => h?.startsWith("/jogo") || h?.startsWith("/broom-dash"))).toBe(false);
  });
});
