export type Project = {
  title: string;
  description: string;
  stack: string[];
  /** Repositório do código. Opcional: o card só mostra "Ver código" quando existe. */
  repoUrl?: string;
  /** Versão publicada. Opcional: o card só mostra "Ver ao vivo" quando existe. */
  liveUrl?: string;
  /**
   * Capa exibida em 16:9 (em /public), recortada com object-fit: cover. Sem ela, o card
   * usa um placeholder na paleta do site. `pixelated`: pixel art — amplia sem borrar e
   * é servida como está (sem o otimizador do Next, que reamostraria os pixels).
   * `position`: ponto de corte do cover (object-position) quando a imagem não é 16:9.
   */
  image?: { src: string; alt: string; pixelated?: boolean; position?: string };
};

// Ordem proposital: produto → API → sistema completo → jogo
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
    title: "Storyboard API",
    description:
      "API que transforma o brief de um vídeo publicitário em roteiro por cenas, validada na entrada e na saída, com testes e CI.",
    stack: ["Python", "FastAPI", "Pydantic", "SQLAlchemy", "pytest", "GitHub Actions"],
    repoUrl: "https://github.com/Name-Less-Dev/storyboard-api",
    image: {
      src: "/projects/storyboard-api.png",
      alt: "Terminal showing the JSON storyboard returned by POST /briefs",
      // 2,32:1 → o 16:9 corta ~23% da largura; o JSON começa na borda esquerda, então ancora
      // o corte à esquerda e quem perde é só o fim das linhas longas
      position: "0% 50%",
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
