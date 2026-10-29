import type { ChartResult, PalaceView, StarView } from '../lib/ziwei';
import { BRANCH_GRID } from '../lib/ziwei';

const BRIGHT_CLASS: Record<string, string> = {
  庙: 'br-1', 旺: 'br-1',
  得: 'br-2', 利: 'br-2',
  平: 'br-3',
  不: 'br-4', 陷: 'br-4', 闲: 'br-4',
};

function Star({ s }: { s: StarView }) {
  const cls = ['star', `star-${s.kind}`];
  if (s.brightness && BRIGHT_CLASS[s.brightness]) cls.push(BRIGHT_CLASS[s.brightness]);
  return (
    <span className={cls.join(' ')}>
      {s.name}
      {s.brightness ? <sup className="br">{s.brightness}</sup> : null}
      {s.siHua ? <sup className={`sihua sihua-${s.siHua}`}>{s.siHua}</sup> : null}
    </span>
  );
}

function PalaceCell({
  p,
  borrow,
  active,
  isDecadal,
  isYearly,
  onSelect,
}: {
  p: PalaceView;
  borrow: string;
  active: boolean;
  isDecadal: boolean;
  isYearly: boolean;
  onSelect: () => void;
}) {
  const [row, col] = BRANCH_GRID[p.branch];
  const cls = ['cell'];
  if (p.name === '命宫') cls.push('ming');
  if (isDecadal) cls.push('decadal');
  if (isYearly) cls.push('yearly');
  if (active) cls.push('active');

  return (
    <button
      type="button"
      className={cls.join(' ')}
      style={{ gridRow: row, gridColumn: col }}
      onClick={onSelect}
      aria-label={`${p.name}${p.name.endsWith('宫') ? '' : '宫'} ${p.branchName}`}
    >
      <div className="cell-head">
        <span className="pname">{p.name}</span>
        {p.isBody ? <span className="badge-body">身</span> : null}
        {p.isOriginal ? <span className="badge-orig">原</span> : null}
        {p.isEmpty ? <span className="badge-empty">空宫</span> : null}
      </div>

      <div className="stars">
        {p.major.map((s) => <Star key={`M${s.name}`} s={s} />)}
        {p.isEmpty && borrow ? <span className="star star-borrow">借 {borrow}</span> : null}
        {p.minor.map((s) => <Star key={`m${s.name}`} s={s} />)}
        {p.adj.map((s) => <Star key={`a${s.name}`} s={s} />)}
      </div>

      <div className="cell-foot">
        <span className="branch">{p.stemName}{p.branchName}</span>
        {p.decadal ? <span className="daxian"> {p.decadal[0]}–{p.decadal[1]}</span> : null}
      </div>
    </button>
  );
}

function Center({ r }: { r: ChartResult }) {
  const c = r.chart;
  const rows: [string, string][] = [
    ['公历', c.solarDate],
    ['农历', c.lunar],
    ['四柱', c.chinese],
    ['五行局', c.fiveElements],
    ['命主 / 身主', `${c.soul} / ${c.body}`],
    ['生肖 / 星座', `${c.zodiac} / ${c.sign}`],
  ];

  return (
    <div className="center">
      <div className="center-title">
        <span className="seal">紫微</span>
        <div>
          <h2>命盘</h2>
          <p className="sub">{c.gender} · {c.time}（{c.timeRange}）</p>
        </div>
      </div>

      <dl className="meta">
        {rows.map(([k, v]) => (
          <div key={k} className="meta-row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="hl">
        <div className="hl-item">
          <span className="hl-label">大限</span>
          <span className="hl-value">
            {r.decadalRange ? `${r.decadalRange[0]}–${r.decadalRange[1]} 岁` : '—'}
            <em>{r.nominalAge} 虚岁</em>
            {r.decadalIndex >= 0 ? (
              <em className="dim">{r.chart.palaces[r.decadalIndex]?.name}宫</em>
            ) : null}
          </span>
        </div>
        <div className="hl-item">
          <span className="hl-label">流年</span>
          <span className="hl-value">{r.targetYear} 年{`（${r.targetYear} 流年）`}</span>
        </div>
      </div>

      <div className="sihua-box">
        <div>
          <span className="hl-label">大限四化</span>
          <span className="chips">
            {['禄', '权', '科', '忌'].map((k, i) => (
              <i key={k} className={`chip sihua-${k}`}>{r.decadalMutagen[i] ?? '—'}{k}</i>
            ))}
          </span>
        </div>
        <div>
          <span className="hl-label">流年四化</span>
          <span className="chips">
            {['禄', '权', '科', '忌'].map((k, i) => (
              <i key={k} className={`chip sihua-${k}`}>{r.yearlyMutagen[i] ?? '—'}{k}</i>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ChartBoard({
  r,
  selected,
  onSelect,
}: {
  r: ChartResult;
  selected: number | null;
  onSelect: (i: number | null) => void;
}) {
  return (
    <div className="board-wrap">
      <div className="board">
        {r.chart.palaces.map((p) => {
          const opp = r.chart.palaces.find((q) => q.branch === (p.branch + 6) % 12);
          const borrow = !p.major.length && opp ? opp.major.map((s) => s.name).join('、') : '';
          return (
            <PalaceCell
              key={p.index}
              p={p}
              borrow={borrow}
              active={selected === p.index}
              isDecadal={r.decadalIndex === p.index}
              isYearly={r.yearlyIndex === p.index}
              onSelect={() => onSelect(selected === p.index ? null : p.index)}
            />
          );
        })}
        <Center r={r} />
      </div>
    </div>
  );
}
