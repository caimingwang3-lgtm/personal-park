/* ============================================================
 *  入口：内容 → DOM → 滚动 → 3D
 * ============================================================ */
import { World } from './world.js';

const SITE = window.SITE || {};
const PROJECTS = window.PROJECTS || [];
const LAB = window.LAB || {};
const CANDY_TILES = ['#FF8FA3', '#FFB36B', '#BFE7FF', '#B8F2D6', '#C9B6FF'];

const $ = (sel, root = document) => root.querySelector(sel);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const $track = $('#track');
const $loader = $('#loader');
const $canvas = $('#stage');
const $hero = $('#hero');
const $cue = $('#scroll-cue');
const $panels = $('#panels');
const $outro = $('#outro');
const $lab = $('#lab');
const $mark = $('#depth-mark');
const $ticks = $('#depth-ticks');
const $value = $('#depth-value');
const $glow = $('.cursor-glow');

let world = null;
let panels = [];
let targetP = 0;
let currentP = 0;
let lastActive = -2;
let lastHero = null;
let lastLab = null;
let lastOutro = null;
let stillP = null;   // ?still=0.33 —— 调试：不滚动，直接把进度钉在某一章

/* ---------------- 内容注入 ---------------- */
function mountContent() {
  $('#hero-role').innerHTML = esc(SITE.role || '').replace('×', '<i>×</i>');
  $('#hero-line').textContent = SITE.line || '';
  $('#year-range').textContent = SITE.year || '';
  document.title = `${SITE.name || 'WCM'} — 创意能量塔 · 作品集`;

  const mail = $('#nav-mail'), git = $('#nav-git');
  mail.href = 'mailto:' + (SITE.email || '');
  git.href = SITE.github || '#';

  $('#outro-mail').href = 'mailto:' + (SITE.email || '');
  $('#outro-mail').textContent = SITE.email || '';
  $('#outro-git').href = SITE.github || '#';

  $('#plain-role').textContent = `${SITE.role || ''}｜${SITE.line || ''}`;
  $('#plain-mail').href = 'mailto:' + (SITE.email || '');
  $('#plain-mail').textContent = SITE.email || '';

  const plainList = $('#plain-list');
  PROJECTS.forEach((p) => {
    const li = document.createElement('li');
    li.innerHTML = `<h3>${esc(p.category)}｜${esc(p.title)} — ${esc(p.subtitle)}</h3>
      <p>${esc(p.line)}</p>
      <p>${esc(p.role)}｜${esc(p.year)}</p>
      <p>${p.link ? `<a href="${esc(p.link)}" rel="noopener">${esc(p.linkLabel || '查看')}</a>` : esc(p.linkLabel || 'Demo 制作中')}</p>`;
    plainList.appendChild(li);
  });
  if (LAB.cases) {
    LAB.cases.forEach((c) => {
      const li = document.createElement('li');
      li.innerHTML = `<h3>${esc(c.title)}</h3><p>${esc(c.desc)}</p>`;
      plainList.appendChild(li);
    });
  }

  // 项目卡片（漂浮关卡卡）
  PROJECTS.forEach((p, i) => {
    const el = document.createElement('article');
    el.className = 'panel';
    el.id = 'project-' + i;
    el.style.setProperty('--accent', p.accent || '#C9B6FF');
    el.innerHTML = `
      <div class="panel-head">
        <span class="panel-index">${esc(p.index || String(i + 1).padStart(2, '0'))}</span>
        <span class="panel-rule"></span>
        <span class="panel-year">${esc(p.year || '')}</span>
      </div>
      <p class="panel-cat">${esc(p.category || '')}</p>
      <h2 class="panel-title">${esc(p.title)}</h2>
      <p class="panel-sub">${esc(p.subtitle)}</p>
      <p class="panel-line">${esc(p.line)}</p>
      <div class="panel-meta">
        <span class="meta-role">${esc(p.role)}</span>
        ${(p.tags || []).map((tag) => `<span class="badge">${esc(tag)}</span>`).join('')}
      </div>
      ${p.link
        ? `<a class="btn btn-primary panel-link" href="${esc(p.link)}" target="_blank" rel="noopener">
             ${esc(p.linkLabel || '查看项目')} <span class="arr">↗</span>
           </a>`
        : `<span class="btn btn-primary panel-link is-disabled">${esc(p.linkLabel || 'Demo 制作中')}</span>`}`;
    $panels.appendChild(el);
    panels.push(el);
  });

  // 深度尺刻度
  PROJECTS.forEach((p, i) => {
    const tick = document.createElement('span');
    tick.className = 'tick';
    tick.style.top = '0%';
    tick.dataset.i = String(i);
    tick.innerHTML = `<span>${esc(p.index || String(i + 1).padStart(2, '0'))}</span>`;
    $ticks.appendChild(tick);
  });
  const labTick = document.createElement('span');
  labTick.className = 'tick tick-lab';
  labTick.innerHTML = '<span>LAB</span>';
  $ticks.appendChild(labTick);

  mountLab();
  mountBoard();
}

