/* ============================================================
 *  Creative Core · 漂浮休闲乐园
 *  一根糖果能量塔立在云海上；每一层是一位项目岛民的家
 * ============================================================ */
import * as THREE from 'three';
import { Clawd } from './clawd.js';
import {
  CANDY, candy, jelly, skyMaterial, cloudTexture, starTexture, softShadowTexture,
  roundedCylinder, makeIsland, glowSprite, glowTexture, dotTexture, additive, makeRng
} from './materials.js';
import { createEmblem } from './emblems.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (t) => t * t * (3 - 2 * t);
const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt));

export class World {
  constructor(canvas, projects) {
    this.canvas = canvas;
    this.projects = projects;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mobile = matchMedia('(max-width: 820px)').matches;
    this.pr = Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2);
    this.clock = 0;

    /* ---------- 章节进度 ---------- */
    this.heroEnd = 0.10;
    this.layersStart = 0.12;
    this.layersEnd = 0.60;
    this.labStart = 0.615;
    this.labEnd = 0.80;
    this.contactStart = 0.82;

    /* ---------- 布局 ---------- */
    this.spacing = 22;
    this.y0 = 6;
    this.layers = projects.map((p, i) => ({
      y: this.y0 - i * this.spacing,
      project: p,
      accent: new THREE.Color(p.accent || '#C9B6FF'),
      energy: 0
    }));
    const lastY = this.y0 - (projects.length - 1) * this.spacing;
    this.contactY = lastY - 20;
    this.topY = 56;
    this.bottomY = this.contactY - 16;
    this.span = (this.layersEnd - this.layersStart) / Math.max(1, projects.length);

    /* ---------- 渲染器 ---------- */
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: !this.mobile, alpha: false, powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(this.pr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.98;
    this.renderer.setClearColor(0xDFF2FF, 1);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xE9F6FF, 0.0036);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
    this.camera.position.set(-26, 78, 43);
    this.camera.lookAt(-5, 54, 4);

    this.pointer = new THREE.Vector2(0, 0);
    this.pointerSmooth = new THREE.Vector2(0, 0);
    this.activeIndex = -1;
    this.lastActive = -2;
    this.clawdPos = new THREE.Vector3();
    this.clawdTarget = new THREE.Vector3();
    this.clawdReady = false;
    this.tmpV = new THREE.Vector3();
    this.tmpV2 = new THREE.Vector3();

