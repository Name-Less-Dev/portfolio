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

  it("links aparecem só quando o campo existe, em nova aba, sem botão sólido", () => {
    for (const project of projects) {
      const { container, unmount } = render(<ProjectCard {...project} />);
      const code = screen.queryByRole("link", { name: "Ver código" });
      const live = screen.queryByRole("link", { name: "Ver ao vivo" });

      expect(code?.getAttribute("href") ?? undefined).toBe(project.repoUrl);
      expect(live?.getAttribute("href") ?? undefined).toBe(project.liveUrl);
      for (const link of [code, live].filter(Boolean)) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
      const solid = [...container.querySelectorAll("[class]")].filter((el) =>
        el.getAttribute("class")!.split(/\s+/).includes("bg-accent"),
      );
      expect(solid).toHaveLength(0);
      unmount();
    }
  });

  it("FlowForge, Storyboard API e Hex Broom têm link do código; FoundCalc ainda não", () => {
    const repos = Object.fromEntries(projects.filter((p) => p.repoUrl).map((p) => [p.title, p.repoUrl]));
    expect(repos).toEqual({
      FlowForge: "https://github.com/Name-Less-Dev/flowforge-landing",
      "Storyboard API": "https://github.com/Name-Less-Dev/storyboard-api",
      "Hex Broom": "https://github.com/Name-Less-Dev/Hex-Broom",
    });
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
