"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { AdditiveBlending, Vector3, type Group, type Mesh } from "three";
import DieIcon from "../DieIcon";
import { DICE } from "../hero/dice";
import { createDieMaterial, cssColor } from "../hero/scene";
import EnemiesLayer from "./EnemiesLayer";
import { formatTime } from "./format";
import {
  PLAYER_MAX_HP,
  PLAYER_RADIUS,
  PROJECTILE_RADIUS,
  createGame,
  inputDirection,
  resetGame,
  step,
  tryAttack,
  type GameState,
} from "./engine";

const POOL = 48; // projéteis simultâneos possíveis (cooldown de 0,25 s → sobra bastante)
const IDLE_SPIN = 0.4; // rad/s, d20 parado
const ROLL_SPIN = 16; // rad/s, "rolar" ao atacar, decaindo rápido
const BASE_OPACITY = 0.78; // a mesma do material dos dados
const Z = new Vector3(0, 0, 1);

/** Teclas que o jogo usa: não podem rolar a página. */
const GAME_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);

type GameOverStats = { elapsed: number; kills: number };

type Shared = {
  game: GameState;
  keys: Set<string>;
  /** velocidade extra de giro após um ataque */
  rollSpin: number;
  /** callbacks do HUD (React), chamados pelo loop quando algo muda */
  onPlayerHit: (hpLeft: number) => void;
  onGameOver: (stats: GameOverStats) => void;
};

