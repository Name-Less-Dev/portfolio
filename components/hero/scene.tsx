"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { Color, MeshStandardMaterial, Vector3, type Mesh } from "three";
import { DICE, type BackdropDie } from "./dice";
import { decay, dragToRotation, releaseVelocity, trackVelocity, type Spin } from "./dragSpin";

/**
 * Peças de cena compartilhadas pela Hero e pelo fundo de Projetos: mesmas
 * luzes, mesmo material de silhueta, mesmo movimento — as duas seções
 * renderizam a camada de fundo com o MESMO componente (<BackdropLayer>).
 */

export function cssColor(name: string) {
  return new Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
}

/** Gerador determinístico: cada dado tem sempre o mesmo "temperamento". */
function seeded(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function createMotion(seed: number) {
  const rand = seeded(seed);
  const signed = (min: number, max: number) => (min + rand() * (max - min)) * (rand() < 0.5 ? -1 : 1);
  return {
    spin: new Vector3(signed(0.08, 0.26), signed(0.12, 0.3), signed(0.04, 0.16)),
    bobFreq: new Vector3(0.21 + rand() * 0.12, 0.33 + rand() * 0.2, 0.17 + rand() * 0.1),
    bobPhase: new Vector3(rand() * 6.28, rand() * 6.28, rand() * 6.28),
    offset: new Vector3(), // desvio atual causado pelo cursor (só os dados principais usam)
  };
}

export const BOB = 0.26;
export const CAMERA = { position: [0, 0, 8] as [number, number, number], fov: 45 };

type Viewport = { width: number; height: number };

/** x/y normalizados (−1…1) → mundo; mais fundo, a área visível cresce na mesma proporção. */
export function placeInViewport([x, y, z]: [number, number, number], { width, height }: Viewport) {
  const depth = (CAMERA.position[2] - z) / CAMERA.position[2];
  return new Vector3(x * (width / 2) * 0.8 * depth, y * (height / 2) * 0.74 * depth, z);
}

export function diceScale({ width }: Viewport) {
  return Math.min(1, Math.max(0.45, width / 11));
}

/**
 * A "pele" dos dados protagonistas (Hero e o d20 do Contato): --surface
 * semi-translúcido, flat shading e brilho de borda fresnel em --accent
 * (injetado como emissão no shader padrão).
 */
export function createDieMaterial() {
  const material = new MeshStandardMaterial({
    color: cssColor("--surface"),
    metalness: 0.35,
    roughness: 0.45,
    flatShading: true,
    transparent: true,
    opacity: 0.78,
  });
  const rim = cssColor("--accent");
  material.onBeforeCompile = (shader) => {
    shader.uniforms.rimColor = { value: rim };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 rimColor;")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        // Câmera ortográfica (jogo) olha sempre em +z; perspectiva usa a direção até o fragmento
        vec3 rimViewDir = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vViewPosition);
        float fresnel = pow(1.0 - saturate(dot(rimViewDir, normal)), 2.2);
        totalEmissiveRadiance += rimColor * fresnel * 1.3;`,
      );
  };
  return material;
}

/** Silhueta: --surface puxado para o fundo, sem brilho de borda. */
export function createBackdropMaterial() {
  const tone = cssColor("--surface").lerp(cssColor("--bg"), 0.35);
  return new MeshStandardMaterial({
    color: tone,
    // Um piso de emissão para não virar preto puro longe das luzes
    emissive: tone.clone().multiplyScalar(0.35),
    metalness: 0.1,
    roughness: 0.9,
    flatShading: true,
  });
}

export function SceneLights() {
  const accent = useMemo(() => cssColor("--accent"), []);
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 6]} intensity={1.5} />
      <pointLight position={[-4, -3, 3]} color={accent} intensity={20} />
    </>
  );
}

/** Camada de formas pequenas, escuras e fundas. Giro e flutuação lentos, sem mouse. */
export function BackdropLayer({ items, still }: { items: BackdropDie[]; still: boolean }) {
  const viewport = useThree((s) => s.viewport);
  const meshes = useRef<(Mesh | null)[]>([]);
  const material = useMemo(createBackdropMaterial, []);
  const geometries = useMemo(() => DICE.map((d) => d.create(d.radius)), []);
  const motion = useMemo(() => items.map((_, i) => createMotion(i + 101)), [items]);

  const layout = useMemo(
    () => ({ rest: items.map((b) => placeInViewport(b.rest, viewport)), scale: diceScale(viewport) }),
    [items, viewport],
  );

  useLayoutEffect(
    () => () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
    },
    [geometries, material],
  );

  const base = useMemo(() => new Vector3(), []);

  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const t = clock.elapsedTime;
    items.forEach((b, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const m = motion[i];
      base.copy(layout.rest[i]);
      if (!still) {
        base.y += BOB * 0.7 * Math.sin(t * m.bobFreq.y * 0.7 + m.bobPhase.y);
        mesh.rotation.x += m.spin.x * delta * 0.6;
        mesh.rotation.y += m.spin.y * delta * 0.6;
      }
      mesh.position.copy(base);
      mesh.scale.setScalar(layout.scale * b.scale);
    });
  });

  return (
    <>
      {items.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={geometries[b.shape]}
          material={material}
          position={layout.rest[i]}
          rotation={[i * 1.1, i * 0.6, i * 0.9]}
        />
      ))}
    </>
  );
}

/** Canvas próprio só com a camada de fundo (para seções fora da Hero). Pausa fora da tela. */
export function BackdropCanvas({ items, className }: { items: BackdropDie[]; className?: string }) {
  const still = useReducedMotion() ?? false;
  const box = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} className={className}>
      <Canvas
        aria-hidden
        camera={CAMERA}
        dpr={[1, 2]}
        frameloop={!onScreen ? "never" : still ? "demand" : "always"}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: "none" }}
      >
        <SceneLights />
        <BackdropLayer items={items} still={still} />
      </Canvas>
    </div>
  );
}


// Bem mais lento que qualquer outra forma do site (fundo: ~0,1 rad/s; Hero: até 0,3)
const REST_SPIN = { x: 0.012, y: 0.035 };
const AXIS_X = new Vector3(1, 0, 0);
const AXIS_Y = new Vector3(0, 1, 0);

/** Estado do gesto, compartilhado entre o DOM (ponteiro) e o loop de render. */
type DragState = {
  dragging: boolean;
  /** rotação arrastada desde o último quadro, ainda não aplicada */
  pending: Spin;
  /** velocidade atual (estimada no arrasto; decai na inércia) */
  velocity: Spin;
  lastMove: number;
  lastX: number;
  lastY: number;
};

function RestingMesh({
  still,
  drag,
  onSettled,
}: {
  still: boolean;
  drag: React.RefObject<DragState>;
  onSettled: () => void;
}) {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(createDieMaterial, []);
  const d20 = DICE.find((d) => d.name === "d20")!;
  const geometry = useMemo(() => d20.create(d20.radius), [d20]);

  useLayoutEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, rawDelta) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(rawDelta, 0.1);
    const s = drag.current;

    if (s.dragging) {
      // Segue o cursor: eixos do mundo, então "arrastar pra direita" gira pra direita
      // não importa como o dado já esteja virado
      m.rotateOnWorldAxis(AXIS_Y, s.pending.y);
      m.rotateOnWorldAxis(AXIS_X, s.pending.x);
      s.pending = { x: 0, y: 0 };
      return;
    }

    // Inércia: continua na direção do arrasto, desacelerando até parar
    if (s.velocity.x || s.velocity.y) {
      m.rotateOnWorldAxis(AXIS_Y, s.velocity.y * dt);
      m.rotateOnWorldAxis(AXIS_X, s.velocity.x * dt);
      s.velocity = decay(s.velocity, dt);
      if (!s.velocity.x && !s.velocity.y) onSettled();
    }

    // Giro automático lento (desligado com reduced-motion; o arrasto continua valendo)
    if (!still) {
      m.rotateOnWorldAxis(AXIS_Y, REST_SPIN.y * dt);
      m.rotateOnWorldAxis(AXIS_X, REST_SPIN.x * dt);
    }
  });

  return <mesh ref={mesh} geometry={geometry} material={material} rotation={[0.35, 0.5, 0.1]} />;
}

/**
 * Um único d20 em repouso — o fechamento calmo do que a Hero abre com 6 dados.
 * Mesma pele (createDieMaterial) e mesmas luzes. Gira sozinho devagar e pode ser
 * arrastado (mouse ou toque), com inércia ao soltar. Para fora da tela.
 */
export function RestingDie({ className = "" }: { className?: string }) {
  const still = useReducedMotion() ?? false;
  const box = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  // Com reduced-motion o loop fica em "demand"; durante arrasto/inércia ele precisa rodar
  const [interacting, setInteracting] = useState(false);
  const drag = useRef<DragState>({
    dragging: false,
    pending: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    lastMove: 0,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    Object.assign(drag.current, {
      dragging: true,
      velocity: { x: 0, y: 0 },
      lastMove: e.timeStamp,
      lastX: e.clientX,
      lastY: e.clientY,
    });
    setGrabbing(true);
    setInteracting(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = drag.current;
    if (!s.dragging) return;
    const rotation = dragToRotation(e.clientX - s.lastX, e.clientY - s.lastY);
    s.pending = { x: s.pending.x + rotation.x, y: s.pending.y + rotation.y };
    s.velocity = trackVelocity(s.velocity, rotation, e.timeStamp - s.lastMove);
    Object.assign(s, { lastMove: e.timeStamp, lastX: e.clientX, lastY: e.clientY });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = drag.current;
    if (!s.dragging) return;
    s.dragging = false;
    s.velocity = releaseVelocity(s.velocity, e.timeStamp - s.lastMove);
    setGrabbing(false);
    if (!s.velocity.x && !s.velocity.y) setInteracting(false);
  };

  return (
    <div
      ref={box}
      // touch-none: no celular, arrastar sobre o dado gira o dado em vez de rolar a página
      className={`touch-none select-none ${grabbing ? "cursor-grabbing" : "cursor-grab"} ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Canvas
        aria-hidden
        camera={{ position: [0, 0, 3.4], fov: 35 }}
        dpr={[1, 2]}
        frameloop={!onScreen ? "never" : still && !interacting ? "demand" : "always"}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: "none" }}
      >
        <SceneLights />
        <RestingMesh still={still} drag={drag} onSettled={() => setInteracting(false)} />
      </Canvas>
    </div>
  );
}
