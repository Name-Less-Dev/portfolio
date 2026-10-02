import { fireEvent, render, screen } from "@testing-library/react";
import { capabilities } from "@/data/skills";
import Skills from "./Skills";

describe("Skills", () => {
  it("mostra as 6 capacidades, com as tecnologias no verso (sempre no DOM)", () => {
    render(<Skills />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(
      capabilities.map((c) => c.name),
    );
    expect(screen.getByText("N8N")).toBeInTheDocument();
    expect(screen.getByText("Lógica de programação")).toBeInTheDocument();
  });

  it("tap vira a carta, tap de novo desvira, e tocar fora também desvira", () => {
    render(<Skills />);
    const card = screen.getByLabelText(/^Automação de processos/);

    fireEvent.click(card);
    expect(card).toHaveAttribute("data-flipped", "true");
    fireEvent.click(card);
    expect(card).toHaveAttribute("data-flipped", "false");

    fireEvent.click(card);
    fireEvent.pointerDown(document.body);
    expect(card).toHaveAttribute("data-flipped", "false");
  });

  it("teclado: Enter vira a carta", () => {
    render(<Skills />);
    const card = screen.getByLabelText(/^Fundamentos sólidos/);
    fireEvent.keyDown(card, { key: "Enter" });
    expect(card).toHaveAttribute("data-flipped", "true");
  });
});
