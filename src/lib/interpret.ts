import type { ChartResult, PalaceView } from './ziwei';
import { PALACE_ADVICE, STAR_IN_PALACE } from './reading-data.ts';
import { STAR_ADVICE, TRINE_STYLE } from './advice-data.ts';

const STAR_ORDER = Object.keys(STAR_IN_PALACE);
const HUA_ORDER = ['禄', '权', '科', '忌'];
const HUA_EFFECT: Record<string, string> = {
  禄: '资源与机会从这里进',
  权: '责任与压力压在这',
  科: '名声与文书从这里来',
  忌: '卡点与执念在这块',
};

export type Group = 'self' | 'love' | 'career' | 'family' | 'mind' | 'social';

interface StarProfile {
  essence: string;
  domains: Record<Group, string>;
}

/** 十四主星的底色 + 落在六类宫位时的侧重 */
const STAR_PROFILE: Record<string, StarProfile> = {
  紫微: {
    essence: '帝王星，要面子、要主导权、格局大，天生想坐主位。',
    domains: {
      self: '你天生想当主角，凡事要自己说了算，不太服人管',
      love: '你要对方尊重你、捧着你，最受不了被人安排',
      career: '适合带团队、做决策位，做纯执行反而憋屈',
      family: '在家里你容易当主心骨，也容易变成一言堂',
      mind: '面子撑得太紧，累都累在心里',
      social: '圈子贵精不贵多，泛交反而耗你',
    },
  },
  天机: {
    essence: '智多星，脑子转得快、善谋略，动脑不动手。',
    domains: {
      self: '你心思细、点子多，但容易反复、想一晚上不下手',
      love: '感情里你想得多、试探多，安全感得自己给自己',
      career: '适合策划、技术、顾问一类，重复性劳动会磨掉你',
      family: '家里的事你爱操心，容易替所有人先想一遍',
      mind: '神经绷得紧、睡眠浅，脑子很难真正停下来',
      social: '朋友不少，深交不多，容易被人当成“免费参谋”',
    },
  },
  太阳: {
    essence: '博爱星，热心、爱表现、习惯先给出去。',
    domains: {
      self: '你天生想被看见，热心肠，见不得别人为难',
      love: '付出型，容易一头热，要留意对方是不是同频',
      career: '适合对外、公开、服务性的岗位，靠口碑吃饭',
      family: '对长辈上心，也最容易被家里消耗',
      mind: '你累的时候不问“怎么歇”，只问“我是不是不够好”',
      social: '人缘广，但要防被当成理所当然',
    },
  },
  武曲: {
    essence: '财星，刚硬务实、执行力强，说到做到。',
    domains: {
      self: '你脾气硬、认死理，是行动派不是空谈派',
      love: '不太会说甜话，靠做事表达，容易被误会冷淡',
      career: '适合金融、技术、实业，靠硬本事立身',
      family: '对家人负责但说不出口，常被嫌不够温柔',
      mind: '压力自己扛，闷久了容易闷出病',
      social: '朋友不多，但都是能办事的',
    },
  },
  天同: {
    essence: '福星，随和、会享受、怕麻烦。',
    domains: {
      self: '你好相处、不爱争，“舒服”是你最重要的标准',
      love: '感情里图安稳，一遇摩擦就先退让',
      career: '适合稳定的环境，高压竞争会让你变形',
      family: '家里的和气靠你维持，但你不爱管具体事',
      mind: '心事藏得深，嘴上常说“没事”',
      social: '谁都不得罪，也就容易没有立场',
    },
  },
  廉贞: {
    essence: '次桃花兼囚星，聪明、有魅力、爱较真。',
    domains: {
      self: '你有棱角、不服输，爱憎分明写在脸上',
      love: '感情浓烈、占有欲强，容易从喜欢走到纠缠',
      career: '适合公关、设计、法务一类需要手腕的活',
      family: '家里容易因为你的坚持起摩擦',
      mind: '情绪起伏大，最容易跟自己较劲',
      social: '有魅力，但也容易招来桃花是非',
    },
  },
  天府: {
    essence: '财库星，稳重会守，讲究“手里有底”。',
    domains: {
      self: '你稳字当头，安全感来自账户余额而不是承诺',
      love: '看重稳定与实际，慢热，不玩虚的',
      career: '适合管理、财务、后勤，守成强过开拓',
      family: '你是家里的压舱石，什么都想兜住',
      mind: '怕失去，面对不确定最容易焦虑',
      social: '朋友交得少而稳，一个顶三个',
    },
  },
  太阴: {
    essence: '财星兼母星，细腻内敛，重感受。',
    domains: {
      self: '你内秀慢热，感受力强，不擅长当场表达',
      love: '细腻体贴，但要对方愿意读懂你',
      career: '适合文教、财务、幕后、和女性相关的行业',
      family: '与母亲或女性长辈缘分深，也容易被牵动',
      mind: '情绪起伏都藏在心里，容易失眠',
      social: '温和有距离，圈子小但暖',
    },
  },
  贪狼: {
    essence: '桃花兼欲望星，多才多艺，想要的多。',
    domains: {
      self: '你兴趣广、欲望强，最怕日子一眼望到头',
      love: '桃花不缺，感情里需要新鲜感撑着',
      career: '适合业务、娱乐、多元经营，单一工种留不住你',
      family: '在家里坐不住，总想往外跑',
      mind: '想要的东西太多，心容易浮',
      social: '人脉活络，但要筛掉酒肉朋友',
    },
  },
  巨门: {
    essence: '口舌星，能说会研究，也爱怀疑。',
    domains: {
      self: '你靠嘴和脑子吃饭，疑心比一般人重',
      love: '一句话没说好就容易起争执，赢理输情',
      career: '适合律师、教师、销售、研究一类靠表达与钻研的活',
      family: '家里话最多的是你，说重话的也常是你',
      mind: '说出口的还好，憋着的那部分最耗人',
      social: '能交心的少，容易被卷进背后议论',
    },
  },
  天相: {
    essence: '印星，讲规矩、重形象、擅长配合。',
    domains: {
      self: '你体面、守规矩、不爱出格，是天生的“副手型主角”',
      love: '感情里讲对等与体面，不喜欢拉扯',
      career: '适合行政、法务、协调、助理，靠可靠取胜',
      family: '家里出事你第一个出来打圆场',
      mind: '顾虑太多，做决定总比别人慢半拍',
      social: '人缘正，靠的是口碑不是手段',
    },
  },
  天梁: {
    essence: '荫星兼寿星，老成、有原则、爱管事。',
    domains: {
      self: '你少年老成，爱讲道理，见不得糊涂事',
      love: '感情里像照顾者，容易管太多',
      career: '适合医疗、教育、审计、顾问，越老越值钱',
      family: '长辈缘厚，也爱在家里当家长',
      mind: '操心别人多过操心自己',
      social: '容易被人当树洞，听多了也累',
    },
  },
  七杀: {
    essence: '将星，刚烈、敢冲、独立。',
    domains: {
      self: '你独立敢拼，最受不了被人按着头做事',
      love: '感情直接，容易硬碰硬，缺一个缓冲',
      career: '适合开拓、创业、军警、销售，越硬的环境越出彩',
      family: '与家人聚少离多，感情靠事后补',
      mind: '压力自己消化，习惯硬撑到极限',
      social: '朋友讲义气，但得罪人也快',
    },
  },
  破军: {
    essence: '耗星，破旧立新、敢赌敢重来。',
    domains: {
      self: '你不安分、爱折腾，说变就变',
      love: '感情起伏大，旧的不去新的不来',
      career: '适合改革、项目制、开新市场，守成型工作会闷死你',
      family: '家里变动多，早年容易离家',
      mind: '心里常冒出“推倒重来”的念头',
      social: '圈子换得勤，留得住的才是真的',
    },
  },
};

