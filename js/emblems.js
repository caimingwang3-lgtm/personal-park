/* ============================================================
 *  项目「标本」· 玩具版
 *  每个项目是一座漂浮岛上的小场景，全部由基础几何程序化生成
 * ============================================================ */
import * as THREE from 'three';
import { CANDY, candy, jelly, glowSprite, additive, makeRng, starTexture, dotTexture } from './materials.js';

/* 星屑粒子 */
function makeSparkles(count, color, size, rng, spread = 3, height = 3.4) {
  const pos = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rng() - 0.5) * spread * 2;
    pos[i * 3 + 1] = (rng() - 0.5) * height;
    pos[i * 3 + 2] = (rng() - 0.5) * spread * 1.3;
    phase[i] = rng() * 6.28;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color, size, map: starTexture(), transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false
  });
  const points = new THREE.Points(geo, mat);
  points.userData = { phase, spread, height };
  return points;
}

function updateSparkles(points, t, energy) {
  points.rotation.y = t * 0.15;
  points.material.opacity = 0.55 + energy * 0.35 + Math.sin(t * 2.1) * 0.08;
}

function cloudPuff(radius, y, color = 0xFFFFFF, opacity = 0.95) {
  const g = new THREE.Group();
  const mat = candy(color, { roughness: 0.9, clearcoat: 0.2 });
  const rnd = makeRng(radius * 97 + 3);
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(radius * (0.5 + rnd() * 0.45), 12, 10), mat);
    s.position.set((rnd() - 0.5) * radius * 1.9, (rnd() - 0.5) * radius * 0.35, (rnd() - 0.5) * radius * 0.6);
    g.add(s);
  }
  g.position.y = y;
  if (opacity < 1) g.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = opacity; } });
  return g;
}

/* ---------------- 幽影峡谷：小幽灵王 ---------------- */
function buildGhost(accent, rng) {
  const g = new THREE.Group();
  const bodyColor = 0xE6DDFF;
  const accentCol = new THREE.Color(accent);

  // 云朵底座
  g.add(cloudPuff(1.02, -1.5, 0xFFFFFF, 0.85));

  // 幽灵身体
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 28, 22),
    candy(bodyColor, { roughness: 0.35, clearcoatRoughness: 0.2, emissive: accent, emissiveIntensity: 0.12 })
  );
  body.scale.set(1, 1.18, 0.98);
  body.position.y = 0.2;
  g.add(body);

  // 波浪裙边
  const skirtMat = candy(bodyColor, { roughness: 0.35, emissive: accent, emissiveIntensity: 0.12 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), skirtMat);
    puff.position.set(Math.cos(a) * 0.72, -0.82 + Math.sin(a * 3) * 0.1, Math.sin(a) * 0.72);
    g.add(puff);
  }

  // 眼睛
  const eyeMat = candy(0x4A3F5C, { roughness: 0.25 });
  const eyeGeo = new THREE.SphereGeometry(0.16, 14, 12);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.28, 0.36, 0.94);
  eyeR.position.set(0.28, 0.36, 0.94);
  eyeL.scale.set(0.85, 1.25, 0.5);
  eyeR.scale.set(0.85, 1.25, 0.5);
  g.add(eyeL, eyeR);

  const glintMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, toneMapped: false });
  for (const e of [eyeL, eyeR]) {
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), glintMat);
    glint.position.set(e.position.x + 0.04, e.position.y + 0.07, 1.0);
    g.add(glint);
  }

  // 腮红
  const blushMat = candy(CANDY.coral, { roughness: 0.6, transparent: true, opacity: 0.55 });
  for (const sx of [-1, 1]) {
    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), blushMat);
    blush.position.set(sx * 0.52, 0.05, 0.88);
    blush.scale.set(1, 0.6, 0.25);
    g.add(blush);
  }

  // 小皇冠
  const crownGold = candy(0xFFD98A, { roughness: 0.25, metalness: 0.2 });
  const crownBase = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 8, 24), crownGold);
  crownBase.rotation.x = Math.PI / 2;
  crownBase.position.set(0, 1.18, -0.05);
  g.add(crownBase);
  for (let i = 0; i < 3; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 6), crownGold);
    const a = (i / 3) * Math.PI * 2;
    spike.position.set(Math.cos(a) * 0.26, 1.38, Math.sin(a) * 0.26);
    g.add(spike);
  }

  // 小手臂
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), skirtMat);
    arm.position.set(sx * 1.02, 0.12, 0.2);
    arm.scale.set(0.8, 1.3, 0.8);
    g.add(arm);
  }

  const glow = glowSprite(accent, 6.5, 0.3);
  glow.position.set(0, 0.4, 0);
  g.add(glow);

  const sparkles = makeSparkles(26, 0xFFF3D0, 0.28, rng, 2.2, 3.2);
  sparkles.position.y = 0.5;
  g.add(sparkles);

  return {
    group: g,
    update(t, dt, energy) {
      body.position.y = 0.2 + Math.sin(t * 1.3) * 0.09;
      body.rotation.z = Math.sin(t * 0.7) * 0.04;
      crownBase.rotation.z = Math.sin(t * 1.1) * 0.06;
      const blink = (Math.sin(t * 0.8) > 0.985) ? 0.25 : 1;
      eyeL.scale.y = 1.25 * blink;
      eyeR.scale.y = 1.25 * blink;
      glow.material.opacity = 0.18 + energy * 0.2;
      updateSparkles(sparkles, t, energy);
    }
  };
}

