import { capabilities } from "@/data/skills";
import DieIcon from "./DieIcon";
import type { BackdropDie } from "./hero/dice";
import Section from "./Section";
import SectionAtmosphere from "./SectionAtmosphere";
import SkillCard from "./SkillCard";

// Só nas bordas (margens e faixas acima/abaixo do grid): nada atrás das cartas, pra não
// interferir no flip. Menos formas que em Projetos e em lados trocados.
const DICE: BackdropDie[] = [
  { shape: 3, scale: 0.32, rest: [1.1, 0.5, -6.5] }, // margem direita, alto
  { shape: 5, scale: 0.3, rest: [-1.1, 0.05, -7] }, // margem esquerda, meio
  { shape: 1, scale: 0.28, rest: [0.42, 0.98, -7.5] }, // faixa do título, direita
  { shape: 2, scale: 0.3, rest: [-0.55, -1.2, -8] }, // abaixo do grid, esquerda
];

export default function Skills() {
  return (
    <Section
      id="habilidades"
      title="Habilidades"
      backdrop={
        <SectionAtmosphere
          glows={[
            // principal atrás do grid, puxado para a direita…
            { at: { x: 68, y: 60 }, w: 40, h: 40, strength: 9 },
            // …e um contraponto bem mais fraco à esquerda, pra esse lado não ficar apagado
            { at: { x: 18, y: 40 }, w: 30, h: 34, strength: 4 },
          ]}
          dice={DICE}
        />
      }
    >
      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map(({ die, name, techs }) => (
          <li key={name}>
            <SkillCard name={name} techs={techs} icon={<DieIcon die={die} className="size-24" />} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
