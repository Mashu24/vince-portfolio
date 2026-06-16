"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

type Mode = "idle" | "running" | "paused" | "won" | "lost";
type Bullet = { x: number; y: number; vy: number; damage: number; wide?: boolean; spent?: boolean };
type Enemy = { x: number; y: number; r: number; hp: number; maxHp: number; speed: number; type: string; boss?: boolean; drift: number; phase: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };
type Pickup = { x: number; y: number; r: number; type: string; kind: "energy" | "upgrade"; amount?: number; vy: number };
type Floater = { x: number; y: number; text: string; life: number; color: string };
type ScoreEntry = { score: number; cleared: number; accuracy: number; time: number; date: string };

const W = 760;
const H = 520;
const ENERGY_COST = 3;
const MAX_ENEMIES = 36;
const MAX_BULLETS = 90;
const MAX_PARTICLES = 220;
const MAX_PICKUPS = 14;
const MAX_FLOATERS = 48;
const SCORE_KEY = "virus-protocol-high-scores";
const TOTAL_KEY = "virus-protocol-total-kills";
const ACH_KEY = "virus-protocol-achievements";

function initialGame() {
  return {
    player: { x: W / 2, y: H - 58, r: 20, health: 100, energy: 100, cooldown: 0, invuln: 0 },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    pickups: [] as Pickup[],
    floaters: [] as Floater[],
    score: 0,
    wave: 1,
    cleared: 0,
    shots: 0,
    hits: 0,
    combo: 1,
    bossSpawned: false,
    shake: 0,
    tick: 0,
    lastEnemy: 0,
    lastPickup: 0,
    lastHudAt: 0,
    lastFrameAt: 0,
    fps: 60,
    startedAt: 0,
    firing: false,
    lastShotAt: -999,
    upgrades: {
      rapid: 0,
      dual: 0,
      spread: 0,
      beam: 0
    }
  };
}

function getScores(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(SCORE_KEY) ?? "[]") as Array<Record<string, unknown>>;
    return raw.slice(0, 5).map((entry) => ({
      score: Number(entry.score) || 0,
      cleared: Number(entry.cleared) || 0,
      accuracy: Number(entry.accuracy) || 0,
      time: Number(entry.time) || 0,
      date: typeof entry.date === "string" ? entry.date : "—"
    }));
  } catch {
    return [];
  }
}

function getAchievements(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ACH_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveAchievement(name: string, setUnlocked: (items: string[]) => void, setToast: (value: string) => void) {
  const current = new Set(getAchievements());
  if (current.has(name)) return;
  current.add(name);
  const list = Array.from(current);
  localStorage.setItem(ACH_KEY, JSON.stringify(list));
  setUnlocked(list);
  setToast(`Achievement unlocked: ${name}`);
}

function HudCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`border bg-black/30 p-2 backdrop-blur md:p-3 theme-light:bg-white/70 ${warn ? "border-red-400/60 shadow-[0_0_24px_rgba(248,113,113,.25)]" : "border-cyanCore/25"}`}>
      <div className={`text-[10px] uppercase tracking-[0.2em] ${warn ? "text-red-300" : "text-cyanCore"}`}>{label}</div>
      <div className={`mt-1 font-mono text-base font-black md:text-lg ${warn ? "text-red-300" : "text-greenCore"}`}>{value}</div>
    </div>
  );
}

function DPadBtn({ label, onDown, onUp }: { label: string; onDown: () => void; onUp: () => void }) {
  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); onDown(); }}
      onTouchEnd={(e) => { e.preventDefault(); onUp(); }}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onContextMenu={(e) => e.preventDefault()}
      className="grid h-14 w-14 select-none place-items-center rounded-lg border-2 border-cyanCore/50 bg-cyanCore/15 text-xl font-bold text-cyanCore active:bg-cyanCore active:text-black"
    >
      {label}
    </button>
  );
}

function DPad({ onPress }: { onPress: (key: string, active: boolean) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5" onContextMenu={(e) => e.preventDefault()}>
      <div />
      <DPadBtn label="▲" onDown={() => onPress("w", true)} onUp={() => onPress("w", false)} />
      <div />
      <DPadBtn label="◀" onDown={() => onPress("a", true)} onUp={() => onPress("a", false)} />
      <DPadBtn label="▼" onDown={() => onPress("s", true)} onUp={() => onPress("s", false)} />
      <DPadBtn label="▶" onDown={() => onPress("d", true)} onUp={() => onPress("d", false)} />
    </div>
  );
}

