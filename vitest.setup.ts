import "@testing-library/jest-dom/vitest";

// jsdom não implementa estas APIs de layout; os componentes só precisam que existam.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver;

// jsdom não tem WebGL: o canvas de fundo das seções (SectionAtmosphere) não renderiza nos testes.
// Para testar a cena em si, use vi.unmock("@/components/hero/scene") no arquivo do teste.
vi.mock("@/components/hero/scene", () => ({ BackdropCanvas: () => null, RestingDie: () => null }));
