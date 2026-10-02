import DieIcon from "./DieIcon";
import type { BackdropDie } from "./hero/dice";
import FadeIn from "./FadeIn";
import Highlight from "./Highlight";
import Section from "./Section";
import SectionAtmosphere from "./SectionAtmosphere";

// Cada marco usa o ícone de um dado da seção Habilidades: identidade visual, não significado
const milestones = [
  { year: "2023", die: "d4", text: "Estágio em edição de vídeo e imagem na Conectando Pessoas" },
  { year: "2024", die: "d6", text: "Comecei como desenvolvedor full-stack freelancer" },
  { year: "2025", die: "d8", text: "Cofundei a Vortex Tech, onde sou desenvolvedor full-stack" },
  { year: "2026", die: "d12", text: "Conclusão de Ciência da Computação na Universidade Católica de Brasília" },
];

// Seção densa: só 2 formas, em diagonal, nos CANTOS. A posição é relativa à largura da
// seção inteira (não do container), então qualquer coisa "perto do título" muda de lugar
// conforme a tela — nos cantos elas ficam sempre nas margens livres: acima do título
// (dentro do padding do topo) e abaixo do painel/texto (dentro do padding da base).
// Na tela: x = 50% + nx·40%, y = 50% − ny·37% da seção.
const DICE: BackdropDie[] = [
  { shape: 5, scale: 0.3, rest: [1.08, 1.12, -7] }, // canto superior direito (~93%, ~9%)
  { shape: 2, scale: 0.32, rest: [-1.1, -1.25, -6.5] }, // canto inferior esquerdo (~6%, ~96%)
];

export default function About() {
  return (
    <Section
      id="sobre"
      title="Sobre"
      // Versão mais discreta: glow principal perto do texto, um contraponto bem mais fraco
      // atrás do painel da timeline e só 3 dados, fora do texto e do painel
      backdrop={
        <SectionAtmosphere
          glows={[
            { at: { x: 24, y: 26 }, w: 30, h: 24, strength: 6 },
            { at: { x: 78, y: 60 }, w: 26, h: 30, strength: 3 },
          ]}
          dice={DICE}
          // Abaixo de lg o Sobre vira coluna única e cheia: não sobra canto livre para os dados
          diceFrom="lg"
        />
      }
    >
      {/* Duas colunas no desktop: texto (~58%) | timeline num painel de vidro (~42%) */}
      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:gap-16">
        <FadeIn className="max-w-[65ch] space-y-6 text-fg/80">
          <p>
            Comecei editando vídeo e imagem, e foi ali que aprendi que detalhe visual não é
            enfeite: é o que faz alguém confiar no que está usando. Hoje trabalho em{" "}
            <Highlight>produtos de ponta a ponta, do banco de dados à interface</Highlight>, e sei
            reconhecer quando um time constrói
            algo coerente — cada parte no lugar certo, sem remendo entre elas.
          </p>
          <p>
            Jogo basquete desde sempre, e aprendi cedo que time bom não é cinco pessoas boas
            sozinhas — é cada uma sabendo exatamente o papel que precisa cumprir e{" "}
            <Highlight>confiando que o resto do time cobre o resto da quadra</Highlight>. Levo isso
            pro trabalho: não preciso ser quem resolve tudo, preciso entregar bem a minha parte e me
            comunicar claro o suficiente pra próxima pessoa continuar de onde eu parei.
          </p>
          <p>
            Os dados que giram lá em cima não são só estética — venho de uma trajetória de
            construir jogos nas horas vagas, do Hex Broom (um projeto em Unity, veja na seção de{" "}
            <a
              href="#projetos"
              className="underline decoration-muted underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              Projetos
            </a>
            ) até o Crítico Natural, o mini-jogo escondido aqui mesmo no site. Essa mesma lógica de{" "}
            <Highlight>sistemas, regras e peças que se encaixam</Highlight> é o que trago pra
            qualquer interface que construo.
          </p>
        </FadeIn>

        {/* Painel de vidro (mesmo tratamento dos cards de Projetos). Estica até a altura da
            coluna de texto (stretch, padrão do grid) e espalha os marcos nessa altura toda */}
        <FadeIn className="flex flex-col rounded-xl border border-muted/30 bg-surface/[0.18] px-6 py-8 backdrop-blur-[14px] md:px-8 md:py-10">
          {/* Timeline: linha reta fina, marcadores = ícones dos dados. Recuo menor que o das seções */}
          <div className="relative flex flex-1 flex-col pl-(--gutter) [--gutter:2.25rem]">
            <span aria-hidden className="absolute inset-y-1 left-0 w-px bg-muted/60" />
            <ol className="flex flex-1 flex-col justify-between gap-7">
              {milestones.map(({ year, die, text }) => (
                <li key={year} className="relative flex flex-col gap-1.5">
                  <DieIcon
                    die={die}
                    className="absolute top-[-0.3rem] left-[calc(-1*var(--gutter))] size-7 -translate-x-1/2"
                  />
                  <span className="font-display text-h3 leading-none text-fg tabular-nums">{year}</span>
                  <span className="text-fg/75">{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}