export default function VirusArcade() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const pointerRef = useRef({ active: false, x: W / 2, y: H - 58 });
  const audioRef = useRef<AudioContext | null>(null);
  const gameRef = useRef(initialGame());
  const modeRef = useRef<Mode>("idle");
  const soundRef = useRef(false);
  const fireIntervalRef = useRef<number | null>(null);

  const [mode, setMode] = useState<Mode>("idle");
  const [sound, setSound] = useState(false);
  const [toast, setToast] = useState("Security simulation ready.");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [hud, setHud] = useState({
    health: 100,
    firewall: 100,
    threats: 0,
    score: 0,
    wave: 1,
    energy: 100,
    combo: 1,
    accuracy: 100,
    time: 0,
    upgrades: [] as string[],
  });

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { soundRef.current = sound; }, [sound]);

  useEffect(() => {
    setScores(getScores());
    setUnlocked(getAchievements());
  }, []);

  useEffect(() => {
    return () => {
      if (fireIntervalRef.current) clearInterval(fireIntervalRef.current);
    };
  }, []);

  const tone = useCallback((freq: number, duration = 0.04, type: OscillatorType = "sine") => {
    if (!soundRef.current || typeof window === "undefined") return;
    const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = audioRef.current ?? new Ctor();
    audioRef.current = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.035;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

  const burst = useCallback((x: number, y: number, color: string, amount = 14) => {
    const game = gameRef.current;
    const room = Math.max(0, MAX_PARTICLES - game.particles.length);
    for (let i = 0; i < Math.min(amount, room); i += 1) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 4;
      game.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 28 + Math.random() * 34, color, size: 1 + Math.random() * 3 });
    }
  }, []);

  const reset = useCallback(() => {
    gameRef.current = initialGame();
    setHud({ health: 100, firewall: 100, threats: 0, score: 0, wave: 1, energy: 100, combo: 1, accuracy: 100, time: 0, upgrades: [] });
    setToast("Mission armed. SPACE, click, or tap FIRE to shoot.");
  }, []);

  const start = useCallback(() => {
    reset();
    gameRef.current.startedAt = performance.now();
    setMode("running");
    tone(660, 0.08, "square");
  }, [reset, tone]);

  const fireWeapon = useCallback(() => {
    const game = gameRef.current;
    const p = game.player;
    if (modeRef.current !== "running") return;
    if (game.bullets.length >= MAX_BULLETS) return;
    const cooldown = game.upgrades.rapid > 0 ? 5 : p.energy < 50 ? 14 : 9;
    if (p.cooldown > 0 || game.tick - game.lastShotAt < cooldown) return;
    if (p.energy < ENERGY_COST) {
      setToast("RECHARGING WEAPON SYSTEM");
      tone(120, 0.08, "sawtooth");
      return;
    }
    const damage = game.upgrades.beam > 0 ? 3 : 1;
    const shots = game.upgrades.dual > 0 ? [-10, 10] : [0];
    shots.forEach((offset) => game.bullets.push({ x: p.x + offset, y: p.y - 25, vy: -9.2, damage }));
    if (game.upgrades.spread > 0) {
      game.bullets.push({ x: p.x - 18, y: p.y - 20, vy: -8.2, damage: 1, wide: true });
      game.bullets.push({ x: p.x + 18, y: p.y - 20, vy: -8.2, damage: 1, wide: true });
    }
    p.energy = Math.max(0, p.energy - ENERGY_COST);
    p.cooldown = cooldown;
    game.shots += shots.length + (game.upgrades.spread > 0 ? 2 : 0);
    if (game.bullets.length > MAX_BULLETS) game.bullets = game.bullets.slice(-MAX_BULLETS);
    game.lastShotAt = game.tick;
    game.firing = true;
    tone(game.upgrades.beam > 0 ? 1180 : 900, 0.03, "square");
  }, [tone]);

  const startFiring = useCallback(() => {
    fireWeapon();
    if (fireIntervalRef.current) clearInterval(fireIntervalRef.current);
    fireIntervalRef.current = window.setInterval(fireWeapon, 110);
  }, [fireWeapon]);

  const stopFiring = useCallback(() => {
    if (fireIntervalRef.current) {
      clearInterval(fireIntervalRef.current);
      fireIntervalRef.current = null;
    }
  }, []);

  const pressDir = useCallback((key: string, active: boolean) => {
    keysRef.current[key] = active;
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = true;
      if (event.key === " ") {
        event.preventDefault();
        fireWeapon();
      }
    };
    const up = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [fireWeapon]);

  const finishGame = useCallback((won: boolean) => {
    const game = gameRef.current;
    const time = Math.max(1, Math.round((performance.now() - game.startedAt) / 1000));
    const accuracy = game.shots ? Math.round((game.hits / game.shots) * 100) : 100;
    const entry: ScoreEntry = {
      score: game.score,
      cleared: game.cleared,
      accuracy,
      time,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };
    const nextScores = [...getScores(), entry].sort((a, b) => b.score - a.score).slice(0, 5);
    localStorage.setItem(SCORE_KEY, JSON.stringify(nextScores));
    setScores(nextScores);
    const totalKills = Number(localStorage.getItem(TOTAL_KEY) ?? "0") + game.cleared;
    localStorage.setItem(TOTAL_KEY, String(totalKills));
    if (game.cleared >= 50) saveAchievement("Virus Hunter", setUnlocked, setToast);
    if (won) saveAchievement("System Defender", setUnlocked, setToast);
    if (won && game.player.energy >= 75) saveAchievement("Energy Master", setUnlocked, setToast);
    if (accuracy >= 90 && game.shots > 20) saveAchievement("Sharp Shooter", setUnlocked, setToast);
    if (totalKills >= 500) saveAchievement("Threat Eliminator", setUnlocked, setToast);
    setMode(won ? "won" : "lost");
    tone(won ? 660 : 130, won ? 0.3 : 0.4, won ? "triangle" : "sawtooth");
  }, [tone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;

    const spawnEnemy = (boss = false) => {
      const game = gameRef.current;
      if (game.enemies.length >= MAX_ENEMIES && !boss) return;
      if (boss) {
        if (game.enemies.some((enemy) => enemy.boss)) return;
        game.enemies.push({ x: W / 2, y: 88, r: 62, hp: 220, maxHp: 220, speed: 0.35, type: "THE ROOT VIRUS", drift: 0.035, boss: true, phase: 1 });
        setToast("WARNING: THE ROOT VIRUS breached the network core.");
        tone(130, 0.24, "sawtooth");
        return;
      }
      const types = ["Virus Drone", "Malware Cluster", "Corrupted Bot", "Glitch Enemy", "Rogue AI Ship"];
      const type = types[Math.floor(Math.random() * types.length)];
      const r = type === "Malware Cluster" ? 24 : 16 + Math.random() * 9;
      game.enemies.push({ x: 38 + Math.random() * (W - 76), y: -30, r, hp: Math.ceil(r / 9), maxHp: Math.ceil(r / 9), speed: 0.65 + game.wave * 0.18 + Math.random() * 0.45, type, drift: (Math.random() - 0.5) * 0.06, phase: 1 });
    };

    const spawnPickup = (x?: number, y?: number, forceEnergy = false) => {
      const game = gameRef.current;
      if (game.pickups.length >= MAX_PICKUPS) return;
      const energyTypes = [
        { type: "Small Energy Cell", amount: 10, r: 13 },
        { type: "Medium Energy Cell", amount: 25, r: 16 },
        { type: "Large Energy Cell", amount: 50, r: 20 }
      ];
      const upgrades = ["Rapid Fire", "Dual Cannons", "Firewall Blaster", "Antivirus Beam", "EMP Pulse"];
      if (forceEnergy || Math.random() < 0.55) {
        const e = energyTypes[Math.floor(Math.random() * energyTypes.length)];
        game.pickups.push({ x: x ?? 44 + Math.random() * (W - 88), y: y ?? -24, r: e.r, type: e.type, kind: "energy", amount: e.amount, vy: 1.35 });
      } else {
        game.pickups.push({ x: x ?? 44 + Math.random() * (W - 88), y: y ?? -24, r: 17, type: upgrades[Math.floor(Math.random() * upgrades.length)], kind: "upgrade", vy: 1.25 });
      }
    };

    const background = (tick: number) => {
      ctx.fillStyle = "#030711";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(39,244,255,.14)";
      for (let x = (tick * 0.28) % 44; x < W; x += 44) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = (tick * 0.58) % 44; y < H; y += 44) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      for (let i = 0; i < 54; i += 1) {
        ctx.fillStyle = i % 3 ? "rgba(39,244,255,.65)" : "rgba(105,255,143,.8)";
        ctx.fillRect((i * 97 + tick * 0.45) % W, (i * 61 + tick * 0.88) % H, 1.5, 1.5);
      }
    };

    const drawShip = () => {
      const p = gameRef.current.player;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#27f4ff";
      ctx.fillStyle = "#27f4ff";
      ctx.beginPath();
      ctx.moveTo(0, -24); ctx.lineTo(21, 19); ctx.lineTo(0, 10); ctx.lineTo(-21, 19); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#69ff8f";
      ctx.fillRect(-5, 4, 10, 17);
      ctx.globalAlpha = 0.18 + p.health / 380;
      ctx.strokeStyle = "#69ff8f";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 31, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    };

    const drawEnemy = (e: Enemy) => {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(gameRef.current.tick * (e.boss ? 0.01 : 0.025));
      ctx.shadowBlur = e.boss ? 34 : 19;
      ctx.shadowColor = e.boss ? "#ff2f7d" : "#ff5ef1";
      ctx.strokeStyle = e.boss ? "#ff2f7d" : "#ff5ef1";
      ctx.fillStyle = e.boss ? "rgba(255,47,125,.24)" : "rgba(255,94,241,.18)";
      ctx.lineWidth = e.boss ? 4 : 2;
      ctx.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const a = (i / 10) * Math.PI * 2;
        const rr = e.r * (i % 2 ? 0.55 : 1);
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = e.boss ? "bold 17px monospace" : "bold 16px monospace"; ctx.textAlign = "center";
      ctx.fillText(e.boss ? "ROOT" : "!", 0, 5);
      ctx.restore();
      if (e.boss) {
        ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.fillRect(e.x - 90, e.y - 82, 180, 7);
        ctx.fillStyle = "#ff2f7d"; ctx.fillRect(e.x - 90, e.y - 82, 180 * (e.hp / e.maxHp), 7);
      }
    };

    const loop = () => {
      const game = gameRef.current;
      const currentMode = modeRef.current;
      const now = performance.now();
      if (game.lastFrameAt) {
        game.fps = game.fps * 0.9 + (1000 / Math.max(1, now - game.lastFrameAt)) * 0.1;
      }
      game.lastFrameAt = now;
      game.tick += 1;
      background(game.tick);

      if (currentMode === "idle") {
        drawShip();
        ctx.fillStyle = "#69ff8f"; ctx.font = "bold 24px monospace"; ctx.textAlign = "center";
        ctx.fillText("VIRUS EXTERMINATION PROTOCOL", W / 2, 170);
        ctx.fillStyle = "rgba(215,251,255,.78)"; ctx.font = "15px monospace";
        ctx.fillText("Move: mouse/touch/WASD. Fire: SPACE/click/FIRE button.", W / 2, 205);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (currentMode === "running") {
        const p = game.player;
        const speed = game.upgrades.rapid > 0 ? 5.4 : 5;
        if (keysRef.current.a || keysRef.current.arrowleft) p.x -= speed;
        if (keysRef.current.d || keysRef.current.arrowright) p.x += speed;
        if (keysRef.current.w || keysRef.current.arrowup) p.y -= speed;
        if (keysRef.current.s || keysRef.current.arrowdown) p.y += speed;
        if (pointerRef.current.active) {
          p.x += (pointerRef.current.x - p.x) * 0.16;
          p.y += (pointerRef.current.y - p.y) * 0.16;
        }
        p.x = Math.max(28, Math.min(W - 28, p.x));
        p.y = Math.max(72, Math.min(H - 28, p.y));
        p.cooldown = Math.max(0, p.cooldown - 1);
        Object.keys(game.upgrades).forEach((key) => {
          const k = key as keyof typeof game.upgrades;
          game.upgrades[k] = Math.max(0, game.upgrades[k] - 1);
        });
        const regen = p.energy <= 0 ? 0.08 : game.tick - game.lastShotAt > 55 ? 0.34 : 0.16;
        p.energy = Math.min(100, p.energy + regen);
        if (p.energy < 10 && game.tick % 80 === 0) setToast("CRITICAL POWER LEVEL");
        else if (p.energy < 25 && game.tick % 100 === 0) setToast("LOW ENERGY");
        else if (p.energy <= 0 && game.tick % 60 === 0) setToast("RECHARGING WEAPON SYSTEM");

        if (!game.bossSpawned && game.tick - game.lastEnemy > Math.max(24, 58 - game.wave * 5)) {
          spawnEnemy(); game.lastEnemy = game.tick;
        }
        if (game.tick - game.lastPickup > 360) {
          spawnPickup(); game.lastPickup = game.tick;
        }
        if (game.score >= 1800 && !game.bossSpawned) {
          game.bossSpawned = true; game.wave = 5; spawnEnemy(true);
        } else if (!game.bossSpawned) {
          game.wave = Math.min(4, 1 + Math.floor(game.score / 460));
        }

        game.bullets.forEach((b) => { b.y += b.vy; });
        game.enemies.forEach((e) => {
          e.y += e.speed;
          e.x += Math.sin(game.tick * e.drift) * (e.boss ? 2.4 : 1.35);
          if (e.boss && e.hp < e.maxHp * 0.5) e.phase = 2;
          if (e.boss && game.tick % (e.phase === 2 ? 34 : 52) === 0) burst(e.x + (Math.random() - 0.5) * 110, e.y + 18, "#ff2f7d", 6);
        });

        for (const b of game.bullets) {
          for (const e of game.enemies) {
            if (!b.spent && Math.hypot(b.x - e.x, b.y - e.y) < e.r + (b.wide ? 18 : 10)) {
              b.spent = true; e.hp -= b.damage; game.hits += 1;
              game.floaters.push({ x: e.x, y: e.y - e.r, text: b.damage > 1 ? "-3" : "HIT", life: 24, color: "#69ff8f" });
              burst(b.x, b.y, "#27f4ff", 5);
              if (e.hp <= 0) {
                const points = e.boss ? 1500 : 110 * game.combo;
                game.score += points; game.combo = Math.min(9, game.combo + 1); game.cleared += 1; game.shake = e.boss ? 18 : 7;
                if (!e.boss && Math.random() < 0.28) spawnPickup(e.x, e.y, Math.random() < 0.7);
                game.floaters.push({ x: e.x, y: e.y, text: `+${points}`, life: 42, color: "#27f4ff" });
                burst(e.x, e.y, e.boss ? "#ff2f7d" : "#ff5ef1", e.boss ? 60 : 18);
                tone(e.boss ? 90 : 250, e.boss ? 0.2 : 0.06, "sawtooth");
                if (e.boss) {
                  burst(e.x, e.y, "#69ff8f", 80);
                  burst(e.x, e.y, "#27f4ff", 60);
                  finishGame(true);
                }
              }
            }
          }
        }
        game.bullets = game.bullets.filter((b) => !b.spent && b.y > -30);
        game.enemies = game.enemies.filter((e) => e.hp > 0 && e.y < H + 80);

        for (const e of game.enemies) {
          if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) {
            p.health -= e.boss ? 24 : 14; game.combo = 1; game.shake = 12; e.hp = 0;
            burst(p.x, p.y, "#f5d76e", 18); setToast("Firewall impact detected.");
            if (p.health <= 0) { p.health = 0; finishGame(false); }
          }
        }
        game.enemies = game.enemies.filter((e) => e.hp > 0);

        game.pickups.forEach((u) => {
          u.y += u.vy;
          if (Math.hypot(p.x - u.x, p.y - u.y) < p.r + u.r) {
            if (u.kind === "energy") {
              p.energy = Math.min(100, p.energy + (u.amount ?? 10));
              game.floaters.push({ x: p.x, y: p.y - 30, text: `+${u.amount} Energy`, life: 46, color: "#27f4ff" });
            } else {
              if (u.type === "Rapid Fire") game.upgrades.rapid = 600;
              if (u.type === "Dual Cannons") game.upgrades.dual = 600;
              if (u.type === "Firewall Blaster") game.upgrades.spread = 600;
              if (u.type === "Antivirus Beam") game.upgrades.beam = 420;
              if (u.type === "EMP Pulse") {
                game.enemies.forEach((e) => { if (!e.boss || Math.hypot(e.x - p.x, e.y - p.y) < 210) e.hp -= e.boss ? 18 : 5; });
                burst(p.x, p.y, "#27f4ff", 38);
              }
              setToast(`${u.type} activated.`);
            }
            burst(p.x, p.y, u.kind === "energy" ? "#27f4ff" : "#69ff8f", 26);
            u.y = H + 50; tone(1040, 0.08, "triangle");
          }
        });
        game.pickups = game.pickups.filter((u) => u.y < H + 40);

        if (game.floaters.length > MAX_FLOATERS) game.floaters = game.floaters.slice(-MAX_FLOATERS);
      }

      const sx = game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0;
      const sy = game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0;
      game.shake = Math.max(0, game.shake - 0.8);
      ctx.save(); ctx.translate(sx, sy);
      game.bullets.forEach((b) => {
        ctx.shadowBlur = b.damage > 1 ? 26 : 16; ctx.shadowColor = b.damage > 1 ? "#27f4ff" : "#69ff8f";
        ctx.strokeStyle = b.damage > 1 ? "#27f4ff" : "#69ff8f"; ctx.lineWidth = b.wide ? 5 : b.damage > 1 ? 6 : 3;
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x, b.y + 20); ctx.stroke();
      });
      game.pickups.forEach((u) => {
        ctx.save(); ctx.translate(u.x, u.y); ctx.rotate(game.tick * 0.035);
        ctx.shadowBlur = 22; ctx.shadowColor = u.kind === "energy" ? "#27f4ff" : "#69ff8f";
        ctx.strokeStyle = u.kind === "energy" ? "#27f4ff" : "#69ff8f"; ctx.fillStyle = u.kind === "energy" ? "rgba(39,244,255,.14)" : "rgba(105,255,143,.14)";
        ctx.beginPath(); ctx.moveTo(0, -u.r); ctx.lineTo(u.r, 0); ctx.lineTo(0, u.r); ctx.lineTo(-u.r, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      game.enemies.forEach(drawEnemy);
      game.particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.life -= 1; ctx.globalAlpha = Math.max(0, p.life / 50);
        ctx.fillStyle = p.color; ctx.shadowBlur = 12; ctx.shadowColor = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1;
      });
      game.particles = game.particles.filter((p) => p.life > 0);
      game.floaters.forEach((f) => {
        f.y -= 0.8; f.life -= 1; ctx.globalAlpha = Math.max(0, f.life / 46);
        ctx.fillStyle = f.color; ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; ctx.fillText(f.text, f.x, f.y); ctx.globalAlpha = 1;
      });
      game.floaters = game.floaters.filter((f) => f.life > 0);
      drawShip(); ctx.restore();

      if (currentMode === "paused") {
        ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#27f4ff"; ctx.font = "bold 34px monospace"; ctx.textAlign = "center"; ctx.fillText("SIMULATION PAUSED", W / 2, H / 2);
      }
      if (currentMode === "won" || currentMode === "lost") {
        ctx.fillStyle = "rgba(0,0,0,.64)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = currentMode === "won" ? "#69ff8f" : "#ff5ef1"; ctx.font = "bold 30px monospace"; ctx.textAlign = "center";
        ctx.fillText(currentMode === "won" ? "SYSTEM SECURED ✓" : "SYSTEM BREACH", W / 2, H / 2 - 58);
        if (currentMode === "won") {
          ctx.fillText("THREATS ELIMINATED ✓", W / 2, H / 2 - 20);
          ctx.fillText("NETWORK STABILIZED ✓", W / 2, H / 2 + 18);
        }
        ctx.font = "16px monospace"; ctx.fillStyle = "#d7fbff";
        ctx.fillText("Protected by Vince Matthew Magampon", W / 2, H / 2 + 62);
      }

      if (now - game.lastHudAt > 250) {
        game.lastHudAt = now;
        const accuracy = game.shots ? Math.round((game.hits / game.shots) * 100) : 100;
        const active = Object.entries(game.upgrades).filter(([, v]) => v > 0).map(([k, v]) => `${k.toUpperCase()} ${Math.ceil(v / 60)}s`);
        setHud({
          health: Math.round(game.player.health), firewall: Math.round(game.player.health), threats: game.cleared,
          score: game.score, wave: game.wave, energy: Math.round(game.player.energy), combo: game.combo,
          accuracy, time: game.startedAt ? Math.round((now - game.startedAt) / 1000) : 0, upgrades: active,
        });
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tone, finishGame, burst]);

  const pointerToCanvas = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointerRef.current = { active: true, x: ((clientX - rect.left) / rect.width) * W, y: ((clientY - rect.top) / rect.height) * H };
  };

  const achievements = [
    ["Virus Hunter", "Destroy 50 enemies"],
    ["System Defender", "Complete Game"],
    ["Energy Master", "Finish boss with 75% energy"],
    ["Sharp Shooter", "Achieve 90% accuracy"],
    ["Threat Eliminator", "Destroy 500 total enemies"]
  ];

  const specializations = ["IT Support", "Workflow Automation", "Power Apps", "Power Automate", "Process Optimization", "Technical Troubleshooting"];

  return (
    <section id="game" className="mx-auto max-w-7xl px-4 py-20 text-ink max-md:px-2 max-md:py-10 theme-light:text-slate-950">
      <div className="mb-9">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-greenCore">Security Arcade</div>
        <h2 className="text-3xl font-bold md:text-5xl">Virus Extermination Protocol</h2>
      </div>
      <div className="border border-white/10 bg-panel p-5 shadow-glow backdrop-blur-xl max-md:p-3 theme-light:bg-white/70">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-greenCore">Cyber Defense Simulation</div>
            <p className="mt-2 text-sm text-white/70 theme-light:text-slate-700">Manual-fire security shooter with energy management, upgrades, achievements, and THE ROOT VIRUS boss.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={start} className="inline-flex items-center gap-2 border border-greenCore px-3 py-2 text-sm font-semibold text-greenCore transition hover:bg-greenCore hover:text-black md:px-4 md:py-3">
              {mode === "idle" ? <Play size={16} /> : <RotateCcw size={16} />} {mode === "idle" ? "Play" : "Restart"}
            </button>
            <button onClick={() => setMode((v) => (v === "paused" ? "running" : v === "running" ? "paused" : v))} className="inline-flex items-center gap-2 border border-cyanCore/40 px-3 py-2 text-sm text-cyanCore transition hover:bg-cyanCore hover:text-black md:px-4 md:py-3">
              <Pause size={16} /> {mode === "paused" ? "Resume" : "Pause"}
            </button>
            <button onClick={() => setSound(!sound)} className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-sm text-white/70 transition hover:border-greenCore hover:text-greenCore md:px-4 md:py-3 theme-light:text-slate-700">
              {sound ? <Volume2 size={16} /> : <VolumeX size={16} />} {sound ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 xl:grid-cols-6">
          <HudCard label="Health" value={`${hud.health}%`} />
          <HudCard label="Firewall" value={`${hud.firewall}%`} />
          <HudCard label="Cleared" value={hud.threats.toString()} />
          <HudCard label="Score" value={hud.score.toLocaleString()} />
          <HudCard label="Wave" value={hud.wave.toString()} />
          <HudCard label="Energy" value={`${hud.energy}%`} warn={hud.energy < 25} />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
          <HudCard label="Accuracy" value={`${hud.accuracy}%`} />
          <HudCard label="Time" value={`${hud.time}s`} />
          <HudCard label="Upgrades" value={hud.upgrades.length ? hud.upgrades.join(" / ") : "NONE"} />
        </div>

        <div className="relative overflow-hidden border border-cyanCore/30 bg-black shadow-glow">
          <canvas
            ref={canvasRef}
            className="block w-full touch-none"
            style={{ aspectRatio: `${W}/${H}` }}
            onMouseMove={(e) => pointerToCanvas(e.clientX, e.clientY)}
            onMouseEnter={(e) => pointerToCanvas(e.clientX, e.clientY)}
            onMouseDown={() => fireWeapon()}
            onMouseLeave={() => { pointerRef.current.active = false; }}
            onTouchStart={(e) => { const t = e.touches[0]; if (t) pointerToCanvas(t.clientX, t.clientY); }}
            onTouchMove={(e) => { const t = e.touches[0]; if (t) pointerToCanvas(t.clientX, t.clientY); }}
            onTouchEnd={() => { pointerRef.current.active = false; }}
          />
          <div className="pointer-events-none absolute left-2 top-2 border border-red-400/40 bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-200 md:left-4 md:top-4 md:px-3 md:py-2 md:text-xs">
            {hud.energy < 10 ? "CRITICAL POWER" : hud.energy < 25 ? "LOW ENERGY" : mode === "running" && hud.wave >= 5 ? "ROOT VIRUS WARNING" : "THREAT MONITOR"}
          </div>
          <AnimatePresence>
            {toast && (
              <motion.div key={toast} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="pointer-events-none absolute bottom-2 left-2 right-2 border border-greenCore/40 bg-greenCore/10 px-3 py-2 text-xs text-greenCore backdrop-blur md:bottom-4 md:left-4 md:right-4 md:px-4 md:py-3 md:text-sm">
                {toast} <span className="ml-2 text-cyanCore">Combo x{hud.combo}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 md:hidden" onContextMenu={(e) => e.preventDefault()}>
          <DPad onPress={pressDir} />
          <button
            onTouchStart={(e) => { e.preventDefault(); startFiring(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopFiring(); }}
            onContextMenu={(e) => e.preventDefault()}
            className="h-[104px] w-28 select-none rounded-xl border-2 border-greenCore bg-greenCore/20 text-lg font-black text-greenCore shadow-greenGlow active:bg-greenCore active:text-black"
          >
            FIRE
          </button>
        </div>

        {(mode === "won" || mode === "lost") && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-5 border border-greenCore/40 bg-greenCore/10 p-5 text-center shadow-greenGlow md:p-8">
            <h3 className="text-2xl font-black text-greenCore md:text-3xl">Virus Extermination Protocol</h3>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-cyanCore md:text-sm">Designed & Developed By</p>
            <p className="mt-2 text-xl font-bold md:text-2xl">Vince Matthew Magampon</p>
            <p className="text-cyanCore">IT Support & Automation Developer</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {specializations.map((s) => (
                <span key={s} className="border border-cyanCore/30 bg-cyanCore/10 px-3 py-1 text-xs text-cyanCore md:text-sm">{s}</span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:inline-flex md:flex-wrap md:justify-center md:gap-3">
              <div className="border border-white/10 bg-black/20 p-3">
                <div className="text-[10px] uppercase text-cyanCore">Score</div>
                <div className="mt-1 font-mono font-bold text-greenCore">{hud.score.toLocaleString()}</div>
              </div>
              <div className="border border-white/10 bg-black/20 p-3">
                <div className="text-[10px] uppercase text-cyanCore">Cleared</div>
                <div className="mt-1 font-mono font-bold text-greenCore">{hud.threats}</div>
              </div>
              <div className="border border-white/10 bg-black/20 p-3">
                <div className="text-[10px] uppercase text-cyanCore">Accuracy</div>
                <div className="mt-1 font-mono font-bold text-greenCore">{hud.accuracy}%</div>
              </div>
              <div className="border border-white/10 bg-black/20 p-3">
                <div className="text-[10px] uppercase text-cyanCore">Time</div>
                <div className="mt-1 font-mono font-bold text-greenCore">{hud.time}s</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button onClick={start} className="border border-greenCore px-4 py-3 text-sm font-semibold text-greenCore hover:bg-greenCore hover:text-black">Play Again</button>
              <a href="#home" className="border border-cyanCore/40 px-4 py-3 text-sm text-cyanCore hover:bg-cyanCore hover:text-black">Return To Portfolio</a>
              <a href="#timeline" className="border border-cyanCore/40 px-4 py-3 text-sm text-cyanCore hover:bg-cyanCore hover:text-black">View Projects</a>
              <a href="#contact" className="inline-flex items-center gap-2 border border-cyanCore/40 px-4 py-3 text-sm text-cyanCore hover:bg-cyanCore hover:text-black"><Mail size={16} /> Contact Me</a>
            </div>
          </motion.div>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="border border-white/10 bg-black/20 p-4">
            <h3 className="font-bold text-cyanCore">TOP SECURITY AGENTS</h3>
            <div className="mt-3 space-y-2 font-mono text-sm">
              <div className="flex items-center justify-between border border-cyanCore/20 p-2 text-[10px] uppercase tracking-wider text-cyanCore">
                <span className="w-8">Rank</span>
                <span className="flex-1 text-center">Score</span>
                <span className="w-12 text-center">Acc</span>
                <span className="w-24 text-right">Date</span>
              </div>
              {(scores.length ? scores : [{ score: 0, cleared: 0, accuracy: 0, time: 0, date: "—" }]).map((s, i) => (
                <div key={`${s.score}-${s.date}-${i}`} className="flex items-center justify-between border border-white/10 p-2">
                  <span className="w-8 text-greenCore">#{i + 1}</span>
                  <span className="flex-1 text-center">{s.score.toLocaleString()}</span>
                  <span className="w-12 text-center">{s.accuracy}%</span>
                  <span className="w-24 text-right text-white/50">{s.date}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-white/10 bg-black/20 p-4">
            <h3 className="font-bold text-greenCore">ACHIEVEMENTS</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {achievements.map(([name, desc]) => (
                <div key={name} className={`border p-2 text-sm ${unlocked.includes(name) ? "border-greenCore/40 text-greenCore" : "border-white/10 text-white/55 theme-light:text-slate-600"}`}>
                  <strong>{name}</strong><br />{desc}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-xs text-white/65 md:grid-cols-3 md:gap-3 md:text-sm theme-light:text-slate-700">
          <div className="border border-white/10 bg-black/20 p-3">Controls: SPACE, left click, or FIRE button. Movement: mouse, touch canvas, D-pad, WASD, or arrows.</div>
          <div className="border border-white/10 bg-black/20 p-3">Energy: each shot costs 3%. Pick up energy cells to refill weapons.</div>
          <div className="border border-white/10 bg-black/20 p-3">Upgrades: Rapid Fire, Dual Cannons, Firewall Blaster, Antivirus Beam, EMP Pulse.</div>
        </div>
      </div>
    </section>
  );
}
