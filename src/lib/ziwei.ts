import { astro } from 'iztro';

export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

/** 地支 → 传统命盘 4×4 环形布局的 [行, 列]（1-based） */
export const BRANCH_GRID: Record<number, [number, number]> = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1], 9: [2, 4],
  3: [3, 1], 10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

export type Gender = 'male' | 'female';

export interface BirthParams {
  year: number;
  month: number;
  day: number;
  hour: number; // 0=子 … 11=亥
  gender: Gender;
}

export interface StarView {
  name: string;
  kind: 'major' | 'minor' | 'adj';
  brightness?: string;
  siHua?: string;
}

export interface PalaceView {
  index: number;
  branch: number;
  branchName: string;
  stemName: string;
  name: string;
  isBody: boolean;
  isOriginal: boolean;
  major: StarView[];
  minor: StarView[];
  adj: StarView[];
  decadal?: [number, number];
  ages: number[];
  changsheng?: string;
  isEmpty: boolean;
}

export interface ChartView {
  palaces: PalaceView[];
  lunar: string;
  chinese: string;
  time: string;
  timeRange: string;
  fiveElements: string;
  soul: string;
  body: string;
  sign: string;
  zodiac: string;
  gender: string;
  solarDate: string;
  soulBranch: number;
  bodyBranch: number;
  raw: ReturnType<typeof astro.bySolar>;
}

export interface ChartResult {
  chart: ChartView;
  /** 当前大限落在哪一个宫（palaces 下标） */
  decadalIndex: number;
  decadalRange: [number, number] | null;
  decadalMutagen: string[];
  /** 流年命宫下标 */
  yearlyIndex: number;
  yearlyMutagen: string[];
  nominalAge: number;
  targetYear: number;
}

const HOUR_LABEL = [
  '子时 23:00–01:00', '丑时 01:00–03:00', '寅时 03:00–05:00', '卯时 05:00–07:00',
  '辰时 07:00–09:00', '巳时 09:00–11:00', '午时 11:00–13:00', '未时 13:00–15:00',
  '申时 15:00–17:00', '酉时 17:00–19:00', '戌时 19:00–21:00', '亥时 21:00–23:00',
];

export const hourLabel = (h: number) => HOUR_LABEL[h] ?? '';

function toStar(s: any, kind: StarView['kind']): StarView {
  return {
    name: String(s.name),
    kind,
    brightness: s.brightness ? String(s.brightness) : undefined,
    siHua: s.mutagen ? String(s.mutagen) : undefined,
  };
}

export function buildChart(p: BirthParams, targetYear: number): ChartResult {
  // 公历日期必须真实存在，否则 iztro 会静默顺延到下个月，排出别人的盘
  const probe = new Date(Date.UTC(p.year, p.month - 1, p.day));
  if (
    probe.getUTCFullYear() !== p.year ||
    probe.getUTCMonth() !== p.month - 1 ||
    probe.getUTCDate() !== p.day
  ) {
    throw new Error(`${p.year} 年 ${p.month} 月 ${p.day} 日不是一个存在的公历日期`);
  }

  const a = astro.bySolar(
    `${p.year}-${p.month}-${p.day}`,
    p.hour,
    p.gender === 'male' ? '男' : '女',
    true,
    'zh-CN',
  );

  const palaces: PalaceView[] = a.palaces.map((raw, i) => {
    const branch = BRANCHES.indexOf(raw.earthlyBranch as (typeof BRANCHES)[number]);
    const major = raw.majorStars.map((s) => toStar(s, 'major'));
    return {
      index: i,
      branch: branch < 0 ? 0 : branch,
      branchName: raw.earthlyBranch,
      stemName: raw.heavenlyStem,
      name: raw.name,
      isBody: Boolean(raw.isBodyPalace),
      isOriginal: Boolean(raw.isOriginalPalace),
      major,
      minor: raw.minorStars.map((s) => toStar(s, 'minor')),
      adj: raw.adjectiveStars.map((s) => toStar(s, 'adj')),
      decadal: raw.decadal?.range ? [raw.decadal.range[0], raw.decadal.range[1]] : undefined,
      ages: (raw.ages ?? []) as number[],
      changsheng: raw.changsheng12,
      isEmpty: major.length === 0,
    };
  });

  const h = a.horoscope(`${targetYear}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`);

  const dIndex = h.decadal?.index ?? -1;
  const dRange = dIndex >= 0 ? a.palaces[dIndex]?.decadal?.range : undefined;

  return {
    chart: {
      palaces,
      lunar: a.lunarDate,
      chinese: a.chineseDate,
      time: a.time,
      timeRange: a.timeRange,
      fiveElements: a.fiveElementsClass,
      soul: a.soul,
      body: a.body,
      sign: a.sign,
      zodiac: a.zodiac,
      gender: a.gender,
      solarDate: a.solarDate,
      soulBranch: Math.max(0, BRANCHES.indexOf(a.earthlyBranchOfSoulPalace as (typeof BRANCHES)[number])),
      bodyBranch: Math.max(0, BRANCHES.indexOf(a.earthlyBranchOfBodyPalace as (typeof BRANCHES)[number])),
      raw: a,
    },
    decadalIndex: dIndex,
    decadalRange: dRange ? [dRange[0], dRange[1]] : null,
    decadalMutagen: (h.decadal?.mutagen ?? []) as string[],
    yearlyIndex: h.yearly?.index ?? -1,
    yearlyMutagen: (h.yearly?.mutagen ?? []) as string[],
    nominalAge: h.age?.nominalAge ?? 0,
    targetYear,
  };
}

/** 大限列表：按起始岁排序 */
export function decadalList(chart: ChartView) {
  return chart.palaces
    .filter((p) => p.decadal)
    .map((p) => ({ index: p.index, range: p.decadal as [number, number], palaceName: p.name }))
    .sort((a, b) => a.range[0] - b.range[0]);
}

/** 从 URL hash 读取参数，失败返回 null */
export function readHash(): (BirthParams & { ty: number }) | null {
  try {
    const q = new URLSearchParams(location.hash.replace(/^#/, ''));
    const y = Number(q.get('y'));
    const m = Number(q.get('m'));
    const d = Number(q.get('d'));
    const h = Number(q.get('h'));
    const g = q.get('g') === 'f' ? 'female' : 'male';
    const ty = Number(q.get('ty')) || new Date().getFullYear();
    if (!y || !m || !d) return null;
    if (m < 1 || m > 12 || d < 1 || d > 31 || h < 0 || h > 11) return null;
    return { year: y, month: m, day: d, hour: h, gender: g as Gender, ty };
  } catch {
    return null;
  }
}

export function writeHash(p: BirthParams, ty: number) {
  const q = new URLSearchParams({
    y: String(p.year), m: String(p.month), d: String(p.day),
    h: String(p.hour), g: p.gender === 'female' ? 'f' : 'm', ty: String(ty),
  });
  history.replaceState(null, '', `#${q.toString()}`);
}