function Scene({
  shared,
  label,
  timer,
  still,
}: {
  shared: Shared;
  label: React.RefObject<HTMLDivElement | null>;
  timer: React.RefObject<HTMLSpanElement | null>;
  still: boolean;
}) {
  const size = useThree((s) => s.size);
  const player = useRef<Mesh>(null);
  const shots = useRef<Group>(null);
  const shownSecond = useRef(-1);

  const d20 = DICE.find((d) => d.name === "d20")!;
  const geometry = useMemo(() => d20.create(PLAYER_RADIUS / 1.05), [d20]);
  const material = useMemo(createDieMaterial, []);
  const accent = useMemo(() => cssColor("--accent"), []);

  useLayoutEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const axis = useMemo(() => new Vector3(), []);

  // Simulação primeiro (prioridade negativa roda antes de todo o resto e não assume o
  // render); assim jogador, inimigos e fragmentos desenham o estado DESTE quadro.
  // Os eventos valem por um quadro: limpos aqui, antes do passo que gera os novos.
  useFrame((_, rawDelta) => {
    shared.game.events.length = 0;
    step(shared.game, Math.min(rawDelta, 0.05), inputDirection(shared.keys), { w: size.width, h: size.height });
  }, -1);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const { game } = shared;

    for (const ev of game.events) {
      if (ev.type === "player-hit") shared.onPlayerHit(ev.hpLeft);
      if (ev.type === "game-over") shared.onGameOver({ elapsed: ev.elapsed, kills: ev.kills });
    }

    // Cronômetro: escreve direto no DOM, só quando o segundo muda (sem re-render do React)
    const second = Math.floor(game.elapsed);
    if (timer.current && second !== shownSecond.current) {
      shownSecond.current = second;
      timer.current.textContent = formatTime(game.elapsed);
    }

    const m = player.current;
    if (m && !game.over) {
      m.position.set(game.player.x, game.player.y, 0);
      const direction = inputDirection(shared.keys);
      // Andando, o d20 ROLA pelo chão: gira em torno do eixo perpendicular ao movimento
      if (direction.x || direction.y) {
        axis.set(-direction.y, direction.x, 0);
        m.rotateOnWorldAxis(axis, (340 / PLAYER_RADIUS) * dt * 0.35);
      } else if (!still) {
        m.rotateOnWorldAxis(Z, IDLE_SPIN * dt);
      }
      // Ao atacar, um giro rápido de "rolagem" que se acalma sozinho
      if (shared.rollSpin > 0.01) {
        m.rotateOnWorldAxis(axis.set(0.6, 1, 0.3).normalize(), shared.rollSpin * dt);
        shared.rollSpin *= Math.exp(-6 * dt);
      }
    }

    // Invencibilidade: o d20 pisca (com reduced-motion, só fica apagado, sem piscar)
    material.opacity =
      game.invulnerable > 0
        ? still
          ? BASE_OPACITY * 0.4
          : BASE_OPACITY * (Math.sin(clock.elapsedTime * 28) > 0 ? 1 : 0.2)
        : BASE_OPACITY;

    // Projéteis: pool fixo, mostra só os vivos
    const group = shots.current;
    if (group) {
      group.children.forEach((child, i) => {
        const p = game.projectiles[i];
        child.visible = !!p;
        if (p) child.position.set(p.x, p.y, 0);
      });
    }

    // Número da rolagem acompanha o d20 (DOM por cima do canvas, mesma escala em px)
    if (label.current) {
      const x = game.player.x + size.width / 2;
      const y = size.height / 2 - game.player.y - PLAYER_RADIUS - 8;
      label.current.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[0.4, 0.6, 1]} intensity={1.6} />
      <directionalLight position={[-1, -1, 0.6]} color={accent} intensity={0.8} />

      <EnemiesLayer game={shared.game} still={still} />
      <mesh ref={player} geometry={geometry} material={material} rotation={[0.35, 0.5, 0.1]} />

      <group ref={shots}>
        {Array.from({ length: POOL }, (_, i) => (
          <group key={i} visible={false}>
            <mesh>
              <sphereGeometry args={[PROJECTILE_RADIUS, 12, 12]} />
              <meshBasicMaterial color={accent} />
            </mesh>
            {/* halo: o "brilho" do projétil */}
            <mesh>
              <sphereGeometry args={[PROJECTILE_RADIUS * 2.4, 12, 12]} />
              <meshBasicMaterial color={accent} transparent opacity={0.22} blending={AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

/**
 * O jogador é um d20 com 3 de vida. WASD/setas movem. O dano do próximo disparo
 * (1–20) já vem rolado e fica visível acima do d20; clique/toque gasta esse valor
 * num projétil na direção exata do ponto. Inimigos (d4) nascem nas bordas e
 * perseguem; encostar custa 1 de vida (com 1 s de invencibilidade). Sem vida: fim de jogo.
 */
export default function Game() {
  const still = useReducedMotion() ?? false;
  const label = useRef<HTMLDivElement>(null);
  const timer = useRef<HTMLSpanElement>(null);
  const [hp, setHp] = useState(PLAYER_MAX_HP);
  const [gameOver, setGameOver] = useState<GameOverStats | null>(null);
  // Só aparece depois de montar: o valor é aleatório, e renderizá-lo no servidor
  // daria um número diferente do cliente (erro de hidratação)
  const [nextRoll, setNextRoll] = useState<{ id: number; value: number } | null>(null);

  const shared = useRef<Shared>({
    game: createGame(),
    keys: new Set(),
    rollSpin: 0,
    onPlayerHit: setHp,
    onGameOver: setGameOver,
  });

  useEffect(() => {
    setNextRoll({ id: 0, value: shared.current.game.nextRoll });
    // Só em desenvolvimento: estado do jogo no console (window.__critico) para depurar/testar.
    // Em produção esse bloco some do bundle.
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __critico?: GameState }).__critico = shared.current.game;
    }
  }, []);

  useEffect(() => {
    const keys = shared.current.keys;
    const down = (e: KeyboardEvent) => {
      if (!GAME_KEYS.has(e.code) || e.ctrlKey || e.metaKey || e.altKey) return;
      // Na tela de fim de jogo, Espaço/setas voltam a funcionar normalmente (ex.: ativar o botão)
      if (shared.current.game.over) return;
      e.preventDefault();
      keys.add(e.code);
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    // Trocou de aba/janela com tecla apertada: não deixa o d20 andando sozinho
    const clear = () => keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // tela → arena: origem no centro, y para cima
    const target = { x: e.clientX - rect.left - rect.width / 2, y: rect.height / 2 - (e.clientY - rect.top) };
    const hit = tryAttack(shared.current.game, target);
    if (!hit) return;
    shared.current.rollSpin = still ? 0 : ROLL_SPIN;
    setNextRoll({ id: hit.projectile.id, value: hit.nextRoll });
  };

  const playAgain = () => {
    const { game, keys } = shared.current;
    resetGame(game);
    keys.clear();
    setHp(PLAYER_MAX_HP);
    setGameOver(null);
    setNextRoll({ id: -game.round, value: game.nextRoll });
  };

  return (
    <div
      data-testid="arena"
      className="relative h-full w-full cursor-crosshair touch-none overflow-hidden select-none"
      onPointerDown={onPointerDown}
    >
      <Canvas
        orthographic
        // 1 unidade = 1 px; câmera bem longe no eixo z, olhando a arena "de cima"
        camera={{ position: [0, 0, 1000], near: 1, far: 3000, zoom: 1 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: "none" }}
      >
        <Scene shared={shared.current} label={label} timer={timer} still={still} />
      </Canvas>

      {/* HUD: vida (um d20 por ponto) à esquerda, cronômetro à direita — discretos */}
      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between">
        <ul className="flex gap-1.5" aria-label={`Vida: ${hp} de ${PLAYER_MAX_HP}`} data-testid="vidas">
          {Array.from({ length: PLAYER_MAX_HP }, (_, i) => (
            <li
              key={i}
              data-cheia={i < hp}
              // vida perdida: aresta --muted, sem brilho e apagada
              className={`transition-opacity duration-300 ${i < hp ? "" : "opacity-35 [--die-edge:var(--muted)] [--die-glow:none]"}`}
            >
              <DieIcon die="d20" className="size-5" />
            </li>
          ))}
        </ul>
        <span ref={timer} className="text-small text-fg/60 tabular-nums" aria-label="Tempo sobrevivido">
          0:00
        </span>
      </div>

      {/*
        Dano do próximo disparo: fica visível até o jogador atirar. Discreto de propósito —
        fonte do corpo, pequena, algarismos tabulares. A chave reinicia o fade a cada nova rolagem.
      */}
      <div ref={label} className="pointer-events-none absolute top-0 left-0">
        {nextRoll && !gameOver && (
          <span
            key={nextRoll.id}
            aria-live="polite"
            className="block animate-[roll-in_220ms_ease-out] text-small leading-none font-medium text-fg/75 tabular-nums motion-reduce:animate-none"
            style={{ transform: "translate(-50%, -100%)" }}
          >
            <span className="sr-only">Dano do próximo disparo: </span>
            {nextRoll.value}
          </span>
        )}
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-small text-muted">
        WASD ou setas para mover · clique para disparar
      </p>

      {gameOver && (
        <div
          className="absolute inset-0 flex cursor-default items-center justify-center p-6"
          // clique no overlay não vira disparo na arena
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Mesmo vidro dos cards do site */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fim-de-jogo"
            className="w-full max-w-sm rounded-xl border border-muted/30 bg-surface/[0.18] p-8 text-center backdrop-blur-[14px]"
          >
            <h2 id="fim-de-jogo" className="font-display text-h2">
              Fim de jogo
            </h2>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-left">
              <div className="rounded-lg border border-muted/20 p-3">
                <dt className="text-small text-fg/60">Tempo sobrevivido</dt>
                <dd className="mt-1 text-h3 text-fg tabular-nums" data-testid="tempo">
                  {formatTime(gameOver.elapsed)}
                </dd>
              </div>
              <div className="rounded-lg border border-muted/20 p-3">
                <dt className="text-small text-fg/60">Inimigos derrotados</dt>
                <dd className="mt-1 text-h3 text-fg tabular-nums" data-testid="derrotas">
                  {gameOver.kills}
                </dd>
              </div>
            </dl>
            {/* Contorno âmbar, sem preenchimento sólido (esse é exclusivo do e-mail do Contato) */}
            <button
              type="button"
              autoFocus
              onClick={playAgain}
              className="mt-8 rounded-md border border-accent px-6 py-2.5 text-small font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:outline-accent"
            >
              Jogar de novo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
