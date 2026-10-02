"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { Plane, Raycaster, Vector2, Vector3, type Mesh } from "three";
import { BACKDROP, DICE } from "./hero/dice";
import {
  BOB,
  BackdropLayer,
  CAMERA,
  SceneLights,
  createDieMaterial,
  createMotion,
  diceScale,
  placeInViewport,
} from "./hero/scene";

type PointerState = { ndc: Vector2; active: boolean };

// Repulsão do cursor (unidades do mundo)
const INFLUENCE = 1.9;
const MAX_PUSH = 0.75;

function DiceField({ still, pointer }: { still: boolean; pointer: React.RefObject<PointerState> }) {
  const viewport = useThree((s) => s.viewport);
  const meshes = useRef<(Mesh | null)[]>([]);

  const material = useMemo(createDieMaterial, []);
  const geometries = useMemo(() => DICE.map((d) => d.create(d.radius)), []);

  // Layout relativo à viewport: o aglomerado mantém a mesma composição em desktop e mobile
  const layout = useMemo(() => {
    // Em retrato o texto ocupa a largura toda: os dados vão para as faixas acima/abaixo dele
    const portrait = viewport.aspect < 1;
    const rest = DICE.map(({ rest: [x, y, z] }) =>
      placeInViewport([x, portrait ? Math.sign(y) * (0.6 + 0.4 * Math.abs(y)) : y, z], viewport),
    );
    return { rest, scale: diceScale(viewport) };
  }, [viewport]);

  const motion = useMemo(() => DICE.map((_, i) => createMotion(i + 1)), []);

  useLayoutEffect(
    () => () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
    },
    [geometries, material],
  );

  const scratch = useMemo(
    () => ({
      raycaster: new Raycaster(),
      plane: new Plane(new Vector3(0, 0, 1), 0),
      hit: new Vector3(),
      base: new Vector3(),
      away: new Vector3(),
      target: new Vector3(),
    }),
    [],
  );

  useFrame(({ clock, camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const t = clock.elapsedTime;
    const { raycaster, plane, hit, base, away, target } = scratch;
    const tracking = !still && pointer.current.active;
    if (tracking) raycaster.setFromCamera(pointer.current.ndc, camera);

    DICE.forEach((_, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const m = motion[i];
      base.copy(layout.rest[i]);

      if (!still) {
        base.x += BOB * 0.6 * Math.sin(t * m.bobFreq.x + m.bobPhase.x);
        base.y += BOB * Math.sin(t * m.bobFreq.y + m.bobPhase.y);
        base.z += BOB * 0.8 * Math.sin(t * m.bobFreq.z + m.bobPhase.z);

        // Cursor projetado num plano na profundidade deste dado; empurra para longe, com falloff
        target.set(0, 0, 0);
        if (tracking) {
          plane.constant = -base.z;
          if (raycaster.ray.intersectPlane(plane, hit)) {
            away.set(base.x - hit.x, base.y - hit.y, 0);
            const dist = away.length();
            if (dist < INFLUENCE && dist > 1e-4) {
              const falloff = (1 - dist / INFLUENCE) ** 2;
              target.copy(away).multiplyScalar((MAX_PUSH * falloff) / dist);
            }
          }
        }
        m.offset.lerp(target, 1 - Math.exp(-delta * 3));
        base.add(m.offset);

        mesh.rotation.x += m.spin.x * delta;
        mesh.rotation.y += m.spin.y * delta;
        mesh.rotation.z += m.spin.z * delta;
      }

      mesh.position.copy(base);
      mesh.scale.setScalar(layout.scale);
    });
  });

  return (
    <>
      {DICE.map((die, i) => (
        <mesh
          key={die.name}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={geometries[i]}
          material={material}
          position={layout.rest[i]}
          rotation={[i * 0.7, i * 1.3, i * 0.4]}
        />
      ))}
    </>
  );
}

export default function Hero3D() {
  const still = useReducedMotion() ?? false;
  const canvasBox = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerState>({ ndc: new Vector2(), active: false });
  const [onScreen, setOnScreen] = useState(true);

  // Fora da tela, o loop de render para
  useEffect(() => {
    const el = canvasBox.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const trackPointer = (e: React.PointerEvent) => {
    const rect = canvasBox.current?.getBoundingClientRect();
    if (!rect) return;
    pointer.current.ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    // Só mouse/caneta: arrastar o dedo para rolar a página não deve empurrar os dados
    pointer.current.active = e.pointerType !== "touch";
  };

  return (
    <section
      id="inicio"
      aria-label="Apresentação"
      className="relative h-svh min-h-[560px] overflow-hidden"
      onPointerMove={trackPointer}
      onPointerLeave={() => (pointer.current.active = false)}
    >
      {/* Atmosfera: glow âmbar suave atrás do nome, por baixo do canvas transparente */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_42%_34%_at_50%_50%,color-mix(in_srgb,var(--accent)_16%,transparent)_0%,color-mix(in_srgb,var(--accent)_6%,transparent)_45%,transparent_100%)]"
      />

      <div ref={canvasBox} className="absolute inset-0">
        <Canvas
          aria-hidden
          camera={CAMERA}
          dpr={[1, 2]}
          frameloop={!onScreen ? "never" : still ? "demand" : "always"}
          gl={{ alpha: true, antialias: true }}
        >
          <SceneLights />
          <BackdropLayer items={BACKDROP} still={still} />
          <DiceField still={still} pointer={pointer} />
        </Canvas>
      </div>

      {/* Mesmo container central das outras seções; o texto da Hero é o único centralizado */}
      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-6 text-center md:px-12">
        <h1 className="font-display text-display">Matheus Bezerra</h1>
        {/* "Front-End / Full-Stack" não quebra por dentro (nem na barra, nem no hífen): no celular a
            quebra cai depois de "Desenvolvedor" */}
        <p className="mt-6 text-h3 text-fg/80">
          Desenvolvedor <span className="whitespace-nowrap">Front-End / Full-Stack</span>
        </p>
        <p className="mt-4 max-w-md text-fg/65">
          Interfaces bem construídas, sustentadas por sistemas igualmente sólidos.
        </p>
      </div>
    </section>
  );
}
