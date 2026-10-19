/* ============================================================
 *  Clawd —— Claude 吉祥物，纯程序化几何重建
 *  圆润方块身体 + 四条短腿 + 两只竖眼，漂浮陪伴
 * ============================================================ */
import * as THREE from 'three';
import { cloudTexture } from './materials.js';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* 圆角盒：把 BoxGeometry 的顶点向最近的内盒收拢，再沿法线推出半径 */
function roundedBox(w, h, d, r = 0.12, seg = 3) {
  const geo = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  const pos = geo.attributes.position;
  const inner = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r);
  const p = new THREE.Vector3();
  const c = new THREE.Vector3();
  const dir = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    c.set(clamp(p.x, -inner.x, inner.x), clamp(p.y, -inner.y, inner.y), clamp(p.z, -inner.z, inner.z));
    dir.copy(p).sub(c);
    if (dir.lengthSq() > 1e-8) {
      dir.normalize().multiplyScalar(r);
      p.copy(c).add(dir);
      pos.setXYZ(i, p.x, p.y, p.z);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export class Clawd {
  constructor() {
    this.group = new THREE.Group();
    this.group.scale.setScalar(0.5);

    const cream = new THREE.MeshStandardMaterial({
      color: 0xefe7d6, roughness: 0.52, metalness: 0.02,
      emissive: 0x14110b, emissiveIntensity: 0.4
    });
    const creamDark = new THREE.MeshStandardMaterial({ color: 0xd8cdb7, roughness: 0.6, metalness: 0.03 });
    const ink = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.22, metalness: 0.15 });
    const glint = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, toneMapped: false });

    // 身体
    const body = new THREE.Mesh(roundedBox(1.5, 1.06, 1.16, 0.26), cream);
    this.group.add(body);

    // 胸前的浅色接缝
    const belly = new THREE.Mesh(roundedBox(0.92, 0.62, 0.04, 0.14), creamDark);
    belly.position.set(0, -0.08, 0.585);
    this.group.add(belly);

    // 头
    this.head = new THREE.Group();
    this.head.position.set(0, 1.02, 0.02);
    const skull = new THREE.Mesh(roundedBox(1.22, 0.96, 1.02, 0.24), cream);
    this.head.add(skull);
    this.group.add(this.head);

    // 眼睛
    this.eyes = [];
    const eyeGeo = roundedBox(0.15, 0.38, 0.06, 0.06, 2);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, ink);
      eye.position.set(sx * 0.27, 0.02, 0.512);
      this.head.add(eye);
      this.eyes.push(eye);

      const g = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), glint);
      g.position.set(sx * 0.27 + 0.03, 0.13, 0.545);
      this.head.add(g);
    }

    // 耳朵（两个小圆角三角替代）
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(roundedBox(0.22, 0.3, 0.16, 0.07), cream);
      ear.position.set(sx * 0.42, 0.52, 0);
      ear.rotation.z = sx * -0.22;
      this.head.add(ear);
    }

    // 四条腿（带枢轴，便于摆动）
    this.legs = [];
    const legGeo = roundedBox(0.24, 0.54, 0.24, 0.1);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const pivot = new THREE.Group();
      pivot.position.set(sx * 0.5, -0.48, sz * 0.36);
      const leg = new THREE.Mesh(legGeo, creamDark);
      leg.position.y = -0.3;
      pivot.add(leg);
      this.group.add(pivot);
      this.legs.push({ pivot, sx, sz, phase: (sx * sz > 0 ? 0 : Math.PI) });
    }

    // 后腰的小凸起
    const nub = new THREE.Mesh(roundedBox(0.3, 0.28, 0.3, 0.1), cream);
    nub.position.set(0, -0.1, -0.62);
    this.group.add(nub);

    // 伴飞微光
    const glowTex = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, 'rgba(120,255,220,.9)');
      grd.addColorStop(0.5, 'rgba(120,255,220,.18)');
      grd.addColorStop(1, 'rgba(120,255,220,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 64);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    this.aura = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false
    }));
    this.aura.scale.setScalar(4.6);
    this.aura.position.y = 0.4;
    this.group.add(this.aura);

    // 脚下的小云朵，让 Clawd 像坐在云上
    this.cloud = new THREE.Sprite(new THREE.SpriteMaterial({
      map: cloudTexture(9), color: 0xFFFFFF, transparent: true, opacity: 0.92,
      depthWrite: false, toneMapped: false
    }));
    this.cloud.scale.set(5.6, 2.3, 1);
    this.cloud.position.set(0, -1.75, -0.3);
    this.group.add(this.cloud);

    // 状态
    this.time = 0;
    this.blink = 0;
    this.nextBlink = 2.4;
    this.hop = 0;
    this.speed = 0;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this._tmp = new THREE.Vector3();
    this._local = new THREE.Vector3();
    this.look = new THREE.Vector2();
    this.tilt = new THREE.Vector2();
    this.ready = false;
  }

  setPosition(v) {
    this.pos.copy(v);
    this.group.position.copy(v);
  }

  /* 让身体朝向相机（保持可读的正面），同时允许轻微侧倾 */
  update(dt, time, cameraPos, pointer, energy = 0) {
    this.time = time;
    const bob = Math.sin(time * 1.6) * 0.07 + Math.sin(time * 0.63) * 0.04;
    this.group.position.set(this.pos.x, this.pos.y + bob, this.pos.z);

    // 朝向：面向相机但不过度翻转
    this._tmp.copy(cameraPos);
    this._tmp.y += 0.6;
    this.group.lookAt(this._tmp);

    // 头部看向指针 / 相机前下方
    this._local.copy(this._tmp);
    this.group.worldToLocal(this._local);
    const yaw = clamp(Math.atan2(this._local.x, this._local.z) * 0.55, -0.55, 0.55);
    const pitch = clamp(-Math.atan2(this._local.y - 1.2, this._local.z) * 0.35, -0.3, 0.3);
    this.head.rotation.y += (yaw - this.head.rotation.y) * Math.min(1, dt * 4.5);
    this.head.rotation.x += (pitch - this.head.rotation.x) * Math.min(1, dt * 4.5);

    // 指针带来的身体侧倾
    this.tilt.x += (pointer.x * 0.16 - this.tilt.x) * Math.min(1, dt * 3);
    this.tilt.y += (pointer.y * 0.1 - this.tilt.y) * Math.min(1, dt * 3);
    this.group.rotation.z = this.tilt.x;
    this.group.rotation.x = -this.tilt.y * 0.5;

    // 眨眼
    this.nextBlink -= dt;
    if (this.nextBlink <= 0) {
      this.blink = 1;
      this.nextBlink = 2.6 + Math.random() * 3.4;
    }
    if (this.blink > 0) {
      this.blink = Math.max(0, this.blink - dt * 5.5);
      const s = this.blink > 0.5 ? 1 - (1 - this.blink) * 1.9 : 0.05 + this.blink * 1.9;
      for (const e of this.eyes) e.scale.y = clamp(s, 0.05, 1);
    } else {
      for (const e of this.eyes) e.scale.y = 1;
    }

    // 腿：漂浮时轻微划水
    const walk = 0.5 + energy * 1.4;
    for (const l of this.legs) {
      l.pivot.rotation.x = Math.sin(time * 2.2 * walk + l.phase) * 0.22;
      l.pivot.rotation.z = l.sx * 0.08;
    }

    // 跳跃（切换地层时）
    if (this.hop > 0) {
      this.hop = Math.max(0, this.hop - dt * 2.2);
      const k = easeOut(1 - this.hop / 1);
      this.group.position.y += Math.sin(k * Math.PI) * 0.45 * this.hop;
    }

    // 光晕呼吸
    this.aura.material.opacity = 0.18 + energy * 0.18 + Math.sin(time * 1.3) * 0.03;
  }

  hopOnce() {
    this.hop = 1;
  }
}
