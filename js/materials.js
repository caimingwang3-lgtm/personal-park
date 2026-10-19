/* 程序化材质 / 纹理 / 发光工具：全部由代码生成，不引用任何外部图片 */
import * as THREE from 'three';

/* ---------- 确定性随机 ---------- */
export function makeRng(seed = 1) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---------- 全局颜色 ---------- */
export const PALETTE = {
  bg: 0x04070a,
  fog: 0x050a0d,
  teal: 0x58ffd6,
  ice: 0xbfeee5,
  rock: 0x0c1417
};

/* ---------- 辉光贴图（径向渐变） ---------- */
export function glowTexture(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.22, 'rgba(255,255,255,.55)');
  grd.addColorStop(0.55, 'rgba(255,255,255,.12)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- 柔和粒子贴图 ---------- */
export function dotTexture(size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,.7)');
  grd.addColorStop(0.75, 'rgba(255,255,255,.1)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- 岩芯地层纹理（程序化） ---------- */
export function strataTexture(seed = 7, w = 512, h = 1024) {
  const rnd = makeRng(seed);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');

  g.fillStyle = '#0a1114';
  g.fillRect(0, 0, w, h);

  // 水平地层带
  let y = 0;
  while (y < h) {
    const bh = 2 + rnd() * 16;
    const v = 9 + rnd() * 16;
    g.fillStyle = `hsla(${168 + rnd() * 22}, ${8 + rnd() * 12}%, ${v}%, ${0.55 + rnd() * 0.4})`;
    g.fillRect(0, y, w, bh);
    y += bh + rnd() * 3;
  }

  // 矿脉：细的青绿色亮线
  for (let i = 0; i < 22; i++) {
    const vy = rnd() * h;
    g.strokeStyle = `rgba(${120 + rnd() * 60},${230 + rnd() * 25},${210 + rnd() * 40},${0.04 + rnd() * 0.07})`;
    g.lineWidth = 0.6 + rnd() * 0.8;
    g.beginPath();
    g.moveTo(0, vy);
    g.bezierCurveTo(w * 0.32, vy + (rnd() - 0.5) * 14, w * 0.68, vy + (rnd() - 0.5) * 14, w, vy + (rnd() - 0.5) * 8);
    g.stroke();
  }

  // 细层理
  g.globalAlpha = 0.5;
  for (let i = 0; i < 240; i++) {
    const yy = rnd() * h;
    g.strokeStyle = `rgba(${150 + rnd() * 40},${205 + rnd() * 35},${200 + rnd() * 40},${0.02 + rnd() * 0.05})`;
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(0, yy);
    g.bezierCurveTo(w * 0.3, yy + (rnd() - 0.5) * 6, w * 0.7, yy + (rnd() - 0.5) * 6, w, yy + (rnd() - 0.5) * 3);
    g.stroke();
  }
  g.globalAlpha = 1;

  // 纵向裂纹
  for (let i = 0; i < 26; i++) {
    let x = rnd() * w, yy = rnd() * h;
    g.strokeStyle = `rgba(0,0,0,${0.25 + rnd() * 0.35})`;
    g.lineWidth = 0.6 + rnd() * 1.4;
    g.beginPath();
    g.moveTo(x, yy);
    const steps = 4 + (rnd() * 6 | 0);
    for (let s = 0; s < steps; s++) {
      x += (rnd() - 0.5) * 26;
      yy += 12 + rnd() * 48;
      g.lineTo(x, yy);
    }
    g.stroke();
  }

  // 矿点
  for (let i = 0; i < 700; i++) {
    const x = rnd() * w, yy = rnd() * h;
    g.fillStyle = `rgba(${120 + rnd() * 120},${230 + rnd() * 25},${215 + rnd() * 30},${rnd() * 0.10})`;
    const r = rnd() < 0.9 ? 0.7 : 1.8;
    g.fillRect(x, yy, r, r);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  t.anisotropy = 4;
  return t;
}

/* ---------- 菲涅尔边缘光材质 ---------- */
export function rimMaterial(opts = {}) {
  const {
    color = 0xffffff, rim = 0x58ffd6, rimPower = 2.6, rimStrength = 0.55,
    roughness = 0.8, metalness = 0.1, map = null, emissive = 0x000000,
    emissiveIntensity = 1
  } = opts;

  const m = new THREE.MeshStandardMaterial({
    color, roughness, metalness, map,
    emissive, emissiveIntensity
  });

  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = { value: new THREE.Color(rim) };
    shader.uniforms.uRimPower = { value: rimPower };
    shader.uniforms.uRimStrength = { value: rimStrength };
    shader.fragmentShader = `
      uniform vec3 uRim;
      uniform float uRimPower;
      uniform float uRimStrength;
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       float rimF = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), uRimPower);
       totalEmissiveRadiance += uRim * rimF * uRimStrength;`
    );
  };
  m.customProgramCacheKey = () => `rim_${rimPower}_${rimStrength}`;
  return m;
}

/* ---------- 加色材质 ---------- */
export function additive(opts = {}) {
  return new THREE.MeshBasicMaterial(Object.assign({
    transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false
  }, opts));
}

/* ---------- 体积光束 ---------- */
export function beamMaterial(color = PALETTE.teal, opacity = 0.14) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, fog: false, toneMapped: false,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uTime;
      void main(){
        float edge = smoothstep(0.0,0.42,vUv.x) * smoothstep(1.0,0.58,vUv.x);
        float fall = pow(1.0 - vUv.y, 1.7);
        float flicker = 0.82 + 0.18 * sin(uTime * 0.7 + vUv.y * 5.0);
        gl_FragColor = vec4(uColor, edge * fall * uOpacity * flicker);
      }
    `
  });
}

/* ---------- 背景天穹 ---------- */
export function backdropMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x0a1a1c) },
      uBottom: { value: new THREE.Color(0x020405) }
    },
    vertexShader: `
      varying vec3 vDir;
      void main(){
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uTop;
      uniform vec3 uBottom;
      void main(){
        float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(uBottom, uTop, pow(h, 2.2));
        float glow = pow(max(0.0, vDir.y * 0.5 + 0.5), 6.0) * 0.16;
        col += vec3(0.10, 0.35, 0.30) * glow;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* ---------- 圆环线（加色） ---------- */
export function ringLine(radius, segments, color, opacity = 0.4, arc = Math.PI * 2) {
  const pts = [];
  const n = Math.max(3, segments);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * arc;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color, transparent: true, opacity, blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false, toneMapped: false
  });
  return new THREE.Line(geo, mat);
}

/* ---------- 发光精灵 ---------- */
export function glowSprite(color = PALETTE.teal, scale = 4, opacity = 0.8, tex = null) {
  const m = new THREE.SpriteMaterial({
    map: tex || glowTexture(), color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false
  });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(scale);
  return s;
}

/* ============================================================
 *  糖果 / 卡通休闲风新增（2026 改版）
 * ============================================================ */

export const CANDY = {
  cream: 0xFFF7ED,
  blue: 0xBFE7FF,
  mint: 0xB8F2D6,
  orange: 0xFFB36B,
  coral: 0xFF8FA3,
  lilac: 0xC9B6FF,
  leaf: 0x9FE3B0,
  leafDeep: 0x74C99A,
  sand: 0xFFE3C4,
  wood: 0xE8C8A8,
  ink: 0x4A3F5C,
  white: 0xFFFFFF,
  skyTop: 0x9FD3EF,
  skyMid: 0xDDF2FF,
  skyLow: 0xFFF7ED
};

/* 玩具感的哑光糖衣材质 */
export function candy(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial(Object.assign({
    color,
    roughness: 0.42,
    metalness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0.28,
    emissive: new THREE.Color(color).multiplyScalar(0.05)
  }, opts));
}

/* 半透明果冻 / 亚克力 */
export function jelly(color, opacity = 0.72) {
  return new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity,
    roughness: 0.12,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    emissive: new THREE.Color(color).multiplyScalar(0.12),
    depthWrite: false
  });
}