/* ---------------- Casual Game Lab ---------------- */
function mountLab() {
  if (!LAB.title) return;
  $('#lab-eyebrow').textContent = LAB.eyebrow || 'CASUAL GAME LAB';
  $('#lab-title').textContent = LAB.title;
  $('#lab-intro').textContent = LAB.intro || '';

  const tags = $('#lab-tags');
  (LAB.tags || []).forEach((t, i) => {
    const s = document.createElement('span');
    s.className = 'chip ' + ['chip-lilac', 'chip-mint', 'chip-coral'][i % 3];
    s.textContent = t;
    tags.appendChild(s);
  });

  const cases = $('#lab-cases');
  (LAB.cases || []).forEach((c) => {
    const art = document.createElement('article');
    art.className = 'lab-case';
    art.innerHTML = `
      <span class="case-kind">${esc(c.kind)}</span>
      <h3>${esc(c.title)}</h3>
      <p>${esc(c.desc)}</p>
      <div class="case-foot">
        ${(c.tags || []).map((t) => `<span class="badge badge-soft">${esc(t)}</span>`).join('')}
        ${c.href ? `<a class="case-link" href="${esc(c.href)}" target="_blank" rel="noopener">${esc(c.linkLabel || '查看')} ↗</a>` : ''}
      </div>`;
    cases.appendChild(art);
  });
}

/* ---------------- 三消小棋盘（可点的装饰彩蛋） ---------------- */
function mountBoard() {
  const board = $('#lab-board');
  if (!board) return;
  const colors = [CANDY_TILES[0], CANDY_TILES[1], CANDY_TILES[2], CANDY_TILES[3], CANDY_TILES[4]];
  const seed = [2, 0, 3, 1, 4, 1, 4, 2, 0, 3, 3, 1, 0, 4, 2, 4, 2, 3, 1, 0, 0, 3, 1, 2, 4];
  for (let i = 0; i < 25; i++) {
    const tile = document.createElement('button');
    tile.className = 'candy-t' + (i % 7 === 0 ? ' is-round' : '');
    tile.type = 'button';
    tile.tabIndex = -1;
    tile.style.setProperty('--c', colors[seed[i]]);
    tile.setAttribute('aria-hidden', 'true');
    board.appendChild(tile);
  }

  board.addEventListener('click', (e) => {
    const tile = e.target.closest('.candy-t');
    if (!tile) return;
    tile.classList.remove('pop');
    // 强制回流，重新播放动画
    void tile.offsetWidth;
    tile.classList.add('pop');
    setTimeout(() => tile.classList.remove('pop'), 520);
    spawnSparkle(tile);
  });
}

function spawnSparkle(tile) {
  const spark = document.createElement('span');
  spark.className = 'tile-spark';
  spark.textContent = '✦';
  tile.appendChild(spark);
  setTimeout(() => spark.remove(), 700);
}

/* ---------------- 布局 ---------------- */
function layout() {
  const vh = window.innerHeight;
  const screens = PROJECTS.length * 1.9 + 3.3;
  $track.style.height = Math.round(vh * screens) + 'px';
  if (world) {
    world.resize(window.innerWidth, vh);
    const ticks = $ticks.children;
    PROJECTS.forEach((p, i) => {
      const center = world.layersStart + world.span * (i + 0.5);
      if (ticks[i]) ticks[i].style.top = (center * 100) + '%';
    });
    const labTick = ticks[PROJECTS.length];
    if (labTick) labTick.style.top = (((world.labStart + world.labEnd) / 2) * 100) + '%';
  }

  // 小屏：用 JS 锁死浮层宽度，避免任何网格/长文案把卡片撑出视口
  if (window.innerWidth <= 900) {
    const w = Math.max(240, window.innerWidth - 32);
    panels.forEach((el) => { el.style.width = w + 'px'; el.style.left = '16px'; el.style.right = 'auto'; });
    const lc = $('.lab-copy');
    if (lc) lc.style.width = Math.max(240, window.innerWidth - 36) + 'px';
  } else {
    panels.forEach((el) => { el.style.width = ''; el.style.left = ''; el.style.right = ''; });
    const lc = $('.lab-copy');
    if (lc) lc.style.width = '';
  }

  readScroll(true);
}

