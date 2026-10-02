import DieIcon from "./DieIcon";
import SideNavList from "./SideNavList";

// Um ícone de dado distinto por seção (sem relação de significado, só identidade visual)
const sections = [
  { id: "inicio", label: "Início", die: "d20" },
  { id: "projetos", label: "Projetos", die: "d6" },
  { id: "habilidades", label: "Habilidades", die: "d8" },
  { id: "sobre", label: "Sobre", die: "d4" },
  { id: "contato", label: "Contato", die: "d12" },
];

/**
 * Navegação lateral fixa na borda ESQUERDA (a direita fica para o botão do WhatsApp).
 * Os ícones são desenhados no servidor e repassados à lista, que só cuida do estado ativo.
 * Some abaixo de xl: no celular/tablet a navbar do topo já resolve, e abaixo de 1280px a margem
 * lateral do container (48px) deixa só ~4px entre os ícones e o conteúdo.
 */
export default function SideNav() {
  return (
    <nav aria-label="Seções" className="fixed top-1/2 left-3 z-40 hidden -translate-y-1/2 xl:block">
      <SideNavList
        items={sections.map(({ id, label, die }) => ({
          id,
          label,
          icon: <DieIcon die={die} className="size-6" />,
        }))}
      />
    </nav>
  );
}
