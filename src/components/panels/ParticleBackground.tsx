'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
  pulseSpeed: number;
  pulsePhase: number;
}

interface GlowOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color1: string;
  color2: string;
}

const PARTICLE_COLORS = [
  'rgba(168, 85, 247,',  // violet
  'rgba(236, 72, 153,',  // pink
  'rgba(99, 102, 241,',  // indigo
  'rgba(6, 182, 212,',   // cyan
  'rgba(52, 211, 153,',  // emerald
  'rgba(251, 191, 36,',  // amber
];

const ORB_CONFIGS = [
  { color1: 'rgba(168, 85, 247, 0.07)', color2: 'rgba(168, 85, 247, 0)' },
  { color1: 'rgba(236, 72, 153, 0.06)', color2: 'rgba(236, 72, 153, 0)' },
  { color1: 'rgba(6, 182, 212, 0.05)',  color2: 'rgba(6, 182, 212, 0)' },
  { color1: 'rgba(99, 102, 241, 0.06)', color2: 'rgba(99, 102, 241, 0)' },
  { color1: 'rgba(52, 211, 153, 0.05)', color2: 'rgba(52, 211, 153, 0)' },
];

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef   = useRef({ x: -9999, y: -9999 });
  const stateRef   = useRef<{
    particles: Particle[];
    orbs: GlowOrb[];
    w: number;
    h: number;
    dpr: number;
  }>({ particles: [], orbs: [], w: 0, h: 0, dpr: 1 });
  const rafRef = useRef<number>(0);

  /* ─── Build / rebuild particle & orb arrays ─── */
  const build = useCallback((w: number, h: number) => {
    const area = w * h;
    const count = Math.min(Math.max(Math.floor(area / 10000), 50), 130);

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 1.8 + 0.6,
      opacity: Math.random() * 0.45 + 0.15,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      pulseSpeed: Math.random() * 0.018 + 0.004,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    const orbs: GlowOrb[] = ORB_CONFIGS.map(cfg => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      radius: Math.random() * 280 + 180,
      color1: cfg.color1,
      color2: cfg.color2,
    }));

    stateRef.current.particles = particles;
    stateRef.current.orbs = orbs;
  }, []);

  /* ─── Resize handler ─── */
  const handleResize = useCallback((
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w   = window.innerWidth;
    const h   = window.innerHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stateRef.current.w   = w;
    stateRef.current.h   = h;
    stateRef.current.dpr = dpr;
    build(w, h);
  }, [build]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    handleResize(canvas, ctx);

    /* ─── Events ─── */
    let resizeTid: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTid);
      resizeTid = setTimeout(() => handleResize(canvas, ctx), 150);
    };
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    /* ─── Animation loop ─── */
    const MAX_CONNECT  = 135;
    const MAX_MOUSE    = 190;
    const GRID_SIZE    = 85;

    let tick = 0;

    const draw = () => {
      tick++;
      const { w, h, particles, orbs } = stateRef.current;
      const { x: mx, y: my } = mouseRef.current;

      /* clear */
      ctx.clearRect(0, 0, w, h);

      /* ── Gradient orbs ── */
      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.radius) orb.vx =  Math.abs(orb.vx);
        if (orb.x >  w + orb.radius) orb.vx = -Math.abs(orb.vx);
        if (orb.y < -orb.radius) orb.vy =  Math.abs(orb.vy);
        if (orb.y >  h + orb.radius) orb.vy = -Math.abs(orb.vy);

        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        g.addColorStop(0, orb.color1);
        g.addColorStop(1, orb.color2);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ── Faint breathing grid ── */
      const gridAlpha = 0.012 + Math.sin(tick * 0.004) * 0.006;
      ctx.strokeStyle = `rgba(139, 92, 246, ${gridAlpha})`;
      ctx.lineWidth = 0.4;
      for (let gx = 0; gx <= w; gx += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      }
      for (let gy = 0; gy <= h; gy += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }

      /* ── Particles + connections ── */
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        /* move */
        p.x += p.vx;
        p.y += p.vy;
        /* wrap */
        if (p.x < -8)  p.x = w + 8;
        if (p.x > w+8) p.x = -8;
        if (p.y < -8)  p.y = h + 8;
        if (p.y > h+8) p.y = -8;

        /* mouse repulsion */
        const mdx = p.x - mx;
        const mdy = p.y - my;
        const mD2 = mdx*mdx + mdy*mdy;
        const mD  = Math.sqrt(mD2);
        if (mD < MAX_MOUSE && mD > 0.5) {
          const f = ((MAX_MOUSE - mD) / MAX_MOUSE) * 0.009;
          p.vx += (mdx / mD) * f;
          p.vy += (mdy / mD) * f;
        }

        /* damp */
        const spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        if (spd > 0.65) { p.vx *= 0.97; p.vy *= 0.97; }

        /* pulse opacity */
        const alpha = Math.max(0.08, Math.min(0.72,
          p.opacity + Math.sin(tick * p.pulseSpeed + p.pulsePhase) * 0.18
        ));

        /* dot */
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${alpha})`;
        ctx.fill();

        /* glow halo */
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${alpha * 0.12})`;
        ctx.fill();

        /* constellation lines: particle ↔ particle */
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < MAX_CONNECT) {
            const lo = (1 - d / MAX_CONNECT) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(160, 130, 255, ${lo})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }

        /* mouse attraction lines */
        if (mD < MAX_MOUSE) {
          const lo = (1 - mD / MAX_MOUSE) * 0.32;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(236, 72, 153, ${lo})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }

      /* ── Mouse cursor glow ── */
      if (mx > 0 && my > 0) {
        const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 90);
        mg.addColorStop(0, 'rgba(236, 72, 153, 0.06)');
        mg.addColorStop(1, 'rgba(236, 72, 153, 0)');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mx, my, 90, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      clearTimeout(resizeTid);
    };
  }, [handleResize]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