/* ---------------- 月下疾走：糖果教堂岛 ---------------- */
function buildCastle(accent, rng) {
  const g = new THREE.Group();

  // 云底座
  g.add(cloudPuff(1.15, -2.3, 0xFFFFFF, 0.85));

  // 彩虹拱
  const rainbowColors = [CANDY.coral, CANDY.orange, CANDY.mint];
  rainbowColors.forEach((c, i) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(2.55 - i * 0.28, 0.13, 8, 40, Math.PI),
      candy(c, { roughness: 0.5, transparent: true, opacity: 0.75 })
    );
    arc.position.set(0, -1.9, -0.5);
    g.add(arc);
  });

  // 月亮
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 24, 18),
    candy(0xFFF0B8, { roughness: 0.4, emissive: 0xFFD98A, emissiveIntensity: 0.65 })
  );
  moon.position.set(-2.0, 1.6, -1.3);
  g.add(moon);
  const moonGlow = glowSprite(0xFFE9B0, 5, 0.4);
  moonGlow.position.copy(moon.position);
  g.add(moonGlow);

  // 教堂主体
  const cream = candy(CANDY.cream, { roughness: 0.45 });
  const coral = candy(CANDY.coral, { roughness: 0.4 });
  const lilac = candy(CANDY.lilac, { roughness: 0.4 });

  const nave = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.12, 1.9, 8), cream);
  nave.position.y = -0.9;
  g.add(nave);

  // 三座塔
  const towers = [
    { x: -0.95, z: 0.1, h: 2.4, r: 0.38, mat: cream, roof: coral },
    { x: 0.0, z: -0.15, h: 3.2, r: 0.44, mat: cream, roof: lilac },
    { x: 0.95, z: 0.1, h: 2.2, r: 0.36, mat: cream, roof: coral }
  ];
  towers.forEach((tw) => {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(tw.r, tw.r * 1.05, tw.h, 10), tw.mat);
    body.position.set(tw.x, -1.9 + tw.h / 2, tw.z);
    g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(tw.r * 1.35, 0.95, 10), tw.roof);
    roof.position.set(tw.x, -1.9 + tw.h + 0.45, tw.z);
    g.add(roof);
    // 塔尖小旗
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5), candy(CANDY.wood));
    pole.position.set(tw.x, -1.9 + tw.h + 1.1, tw.z);
    g.add(pole);
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0.3, 0, 0.3, 0.14, 0, 0, -0.02, 0
    ], 3));
    tri.computeVertexNormals();
    const flag = new THREE.Mesh(tri, candy(CANDY.orange, { side: THREE.DoubleSide }));
    flag.position.set(tw.x, -1.9 + tw.h + 1.02, tw.z);
    g.add(flag);
  });

  // 小跑者
  const runner = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.2, 4, 8), candy(0xFFFDF7, { emissive: 0xFFD9DE, emissiveIntensity: 0.4 }));
  body.position.y = 0.18;
  runner.add(body);
  const scarf = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), candy(CANDY.coral, { side: THREE.DoubleSide }));
  scarf.position.set(-0.16, 0.22, 0.02);
  scarf.rotation.y = 0.4;
  runner.add(scarf);
  runner.position.set(-1.4, -1.55, 1.2);
  g.add(runner);

  // 星屑
  const sparkles = makeSparkles(24, 0xFFF3D0, 0.24, rng, 2.6, 3.6);
  sparkles.position.y = 0.4;
  g.add(sparkles);

  const glow = glowSprite(accent, 6, 0.22);
  glow.position.set(0, -0.4, 0);
  g.add(glow);

  let runT = 0;
  return {
    group: g,
    update(t, dt, energy) {
      runT += dt * (0.8 + energy * 0.6);
      runner.position.x = Math.sin(runT) * 1.9;
      runner.position.y = -1.55 + Math.abs(Math.cos(runT * 1.6)) * 0.14;
      runner.rotation.z = Math.cos(runT) * -0.2;
      scarf.rotation.z = Math.sin(runT * 2) * 0.3;
      moon.rotation.y = t * 0.15;
      glow.material.opacity = 0.12 + energy * 0.16;
      updateSparkles(sparkles, t, energy);
    }
  };
}