function readScroll(force) {
  if (stillP != null) {
    targetP = stillP;
    if (force) currentP = stillP;
    return;
  }
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  targetP = clamp(window.scrollY / max, 0, 1);
  if (force) currentP = targetP;
}

/* ---------------- UI ---------------- */
function setActiveTheme(accent) {
  if (!accent) return;
  document.documentElement.style.setProperty('--accent', accent);
}

function updateUI(p) {
  const active = world ? world.getActiveIndex(p) : -1;

  const heroOn = p < (world ? world.layersStart : 0.12) - 0.015;
  if (heroOn !== lastHero) {
    lastHero = heroOn;
    $hero.classList.toggle('is-hidden', !heroOn);
  }

  if (active !== lastActive) {
    lastActive = active;
    panels.forEach((el, i) => el.classList.toggle('on', i === active));
    if (active >= 0 && PROJECTS[active]) {
      setActiveTheme(PROJECTS[active].accent);
      if (world.clawd) world.clawd.hopOnce();
    }
  }

  const labOn = world && p >= world.labStart - 0.005 && p <= world.labEnd + 0.005;
  if (labOn !== lastLab) {
    lastLab = labOn;
    $lab.classList.toggle('on', !!labOn);
    if (labOn) setActiveTheme('#FFB36B');
  }

  const outroOn = p > (world ? world.labEnd : 0.8) + 0.01;
  if (outroOn !== lastOutro) {
    lastOutro = outroOn;
    $outro.classList.toggle('on', outroOn);
  }

  $mark.style.top = (p * 100).toFixed(2) + '%';
  $value.textContent = String(Math.round(p * 999)).padStart(3, '0');
}

/* ---------------- 指针 ---------------- */
function bindPointer() {
  const set = (x, y) => {
    const nx = (x / window.innerWidth) * 2 - 1;
    const ny = (y / window.innerHeight) * 2 - 1;
    if (world) world.setPointer(nx, ny);
    if ($glow) $glow.style.transform = `translate3d(${x}px,${y}px,0)`;
    document.body.classList.add('has-pointer');
  };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    set(e.clientX, e.clientY);
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') set(e.clientX, e.clientY);
  }, { passive: true });
  window.addEventListener('pointerleave', () => {
    if (world) world.setPointer(0, 0);
    document.body.classList.remove('has-pointer');
  });
}

/* ---------------- 启动 ---------------- */
function start() {
  mountContent();
  try {
    world = new World($canvas, PROJECTS);
  } catch (err) {
    showFatal(err);
    return;
  }

  layout();
  bindPointer();

  history.scrollRestoration = 'manual';
  const qp = window.__DSH_PARAMS;
  if (qp && qp.has('still')) {
    stillP = clamp(parseFloat(qp.get('still')) || 0, 0, 1);
    targetP = currentP = stillP;
    window.scrollTo(0, 0);
  } else if (qp && qp.has('p')) {
    const p = clamp(parseFloat(qp.get('p')) || 0, 0, 1);
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, p * max);
    targetP = currentP = p;
  } else if (!location.hash) {
    window.scrollTo(0, 0);
  }

  window.addEventListener('scroll', () => readScroll(false), { passive: true });
  window.addEventListener('resize', layout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);

  $cue.addEventListener('click', (e) => {
    e.preventDefault();
    const p = world.layersStart + world.span * 0.5;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: p * max, behavior: 'smooth' });
  });
  $cue.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      $cue.click();
    }
  });

  let last = performance.now();
  let running = true;

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    last = performance.now();
  });

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!running) return;

    const ease = world.reduced ? 1 : Math.min(1, dt * 7);
    currentP += (targetP - currentP) * ease;
    if (Math.abs(targetP - currentP) < 0.00015) currentP = targetP;

    world.update(currentP, dt);
    updateUI(currentP);
  }
  requestAnimationFrame(frame);

  // 首帧完成后收起加载层
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      $loader.classList.add('done');
      setTimeout(() => { if ($loader && $loader.parentNode) $loader.parentNode.removeChild($loader); }, 1400);
      if (qp && qp.has('p') && !qp.has('still')) {
        const p = clamp(parseFloat(qp.get('p')) || 0, 0, 1);
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        window.scrollTo(0, p * max);
        currentP = targetP = p;
      }
    });
  });
}

function showFatal(err) {
  const el = document.getElementById('errlog');
  if (el) {
    el.hidden = false;
    el.textContent = 'WebGL 场景启动失败：' + (err && err.message ? err.message : err);
  }
  document.body.classList.add('no-webgl');
}

start();