interface PalaceMeta {
  group: Group;
  topic: string;
  advice: string;
}

export const PALACE_META: Record<string, PalaceMeta> = {
  命宫: { group: 'self', topic: '性格底色、给人的第一印象、一生的主旋律', advice: '先看清自己是被哪颗星带着走，再决定要不要顺着它走。' },
  兄弟: { group: 'family', topic: '手足、合伙、母亲，以及你与人并肩做事的方式', advice: '合伙前把账说清，比只讲义气更能护住关系。' },
  夫妻: { group: 'love', topic: '伴侣类型、相处模式、感情的起伏节奏', advice: '你吸引的人和你处得来的人往往不是同一类，先分清再投入。' },
  子女: { group: 'family', topic: '子女缘分、晚辈与下属，以及你的创造力', advice: '对晚辈少下指令、多给空间，关系会比你想的顺。' },
  财帛: { group: 'career', topic: '赚钱方式、理财习惯、钱从哪来', advice: '先分清你赚的是劳力钱还是专业钱，再决定要不要加杠杆。' },
  疾厄: { group: 'mind', topic: '体质弱点、情绪与身体的连动', advice: '身体的信号通常比体检报告早半年出现，别硬拖。' },
  迁移: { group: 'social', topic: '外出、异地发展、在外的际遇', advice: '这张盘的“外面”通常比“里面”宽，动起来才有机会。' },
  仆役: { group: 'social', topic: '朋友、同事、下属，人脉的真实质量', advice: '人脉不看数量，看关键时刻能借到力的有几个。' },
  官禄: { group: 'career', topic: '事业方向、职场角色、能爬到的高度', advice: '选对赛道比埋头努力更省命。' },
  田宅: { group: 'family', topic: '家宅、不动产、家庭氛围，以及你的“根”', advice: '房子是结果，家里的气氛才是原因。' },
  福德: { group: 'mind', topic: '精神世界、兴趣、抗压能力、晚年生活', advice: '这宫是你给自己充电的地方，别全用来焦虑。' },
  父母: { group: 'family', topic: '父母缘分、长辈贵人，以及你与权威的关系', advice: '你和权威的关系，往往是和父亲关系的复刻。' },
};

