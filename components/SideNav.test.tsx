import { render, screen, within } from "@testing-library/react";
import SideNav from "./SideNav";
import WhatsAppButton, { WHATSAPP_URL } from "./WhatsAppButton";

describe("SideNav", () => {
  it("tem um link por seção, na ordem da página, com o nome como rótulo e tooltip", () => {
    render(<SideNav />);
    const nav = screen.getByRole("navigation", { name: "Seções" });
    const links = within(nav).getAllByRole("link");

    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "#inicio",
      "#projetos",
      "#habilidades",
      "#sobre",
      "#contato",
    ]);
    expect(links.map((a) => a.getAttribute("aria-label"))).toEqual(["Início", "Projetos", "Habilidades", "Sobre", "Contato"]);
    expect(within(nav).getAllByRole("tooltip", { hidden: true })).toHaveLength(5);
  });

  it("começa com o Início ativo; inativos apagam o ícone (aresta --muted, sem brilho)", () => {
    render(<SideNav />);
    const [inicio, projetos] = screen.getAllByRole("link");
    expect(inicio).toHaveAttribute("aria-current", "location");
    expect(projetos.className).toContain("[--die-edge:var(--muted)]");
    expect(projetos.className).toContain("[--die-glow:none]");
  });

  it("fica escondida abaixo de xl", () => {
    render(<SideNav />);
    expect(screen.getByRole("navigation", { name: "Seções" })).toHaveClass("hidden", "xl:block");
  });
});

describe("WhatsAppButton", () => {
  it("aponta para o número no formato do wa.me", () => {
    expect(WHATSAPP_URL).toBe("https://wa.me/5561992689919");
  });

  it("fica oculto (e fora do teclado) enquanto a Hero está na tela", () => {
    document.body.innerHTML = '<section id="inicio"></section>';
    render(<WhatsAppButton />);
    const link = document.querySelector(`a[href="${WHATSAPP_URL}"]`)!;
    expect(link).toHaveAttribute("data-visible", "false");
    expect(link).toHaveAttribute("tabindex", "-1");
    expect(link.className).not.toMatch(/(^|\s)bg-accent(\s|$)/);
  });
});
