import { render, screen } from "@testing-library/react";
import { projects } from "@/data/projects";
import ProjectCard from "./ProjectCard";

describe("ProjectCard — imagens", () => {
  it("cada projeto mostra a própria imagem, com texto alternativo", () => {
    for (const project of projects) {
      const { unmount } = render(<ProjectCard {...project} />);
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", project.image!.alt);
      expect(img).toHaveClass("object-cover");
      unmount();
    }
  });

  it("só o Hex Broom (pixel art) usa image-rendering: pixelated e é servido sem o otimizador", () => {
    for (const project of projects) {
      const { unmount } = render(<ProjectCard {...project} />);
      const img = screen.getByRole("img");
      const pixel = project.title === "Hex Broom";
      expect(img.className.includes("[image-rendering:pixelated]")).toBe(pixel);
      // sem otimizador, o src é o arquivo original; com ele, passa por /_next/image
      expect(img.getAttribute("src")!.startsWith("/_next/image")).toBe(!pixel);
      unmount();
    }
  });
});
