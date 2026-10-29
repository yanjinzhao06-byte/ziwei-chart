import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import ChartBoard from './components/ChartBoard';
import Intro from './components/Intro';
import Settings, { type Prefs } from './components/Settings';
import Starfield from './components/Starfield';
import { interpretPalace } from './lib/interpret';
import { sound } from './lib/sound';
import {
  buildChart, decadalList, hourLabel, readHash, writeHash,
  type BirthParams, type ChartResult, type Gender, type PalaceView,
} from './lib/ziwei';

const TODAY = new Date();
const DEFAULT: BirthParams = { year: 1990, month: 5, day: 12, hour: 6, gender: 'male' };
const PREFS_KEY = 'ziwei.prefs';
const INTRO_KEY = 'ziwei.intro';

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const p = raw ? (JSON.parse(raw) as Partial<Prefs>) : {};
    return {
      sound: Boolean(p.sound ?? sound.prefs.on),
      volume: typeof p.volume === 'number' ? p.volume : sound.prefs.volume,
      motion: p.motion === 'reduced' || p.motion === 'off' ? p.motion : 'system',
    };
  } catch {
    return { sound: false, volume: 0.7, motion: 'system' };
  }
}

function yearOptions(birthYear: number, now: number): number[] {
  const end = Math.max(birthYear + 110, now);
  const out: number[] = [];
  for (let y = birthYear; y <= end; y += 1) out.push(y);
  return out;
}

/** 窄屏：解读改用底部抽屉，避免用户翻到页面最底部 */
function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}