const BRIGHT: Record<string, string> = {
  庙: '这颗星在这里是主场，长处能放得开。',
  旺: '这颗星在这里有力，正常发挥就有七成火候。',
  得: '力量够用，稳着来不会出错。',
  利: '力量偏顺，属于能借上力的位置。',
  平: '不好不坏，全靠后天怎么用。',
  不: '力量偏弱，很多事得靠借力。',
  闲: '力量偏弱，很多事得靠借力。',
  陷: '力量被压着，同一件事你要比别人多花两倍劲。',
};

const SIHUA: Record<string, string> = {
  禄: '化禄在这儿：这一块有现成的机会和资源，接得住就是你的。',
  权: '化权在这儿：这一块你能说了算，但说了算就得担责。',
  科: '化科在这儿：这一块有名声、文书、贵人缘，适合走正规路子。',
  忌: '化忌在这儿：这是你的执念，也是卡点——越用力越容易卡住。',
};

const SHA: Record<string, string> = {
  擎羊: '摩擦和争执多',
  陀罗: '事情容易拖住',
  火星: '来得急，脾气冲',
  铃星: '闷着火，翻脸突然',
  地空: '想法多、落地少',
  地劫: '半路容易被打断',
  天刑: '适合走纪律与专业路线',
};

const JI: Record<string, string> = {
  左辅: '左辅',
  右弼: '右弼',
  文昌: '文昌',
  文曲: '文曲',
  天魁: '天魁',
  天钺: '天钺',
  禄存: '禄存',
  天马: '天马',
};

export interface Interpretation {
  headline: string;
  topic: string;
  paragraphs: string[];
  tags: string[];
}