/* 天空穹顶：奶油白 → 浅蓝渐变 + 柔光太阳 */
export function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    uniforms: {
      uTop: { value: new THREE.Color(CANDY.skyTop) },
      uMid: { value: new THREE.Color(CANDY.skyMid) },
      uLow: { value: new THREE.Color(CANDY.skyLow) },
      uSun: { value: new THREE.Color(0xFFF0C4) },
      uSunDir: { value: new THREE.Vector3(0.55, 0.72, 0.42).normalize() }
    },
    vertexShader: `
      varying vec3 vDir;
      void main(){
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uTop, uMid, uLow, uSun, uSunDir;
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(uLow, uMid, smoothstep(0.02, 0.55, h));
        col = mix(col, uTop, smoothstep(0.52, 0.98, h));
        float s = max(dot(d, normalize(uSunDir)), 0.0);
        col += uSun * pow(s, 220.0) * 0.9;
        col += uSun * pow(s, 14.0) * 0.16;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/* 卡通云朵贴图 */
export function cloudTexture(seed = 3) {
  const rnd = makeRng(seed);
  const w = 320, h = 190;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const blobs = 9;
  for (let i = 0; i < blobs; i++) {
    const bx = 40 + rnd() * (w - 80);
    const by = 80 + rnd() * 55;
    const br = 28 + rnd() * 42;
    const grd = g.createRadialGradient(bx, by - br * 0.2, 0, bx, by, br);
    grd.addColorStop(0, 'rgba(255,255,255,0.98)');
    grd.addColorStop(0.55, 'rgba(255,255,255,0.85)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(bx, by, br, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* 四角星光贴图 */
export function starTexture(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const s = size;
  g.translate(s / 2, s / 2);
  const grd = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.5);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,255,255,.85)');
  grd.addColorStop(0.5, 'rgba(255,255,255,.16)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.beginPath();
  g.arc(0, 0, s * 0.5, 0, Math.PI * 2);
  g.fill();

  const spike = g.createLinearGradient(0, -s * 0.5, 0, s * 0.5);
  spike.addColorStop(0, 'rgba(255,255,255,0)');
  spike.addColorStop(0.5, 'rgba(255,255,255,.95)');
  spike.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = spike;
  for (let i = 0; i < 2; i++) {
    g.save();
    g.rotate(i * Math.PI / 2);
    g.fillRect(-s * 0.012, -s * 0.5, s * 0.024, s);
    g.restore();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* 柔和接触阴影（径向黑） */
export function softShadowTexture(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, 'rgba(74,63,92,.34)');
  grd.addColorStop(0.55, 'rgba(74,63,92,.14)');
  grd.addColorStop(1, 'rgba(74,63,92,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* 圆角圆柱：Lathe 做出糖豆般的上下圆角 */
export function roundedCylinder(radius, height, edge = 0.9, segments = 44) {
  const h = height / 2;
  const e = Math.min(edge, radius * 0.5, height * 0.5);
  const pts = [];
  pts.push(new THREE.Vector2(0, h));
  pts.push(new THREE.Vector2(radius - e, h));
  for (let i = 1; i <= 6; i++) {
    const a = (i / 6) * Math.PI / 2;
    pts.push(new THREE.Vector2(radius - e + Math.sin(a) * e, h - e + Math.cos(a) * e));
  }
  pts.push(new THREE.Vector2(radius, -h + e));
  for (let i = 1; i <= 6; i++) {
    const a = (i / 6) * Math.PI / 2;
    pts.push(new THREE.Vector2(radius - e + Math.cos(a) * e, -h + e - Math.sin(a) * e));
  }
  pts.push(new THREE.Vector2(0, -h));
  const geo = new THREE.LatheGeometry(pts, segments);
  geo.computeVertexNormals();
  return geo;
}

/* 悬浮岛：低多边形水滴形 + 顶部草地圆盘 */
export function makeIsland(radius, opts = {}) {
  const g = new THREE.Group();
  const bodyH = opts.bodyH || radius * 1.7;
  const sides = opts.sides || 7;
  const bodyColor = opts.body || CANDY.sand;
  const topColor = opts.top || CANDY.leaf;

  const body = new THREE.Mesh(
    new THREE.ConeGeometry(radius, bodyH, sides, 2, false),
    candy(bodyColor, { flatShading: true, roughness: 0.85, clearcoat: 0.25 })
  );
  body.rotation.x = Math.PI;
  body.position.y = -bodyH / 2 - 0.25;
  g.add(body);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.03, radius * 1.03, 0.55, sides, 1, false),
    candy(topColor, { flatShading: true, roughness: 0.7, clearcoat: 0.4 })
  );
  top.position.y = -0.1;
  g.add(top);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.02, 0.16, 6, sides * 4),
    candy(topColor, { roughness: 0.6 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.16;
  g.add(rim);

  // 岛顶的小装饰
  const propCount = opts.props == null ? 3 : opts.props;
  const rnd = makeRng((opts.seed || 11) * 13 + 7);
  for (let i = 0; i < propCount; i++) {
    const a = rnd() * Math.PI * 2;
    const r = rnd() * radius * 0.62;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const y = 0.22;
    const kind = rnd();
    if (kind < 0.42) {
      // 小树
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.7, 7), candy(CANDY.wood));
      trunk.position.set(x, y + 0.35, z);
      g.add(trunk);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.48 + rnd() * 0.14, 10, 8), candy(rnd() > 0.5 ? CANDY.leaf : 0x8FD9B0));
      crown.position.set(x, y + 1.02, z);
      crown.scale.y = 0.92;
      g.add(crown);
    } else if (kind < 0.62) {
      // 蘑菇
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.42, 8), candy(CANDY.cream));
      stem.position.set(x, y + 0.21, z);
      g.add(stem);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), candy(rnd() > 0.5 ? CANDY.coral : CANDY.lilac));
      cap.position.set(x, y + 0.5, z);
      cap.scale.y = 0.85;
      g.add(cap);
    } else if (kind < 0.8) {
      // 宝石
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.26 + rnd() * 0.12, 0), candy([CANDY.blue, CANDY.mint, CANDY.lilac][i % 3], { roughness: 0.15, metalness: 0.1 }));
      gem.position.set(x, y + 0.34, z);
      gem.rotation.y = rnd() * 3;
      gem.scale.y = 1.35;
      g.add(gem);
    } else {
      // 小旗
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15, 6), candy(CANDY.wood));
      pole.position.set(x, y + 0.58, z);
      g.add(pole);
      const flagGeo = new THREE.BufferGeometry();
      flagGeo.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0.32, 0, 0.62, 0.16, 0, 0, -0.02, 0
      ], 3));
      flagGeo.computeVertexNormals();
      const flag = new THREE.Mesh(flagGeo, candy(rnd() > 0.5 ? CANDY.coral : CANDY.orange, { side: THREE.DoubleSide }));
      flag.position.set(x + 0.02, y + 1.0, z);
      g.add(flag);
    }
  }

  return g;
}

