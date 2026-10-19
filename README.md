# Creative Core Park · 王财明个人作品集（v3 · 糖果休闲版）

一根漂浮在云海上的糖果能量塔：塔身是纵向视觉主轴，每一座漂浮岛是一个项目，
Clawd 坐在小云朵上随行。纯静态站点，无后端、无框架、无外部素材 ——
所有几何、纹理、发光、粒子、棋盘都由代码生成。

```
portfolio-v3/
├─ index.html          页面骨架（含 importmap / Lab 章节）
├─ serve.cjs           本地静态服务器（正确的 MIME，ES Module 必需）
├─ start.cmd           双击启动（会留命令行窗口）
├─ 启动网站.vbs        双击启动（后台静默，推荐）
├─ 关闭网站.cmd        结束本地服务
├─ css/style.css       糖果主题：卡片 / 徽章 / 按钮 / Lab 岛 / 响应式
├─ js/
│  ├─ content.js       ★ 唯一需要改的文件：个人信息 + 项目 + Lab 内容
│  ├─ main.js          滚动进度 → 相机 / 面板 / Lab / 高度尺 / 指针 / 棋盘彩蛋
│  ├─ world.js         天空、云、漂浮岛、糖果塔、丝带、宝石、雾、相机路径
│  ├─ clawd.js         程序化 Clawd（圆角盒 + 四条腿 + 眨眼 + 云朵座椅）
│  ├─ emblems.js       项目标本：小幽灵 / 糖果教堂 / 通用宝石
│  └─ materials.js     糖果材质、果冻、圆角柱、程序化云 / 星 / 阴影贴图、天空
└─ assets/three.module.js   three.js r160（本地内置，离线可用）
```

## 本地预览

最省事：双击 **`启动网站.vbs`** —— 后台起服务 + 自动开浏览器，不留黑窗口。
关闭：双击 `关闭网站.cmd`。也可以双击 `start.cmd` 或运行 `node serve.cjs 5173`。

不要直接双击 index.html：ES Module 会被 file:// 拦截。

## 本次改版（相对上一版「Data Strata」）

保留：中间柱子的大致中心构图、纵向视觉焦点、滚动驱动镜头、项目内容、Clawd。
改掉：

- **主塔**：黑曜岩芯 → 糖果能量塔（圆角糖果分段、彩色糖霜环、暖光糖窗、
  浮空丝带、顶冠水晶、塔底水滴与灯笼），低多边形 + 平面着色，玩具感而非赛博风
- **世界**：纯黑虚空 → 天空渐变 + 云海 + 6 座漂浮岛 + 环绕宝石 + 星屑 + 泡泡
- **标本**：裂隙巫妖 / 哥特教堂 → 小幽灵王 / 彩虹糖果教堂，站在漂浮岛上
- **新增 Casual Game Lab 章节**（0.615–0.80 进度）：漂浮岛 + 5×5 三消棋盘（可点）、
  两张真实案例卡（《心动小镇》系统拆解、90 秒关卡节奏笔记）、Demo 入口
- **DOM**：深色科技面板 → 奶油色关卡卡（大圆角、柔和阴影、道具徽章、糖果渐变按钮）
- **配色**：`#FFF7ED / #BFE7FF / #B8F2D6 / #FFB36B / #FF8FA3 / #C9B6FF`
- **无新增依赖**：全部沿用 three.js r160 + 原生 JS / CSS，`package.json` 都不需要

## 加一个项目

打开 `js/content.js`，在 `window.PROJECTS` 末尾追加对象即可（自动多出一座漂浮岛、
一张项目卡、一个高度刻度、一个相机停留点）：

```js
{
  id: 'my-project',
  index: '03',
  title: '项目名',
  subtitle: '一句话定位',
  line: '一句设计洞察（≤ 24 字最好）',
  role: '你的角色',
  year: '2027.03',
  tags: ['标签 1', '标签 2'],
  link: 'https://...',
  linkLabel: '在线试玩',
  accent: '#C9B6FF',     // 这一座岛的强调色
  emblem: 'core'         // 'lich' 小幽灵 | 'cathedral' 糖果教堂 | 'core' 宝石
}
```

## 改 Lab 章节

同样在 `js/content.js` 的 `window.LAB` 里：`title / intro / tags / cases / cta`。
每张 case 支持 `kind / title / desc / tags / href / linkLabel`，没有 `href` 就只展示文字。
棋盘格是装饰彩蛋（`js/main.js` 的 `mountBoard()`），25 个糖果格，点击会爆星光。

## 已实现 / 体验细节

- 滚动驱动相机：空中 → 项目岛 → 休闲乐园 → 塔底灯笼，连续空间运动
- 糖果塔：10 段可变半径低模圆柱 + 彩色糖霜环 + 糖粒 + 暖光窗 + 双螺旋丝带 + 浮环
- 每座项目岛：岛体/草地/树/蘑菇/旗 + 标本 + 柔影 + 轨道环 + 点光
- Clawd：坐在云上随行，眨眼、看指针、切章跳跃，结尾靠近灯笼
- 高度尺、LAB 刻度、项目卡片切换强调色
- 无障碍：跳到文字版、语义标签、键盘可达、`prefers-reduced-motion` 降级
- 移动端：≤900px 单列 Lab / 卡片 JS 锁宽；≤820px 隐藏 Lab 3D 岛、简化卡片；
  ≤480px 隐藏高度尺；DPR 上限 1.5，粒子/分段数减半

## 下一步可做

- **音效**：CC0 素材（freesound / Pixabay），默认静音 + 开关；目前未接入
- **真机性能**：桌面已在 1440×900 用无头 Chrome 验证；手机建议真机看一次帧率
- **OG 图**：截一张塔顶图放 `assets/og.png`，补 `og:image` 即可
- **项目详情层**：目前点卡片直接外链；需要站内详情可在面板加 `data-detail` 分支

## 部署

纯静态：整目录丢 GitHub Pages / Vercel / Netlify，相对路径，子目录也能跑。
