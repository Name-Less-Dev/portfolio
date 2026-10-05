export type Capability = {
  /** dado que ilustra a carta (nome em components/hero/dice.ts) */
  die: "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
  name: string;
  techs: string[];
};

// Capacidades, não uma lista de tecnologias: a tecnologia é o detalhe no verso da carta
export const capabilities: Capability[] = [
  { die: "d4", name: "Interfaces de produto", techs: ["React", "Next.js", "Tailwind", "Framer Motion", "Figma"] },
  { die: "d6", name: "Dados & Integrações", techs: ["APIs REST", "FastAPI", "SQL", "SQLAlchemy", "NoSQL", "Supabase"] },
  { die: "d8", name: "Qualidade & Confiabilidade", techs: ["Git", "Clean Code", "Vitest", "Testing Library", "pytest", "GitHub Actions"] },
  { die: "d10", name: "Automação de processos", techs: ["N8N"] },
  { die: "d12", name: "Experimentação criativa", techs: ["WebGL", "Three.js"] },
  {
    die: "d20",
    name: "Fundamentos sólidos",
    techs: ["Lógica de programação", "Estruturas de dados", "Python"],
  },
];
