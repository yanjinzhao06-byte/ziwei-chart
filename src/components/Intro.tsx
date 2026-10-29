import { useEffect, useMemo } from 'react';

/** 北斗七星（以天枢起，顺时针到摇光） */
const DIPPER: { name: string; x: number; y: number }[] = [
  { name: '天枢', x: 168, y: 118 },
  { name: '天璇', x: 162, y: 226 },
  { name: '天玑', x: 282, y: 260 },
  { name: '天权', x: 302, y: 148 },
  { name: '玉衡', x: 402, y: 182 },
  { name: '开阳', x: 502, y: 146 },
  { name: '摇光', x: 588, y: 92 },
];

/** 斗身四点闭合 + 斗柄一线 */
const LINKS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [3, 4], [4, 5], [5, 6],
];

export default function Intro({
  onDone,
  onSkip,
  reduced,
}: {
  onDone: () => void;
  onSkip?: () => void;
  reduced: boolean;
}) {
  const total = reduced ? 1650 : 3750;

  useEffect(() => {
    const t = window.setTimeout(onDone, total);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') onDone();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [onDone, total]);

  const stars = useMemo(
    () =>
      DIPPER.map((s, i) => ({
        ...s,
        delay: reduced ? 480 + i * 55 : 1150 + i * 140,
        size: i === 0 || i === 4 ? 3.4 : i === 6 ? 3.1 : 2.6,
      })),
    [reduced],
  );

  return (
    <div className={`intro ${reduced ? 'intro-reduced' : ''}`} role="dialog" aria-label="进入动画">
      <div className="intro-glow" />

      {/* 开场名牌：出现 → 停留 → 消散 */}
      <div className="intro-name" aria-hidden="true">
        <span>子非鱼</span>
        <i />
      </div>

      <svg className="intro-svg" viewBox="0 0 700 420" aria-hidden="true">
        <defs>
          <radialGradient id="starHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(240,232,214,.95)" />
            <stop offset="35%" stopColor="rgba(201,165,102,.55)" />
            <stop offset="100%" stopColor="rgba(201,165,102,0)" />
          </radialGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(201,165,102,.75)" />
            <stop offset="100%" stopColor="rgba(140,120,200,.45)" />
          </linearGradient>
        </defs>

        {LINKS.map(([a, b], i) => {
          const A = DIPPER[a];
          const B = DIPPER[b];
          return (
            <line
              key={`${a}-${b}`}
              className="dline"
              x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke="url(#lineGrad)"
              strokeWidth="1.1"
              style={{ animationDelay: `${reduced ? 0 : 1250 + i * 110}ms`, animationDuration: reduced ? '0ms' : '620ms' }}
            />
          );
        })}

        {stars.map((s) => (
          <g key={s.name} className="dstar" style={{ animationDelay: `${s.delay}ms` }}>
            <circle cx={s.x} cy={s.y} r="26" fill="url(#starHalo)" opacity=".55" />
            <circle cx={s.x} cy={s.y} r={s.size} fill="#f6f1e6" />
            <text x={s.x} y={s.y - 14} textAnchor="middle" className="dlabel">
              {s.name}
            </text>
          </g>
        ))}
      </svg>

      <div className="intro-copy">
        <h1 className="intro-title">紫微斗数</h1>
        <p className="intro-sub">观星以知命 · 排盘以明理</p>
        <p className="intro-hint">北斗在天，人各有位</p>
      </div>

      <button
        type="button"
        className="intro-skip"
        onClick={() => { onSkip?.(); onDone(); }}
        aria-label="跳过开场动画"
      >
        跳过
      </button>
    </div>
  );
}
