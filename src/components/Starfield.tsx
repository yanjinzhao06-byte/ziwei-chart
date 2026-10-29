import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  base: number;
  phase: number;
  speed: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

/**
 * 背景：三层空间 + 一颗流星
 *  - 远景：canvas 星点，缓慢呼吸（不是随机跳）
 *  - 中景：CSS 星云，极慢漂移
 *  - 装饰：二十八宿环，240 秒转一圈
 * 全程单个 rAF，不触发 React 重渲染。
 */
export default function Starfield({ animated }: { animated: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let nextMeteor = 4000 + Math.random() * 6000;
    let last = performance.now();

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = w < 640 ? 70 : w < 1100 ? 150 : 220;
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() < 0.86 ? 0.4 + Math.random() * 0.6 : 1 + Math.random() * 0.8,
        base: 0.25 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        speed: 0.00012 + Math.random() * 0.00022,
      }));
    };

    const drawStars = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = animated ? 0.72 + 0.28 * Math.sin(t * s.speed + s.phase) : 0.85;
        const alpha = Math.max(0, Math.min(1, s.base * tw));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 232, 244, ${alpha})`;
        ctx.fill();
      }
    };

    const drawMeteors = (dt: number) => {
      if (!animated) return;
      nextMeteor -= dt;
      if (nextMeteor <= 0) {
        nextMeteor = 7000 + Math.random() * 9000;
        const fromLeft = Math.random() > 0.4;
        meteors.push({
          x: fromLeft ? -60 : w * 0.6 + Math.random() * w * 0.4,
          y: Math.random() * h * 0.5,
          vx: (fromLeft ? 1 : -1) * (0.45 + Math.random() * 0.25),
          vy: 0.18 + Math.random() * 0.12,
          life: 0,
          max: 1500 + Math.random() * 900,
        });
      }

      meteors = meteors.filter((m) => m.life < m.max);
      for (const m of meteors) {
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const p = m.life / m.max;
        const fade = Math.sin(Math.PI * p) * 0.55;
        const len = 90;
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * len, m.y - m.vy * len);
        grad.addColorStop(0, `rgba(226, 232, 244, ${fade})`);
        grad.addColorStop(1, 'rgba(226, 232, 244, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * len, m.y - m.vy * len);
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      drawStars(now);
      drawMeteors(dt);
      raf = requestAnimationFrame(loop);
    };

    build();
    if (animated) {
      raf = requestAnimationFrame(loop);
    } else {
      drawStars(0);
    }

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, 180);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, [animated]);

  return (
    <div className="sky" aria-hidden="true">
      <div className="sky-deep" />
      <div className="sky-nebula nebula-a" />
      <div className="sky-nebula nebula-b" />
      <div className="sky-nebula nebula-c" />
      <canvas ref={canvasRef} className="sky-stars" />
      <div className={`sky-ring ${animated ? 'spin' : ''}`}>
        <svg viewBox="0 0 800 800" width="100%" height="100%">
          <circle cx="400" cy="400" r="360" fill="none" stroke="rgba(201,165,102,.22)" strokeWidth="0.6" />
          <circle cx="400" cy="400" r="300" fill="none" stroke="rgba(201,165,102,.12)" strokeWidth="0.5" />
          <circle cx="400" cy="400" r="238" fill="none" stroke="rgba(201,165,102,.08)" strokeWidth="0.5" />
          {Array.from({ length: 28 }).map((_, i) => {
            const a = (i / 28) * Math.PI * 2;
            const x1 = 400 + Math.cos(a) * 360;
            const y1 = 400 + Math.sin(a) * 360;
            const x2 = 400 + Math.cos(a) * (i % 7 === 0 ? 336 : 348);
            const y2 = 400 + Math.sin(a) * (i % 7 === 0 ? 336 : 348);
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={i % 7 === 0 ? 'rgba(201,165,102,.45)' : 'rgba(201,165,102,.18)'}
                strokeWidth={i % 7 === 0 ? 1.2 : 0.6}
              />
            );
          })}
          <text x="400" y="52" textAnchor="middle" fill="rgba(201,165,102,.28)" fontSize="15" letterSpacing="6">北</text>
          <text x="400" y="762" textAnchor="middle" fill="rgba(201,165,102,.22)" fontSize="15" letterSpacing="6">南</text>
          <text x="58" y="406" textAnchor="middle" fill="rgba(201,165,102,.22)" fontSize="15" letterSpacing="6">西</text>
          <text x="742" y="406" textAnchor="middle" fill="rgba(201,165,102,.22)" fontSize="15" letterSpacing="6">东</text>
        </svg>
      </div>
    </div>
  );
}