    this.build();
  }

  /* ================= 构建场景 ================= */
  build() {
    const scene = this.scene;
    const rng = makeRng(20261018);
    this.rng = rng;

    /* ---- 天空 ---- */
    const sky = new THREE.Mesh(new THREE.SphereGeometry(240, 40, 28), skyMaterial());
    sky.frustumCulled = false;
    sky.renderOrder = -10;
    scene.add(sky);

    const sunDir = new THREE.Vector3(0.55, 0.72, 0.42).normalize();
    const sun = glowSprite(0xFFF3CE, 95, 0.5);
    sun.position.copy(sunDir.clone().multiplyScalar(150));
    scene.add(sun);
    const sunHalo = glowSprite(0xFFF7E0, 220, 0.16);
    sunHalo.position.copy(sun.position);
    scene.add(sunHalo);

    /* ---- 光 ---- */
    scene.add(new THREE.HemisphereLight(0xEAF6FF, 0xFFDDBB, 0.85));
    const key = new THREE.DirectionalLight(0xFFF3E2, 2.0);
    key.position.set(18, 42, 26);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xBFE7FF, 0.85);
    fill.position.set(-24, 10, -20);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xFFD9DE, 0.5);
    rim.position.set(0, -20, 30);
    scene.add(rim);

    /* ---- 世界 ---- */
    this.buildTower();
    this.buildLayerIslands();
    this.buildIslands();
    this.buildClouds();
    this.buildGems();
    this.buildSparkles();
    this.buildBubbles();
    this.buildBottom();

    /* ---- Clawd ---- */
    this.clawd = new Clawd();
    this.scene.add(this.clawd.group);
    this.clawdPos.set(6.5, this.topY + 1.8, 6.2);
    this.clawd.setPosition(this.clawdPos);

    /* ---- 相机关键帧 ---- */
    this.keys = this.buildCameraKeys();
  }

  /* ---------------- 糖果能量塔 ---------------- */
  buildTower() {
    const rng = this.rng;
    this.tower = new THREE.Group();
    this.scene.add(this.tower);

    const colors = [0xFFD9A8, 0x8FCBFF, 0x7FE0AE, 0xB49BFF, 0xFFB783];
    const segH = 11.4;
    let y = this.topY;
    let i = 0;

    while (y > this.bottomY + 0.5) {
      const h = Math.min(segH, y - this.bottomY);
      const radius = Math.max(5.4, 6.55 - i * 0.1 + Math.sin(i * 1.9) * 0.3);
      const color = colors[i % colors.length];

      const seg = new THREE.Mesh(
        roundedCylinder(radius, h - 0.55, 1.0, this.mobile ? 10 : 14),
        candy(color, { roughness: 0.72, metalness: 0, clearcoat: 0, flatShading: true })
      );
      seg.position.y = y - h / 2;
      this.tower.add(seg);

      // 彩色糖霜细环
      const stripe = new THREE.Mesh(
        new THREE.TorusGeometry(radius + 0.04, 0.1, 6, this.mobile ? 24 : 40),
        candy(i % 2 ? CANDY.coral : CANDY.orange, { roughness: 0.6 })
      );
      stripe.rotation.x = Math.PI / 2;
      stripe.position.y = y - h * 0.55;
      this.tower.add(stripe);

      // 段与段之间的糖霜带
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(radius + 0.02, 0.07, 6, this.mobile ? 32 : 56),
        candy(0xFFFDF7, { roughness: 0.6 })
      );
      band.rotation.x = Math.PI / 2;
      band.position.y = y - h + 0.1;
      this.tower.add(band);

      // 塔身圆点糖粒
      const dots = this.mobile ? 3 : 6;
      for (let d = 0; d < dots; d++) {
        const a = rng() * Math.PI * 2;
        const dy = (rng() - 0.5) * (h * 0.55);
        const rr = radius * 0.98;
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.18 + rng() * 0.16, 10, 8),
          candy(rng() > 0.7 ? (i % 2 ? CANDY.mint : CANDY.blue) : 0xFFFFFF, { roughness: 0.5 })
        );
        dot.position.set(Math.cos(a) * rr, y - h / 2 + dy, Math.sin(a) * rr);
        dot.scale.y = 0.62;
        this.tower.add(dot);
      }

      // 塔身糖果窗：嵌在塔面上的暖光糖球
      if (!this.mobile || i % 2 === 0) {
        const winMat = candy(0xFFF3D2, { roughness: 0.3, emissive: 0xFFD98A, emissiveIntensity: 0.5 });
        for (let w = 0; w < 3; w++) {
          const a = (w / 3) * Math.PI * 2 + i * 0.8;
          const win = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), winMat);
          win.position.set(
            Math.cos(a) * (radius * 0.97),
            y - h / 2 + (rng() - 0.5) * h * 0.2,
            Math.sin(a) * (radius * 0.97)
          );
          win.scale.set(1, 1.2, 0.5);
          this.tower.add(win);
        }
      }

      // 偶尔挂一面小旗
      if (i % 2 === 1) {
        const a = rng() * Math.PI * 2;
        this.tower.add(this.makeFlag(radius + 0.05, y - h * 0.45, a, rng() > 0.5 ? CANDY.coral : CANDY.orange));
      }

      y -= h;
      i++;
    }

    /* ---- 塔顶：能量水晶 + 光环 ---- */
    const topRing = new THREE.Mesh(
      new THREE.TorusGeometry(6.5, 0.22, 10, 64),
      candy(CANDY.orange, { roughness: 0.3 })
    );
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = this.topY + 0.2;
    this.tower.add(topRing);

    this.crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.9, 0),
      candy(0xFFE9A8, { roughness: 0.08, metalness: 0.15, clearcoatRoughness: 0.05 })
    );
    this.crystal.position.set(0, this.topY + 4.2, 0);
    this.crystal.scale.y = 1.35;
    this.tower.add(this.crystal);

    const crystalGlow = glowSprite(0xFFE7A8, 16, 0.45);
    crystalGlow.position.copy(this.crystal.position);
    this.tower.add(crystalGlow);
    this.crystalGlow = crystalGlow;

    const crown = new THREE.Mesh(
      new THREE.TorusGeometry(2.9, 0.09, 8, 48),
      candy(CANDY.coral, { roughness: 0.35, transparent: true, opacity: 0.85 })
    );
    crown.rotation.x = Math.PI / 2 + 0.5;
    crown.position.copy(this.crystal.position);
    this.tower.add(crown);
    this.crown = crown;

    /* ---- 塔身能量丝带 ---- */
    this.ribbons = [];
    for (let r = 0; r < 2; r++) {
      const pts = [];
      const turns = 3.1;
      const steps = 260;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const a = t * Math.PI * 2 * turns + r * Math.PI;
        const yy = this.topY - 3 - t * (this.topY - this.bottomY - 4);
        const rad = 6.75 + Math.sin(t * 9 + r) * 0.18;
        pts.push(new THREE.Vector3(Math.cos(a) * rad, yy, Math.sin(a) * rad));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, this.mobile ? 160 : 260, 0.07, 6, false),
        jelly(r === 0 ? CANDY.coral : CANDY.lilac, 0.68)
      );
      tube.renderOrder = 2;
      this.tower.add(tube);
      this.ribbons.push(tube);
    }

    /* ---- 塔身浮环 ---- */
    this.floatRings = [];
    const ringSpecs = [
      { y: this.topY + 7, r: 5.2, c: CANDY.blue, tilt: 0.42 },
      { y: this.bottomY + 8, r: 7.8, c: CANDY.lilac, tilt: 0.35 }
    ];
    ringSpecs.forEach((rs) => {
      const group = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(rs.r, 0.16, 8, 64),
        candy(rs.c, { roughness: 0.3, transparent: true, opacity: 0.9 })
      );
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      const beads = this.mobile ? 5 : 9;
      for (let b = 0; b < beads; b++) {
        const a = (b / beads) * Math.PI * 2;
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), candy(0xFFFFFF));
        bead.position.set(Math.cos(a) * rs.r, 0, Math.sin(a) * rs.r);
        group.add(bead);
      }
      group.position.y = rs.y;
      group.rotation.z = rs.tilt;
      this.tower.add(group);
      this.floatRings.push({ group, baseY: rs.y, phase: this.floatRings.length * 2.1 });
    });
  }

  makeFlag(radius, y, angle, color) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.5, 6), candy(CANDY.wood));
    pole.position.y = 0.75;
    g.add(pole);
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 1.5, 0, 0.95, 1.2, 0, 0, 0.86, 0
    ], 3));
    tri.computeVertexNormals();
    const flag = new THREE.Mesh(tri, candy(color, { side: THREE.DoubleSide, roughness: 0.5 }));
    g.add(flag);
    g.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    g.rotation.y = -angle + Math.PI / 2;
    return g;
  }

  /* ---------------- 每层的漂浮岛 + 项目标本 ---------------- */
  buildLayerIslands() {
    this.layerObjects = [];

    this.layers.forEach((L, i) => {
      const accent = L.accent;
      const group = new THREE.Group();

      const island = makeIsland(4.3, {
        body: 0xE9D8FF, top: 0x8FE0B4, bodyH: 6.8, seed: 21 + i, props: 4
      });
      island.position.set(0, L.y - 2.9, 12.8);
      group.add(island);

      // 连接塔身的小石阶
      for (let s = 0; s < 5; s++) {
        const t = s / 4;
        const stone = new THREE.Mesh(
          new THREE.SphereGeometry(0.36 - t * 0.06, 10, 8),
          candy(CANDY.cream, { roughness: 0.7 })
        );
        stone.position.set(0, L.y - 2.85 - t * 0.2, 7.9 + t * 1.4);
        stone.scale.y = 0.55;
        group.add(stone);
      }

      // 标本
      const emblem = createEmblem(L.project.emblem || 'core', L.project.accent || '#C9B6FF');
      emblem.group.position.set(0.1, L.y - 0.15, 12.8);
      emblem.group.scale.setScalar(1.12);
      group.add(emblem.group);

      // 柔影
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(4.8, 4.8),
        new THREE.MeshBasicMaterial({
          map: softShadowTexture(), transparent: true, opacity: 0.5,
          depthWrite: false, toneMapped: false, fog: false
        })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(0.1, L.y - 2.7, 12.8);
      group.add(shadow);

      // 梦幻轨道环 + 珠子
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(8.05, 0.15, 8, this.mobile ? 40 : 72),
        candy(accent, { roughness: 0.3, transparent: true, opacity: 0.9 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = 0.06 + i * 0.03;
      ring.position.y = L.y;
      group.add(ring);

      const beads = new THREE.Group();
      const beadCount = this.mobile ? 6 : 12;
      for (let b = 0; b < beadCount; b++) {
        const a = (b / beadCount) * Math.PI * 2;
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 8), candy(0xFFFDF7));
        bead.position.set(Math.cos(a) * 8.05, 0, Math.sin(a) * 8.05);
        beads.add(bead);
      }
      beads.position.y = L.y;
      beads.rotation.z = 0.06 + i * 0.03;
      group.add(beads);

      const haze = glowSprite(accent, 24, 0.14);
      haze.position.set(0.1, L.y + 1.2, 13);
      group.add(haze);

      const light = new THREE.PointLight(accent, 3, 32, 2);
      light.position.set(0, L.y + 2.5, 15);
      group.add(light);

      this.scene.add(group);
      this.layerObjects.push({ group, island, ring, beads, emblem, light, haze, energy: 0, index: i, y: L.y, shadow });
    });
  }

  /* ---------------- 自由漂浮岛 ---------------- */
  buildIslands() {
    this.islands = [];
    const specs = [
      { x: -30, y: 26, z: -14, r: 3.6, top: CANDY.leaf, body: 0xF6E2C8, props: 3 },
      { x: 32, y: 10, z: -18, r: 3.2, top: CANDY.mint, body: 0xF0E0FF, props: 3 },
      { x: -26, y: -12, z: -16, r: 2.9, top: CANDY.leaf, body: 0xF6E2C8, props: 2 },
      { x: 28, y: -30, z: -10, r: 3.5, top: 0xA9E9C8, body: 0xF6E2C8, props: 3 },
      { x: -30, y: -44, z: 2, r: 3.1, top: CANDY.leaf, body: 0xF0E0FF, props: 2 },
      { x: 24, y: 40, z: -22, r: 2.8, top: CANDY.mint, body: 0xF6E2C8, props: 2 },
      { x: -36, y: 6, z: -4, r: 2.4, top: CANDY.leaf, body: 0xEFE2FF, props: 2 }
    ];
    specs.forEach((s, i) => {
      const island = makeIsland(s.r, { body: s.body, top: s.top, bodyH: s.r * 1.9, seed: 40 + i, props: s.props });
      island.position.set(s.x, s.y, s.z);
      island.rotation.y = this.rng() * Math.PI * 2;
      this.scene.add(island);
      this.islands.push({ mesh: island, baseY: s.y, phase: i * 1.7, amp: 0.35 + (i % 3) * 0.18 });
    });
  }

  /* ---------------- 云 ---------------- */
  buildClouds() {
    const tex = cloudTexture(7);
    this.clouds = [];
    const rnd = makeRng(303);
    for (let i = 0; i < (this.mobile ? 12 : 22); i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, color: 0xFFFFFF, transparent: true,
        opacity: 0.6 + rnd() * 0.35, depthWrite: false, fog: false, toneMapped: false
      }));
      const side = i % 2 === 0 ? 1 : -1;
      s.position.set(
        side * (18 + rnd() * 30),
        this.bottomY - 10 + rnd() * (this.topY - this.bottomY + 46),
        -26 + rnd() * 62
      );
      const scale = 10 + rnd() * 22;
      s.scale.set(scale * 1.7, scale, 1);
      this.scene.add(s);
      this.clouds.push({ sprite: s, speed: 0.2 + rnd() * 0.5, baseX: s.position.x, phase: rnd() * 6.28 });
    }
  }

  /* ---------------- 环绕宝石 ---------------- */
  buildGems() {
    this.gems = [];
    const colors = [CANDY.coral, CANDY.blue, CANDY.mint, CANDY.lilac, CANDY.orange];
    const rnd = makeRng(707);
    const count = this.mobile ? 10 : 18;
    for (let i = 0; i < count; i++) {
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32 + rnd() * 0.36, 0),
        candy(colors[i % colors.length], { roughness: 0.12, metalness: 0.1, clearcoatRoughness: 0.05 })
      );
      gem.scale.y = 1.4;
      this.scene.add(gem);
      this.gems.push({
        mesh: gem,
        radius: 8.2 + rnd() * 6.5,
        y: this.bottomY + 6 + rnd() * (this.topY - this.bottomY + 4),
        angle: rnd() * Math.PI * 2,
        speed: 0.05 + rnd() * 0.12,
        phase: rnd() * 6.28,
        bob: 0.3 + rnd() * 0.6
      });
    }
  }

  /* ---------------- 星屑 ---------------- */
  buildSparkles() {
    const count = this.mobile ? 350 : 800;
    const rnd = makeRng(909);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 7 + rnd() * 26;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = this.bottomY + rnd() * (this.topY - this.bottomY + 30);
      pos[i * 3 + 2] = Math.sin(a) * r - 4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xFFF6D8, size: this.mobile ? 0.22 : 0.18, map: starTexture(),
      transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending,
      depthWrite: false, sizeAttenuation: true, fog: false
    });
    this.sparkles = new THREE.Points(geo, mat);
    this.scene.add(this.sparkles);
  }

  /* ---------------- 泡泡 ---------------- */
  buildBubbles() {
    this.bubbles = [];
    const rnd = makeRng(1313);
    const mat = jelly(0xFFFFFF, 0.25);
    for (let i = 0; i < (this.mobile ? 8 : 14); i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.16 + rnd() * 0.3, 14, 10), mat);
      b.position.set((rnd() - 0.5) * 30, this.bottomY + rnd() * 90, (rnd() - 0.5) * 26 + 4);
      this.scene.add(b);
      this.bubbles.push({ mesh: b, baseY: b.position.y, speed: 0.35 + rnd() * 0.8, phase: rnd() * 6.28 });
    }
  }

  /* ---------------- 塔底：水晶 + 灯笼 ---------------- */
  buildBottom() {
    const bottomCap = new THREE.Mesh(
      new THREE.CircleGeometry(6.1, 56),
      candy(0xFFFDF7, { side: THREE.DoubleSide, roughness: 0.6 })
    );
    bottomCap.rotation.x = Math.PI / 2;
    bottomCap.position.y = this.bottomY + 0.02;
    this.scene.add(bottomCap);

    // 塔底：圆润的糖果水滴 + 小水晶
    const droplet = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 24, 18),
      candy(0xFFD9A8, { roughness: 0.34, clearcoat: 0.6 })
    );
    droplet.scale.set(1, 0.85, 1);
    droplet.position.set(0, this.bottomY - 1.9, 0);
    this.scene.add(droplet);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.9, 0),
      candy(0xFFE9B8, { emissive: 0xFFC98A, emissiveIntensity: 0.5, roughness: 0.2 })
    );
    crystal.scale.y = 1.5;
    crystal.position.set(0, this.bottomY - 4.8, 0);
    this.scene.add(crystal);
    this.bottomCrystal = crystal;

    const lantern = new THREE.Group();
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 20, 16),
      candy(0xFFE9B8, { emissive: 0xFFB36B, emissiveIntensity: 1.1, roughness: 0.3 })
    );
    orb.scale.y = 1.2;
    lantern.add(orb);
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.16, 10), candy(0xE8C8A8));
    capTop.position.y = 0.62;
    lantern.add(capTop);
    const halo = glowSprite(0xFFC98A, 11, 0.5);
    lantern.add(halo);
    const halo2 = glowSprite(0xFFF3D6, 3.8, 0.85);
    lantern.add(halo2);
    const lanternLight = new THREE.PointLight(0xFFB36B, 10, 34, 2);
    lantern.add(lanternLight);
    lantern.position.set(3.6, this.bottomY - 8, 8);
    this.scene.add(lantern);
    this.lantern = { group: lantern, halo, halo2, orb };
  }

  /* ---------------- 相机关键帧 ---------------- */
  buildCameraKeys() {
    const keys = [
      { p: 0, pos: [-34, 82, 54], tgt: [-2, 54, 3] },
      { p: 0.05, pos: [-33, 70, 48], tgt: [-3, 45, 4] },
      { p: 0.09, pos: [-32, 56, 43], tgt: [-4, 33, 5] },
      { p: this.layersStart, pos: [-31, this.y0 + 12, 39], tgt: [-4, this.y0 + 3, 6] }
    ];
    this.layers.forEach((L, i) => {
      keys.push({
        p: this.layersStart + this.span * (i + 0.5),
        pos: [-31, L.y + 5, 40],
        tgt: [0, L.y + 1.5, 8]
      });
    });
    const lastY = this.y0 - (this.layers.length - 1) * this.spacing;
    keys.push({ p: this.layersEnd, pos: [-31, lastY - 9, 39], tgt: [-1, lastY - 10, 6] });
    keys.push({ p: this.labStart + 0.09, pos: [-38, this.contactY + 12, 50], tgt: [0, this.contactY + 2, 4] });
    keys.push({ p: this.contactStart, pos: [-34, this.contactY - 6, 43], tgt: [0, this.contactY - 8, 2] });
    keys.push({ p: 1, pos: [-22, this.bottomY - 16, 32], tgt: [1, this.bottomY - 10, 2] });
    return keys.sort((a, b) => a.p - b.p);
  }

  /* ---------------- 进度映射 ---------------- */
  getActiveIndex(p) {
    if (p < this.layersStart || p > this.layersEnd) return -1;
    const i = Math.floor((p - this.layersStart) / this.span);
    return clamp(i, 0, this.layers.length - 1);
  }

  /* ================= 尺寸 / 指针 ================= */
  resize(w, h) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.85 ? 52 : 40;
    this.camera.updateProjectionMatrix();
  }

  setPointer(nx, ny) {
    this.pointer.set(nx, ny);
  }

  /* ================= 相机采样 ================= */
  sampleCamera(p) {
    const keys = this.keys;
    p = clamp(p, 0, 1);
    let a = keys[0], b = keys[keys.length - 1];
    for (let i = 0; i < keys.length - 1; i++) {
      if (p >= keys[i].p && p <= keys[i + 1].p) { a = keys[i]; b = keys[i + 1]; break; }
    }
    const raw = b.p === a.p ? 0 : (p - a.p) / (b.p - a.p);
    const t = smoothstep(clamp(raw, 0, 1));
    const pos = new THREE.Vector3().fromArray(a.pos).lerp(new THREE.Vector3().fromArray(b.pos), t);
    const tgt = new THREE.Vector3().fromArray(a.tgt).lerp(new THREE.Vector3().fromArray(b.tgt), t);
    return { pos, tgt };
  }

  /* ================= 每帧 ================= */
  update(p, dt) {
    this.clock += dt;
    const t = this.clock;
    const pr = this.reduced ? 0.25 : 1;

    this.pointerSmooth.x = damp(this.pointerSmooth.x, this.pointer.x, 3.2, dt);
    this.pointerSmooth.y = damp(this.pointerSmooth.y, this.pointer.y, 3.2, dt);

    // 相机
    const { pos, tgt } = this.sampleCamera(p);
    pos.x += this.pointerSmooth.x * 1.4 + Math.sin(t * 0.2) * 0.3 * pr;
    pos.y += this.pointerSmooth.y * 0.8 + Math.sin(t * 0.16) * 0.22 * pr;
    tgt.x += this.pointerSmooth.x * 1.0;
    tgt.y += this.pointerSmooth.y * 0.5;
    this.camera.position.copy(pos);
    this.camera.lookAt(tgt);
    this.camera.updateMatrixWorld();

    // 地层
    const active = this.getActiveIndex(p);
    this.activeIndex = active;
    this.layerObjects.forEach((o, i) => {
      o.energy = damp(o.energy, i === active ? 1 : 0, 3, dt);
      o.island.position.y = o.y - 2.9 + Math.sin(t * 0.8 + i * 1.9) * 0.14 * pr;
      o.emblem.group.position.y = o.y - 0.15 + Math.sin(t * 0.9 + i * 1.4) * 0.1 * pr;
      o.ring.rotation.z = 0.06 + i * 0.03 + Math.sin(t * 0.5 + i) * 0.05 * pr;
      o.beads.rotation.y = t * (0.12 + o.energy * 0.25) * pr;
      o.ring.material.opacity = 0.55 + o.energy * 0.4;
      o.haze.material.opacity = 0.09 + o.energy * 0.18;
      o.light.intensity = 2 + o.energy * 7;
      o.shadow.material.opacity = 0.42 + o.energy * 0.14;
      o.emblem.update(t * (0.6 + o.energy * 0.5), dt, o.energy);
    });

    // 塔顶
    if (this.crystal) {
      this.crystal.rotation.y = t * 0.35 * pr;
      this.crystal.position.y = this.topY + 4.2 + Math.sin(t * 1.1) * 0.18 * pr;
      this.crystalGlow.position.y = this.crystal.position.y;
      this.crystalGlow.material.opacity = 0.34 + Math.sin(t * 1.6) * 0.06;
      this.crown.rotation.z = t * 0.25 * pr;
    }
    this.ribbons.forEach((rib, i) => {
      rib.rotation.y = t * (0.03 + i * 0.012) * pr;
    });
    this.floatRings.forEach((fr, i) => {
      fr.group.position.y = fr.baseY + Math.sin(t * 0.55 + fr.phase) * 0.5 * pr;
      fr.group.rotation.y = t * (0.05 + i * 0.02) * pr;
    });

    // 岛
    this.islands.forEach((it) => {
      it.mesh.position.y = it.baseY + Math.sin(t * 0.4 + it.phase) * it.amp * pr;
      it.mesh.rotation.y += dt * 0.02 * pr;
    });

    // 云
    this.clouds.forEach((c) => {
      c.sprite.position.x += c.speed * dt * (0.4 + pr * 0.6);
      if (c.sprite.position.x > c.baseX + 26) c.sprite.position.x = c.baseX - 26;
      c.sprite.material.opacity = 0.5 + Math.sin(t * 0.3 + c.phase) * 0.12;
    });

    // 宝石 / 泡泡 / 星屑
    this.gems.forEach((g) => {
      const a = g.angle + t * g.speed * pr;
      g.mesh.position.set(
        Math.cos(a) * g.radius,
        g.y + Math.sin(t * 0.7 + g.phase) * g.bob * pr,
        Math.sin(a) * g.radius
      );
      g.mesh.rotation.y = t * 0.5 + g.phase;
      g.mesh.rotation.x = t * 0.2;
    });
    this.bubbles.forEach((b) => {
      b.mesh.position.y += b.speed * dt * (0.5 + pr * 0.5);
      if (b.mesh.position.y > this.topY + 16) b.mesh.position.y = this.bottomY - 6;
      b.mesh.position.x += Math.sin(t * 0.5 + b.phase) * dt * 0.15;
    });
    if (this.sparkles) {
      this.sparkles.rotation.y = t * 0.01 * pr;
      this.sparkles.material.opacity = 0.6 + Math.sin(t * 1.4) * 0.12;
    }

    // 灯笼
    if (this.lantern) {
      const e = clamp((p - 0.78) / 0.16, 0, 1);
      this.lantern.halo.material.opacity = e * (0.4 + Math.sin(t * 2.1) * 0.05);
      this.lantern.halo2.material.opacity = e * 0.8;
      this.lantern.group.position.y = this.bottomY - 8 + Math.sin(t * 0.8) * 0.25 * e;
      this.lantern.group.rotation.z = Math.sin(t * 0.9) * 0.12 * e;
    }
    if (this.bottomCrystal) {
      this.bottomCrystal.rotation.y = t * 0.4 * pr;
      this.bottomCrystal.position.y = this.bottomY - 4.8 + Math.sin(t * 1.2) * 0.15 * pr;
    }

    // Clawd：始终飘在镜头右下角的一小朵云上，像随行的向导
    if (this.clawd) {
      this.tmpV.set(4.6, -2.4, -9.8).applyMatrix4(this.camera.matrixWorld);
      this.clawdTarget.copy(this.tmpV);

      const contactMix = clamp((p - 0.80) / 0.1, 0, 1);
      if (contactMix > 0.001) {
        this.tmpV2.set(4.2, -2.4, -10.6).applyMatrix4(this.camera.matrixWorld);
        this.clawdTarget.lerp(this.tmpV2, contactMix);
      }

      this.clawd.group.scale.setScalar(0.42 + contactMix * 0.04);
      if (!this.clawdReady) {
        this.clawdPos.copy(this.clawdTarget);
        this.clawdReady = true;
      } else {
        this.clawdPos.lerp(this.clawdTarget, 1 - Math.exp(-2.4 * dt));
      }
      this.clawd.setPosition(this.clawdPos);
      const energy = active >= 0 ? this.layerObjects[active].energy : (p > 0.78 ? 0.7 : 0.3);
      this.clawd.update(dt, t, this.camera.position, this.pointerSmooth, energy);
    }

    if (active !== this.lastActive) {
      if (active >= 0 && this.clawd) this.clawd.hopOnce();
      this.lastActive = active;
    }

    this.renderer.render(this.scene, this.camera);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
