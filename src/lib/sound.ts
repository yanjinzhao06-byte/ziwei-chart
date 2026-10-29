/**
 * 声音系统：全部用 Web Audio 合成，不加载任何音频文件。
 * 默认关闭；用户手动开启后才创建 AudioContext（满足浏览器自动播放策略）。
 */

export type SoundName = 'tap' | 'hover' | 'confirm' | 'start' | 'done' | 'error' | 'open' | 'close' | 'nav';

const STORAGE_KEY = 'ziwei.sound';

interface SoundPrefs {
  on: boolean;
  volume: number; // 0 - 1
}

function loadPrefs(): SoundPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { on: false, volume: 0.7 };
    const p = JSON.parse(raw) as Partial<SoundPrefs>;
    return {
      on: Boolean(p.on),
      volume: typeof p.volume === 'number' ? Math.min(1, Math.max(0, p.volume)) : 0.7,
    };
  } catch {
    return { on: false, volume: 0.7 };
  }
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private lastHover = 0;
  prefs: SoundPrefs = loadPrefs();

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5 * this.prefs.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setPrefs(next: Partial<SoundPrefs>) {
    this.prefs = { ...this.prefs, ...next };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs)); } catch { /* 忽略 */ }
    if (this.master) this.master.gain.value = 0.5 * this.prefs.volume;
    if (this.prefs.on) this.ensure();
  }

  /** 播放前必须由用户手势触发过（按钮点击等） */
  play(name: SoundName) {
    if (!this.prefs.on) return;
    const ctx = this.ensure();
    const master = this.master;
    if (!ctx || !master) return;

    switch (name) {
      case 'tap': {
        // 玲珑破碎：几片玻璃质泛音 + 极短高频碎屑 + 半拍后的回响碎片
        this.crystal(master, { base: 2280, gain: 0.052 });
        break;
      }
      case 'hover': {
        const now = performance.now();
        if (now - this.lastHover < 240) return; // 悬停音不连续触发
        this.lastHover = now;
        this.tone(ctx, master, { freq: 3720, type: 'sine', dur: 0.03, gain: 0.016 });
        this.noise(master, { dur: 0.018, gain: 0.008, from: 9000, to: 6000 });
        break;
      }
      case 'confirm': {
        // 两下更亮的碎响，第二下带一点上扬
        this.crystal(master, { base: 2016, gain: 0.055, shards: false });
        this.crystal(master, { base: 2688, gain: 0.038, delay: 0.075, shards: false });
        break;
      }
      case 'start': {
        this.tone(ctx, master, { freq: 196, to: 92, type: 'sine', dur: 0.55, gain: 0.13 });
        this.tone(ctx, master, { freq: 294, to: 147, type: 'triangle', dur: 0.45, gain: 0.06, delay: 0.03 });
        this.noise(master, { dur: 0.5, gain: 0.03, from: 1800, to: 400 });
        this.crystal(master, { base: 1760, gain: 0.03, delay: 0.42 });
        break;
      }
      case 'done': {
        // 玉石钟鸣打底，落一层碎晶
        this.tone(ctx, master, { freq: 1046.5, type: 'sine', dur: 1.1, gain: 0.10 });
        this.tone(ctx, master, { freq: 1568, type: 'sine', dur: 0.9, gain: 0.05, delay: 0.02 });
        this.tone(ctx, master, { freq: 2093, type: 'sine', dur: 0.6, gain: 0.025, delay: 0.04 });
        this.crystal(master, { base: 2637, gain: 0.042, delay: 0.12 });
        this.crystal(master, { base: 3136, gain: 0.022, delay: 0.3 });
        break;
      }
      case 'error': {
        // 闷一点的钝响，不用刺耳高频
        this.tone(ctx, master, { freq: 220, to: 150, type: 'sine', dur: 0.2, gain: 0.1 });
        this.noise(master, { dur: 0.08, gain: 0.02, from: 900, to: 300 });
        break;
      }
      case 'open': {
        this.noise(master, { dur: 0.24, gain: 0.035, from: 400, to: 2600 });
        this.crystal(master, { base: 1318, gain: 0.045 });
        break;
      }
      case 'close': {
        this.noise(master, { dur: 0.18, gain: 0.03, from: 2000, to: 300 });
        this.crystal(master, { base: 1568, gain: 0.032, detune: -0.04 });
        break;
      }
      case 'nav': {
        this.crystal(master, { base: 1760, gain: 0.04, shards: false });
        break;
      }
    }
  }

  /**
   * 玲珑破碎音：非谐泛音 + 高频碎屑 + 可选的回响碎片。
   * 每次播放基频有 ±1.5% 微扰，连续点击不会像机器。
   */
  private crystal(
    out: GainNode,
    o: { base: number; gain: number; delay?: number; shards?: boolean; detune?: number },
  ) {
    const ctx = this.ctx;
    if (!ctx) return;
    const base = o.base * (1 + (Math.random() - 0.5) * 0.03) * (1 + (o.detune ?? 0));
    const t = ctx.currentTime + (o.delay ?? 0);
    const ratios = [1, 1.58, 2.13, 2.87];

    ratios.forEach((r, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base * r, t + i * 0.003);
      const peak = o.gain / (1.6 + i * 1.25);
      const dur = 0.13 + i * 0.045;
      g.gain.setValueAtTime(0.0001, t + i * 0.003);
      g.gain.exponentialRampToValueAtTime(peak, t + i * 0.003 + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.003 + dur);
      osc.connect(g).connect(out);
      osc.start(t + i * 0.003);
      osc.stop(t + i * 0.003 + dur + 0.02);
    });

    // 碎屑：6~10kHz 的极短噪声，制造「玻璃裂开」的一瞬
    this.noise(out, { dur: 0.03, gain: o.gain * 0.55, from: 8200, to: 4200, delay: o.delay });

    // 回响碎片：半拍后落下的一片小晶
    if (o.shards !== false) {
      const later = 0.055;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base * 2.02, t + later);
      g.gain.setValueAtTime(0.0001, t + later);
      g.gain.exponentialRampToValueAtTime(o.gain * 0.28, t + later + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + later + 0.12);
      osc.connect(g).connect(out);
      osc.start(t + later);
      osc.stop(t + later + 0.14);
    }
  }

  private tone(
    ctx: AudioContext,
    out: GainNode,
    o: { freq: number; to?: number; type?: OscillatorType; dur: number; gain: number; delay?: number },
  ) {
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + o.dur);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

    osc.connect(g).connect(out);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.05);
  }

  private noise(
    out: GainNode,
    o: { dur: number; gain: number; from: number; to: number; delay?: number },
  ) {
    const ctx = this.ctx;
    if (!ctx) return;
    const startAt = ctx.currentTime + (o.delay ?? 0);
    const len = Math.floor(ctx.sampleRate * o.dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.9;
    filter.frequency.setValueAtTime(o.from, startAt);
    filter.frequency.exponentialRampToValueAtTime(o.to, startAt + o.dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, startAt);
    g.gain.exponentialRampToValueAtTime(o.gain, startAt + o.dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + o.dur);

    src.connect(filter).connect(g).connect(out);
    src.start(startAt);
  }
}

export const sound = new SoundEngine();
