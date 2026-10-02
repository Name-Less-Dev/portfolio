import {
  MAX_SPIN,
  STILL_BEFORE_RELEASE_MS,
  decay,
  dragToRotation,
  releaseVelocity,
  trackVelocity,
} from "./dragSpin";

describe("dragSpin", () => {
  it("arrasto horizontal gira no eixo Y, vertical no eixo X", () => {
    expect(dragToRotation(100, 0)).toMatchObject({ x: 0 });
    expect(dragToRotation(100, 0).y).toBeGreaterThan(0);
    expect(dragToRotation(0, -50).y).toBe(0);
    expect(dragToRotation(0, -50).x).toBeLessThan(0);
  });

  it("estima a velocidade do gesto, com teto para petelecos fortes", () => {
    const v = trackVelocity({ x: 0, y: 0 }, dragToRotation(20, 0), 16);
    expect(v.y).toBeGreaterThan(0);
    expect(trackVelocity({ x: 0, y: 0 }, dragToRotation(5000, 0), 16).y).toBe(MAX_SPIN);
  });

  it("sem inércia se o gesto parou antes de soltar", () => {
    const v = { x: 1, y: 3 };
    expect(releaseVelocity(v, 10)).toEqual(v);
    expect(releaseVelocity(v, STILL_BEFORE_RELEASE_MS + 1)).toEqual({ x: 0, y: 0 });
  });

  it("a inércia desacelera até parar, igual em qualquer FPS", () => {
    let at60 = { x: 0, y: 4 };
    for (let i = 0; i < 60; i++) at60 = decay(at60, 1 / 60);
    let at30 = { x: 0, y: 4 };
    for (let i = 0; i < 30; i++) at30 = decay(at30, 1 / 30);
    expect(at60.y).toBeLessThan(4);
    expect(at60.y).toBeCloseTo(at30.y, 6);

    let v = { x: 0, y: 4 };
    for (let i = 0; i < 600 && (v.x || v.y); i++) v = decay(v, 1 / 60);
    expect(v).toEqual({ x: 0, y: 0 });
  });
});