export function interpretPalace(r: ChartResult, p: PalaceView): Interpretation {
  const meta = PALACE_META[p.name];
  const group: Group = meta?.group ?? 'self';
  const tags: string[] = [];
  const paragraphs: string[] = [];

  const majors = p.major;
  const borrowed = !majors.length
    ? r.chart.palaces.find((q) => q.branch === (p.branch + 6) % 12)
    : undefined;
  const effStars = majors.length ? majors : (borrowed?.major ?? []);
  const brightStar = effStars.find((s) => s.brightness);
  const brightLine = brightStar?.brightness ? (BRIGHT[brightStar.brightness] ?? '') : '';
  if (brightStar?.brightness) tags.push(`${brightStar.name}${brightStar.brightness}`);
  if (p.isBody) tags.push('身宫');
  if (r.decadalIndex === p.index) tags.push(`大限 ${r.decadalRange?.[0]}–${r.decadalRange?.[1]}`);
  if (r.yearlyIndex === p.index) tags.push(`${r.targetYear} 流年`);

  // ── 第一段：主星底色（亮度并进同一段，避免出现孤立短句）──
  if (!majors.length) {
    const bm = borrowed?.major?.[0];
    const bProfile = bm ? STAR_PROFILE[bm.name] : undefined;
    const bLine = bm ? STAR_IN_PALACE[bm.name]?.[p.name] : undefined;
    tags.push('空宫借对宫');
    paragraphs.push(
      `本宫无主星，借对宫「${borrowed?.name ?? '—'}」的${bm?.name ?? '星'}来看：` +
      (bLine ? `${bLine}。` : bProfile ? `${bProfile.domains[group]}。` : '这一块没有主星定调，随环境和你自己的选择走。'),
    );
  } else {
    const top = majors[0];
    const profile = STAR_PROFILE[top.name];
    const inPalace = STAR_IN_PALACE[top.name]?.[p.name];
    const core = profile
      ? `${profile.essence}${inPalace ? `${inPalace}。` : `${profile.domains[group]}。`}`
      : `${meta?.topic ?? ''}这一块由它定调。`;
    paragraphs.push(`${top.name}坐守：${core}${brightLine}`);
  }

  if (majors.length > 1) {
    paragraphs.push(`同宫还有${majors.slice(1).map((s) => s.name).join('、')}，两颗星的性质会互相拉扯，做事常有两种心思在打架。`);
  }

  // ── 第二段：四化（本命 + 大限 + 流年落点）──
  const natalSiHua = [...p.major, ...p.minor].filter((s) => s.siHua);
  for (const s of natalSiHua) {
    paragraphs.push(`${s.name}${SIHUA[s.siHua!] ?? ''}`);
    tags.push(`${s.name}化${s.siHua}`);
  }

  const hereStars = [...p.major, ...p.minor];
  const landed = (mutagen: string[]) =>
    mutagen
      .map((name, i) => ({ name, hua: HUA_ORDER[i] }))
      .filter((x) => hereStars.some((s) => s.name === x.name))
      .map((x) => `化${x.hua}${x.name}（${HUA_EFFECT[x.hua]}）`)
      .join('、');

  const decades = landed(r.decadalMutagen);
  if (decades) {
    const extra = r.decadalIndex === p.index ? '这十年整宫被推到台面上，躲不开。' : '';
    paragraphs.push(`本步大限（${r.decadalRange?.[0]}–${r.decadalRange?.[1]} 岁）：${decades}落在本宫。${extra}`);
  }

  const years = landed(r.yearlyMutagen);
  if (years) {
    const extra = r.yearlyIndex === p.index ? '今年流年命宫就在此，重心明确。' : '';
    paragraphs.push(`${r.targetYear} 年流年：${years}落在本宫。${extra}`);
  }

  // ── 第三段：三方四正格局 ──
  const trinePalaces = [p.branch, (p.branch + 6) % 12, (p.branch + 4) % 12, (p.branch + 8) % 12]
    .map((b) => r.chart.palaces.find((x) => x.branch === b))
    .filter(Boolean) as typeof r.chart.palaces;
  const trineStars = trinePalaces.flatMap((x) => x.major.map((s) => s.name));
  const counts = TRINE_STYLE.map((f) => ({ ...f, n: trineStars.filter((s) => f.stars.includes(s)).length }))
    .sort((a, b) => b.n - a.n);
  const top = counts[0];
  const second = counts[1];
  if (top && top.n > 0) {
    const mixed = second && second.n > 0 && second.n >= top.n - 1 && second.key !== top.key;
    const stem = mixed
      ? `三方四正里「${top.label}」与「${second.label}」两族并见：${top.text}${second.weak}。`
      : `三方四正（${trinePalaces.map((x) => x.name).join('·')}）以「${top.label}」为骨架：${top.text}`;
    const jiStar = trinePalaces
      .flatMap((x) => x.major.map((s) => ({ star: s.name, palace: x.name, hua: s.siHua })))
      .find((x) => x.hua === '忌');
    paragraphs.push(stem + (jiStar ? `${jiStar.palace}的${jiStar.star}化忌在，成色要打折。` : ''));
    tags.push(top.label);
  }

  // ── 第四段：吉煞杂曜 ──
  const sha = p.minor.filter((s) => SHA[s.name]).map((s) => s.name);
  const ji = p.minor.filter((s) => JI[s.name]).map((s) => s.name);

  if (sha.length) {
    const desc = sha.slice(0, 3).map((n) => `${n}：${SHA[n]}`).join('；');
    paragraphs.push(`${desc}。有这些在，事情多半不会完全照你排的走。`);
    tags.push(...sha.slice(0, 2));
  }
  if (ji.length) {
    const say = ji
      .slice(0, 3)
      .map((n) => (n === '天马' ? '天马（动中生财）' : n === '禄存' ? '禄存（稳定进项）' : n === '左辅' || n === '右弼' ? `${n}（有人帮）` : n === '文昌' || n === '文曲' ? `${n}（才华加分）` : `${n}（贵人）`))
      .join('、');
    paragraphs.push(`${say}——这是这张盘在这一块能借到的外力，别浪费。`);
    tags.push(...ji.slice(0, 2));
  }

  // ── 第五段：建议（14 主星 × 12 宫 = 168 条专属）──
  if (meta) {
    const starName = majors[0]?.name ?? '';
    const own = STAR_ADVICE[starName]?.[p.name];
    if (own) {
      paragraphs.push(own);
    } else {
      const list = PALACE_ADVICE[p.name] ?? [meta.advice];
      const starIdx = Math.max(0, STAR_ORDER.indexOf(starName));
      paragraphs.push(list[(p.branch + starIdx) % list.length] ?? meta.advice);
    }
  }

  const uniqTags = [...new Set(tags)];
  return {
    headline: `${p.name}宫 · ${p.stemName}${p.branchName}`,
    topic: meta?.topic ?? '',
    paragraphs,
    tags: uniqTags,
  };
}
