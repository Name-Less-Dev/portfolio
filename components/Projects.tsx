import { projects } from "@/data/projects";
import type { BackdropDie } from "./hero/dice";
import ProjectCard from "./ProjectCard";
import Section from "./Section";
import SectionAtmosphere from "./SectionAtmosphere";

// O grid ocupa quase toda a largura do container, então as formas vão para as áreas
// livres — margens laterais, faixa do título e faixa abaixo dos cards —, 3 de cada lado.
const DICE: BackdropDie[] = [
  { shape: 4, scale: 0.34, rest: [-1.1, 0.35, -6.5] }, // margem esquerda, alto
  { shape: 0, scale: 0.36, rest: [-1.12, -0.55, -6] }, // margem esquerda, baixo
  { shape: 1, scale: 0.3, rest: [-0.45, -1.2, -8] }, // abaixo do grid, esquerda
  { shape: 5, scale: 0.36, rest: [0.6, 0.95, -6] }, // faixa do título, direita
  { shape: 2, scale: 0.34, rest: [1.1, -0.2, -7] }, // margem direita
  { shape: 4, scale: 0.28, rest: [0.55, -1.2, -8.5] }, // abaixo do grid, direita
];

export default function Projects() {
  return (
    <Section
      id="projetos"
      title="Projetos"
      backdrop={<SectionAtmosphere glows={[{ at: { x: 50, y: 58 }, strength: 10 }]} dice={DICE} />}
    >
      {/* Cresce sozinho: projeto novo no array = novo card. Flex com largura fixa por card (não
          grid): uma linha incompleta fica centralizada e o card solitário não estica. */}
      <ul className="mt-12 flex flex-wrap justify-center gap-6">
        {projects.map((project, i) => (
          <li key={project.title} className="w-full md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]">
            <ProjectCard {...project} index={i} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
