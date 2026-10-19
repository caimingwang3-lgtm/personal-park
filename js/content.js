/* ============================================================
 *  内容配置 —— 整个网站唯一需要改的文件
 *  ------------------------------------------------------------
 *  加一个项目：复制一个 { ... } 块，粘到 PROJECTS 数组里，改内容。
 *  网站会自动多出一座漂浮岛、一个项目面板、一个高度刻度。
 *  category 用来分组：休闲游戏 排在 肉鸽游戏 之前。
 *  emblem 可选：'lich'（小幽灵）| 'cathedral'（糖果教堂）|
 *              'peach'（黄桃）| 'cabinet'（标本馆）| 'core'（通用宝石）
 *  accent 是这一座的强调色，会同时作用于 3D 与 DOM。
 * ============================================================ */

window.SITE = {
  name: 'WCM',
  role: 'DATA ANALYST × LEVEL DESIGNER',
  line: '用数据找规律，用关卡造体验。',
  email: '2093722186@qq.com',
  github: 'https://github.com/caimingwang3-lgtm',
  year: '2026—2027'
};

window.PROJECTS = [
  {
    id: 'cathedral-sprint',
    index: '01',
    category: '休闲游戏',
    title: '月下疾走',
    subtitle: 'Cathedral Sprint · 哥特屋顶跑酷',
    line: '在屋脊之间，用障碍池控制跑酷的呼吸。',
    role: '关卡节奏 / 障碍池 / 四段式难度',
    year: '2026.10',
    tags: ['跑酷', '关卡节奏', 'PWA'],
    link: 'https://caimingwang3-lgtm.github.io/game-demo-portfolio/cathedral-sprint/',
    linkLabel: '在线试玩',
    accent: '#FFB36B',
    emblem: 'cathedral'
  },
  {
    id: 'peach-run',
    index: '02',
    category: '休闲游戏',
    title: '黄桃快跑',
    subtitle: 'Peach Run · 3D 跑酷原型',
    line: '把速度感交给镜头，把节奏交给障碍。',
    role: '关卡 / 手感 / 障碍编排',
    year: '2026.10',
    tags: ['跑酷', '手感', '原型'],
    link: 'https://caimingwang3-lgtm.github.io/personal-park/games/peach/',
    linkLabel: '在线试玩',
    accent: '#FF8FA3',
    emblem: 'peach'
  },
  {
    id: 'cabinet-of-curiosities',
    index: '03',
    category: '休闲游戏',
    title: '异想标本馆',
    subtitle: 'Cabinet of Curiosities · 三消收集',
    line: '把「收集标本」做成三消的长期目标。',
    role: '玩法 / 关卡 / 视觉方向',
    year: '2026.10',
    tags: ['三消', '收集', '关卡'],
    link: 'https://caimingwang3-lgtm.github.io/personal-park/games/cabinet/',
    linkLabel: '在线试玩',
    accent: '#C9B6FF',
    emblem: 'cabinet'
  },
  {
    id: 'ghost-canyon',
    index: '04',
    category: '肉鸽游戏',
    title: '幽影峡谷',
    subtitle: '裂隙巫妖 · 横版 Boss 战原型',
    line: '用招式密度，而不是数值膨胀制造压力。',
    role: '玩法 / 关卡 / 数值 / Boss 状态机',
    year: '2026.10',
    tags: ['Boss 战', '状态机', '配表'],
    link: 'https://caimingwang3-lgtm.github.io/game-demo-portfolio/',
    linkLabel: '在线试玩',
    accent: '#C9B6FF',
    emblem: 'lich'
  }
];

/* ============================================================
 *  Casual Game Lab · 漂浮岛上的休闲游戏板块
 *  这里只放真实经历：系统拆解、方法笔记
 * ============================================================ */
window.LAB = {
  eyebrow: 'CASUAL GAME LAB / 05',
  title: '休闲游戏实验场',
  intro: '把「轻松」拆成可执行的系统：目标、反馈、节奏。',
  tags: ['玩法理解', '关卡节奏', 'UX 观察'],
  cases: [
    {
      kind: '系统拆解',
      title: '《心动小镇》生活模拟拆解与改案',
      desc: '「无摩擦」在中期会变成「无目标」。把展馆做成公共展示出口，让体力、图鉴与装扮重新咬合，且只换外观不卖数值。',
      tags: ['体力资源', '社交循环', '改案'],
      href: '',
      linkLabel: ''
    },
    {
      kind: '方法笔记',
      title: '轻量玩法的 90 秒节奏',
      desc: '把一段关卡拆成「教 — 练 — 考」：每段只引入一个新规则，让第一次失败发生在理解之后，而不是之前。',
      tags: ['关卡节奏', '教学', '反馈'],
      href: '',
      linkLabel: ''
    }
  ]
};
