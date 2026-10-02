"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshStandardMaterial, Object3D, TetrahedronGeometry, type BufferGeometry, type InstancedMesh } from "three";
import { DICE } from "../hero/dice";
import { createBackdropMaterial, cssColor } from "../hero/scene";
import { ENEMY_KINDS, ENEMY_SPECS, MAX_ENEMIES, type EnemyKind, type GameState } from "./engine";

const FRAGMENT_POOL = 160; // vários kills quase juntos no fim da rampa
const FRAGMENTS_PER_KILL = 10;
const FRAGMENT_LIFE = 0.5; // s

type Fragment = { x: number; y: number; vx: number; vy: number; rot: number; spin: number; life: number };

/**
 * Inimigos com o MESMO material das silhuetas de fundo do site (sem o brilho
 * âmbar do jogador): fica claro quem é "eu" e quem é inimigo. Ao morrer, o dado
 * estilhaça em fragmentos que voam e encolhem.
 *
 * Performance: um InstancedMesh por tipo (e um para os fragmentos) — um draw
 * call por tipo, não importa quantos inimigos estejam na tela. A capacidade de
 * cada um é o teto do motor (MAX_ENEMIES), então nenhum inimigo fica sem vaga.
 */
export default function EnemiesLayer({ game, still }: { game: GameState; still: boolean }) {
  const meshes = useRef<Partial<Record<EnemyKind, InstancedMesh | null>>>({});
  const shards = useRef<InstancedMesh>(null);
  const fragments = useRef<Fragment[]>([]);
  const dummy = useMemo(() => new Object3D(), []);

  const material = useMemo(createBackdropMaterial, []);
  const geometries = useMemo(
    () =>
      Object.fromEntries(
        ENEMY_KINDS.map((kind) => [kind, DICE.find((d) => d.name === kind)!.create(ENEMY_SPECS[kind].radius / 1.05)]),
      ) as Record<EnemyKind, BufferGeometry>,
    [],
  );
  const shardGeometry = useMemo(() => new TetrahedronGeometry(7), []);
  // Fragmentos em --muted: na cor da silhueta um caco de 7 px some no fundo; mais claro, ainda
  // dessaturado e sem âmbar (continua sendo "do inimigo")
  const shardMaterial = useMemo(() => {
    const muted = cssColor("--muted");
    return new MeshStandardMaterial({ color: muted, emissive: muted.clone().multiplyScalar(0.35), flatShading: true, roughness: 0.8 });
  }, []);

  useLayoutEffect(
    () => () => {
      Object.values(geometries).forEach((g) => g.dispose());
      shardGeometry.dispose();
      shardMaterial.dispose();
      material.dispose();
    },
    [geometries, shardGeometry, shardMaterial, material],
  );

  const round = useRef(game.round);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = clock.elapsedTime;

    // "Jogar de novo": some com os fragmentos que sobraram da partida anterior
    if (game.round !== round.current) {
      round.current = game.round;
      fragments.current = [];
    }

    // Eventos do motor (limpos pela cena a cada quadro): cada kill vira uma explosão de fragmentos
    for (const ev of game.events) {
      if (ev.type !== "kill" || still) continue;
      for (let i = 0; i < FRAGMENTS_PER_KILL; i++) {
        const angle = (i / FRAGMENTS_PER_KILL) * Math.PI * 2 + Math.random() * 0.5;
        const speed = 120 + Math.random() * 160;
        fragments.current.push({
          x: ev.x,
          y: ev.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 20,
          life: FRAGMENT_LIFE,
        });
      }
    }
    if (fragments.current.length > FRAGMENT_POOL) fragments.current.splice(0, fragments.current.length - FRAGMENT_POOL);

    // Fim de jogo: a cena congela (inimigos, giro e fragmentos param onde estão)
    if (game.over) return;

    // Inimigos: uma instância por inimigo vivo; rotação lenta derivada do id (cada um gira diferente)
    const r = still ? 0 : t;
    for (const kind of ENEMY_KINDS) {
      const mesh = meshes.current[kind];
      if (!mesh) continue;
      let n = 0;
      for (const e of game.enemies) {
        if (e.kind !== kind) continue;
        dummy.position.set(e.x, e.y, 0);
        dummy.rotation.set(0.6 + r * 0.9 + e.id, 0.4 + r * 0.7 + e.id * 1.7, e.id * 0.3);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(n++, dummy.matrix);
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Fragmentos: voam para fora, desaceleram e encolhem até sumir
    fragments.current = fragments.current.filter((f) => (f.life -= dt) > 0);
    const shardMesh = shards.current;
    if (shardMesh) {
      fragments.current.forEach((f, i) => {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vx *= Math.exp(-4 * dt);
        f.vy *= Math.exp(-4 * dt);
        f.rot += f.spin * dt;
        dummy.position.set(f.x, f.y, 0);
        dummy.rotation.set(f.rot * 0.7, 0, f.rot);
        dummy.scale.setScalar(Math.max(0.001, f.life / FRAGMENT_LIFE));
        dummy.updateMatrix();
        shardMesh.setMatrixAt(i, dummy.matrix);
      });
      shardMesh.count = fragments.current.length;
      shardMesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {ENEMY_KINDS.map((kind) => (
        <instancedMesh
          key={kind}
          ref={(el) => {
            meshes.current[kind] = el;
          }}
          args={[geometries[kind], material, MAX_ENEMIES]}
          count={0}
          // a caixa de colisão da câmera seria a da geometria na origem: desliga o culling
          frustumCulled={false}
        />
      ))}
      <instancedMesh ref={shards} args={[shardGeometry, shardMaterial, FRAGMENT_POOL]} count={0} frustumCulled={false} />
    </>
  );
}