function PalaceDetail({ r, p, onClose }: { r: ChartResult; p: PalaceView; onClose: () => void }) {
  const groups: [string, PalaceView['major']][] = [
    ['主星', p.major],
    ['辅星', p.minor],
    ['杂曜', p.adj],
  ];
  const reading = interpretPalace(r, p);

  return (
    <section className="detail" aria-live="polite">
      <header>
        <h3>
          {p.name}宫 <span className="g">{p.stemName}{p.branchName}</span>
          {p.isBody ? <span className="badge-body">身宫</span> : null}
        </h3>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭解读">×</button>
      </header>

      <div className="reading">
        <div className="reading-head">
          <b>解读</b>
          <span className="reading-topic">{reading.topic}</span>
        </div>
        {reading.paragraphs.map((t, i) => (
          <p key={`${i}-${t.slice(0, 6)}`} className={i === reading.paragraphs.length - 1 ? 'reading-advice' : undefined}>
            {t}
          </p>
        ))}
        <div className="reading-tags">
          {reading.tags.map((t) => (
            <span key={t} className="rtag">{t}</span>
          ))}
        </div>
      </div>

      <div className="detail-meta">
        <span>长生：{p.changsheng ?? '—'}</span>
        <span>大限：{p.decadal ? `${p.decadal[0]}–${p.decadal[1]} 岁` : '—'}</span>
        <span>小限：{p.ages?.length ? p.ages.join('、') : '—'}</span>
        {p.isEmpty ? <span className="warn">无主星（借对宫）</span> : null}
      </div>

      {groups.map(([label, list]) =>
        list.length ? (
          <div key={label} className="detail-group">
            <h4>{label}</h4>
            <ul>
              {list.map((s) => (
                <li key={s.name}>
                  <b>{s.name}</b>
                  {s.brightness ? <span className={`br-tag ${s.brightness}`}>{s.brightness}</span> : null}
                  {s.siHua ? <span className={`si-tag sihua-${s.siHua}`}>化{s.siHua}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </section>
  );
}

export default function App() {
  const initial = readHash();
  const [p, setP] = useState<BirthParams>(initial ?? DEFAULT);
  const [ty, setTy] = useState<number>(initial?.ty ?? TODAY.getFullYear());
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [computing, setComputing] = useState(false);
  const isMobile = useIsMobile();

  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [introOpen, setIntroOpen] = useState(() => {
    try { return sessionStorage.getItem(INTRO_KEY) !== '1'; } catch { return true; }
  });

  const [draft, setDraft] = useState(() => {
    const src = initial ?? DEFAULT;
    return { year: String(src.year), month: String(src.month), day: String(src.day) };
  });

  const boardRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const systemReduced = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const reduced = prefs.motion === 'off' || (prefs.motion === 'system' && systemReduced);

  // 偏好写盘 + 应用到 <html data-motion>
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* 忽略 */ }
    sound.setPrefs({ on: prefs.sound, volume: prefs.volume });
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  }, [prefs, reduced]);

  const result = useMemo(() => {
    try {
      return { ok: true as const, data: buildChart(p, ty) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  }, [p, ty]);

  useEffect(() => { writeHash(p, ty); }, [p, ty]);

  useEffect(() => {
    const lo = p.year;
    const hi = Math.max(p.year + 110, TODAY.getFullYear());
    if (ty < lo || ty > hi) setTy(Math.min(hi, Math.max(lo, TODAY.getFullYear())));
  }, [p.year, ty]);

  useEffect(() => {
    if (result.ok) return;
    sound.play('error');
  }, [result]);

  const draftOk = {
    year: draft.year.length === 4 && Number(draft.year) >= 1900 && Number(draft.year) <= 2100,
    month: Number(draft.month) >= 1 && Number(draft.month) <= 12,
    day: Number(draft.day) >= 1 && Number(draft.day) <= 31,
  };

  const onDraft = (k: 'year' | 'month' | 'day') => (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, k === 'year' ? 4 : 2);
    const next = { ...draft, [k]: digits };
    setDraft(next);

    const y = Number(next.year);
    const m = Number(next.month);
    const d = Number(next.day);
    const ok = next.year.length === 4 && y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31;
    if (ok) setP((prev) => ({ ...prev, year: y, month: m, day: d }));
  };

  const onDraftBlur = (k: 'year' | 'month' | 'day') => () => {
    const min = k === 'year' ? 1900 : 1;
    const max = k === 'year' ? 2100 : k === 'month' ? 12 : 31;
    const raw = draft[k].trim();
    const n = Number(raw);
    const valid = raw.length > 0 && Number.isInteger(n) && n >= min && n <= max;
    const v = valid ? n : p[k];
    setDraft((prev) => ({ ...prev, [k]: String(v) }));
    setP((prev) => ({ ...prev, [k]: v }));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      sound.play('confirm');
      window.setTimeout(() => setCopied(false), 1600);
    } catch { /* 浏览器不支持时忽略 */ }
  };

  const scrollTo = (el: HTMLElement | null) => {
    el?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  const runChart = () => {
    sound.play('start');
    setComputing(true);
    window.setTimeout(() => {
      setComputing(false);
      sound.play('done');
      scrollTo(boardRef.current);
    }, reduced ? 220 : 760);
  };

  const closeIntro = useCallback(() => {
    setIntroOpen(false);
    try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* 忽略 */ }
  }, []);

  // 开场期间锁滚动，避免背景上下滑动
  useEffect(() => {
    if (!introOpen) return;
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [introOpen]);

  // 手机端抽屉打开时锁滚动 + Esc 关闭
  useEffect(() => {
    if (!isMobile || selected === null) return;
    document.body.classList.add('no-scroll');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { sound.play('close'); setSelected(null); } };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('no-scroll');
      window.removeEventListener('keydown', onKey);
    };
  }, [isMobile, selected]);

  const changePrefs = (next: Partial<Prefs>) => {
    if (next.sound === true && !prefs.sound) {
      window.setTimeout(() => sound.play('confirm'), 60);
    } else {
      sound.play('tap');
    }
    setPrefs((prev) => ({ ...prev, ...next }));
  };

  const toggleSound = () => {
    const next = !prefs.sound;
    setPrefs((prev) => ({ ...prev, sound: next }));
    if (next) window.setTimeout(() => sound.play('confirm'), 90);
  };

  const closeDetail = () => {
    sound.play('close');
    setSelected(null);
  };

  const decades = result.ok ? decadalList(result.data.chart) : [];
  const activeDecade = result.ok
    ? decades.find((d) => result.data.nominalAge >= d.range[0] && result.data.nominalAge <= d.range[1])
    : undefined;

  return (
    <>
      <Starfield animated={!reduced} />
      {introOpen ? <Intro onDone={closeIntro} onSkip={() => sound.play('confirm')} reduced={reduced} /> : null}

      <div className="app">
      <header className="site-head">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <h1>紫微斗数</h1>
            <p>观星以知命 · 排盘以明理</p>
          </div>
        </div>

        <nav className="site-nav">
          <button type="button" className="nav-link" onClick={() => { sound.play('nav'); scrollTo(formRef.current); }}>
            排盘
          </button>
          <button type="button" className="nav-link" onClick={() => { sound.play('nav'); scrollTo(boardRef.current); }}>
            命盘
          </button>
          <button type="button" className="nav-link" onClick={copyLink}>
            {copied ? '已复制' : '分享'}
          </button>
          <button
            type="button"
            className={`sound-btn ${prefs.sound ? 'on' : ''}`}
            onClick={toggleSound}
            aria-pressed={prefs.sound}
            aria-label={prefs.sound ? '关闭声音' : '开启声音'}
            title={prefs.sound ? '声音已开启' : '点击开启声音'}
          >
            <span className="note" aria-hidden="true">♪</span>
            <span className="sound-label">{prefs.sound ? '声音开' : '开启声音'}</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="设置"
            onClick={() => { sound.play('open'); setSettingsOpen(true); }}
          >
            <span className="gear" aria-hidden="true">⚙</span>
          </button>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">紫微垣 · 斗数排盘</p>
            <h2 className="hero-title">
              以星为盘，<br />
              照见你一生的方位
            </h2>
            <p className="hero-sub">
              输入出生时辰，生成十二宫命盘。全部计算在浏览器完成，出生信息不上传、不留存。
            </p>
            <div className="hero-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { sound.play('start'); scrollTo(formRef.current); }}
                onPointerEnter={() => sound.play('hover')}
              >
                开始排盘
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { sound.play('nav'); scrollTo(boardRef.current); }}>
                看看示例命盘
              </button>
            </div>
            <ul className="hero-facts">
              <li><b>纯前端</b><span>无请求、无账号</span></li>
              <li><b>12 宫</b><span>本命 / 大限 / 流年</span></li>
              <li><b>逐宫解读</b><span>规则引擎本地生成</span></li>
            </ul>
          </div>

          <div className="hero-orb" aria-hidden="true">
            <div className="orb-ring ring-1" />
            <div className="orb-ring ring-2" />
            <div className="orb-ring ring-3" />
            <div className="orb-core" />
            <div className="orb-cross" />
          </div>
        </section>

        <section className="panel form-card" ref={formRef} id="form">
          <div className="panel-head">
            <h2>出生信息</h2>
            <p>公历生日 + 时辰 + 性别，够排一张本命盘</p>
          </div>

          <form className="form" onSubmit={(e) => { e.preventDefault(); runChart(); }}>
            <label className={`field ${draftOk.year ? '' : 'bad'}`}>
              <span>公历</span>
              <input
                type="text" inputMode="numeric" autoComplete="off" maxLength={4}
                value={draft.year}
                onChange={onDraft('year')}
                onBlur={onDraftBlur('year')}
                aria-label="出生年份"
              />
              <em>年</em>
            </label>

            <label className={`field ${draftOk.month ? '' : 'bad'}`}>
              <input
                type="text" inputMode="numeric" autoComplete="off" maxLength={2}
                value={draft.month}
                onChange={onDraft('month')}
                onBlur={onDraftBlur('month')}
                aria-label="出生月份"
              />
              <em>月</em>
            </label>

            <label className={`field ${draftOk.day ? '' : 'bad'}`}>
              <input
                type="text" inputMode="numeric" autoComplete="off" maxLength={2}
                value={draft.day}
                onChange={onDraft('day')}
                onBlur={onDraftBlur('day')}
                aria-label="出生日"
              />
              <em>日</em>
            </label>

            <label className="field wide">
              <span>时辰</span>
              <select
                value={p.hour}
                onChange={(e) => { setP((prev) => ({ ...prev, hour: Number(e.target.value) })); sound.play('confirm'); }}
                aria-label="出生时辰"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{hourLabel(i)}</option>
                ))}
              </select>
            </label>

            <div className="seg" role="group" aria-label="性别">
              {(['male', 'female'] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  className={p.gender === g ? 'on' : ''}
                  aria-pressed={p.gender === g}
                  onClick={() => { setP((prev) => ({ ...prev, gender: g })); sound.play('confirm'); }}
                >
                  {g === 'male' ? '男' : '女'}
                </button>
              ))}
            </div>

            <button type="submit" className="btn btn-primary btn-chart">
              排盘
            </button>
          </form>

          <p className="form-note">
            按北京时间排，未做真太阳时校正；23:00 之后出生请按次日子时。
          </p>
        </section>

        <section className="chart-section" ref={boardRef} id="chart">
          <div className="section-head">
            <div>
              <h2>命盘</h2>
              <p>点击任意宫位，查看该宫的解读</p>
            </div>

            <div className="chart-tools">
              <label className="mini-select">
                <span>流年</span>
                <select
                  value={ty}
                  onChange={(e) => { setTy(Number(e.target.value)); sound.play('nav'); }}
                  aria-label="流年"
                >
                  {yearOptions(p.year, TODAY.getFullYear()).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
              {activeDecade ? (
                <span className="decade-chip">
                  大限 {activeDecade.palaceName}宫 {activeDecade.range[0]}–{activeDecade.range[1]} 岁
                </span>
              ) : null}
            </div>
          </div>

          {result.ok ? (
            <div className={`board-host ${computing ? 'computing' : ''}`}>
              <ChartBoard
                r={result.data}
                selected={selected}
                onSelect={(i) => {
                  sound.play(i === null ? 'close' : 'tap');
                  setSelected(i);
                }}
              />

              {computing ? (
                <div className="computing" role="status" aria-live="polite">
                  <div className="computing-orbit" aria-hidden="true" />
                  <p>正在排盘 · 本地计算</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="error" role="alert">
              <b>这个日期排不出来</b>
              <p>{(result as { ok: false; error: string }).error}</p>
              <p className="dim">请检查公历日期是否存在（如 2 月 30 日）。</p>
            </div>
          )}

          <div className="legend">
            <div>
              <b>亮度</b>
              <i className="br-tag 庙">庙</i><i className="br-tag 旺">旺</i>
              <i className="br-tag 得">得</i><i className="br-tag 利">利</i>
              <i className="br-tag 平">平</i><i className="br-tag 不">不</i>
              <i className="br-tag 陷">陷</i>
            </div>
            <div>
              <b>四化</b>
              <i className="si-tag sihua-禄">化禄</i>
              <i className="si-tag sihua-权">化权</i>
              <i className="si-tag sihua-科">化科</i>
              <i className="si-tag sihua-忌">化忌</i>
            </div>
            <div>
              <b>标记</b>
              <i className="kbd k-dec">大限</i>
              <i className="kbd k-yr">流年</i>
              <i className="kbd k-ming">命宫</i>
            </div>
          </div>
        </section>

        <section className="reading-section">
          {result.ok && selected !== null ? (
            isMobile ? null : (
              <PalaceDetail
                r={result.data}
                p={result.data.chart.palaces[selected]}
                onClose={closeDetail}
              />
            )
          ) : (
            <div className="empty-state">
              <span className="empty-star" aria-hidden="true" />
              <b>还没有选宫位</b>
              <p>在上面的命盘里点任意一宫，这里会出现该宫的解读。</p>
            </div>
          )}
        </section>
      </main>

      <footer className="foot">
        <p>
          排盘内核 <a href="https://github.com/SylarLong/iztro" target="_blank" rel="noreferrer">iztro</a>（MIT），
          全部计算在浏览器完成，不上传、不留存。
          <a href="THIRD-PARTY-NOTICES.txt" target="_blank" rel="noreferrer">开源许可与版权声明</a>
        </p>
        <p className="dim">命理属传统文化研究，不构成任何决策建议。</p>
      </footer>

      <Settings
        open={settingsOpen}
        prefs={prefs}
        onChange={changePrefs}
        onClose={() => { sound.play('close'); setSettingsOpen(false); }}
        onReplayIntro={() => {
          sound.play('open');
          setSettingsOpen(false);
          setIntroOpen(true);
          try { sessionStorage.removeItem(INTRO_KEY); } catch { /* 忽略 */ }
        }}
      />

      {/* 手机端：解读做成底部抽屉，点宫位立刻弹出，不用往下翻 */}
      {isMobile && result.ok && selected !== null ? (
        <div className="sheet-mask" onClick={closeDetail}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`${result.data.chart.palaces[selected].name}宫解读`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-grip" aria-hidden="true" />
            <PalaceDetail
              r={result.data}
              p={result.data.chart.palaces[selected]}
              onClose={closeDetail}
            />
          </div>
        </div>
      ) : null}
      </div>
    </>
  );
}
