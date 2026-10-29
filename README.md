# 紫微斗数 · 在线排盘

纯前端紫微斗数排盘工具。打开就能用，所有计算在浏览器里完成，**没有后端、没有数据库、不上传任何出生信息**。
构建产物是静态文件，可以扔到 GitHub Pages / Cloudflare Pages / 任意静态托管上。

```
北斗七星开场 → 输入生日 → iztro 在浏览器算盘 → 画十二宫 → 点宫位看解读
```

![开场](./preview-intro.png)

## 功能

- **北斗七星开场动画**：七星依次点亮、斗柄连线绘制、标题淡入，3.6 秒结束；可跳过、每标签页只播一次、跟随系统「减弱动效」
- **动态星空背景**：Canvas 星点呼吸 + CSS 星云漂移 + SVG 二十八宿环，三层空间，移动端自动降粒子数
- **十二宫命盘**：传统 4×4 环形布局，主星带庙旺平陷、四化，辅星与杂曜分色显示
- **逐宫解读**：点任意宫位，生成该宫的解读（宫位主题 → 主星底色 → 亮度 → 四化 → 大限/流年 → 吉煞 → 行动建议），规则引擎本地合成，**不调用任何 AI**，同一输入恒得同一段文字
- **大限 / 流年**：切换年份高亮当前大限宫（金框）与流年宫（虚框），中宫同步显示两套四化
- **声音系统**：9 类音效全部用 Web Audio 实时合成（无音频文件），默认关闭，设置里开关 + 音量，偏好存在 localStorage
- **设置面板**：声音、音量、动效强度（跟随系统 / 减弱 / 关闭）、重播开场
- **可分享**：出生信息编码进 URL hash，刷新不丢、复制链接即可发给别人
- **移动端**：十二宫改两列紧凑宫格（命宫置顶、空宫显示「借对宫」），点宫位从底部抽屉弹解读，不用滚到页面底部；表单两列排布
- **离线可用**：无外部请求（系统字体、无 CDN、无统计脚本）

## 声音说明

所有点击音都是同一套「玲珑破碎」合成：**4 层非谐泛音 + 8kHz 碎屑噪声 + 55ms 后落下的回响碎片**，
每次基频有 ±1.5% 随机微扰，连续点击不会像机器复读。

| 场景 | 音色 |
|---|---|
| 宫位 / 普通按钮 | 2280Hz 起，4 泛音 + 碎屑 + 回响碎片，约 260ms |
| 悬停（仅主按钮） | 3720Hz 单泛音 30ms，240ms 内不重复 |
| 确认（时辰 / 性别 / 复制） | 2016Hz + 2688Hz 两片碎晶，间隔 75ms |
| 开始排盘 | 196→92Hz 低频下沉 + 噪声，收尾落一片碎晶 |
| 排盘完成 | 玉石钟鸣（1046 / 1568 / 2093Hz）+ 两片碎晶叠加 |
| 错误 | 220→150Hz 钝响，刻意去掉高频，不刺耳 |
| 打开 / 关闭面板 | 噪声扫频 + 一片碎晶（关闭时音高下坠 4%） |
| 导航跳转 | 1760Hz 单片碎晶 |

页头有「♪ 开启声音」按钮（打开后常驻高亮），设置里也能开关和调音量，偏好存 localStorage。
只有用户点开后才创建 `AudioContext`，符合浏览器自动播放策略。

## 本地运行

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 产物在 dist/
pnpm preview    # 预览构建结果

# 想让同一个 WiFi 下的手机/别人打开：
node serve.cjs 5199
# 会打印 http://<你的局域网IP>:5199
```

`pnpm` 换成 `npm` 也行。

## 临时公网地址（不想注册账号时）

双击 `start.cmd`：先起本地服务，再用 `cloudflared` 建一条 Quick Tunnel，终端里会打印一个
`https://xxxx.trycloudflare.com` 的公网地址，发给任何人都能打开（HTTPS）。

```
本机/局域网 → node serve.cjs 5199
公网        → .deploy\cloudflared.exe tunnel --url http://127.0.0.1:5199
```

注意：Quick Tunnel **不需要 Cloudflare 账号，也没有可用性保证**，进程一停地址就失效，
每次重启都会换一个新域名。长期使用请看下面的 GitHub Pages。

## 部署

### 方案一：GitHub Pages（仓库已带 Actions）

1. 推到 GitHub：

   ```bash
   git init
   git add .
   git commit -m "紫微斗数在线排盘"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/ziwei-chart.git
   git push -u origin main
   ```

2. 仓库 **Settings → Pages → Source** 选 **GitHub Actions**。

3. 推完 Actions 自动跑，几分钟后地址是：

   ```
   https://<你的用户名>.github.io/ziwei-chart/
   ```

因为 `vite.config.ts` 里用的是 `base: './'`（相对路径），**不需要**改仓库名相关的配置，根域名和子路径都能跑。

### 方案二：Cloudflare Pages（国内访问更稳）

- 连仓库，构建命令 `pnpm build`，输出目录 `dist`，Node 版本 22
- 或直接把 `dist/` 拖进 Cloudflare Pages 的上传页
- 域名形如 `https://ziwei-chart.pages.dev`

### 方案三：任意静态托管

`pnpm build` 之后把 `dist/` 整个传上去即可，不需要 Node 运行时。
本地想快速看一眼构建结果：`node serve.cjs`（自带的小静态服务器，默认 5199 端口）。

## 目录

```
src/
├── lib/ziwei.ts          # iztro 封装：排盘、大限流年、URL 状态
├── lib/interpret.ts      # 解读规则引擎：14 主星 × 6 类宫位 + 亮度/四化/吉煞模板
├── components/
│   └── ChartBoard.tsx    # 十二宫盘面 + 中宫 + 宫位格子
├── App.tsx               # 表单、工具条、宫位详情（含解读）、图例
├── styles.css            # 全部样式（无 UI 框架）
└── main.tsx
vite.config.ts            # base: './'
.github/workflows/deploy.yml
```

## 关于排盘口径

排盘内核是 [iztro](https://github.com/SylarLong/iztro)（MIT），使用其**默认流派**：

- 年界按**正月初一**换年（主流排盘软件口径），不是立春
- 星曜亮度用 iztro 内置表，未做《全书》逐星校订
- 闰月按 iztro 默认的月中分界
- **不做真太阳时校正**（没有出生地经度输入），时区按北京时间

如果需要校订过的口径（倪海厦体系、四派亮度切换、真太阳时），得换成更重的引擎；这套是"够用、能跑、可部署"的版本。

## 免责

命理属传统文化研究，页面内容仅作参考，不构成医疗、法律、投资等任何决策建议。
