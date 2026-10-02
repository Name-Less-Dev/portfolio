export type Project = {
  title: string;
  description: string;
  stack: string[];
  url?: string;
  /** Ação interna do site (ex.: jogo jogável no próprio portfólio) */
  action?: { label: string; href: string };
  /**
   * Capa exibida em 16:9 (em /public), recortada com object-fit: cover. Sem ela, o card
   * usa um placeholder na paleta do site. `pixelated`: pixel art — amplia sem borrar e
   * é servida como está (sem o otimizador do Next, que reamostraria os pixels).
   * `position`: ponto de corte do cover (object-position) quando a imagem não é 16:9.
   */
  image?: { src: string; alt: string; pixelated?: boolean; position?: string };
};

// Ordem proposital: produto → sistema completo → jogo
export const projects: Project[] = [
  {
    title: "FlowForge",
    description: "Interface de produto pensada pra parecer que já tem usuários pagantes.",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion"],
    image: {
      src: "/projects/flowforge.png",
      alt: "Página inicial do FlowForge: título “Automatize tarefas. Escale resultados.” ao lado de um painel de análise de workflow",
      // 2,14:1 → o 16:9 corta ~17% da largura; puxa o corte pra direita e preserva o título/logo
      position: "20% 50%",
    },
  },
  {
    title: "FoundCalc",
    description:
      "Sistema full-stack para cálculo de fundações, do banco de dados à interface de quem usa em campo.",
    stack: ["Java", "Kotlin", "SwiftUI", "PostgreSQL", "Arquitetura de software"],
    image: {
      src: "/projects/foundcalc.png",
      alt: "Tela de apresentação do FoundCalc com o diagrama de uma estaca no solo e o gráfico de N SPT por profundidade",
    },
  },
  {
    title: "Hex Broom",
    description:
      "Um jogo 2D construído do zero em Unity — a mesma lógica de sistemas que uso pra construir para a web.",
    stack: ["Unity", "C#", "Aseprite"],
    image: {
      src: "/projects/hexbroom.png",
      alt: "Pixel art do Hex Broom: uma bruxinha de chapéu roxo voando de vassoura num céu estrelado",
      pixelated: true,
    },
  },
];