/* ---------------- 黄桃快跑：一颗会滚的小黄桃 ---------------- */
function buildPeach(accent, rng) {
  const g = new THREE.Group();
  g.add(cloudPuff(1.05, -1.55, 0xFFFFFF, 0.9));

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 30, 24),
    candy(0xFFC24D, { roughness: 0.5, clearcoat: 0.6 })
  );
  body.scale.set(1.08, 1, 1.05);
  body.position.y = 0.12;
  g.add(body);

  // 桃子中缝
  const crease = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.035, 6, 32, Math.PI * 0.8),
    candy(CANDY.sand, { roughness: 0.7 })
  );
  crease.rotation.set(0.2, 0.9, Math.PI * 0.55);
  crease.position.set(-0.15, 0.25, 0.9);
  g.add(crease);

  // 叶子 + 蒂
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 12), candy(CANDY.leaf, { roughness: 0.55 }));
  leaf.scale.set(1, 0.16, 0.5);
  leaf.position.set(0.42, 1.24, 0.1);
  leaf.rotation.z = -0.55;
  g.add(leaf);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.09, 0.34, 8),
    candy(0x8A6A4A, { roughness: 0.8 })
  );
  stem.position.set(0.12, 1.16, 0);
  stem.rotation.z = -0.3;
  g.add(stem);

  // 小脸
  const eyeMat = candy(CANDY.ink, { roughness: 0.25 });
  [-0.3, 0.3].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), eyeMat);
    eye.position.set(x, 0.32, 1.02);
    g.add(eye);
  });
  const cheekMat = candy(CANDY.coral, { roughness: 0.7, emissive: 0xFF8FA3, emissiveIntensity: 0.15 });
  [-0.55, 0.55].forEach((x) => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), cheekMat);
    cheek.scale.set(1, 0.7, 0.4);
    cheek.position.set(x, 0.18, 0.98);
    g.add(cheek);
  });

  const sparkles = makeSparkles(20, 0xFFF3D0, 0.24, rng, 2.4, 3.2);
  sparkles.position.y = 0.3;
  g.add(sparkles);
  const glow = glowSprite(accent, 6, 0.22);
  glow.position.y = 0;
  g.add(glow);

  return {
    group: g,
    update(t, dt, energy) {
      body.rotation.y = Math.sin(t * 0.4) * 0.2;
      body.position.y = 0.12 + Math.sin(t * 1.1) * 0.06;
      leaf.rotation.z = -0.55 + Math.sin(t * 1.3) * 0.08;
      glow.material.opacity = 0.12 + energy * 0.16;
      updateSparkles(sparkles, t, energy);
    }
  };
}

/* ---------------- 异想标本馆：玻璃罩里的标本核心 ---------------- */
function buildCabinet(accent, rng) {
  const g = new THREE.Group();
  g.add(cloudPuff(1.1, -1.6, 0xFFFFFF, 0.9));

  // 黄铜底座
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.06, 0.3, 28),
    candy(CANDY.orange, { roughness: 0.3, metalness: 0.35 })
  );
  base.position.y = -0.92;
  g.add(base);

  // 玻璃罩
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.02, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.62),
    jelly(CANDY.blue, 0.22)
  );
  dome.position.y = -0.75;
  g.add(dome);

  // 罩内标本核心
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    candy(accent, { roughness: 0.12, metalness: 0.15, emissive: accent, emissiveIntensity: 0.35 })
  );
  core.position.y = -0.2;
  g.add(core);

  // 黄铜环
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.06, 8, 44),
    candy(CANDY.orange, { roughness: 0.28, metalness: 0.4 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.72;
  g.add(ring);

  const sparkles = makeSparkles(22, 0xFFF3D0, 0.22, rng, 2.2, 3);
  g.add(sparkles);
  const glow = glowSprite(accent, 6, 0.24);
  glow.position.y = -0.2;
  g.add(glow);

  return {
    group: g,
    update(t, dt, energy) {
      core.rotation.y = t * 0.6;
      core.position.y = -0.28 + Math.sin(t * 1.2) * 0.08;
      ring.rotation.z = t * 0.12;
      dome.rotation.y = Math.sin(t * 0.25) * 0.06;
      glow.material.opacity = 0.14 + energy * 0.2;
      updateSparkles(sparkles, t, energy);
    }
  };
}

/* ---------------- 通用：糖果宝石 ---------------- */
function buildGem(accent, rng) {
  const g = new THREE.Group();
  g.add(cloudPuff(1.2, -1.7, 0xFFFFFF, 0.9));

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.15, 0),
    candy(accent, { roughness: 0.1, metalness: 0.15, clearcoatRoughness: 0.05 })
  );
  gem.scale.y = 1.5;
  gem.position.y = 0.2;
  g.add(gem);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.08, 8, 48),
    candy(CANDY.orange, { roughness: 0.35 })
  );
  ring.rotation.x = Math.PI / 2 + 0.35;
  ring.position.y = 0.2;
  g.add(ring);

  const glow = glowSprite(accent, 6, 0.25);
  glow.position.y = 0.3;
  g.add(glow);

  const sparkles = makeSparkles(20, 0xFFF3D0, 0.26, rng, 2, 3);
  g.add(sparkles);

  return {
    group: g,
    update(t, dt, energy) {
      gem.rotation.y = t * 0.4;
      gem.position.y = 0.2 + Math.sin(t * 1.1) * 0.1;
      ring.rotation.z = t * 0.25;
      glow.material.opacity = 0.15 + energy * 0.2;
      updateSparkles(sparkles, t, energy);
    }
  };
}

export function createEmblem(type, accent) {
  const rng = makeRng((type.charCodeAt(0) || 7) * 97 + 13);
  if (type === 'lich') return buildGhost(accent, rng);
  if (type === 'cathedral') return buildCastle(accent, rng);
  if (type === 'peach') return buildPeach(accent, rng);
  if (type === 'cabinet') return buildCabinet(accent, rng);
  return buildGem(accent, rng);
}
