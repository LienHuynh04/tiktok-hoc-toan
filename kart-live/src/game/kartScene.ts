// Cảnh 3D đường đua kart bằng Three.js: đường nhựa dọc bãi biển (cát + biển +
// cọ + hải đăng), kart dựng từ khối cơ bản, hiệu ứng lửa nitro, khiên, hào quang
// vinh danh, thùng dầu/vũng nhớt và đệm tăng tốc. Mọi mô hình đều tự dựng bằng
// hình học cơ bản + texture vẽ trên canvas — không dùng tài nguyên ngoài.
// Vị trí xe nội suy từ ảnh chụp engine (dist + speed) để chuyển động mượt.

import * as THREE from 'three';
import { KART_COLORS, type KartView } from './kart';

type RacerView = KartView['racers'][number];

const LANE_X = 3.35; // làn -1/0/1 -> x = -3.35 / 0 / 3.35
const TRACK_END = 1200;

// RNG tất định để stage và bản xem trước dựng cảnh giống hệt nhau
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roadTexture(): THREE.CanvasTexture {
  const tex = canvasTexture(256, 256, (g) => {
    g.fillStyle = '#3a3f47';
    g.fillRect(0, 0, 256, 256);
    // hạt nhựa đường
    g.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 260; i++) g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    // vạch biên liền
    g.fillStyle = '#f3f4f6';
    g.fillRect(6, 0, 7, 256);
    g.fillRect(243, 0, 7, 256);
    // vạch làn đứt
    g.fillRect(82, 10, 8, 120);
    g.fillRect(166, 10, 8, 120);
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 86); // 1200m / ~14m mỗi ô
  return tex;
}

function skyTexture(): THREE.CanvasTexture {
  return canvasTexture(16, 512, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#2b6fd6');
    gr.addColorStop(0.45, '#79bdf2');
    gr.addColorStop(0.78, '#cdeffb');
    gr.addColorStop(1, '#ffedc4');
    g.fillStyle = gr;
    g.fillRect(0, 0, 16, 512);
  });
}

function glowSprite(inner: string, outer: string): THREE.Sprite {
  const tex = canvasTexture(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, inner);
    gr.addColorStop(0.4, outer);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  return new THREE.Sprite(m);
}

function cloudSprite(): THREE.Sprite {
  const tex = canvasTexture(256, 128, (g) => {
    g.fillStyle = 'rgba(255,255,255,0.92)';
    for (const [x, y, r] of [
      [70, 78, 34],
      [118, 62, 44],
      [172, 76, 36],
      [128, 86, 40],
    ] as const) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.95 }));
  s.scale.set(34, 17, 1);
  return s;
}

function bannerTexture(text: string, bg: string, fg: string): THREE.CanvasTexture {
  return canvasTexture(1024, 160, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 1024, 160);
    // viền caro cờ đích
    const s = 32;
    for (let x = 0; x < 1024; x += s) {
      for (let y = 0; y < 32; y += s / 2) {
        g.fillStyle = (x / s + y / (s / 2)) % 2 === 0 ? '#111827' : '#f9fafb';
        g.fillRect(x, y, s, s / 2);
        g.fillStyle = (x / s + y / (s / 2)) % 2 === 0 ? '#f9fafb' : '#111827';
        g.fillRect(x, 128 + y, s, s / 2);
      }
    }
    g.font = '900 84px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = fg;
    g.fillText(text, 512, 84);
  });
}

function padTexture(): THREE.CanvasTexture {
  const tex = canvasTexture(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(14,165,233,0.35)';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#7dd3fc';
    g.lineWidth = 12;
    for (const y of [88, 50]) {
      g.beginPath();
      g.moveTo(24, y + 22);
      g.lineTo(64, y - 14);
      g.lineTo(104, y + 22);
      g.stroke();
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

interface KartObj {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  flame: THREE.Group;
  shield: THREE.Mesh;
  aura: THREE.Mesh;
  stars: THREE.Group;
  label: THREE.Sprite;
  labelKey: string;
  x: number; // x đang hiển thị (nội suy)
  phase: number;
}

function makeLabel(nickname: string, colorHex: number, nitroPct: number, place: number): { sprite: THREE.Sprite; key: string } {
  const key = `${nickname}|${colorHex}|${Math.floor(nitroPct / 10)}|${place}`;
  const color = `#${colorHex.toString(16).padStart(6, '0')}`;
  const tex = canvasTexture(512, 148, (g) => {
    // biển tên
    g.fillStyle = 'rgba(10,14,24,0.78)';
    g.beginPath();
    g.roundRect(56, 6, 400, 74, 22);
    g.fill();
    g.fillStyle = color;
    g.beginPath();
    g.arc(102, 43, 24, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.font = '900 34px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(place > 0 ? `#${place}` : '•', 102, 56);
    g.font = '700 40px system-ui, sans-serif';
    g.textAlign = 'left';
    const name = nickname.length > 13 ? nickname.slice(0, 12) + '…' : nickname;
    g.fillText(name, 140, 58);
    // thanh nitro dưới biển tên
    g.fillStyle = 'rgba(10,14,24,0.78)';
    g.beginPath();
    g.roundRect(56, 92, 400, 34, 16);
    g.fill();
    const w = Math.max(0, Math.min(392, (nitroPct / 100) * 392));
    if (w > 4) {
      g.fillStyle = nitroPct >= 100 ? '#facc15' : '#38bdf8';
      g.beginPath();
      g.roundRect(60, 96, w, 26, 13);
      g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.font = '700 24px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(nitroPct >= 100 ? 'NITRO ĐẦY!' : 'NITRO', 256, 118);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(4.5, 1.3, 1);
  sprite.position.y = 3.05;
  return { sprite, key };
}

function makeKart(colorHex: number, nickname: string): KartObj {
  const color = new THREE.Color(colorHex);
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.25 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 2.5), bodyMat);
  body.position.y = 0.48;
  group.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.3, 0.8), bodyMat);
  nose.position.set(0, 0.44, 1.45);
  group.add(nose);
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.34, 0.9), darkMat);
  cockpit.position.set(0, 0.82, -0.25);
  group.add(cockpit);
  // cánh gió sau
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.42), bodyMat);
  wing.position.set(0, 1.0, -1.28);
  group.add(wing);
  for (const sx of [-0.6, 0.6]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.4, 0.09), darkMat);
    strut.position.set(sx, 0.78, -1.28);
    group.add(strut);
  }
  // tay đua: thân + mũ bảo hiểm
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.4), lightMat);
  torso.position.set(0, 1.0, -0.3);
  group.add(torso);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), new THREE.MeshStandardMaterial({ color: color.clone().offsetHSL(0, 0, 0.18), roughness: 0.25 }));
  helmet.position.set(0, 1.42, -0.28);
  group.add(helmet);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.1), darkMat);
  visor.position.set(0, 1.44, 0.03);
  group.add(visor);
  // ống xả
  for (const sx of [-0.32, 0.32]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 10), darkMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(sx, 0.42, -1.38);
    group.add(pipe);
  }
  // bánh xe
  const wheels: THREE.Mesh[] = [];
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 18);
  const hubGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.32, 12);
  for (const [wx, wz] of [
    [-0.85, 0.95],
    [0.85, 0.95],
    [-0.85, -0.95],
    [0.85, -0.95],
  ] as const) {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.36, wz);
    const hub = new THREE.Mesh(hubGeo, lightMat);
    hub.rotation.z = Math.PI / 2;
    w.add(hub);
    group.add(w);
    wheels.push(w);
  }
  // lửa nitro (2 côn lửa xanh sau ống xả)
  const flame = new THREE.Group();
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const sx of [-0.32, 0.32]) {
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.17, 1.5, 10), flameMat);
    outer.rotation.x = Math.PI / 2;
    outer.position.set(sx, 0.42, -2.2);
    flame.add(outer);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.9, 8), coreMat);
    inner.rotation.x = Math.PI / 2;
    inner.position.set(sx, 0.42, -1.9);
    flame.add(inner);
  }
  flame.visible = false;
  group.add(flame);
  // khiên năng lượng
  const shield = new THREE.Mesh(
    new THREE.SphereGeometry(1.75, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.22, depthWrite: false }),
  );
  shield.position.y = 0.8;
  shield.visible = false;
  group.add(shield);
  // hào quang vinh danh dưới gầm xe
  const aura = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.09, 10, 40),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.9 }),
  );
  aura.rotation.x = Math.PI / 2;
  aura.position.y = 0.12;
  aura.visible = false;
  group.add(aura);
  // sao quay đầu khi bị làm chậm
  const stars = new THREE.Group();
  const starTex = canvasTexture(64, 64, (g) => {
    g.fillStyle = '#fde047';
    g.font = '44px system-ui';
    g.textAlign = 'center';
    g.fillText('★', 32, 46);
  });
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false }));
    s.scale.set(0.5, 0.5, 1);
    s.userData.a = (i / 3) * Math.PI * 2;
    stars.add(s);
  }
  stars.position.y = 2.0;
  stars.visible = false;
  group.add(stars);

  const { sprite: label, key } = makeLabel(nickname, colorHex, 0, 0);
  group.add(label);
  return { group, wheels, flame, shield, aura, stars, label, labelKey: key, x: 0, phase: Math.random() * 6 };
}

function makePalm(rng: () => number): THREE.Group {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x9a6b3f, roughness: 0.9 });
  let x = 0;
  let y = 0;
  let tilt = (rng() - 0.5) * 0.24;
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.16 - i * 0.02, 0.2 - i * 0.02, 1.1, 7), trunkMat);
    x += tilt * 1.1;
    y += 1.0;
    seg.position.set(x, y - 0.5, 0);
    seg.rotation.z = -tilt;
    g.add(seg);
  }
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f9e44, roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.34, 2.6, 4), leafMat);
    const a = (i / 6) * Math.PI * 2;
    leaf.position.set(x + Math.cos(a) * 0.9, y + 0.35, Math.sin(a) * 0.9);
    leaf.rotation.set(Math.sin(a) * 1.15, 0, -Math.cos(a) * 1.15);
    leaf.scale.y = 1;
    g.add(leaf);
  }
  const nutMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), nutMat);
    nut.position.set(x + (rng() - 0.5) * 0.4, y - 0.1, (rng() - 0.5) * 0.4);
    g.add(nut);
  }
  const s = 0.9 + rng() * 0.7;
  g.scale.setScalar(s);
  return g;
}

function makeGantry(text: string, z: number): THREE.Group {
  const g = new THREE.Group();
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
  for (const sx of [-6.4, 6.4]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 7.6, 0.7), pillarMat);
    p.position.set(sx, 3.8, 0);
    g.add(p);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(13.5, 1.9, 0.5), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 }));
  beam.position.set(0, 7.4, 0);
  g.add(beam);
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(12.6, 1.95),
    new THREE.MeshBasicMaterial({ map: bannerTexture(text, '#b91c1c', '#ffffff'), side: THREE.DoubleSide }),
  );
  banner.position.set(0, 7.4, 0.28);
  g.add(banner);
  const bannerBack = banner.clone();
  bannerBack.rotation.y = Math.PI;
  bannerBack.position.z = -0.28;
  g.add(bannerBack);
  g.position.z = z;
  return g;
}

function makeLighthouse(): THREE.Group {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
  const red = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(1.5 - i * 0.18, 1.7 - i * 0.18, 2.6, 14), i % 2 ? red : white);
    seg.position.y = 1.3 + i * 2.6;
    g.add(seg);
  }
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: 0.7 }));
  lamp.position.y = 11.4;
  g.add(lamp);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.4, 12), red);
  roof.position.y = 12.8;
  g.add(roof);
  const glow = glowSprite('rgba(253,224,71,0.9)', 'rgba(245,158,11,0.35)');
  glow.scale.set(9, 9, 1);
  glow.position.y = 11.4;
  g.add(glow);
  return g;
}

function makeHouse(rng: () => number): THREE.Group {
  const g = new THREE.Group();
  const wallColors = [0xfde68a, 0xfca5a5, 0xa7f3d0, 0xbfdbfe, 0xfbcfe8];
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(5, 3.4, 4),
    new THREE.MeshStandardMaterial({ color: wallColors[Math.floor(rng() * wallColors.length)], roughness: 0.8 }),
  );
  wall.position.y = 1.7;
  g.add(wall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.1, 2.0, 4), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 }));
  roof.position.y = 4.4;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  return g;
}

interface HazardObj {
  group: THREE.Group;
  key: string;
}
interface PadObj {
  mesh: THREE.Mesh;
  key: string;
}

export class KartScene3D {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private karts = new Map<string, KartObj>();
  private hazards = new Map<string, HazardObj>();
  private pads = new Map<string, PadObj>();
  private clouds: THREE.Sprite[] = [];
  private raf = 0;
  private view: KartView | null = null;
  private focusZ = 0;
  private lastFrameAt = 0;
  private disposed = false;
  private barrelTex: THREE.CanvasTexture;
  private padTex: THREE.CanvasTexture;

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(60, 1080 / 1920, 0.1, 900);
    this.scene.background = skyTexture();
    this.scene.fog = new THREE.Fog(0xcdeffb, 110, 420);

    const hemi = new THREE.HemisphereLight(0xeaf6ff, 0xd9b380, 1.05);
    this.scene.add(hemi);
    const sunLight = new THREE.DirectionalLight(0xfff2d9, 1.6);
    sunLight.position.set(40, 80, -30);
    this.scene.add(sunLight);

    // mặt trời + mây
    const sun = glowSprite('rgba(255,244,200,1)', 'rgba(251,191,36,0.45)');
    sun.scale.set(60, 60, 1);
    sun.position.set(120, 95, 700);
    this.scene.add(sun);
    const rngC = mulberry32(42);
    for (let i = 0; i < 12; i++) {
      const c = cloudSprite();
      c.position.set((rngC() - 0.5) * 320, 42 + rngC() * 40, rngC() * 1300);
      c.scale.multiplyScalar(0.8 + rngC() * 1.1);
      this.clouds.push(c);
      this.scene.add(c);
    }

    // cát nền + biển bên phải
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(700, 1500), new THREE.MeshStandardMaterial({ color: 0xeed9a4, roughness: 1 }));
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(-60, -0.05, 620);
    this.scene.add(sand);
    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 1500),
      new THREE.MeshPhongMaterial({ color: 0x1593c4, shininess: 120, specular: 0xbfe9ff }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(232, -0.02, 620);
    this.scene.add(sea);
    const foam = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1500), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(19.5, 0.0, 620);
    this.scene.add(foam);

    // đường đua
    const road = new THREE.Mesh(new THREE.PlaneGeometry(11.4, 1290), new THREE.MeshStandardMaterial({ map: roadTexture(), roughness: 0.95 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 615);
    this.scene.add(road);
    // vạch đích caro
    const finishTex = canvasTexture(256, 64, (g) => {
      const s = 16;
      for (let x = 0; x < 256; x += s)
        for (let y = 0; y < 64; y += s) {
          g.fillStyle = (x / s + y / s) % 2 === 0 ? '#111827' : '#f9fafb';
          g.fillRect(x, y, s, s);
        }
    });
    const finishLine = new THREE.Mesh(new THREE.PlaneGeometry(11.4, 2.4), new THREE.MeshBasicMaterial({ map: finishTex }));
    finishLine.rotation.x = -Math.PI / 2;
    finishLine.position.set(0, 0.02, TRACK_END);
    this.scene.add(finishLine);

    this.scene.add(makeGantry('🏁 XUẤT PHÁT', 0));
    this.scene.add(makeGantry('🏁 VỀ ĐÍCH', TRACK_END));

    // cảnh quan hai bên đường
    const rng = mulberry32(7);
    for (let i = 0; i < 52; i++) {
      const palm = makePalm(rng);
      const left = rng() < 0.62;
      palm.position.set(left ? -8.5 - rng() * 15 : 8.8 + rng() * 5.5, 0, rng() * 1260 - 20);
      palm.rotation.y = rng() * Math.PI * 2;
      this.scene.add(palm);
    }
    for (let i = 0; i < 7; i++) {
      const house = makeHouse(rng);
      house.position.set(-17 - rng() * 14, 0, 90 + i * 165 + rng() * 60);
      house.rotation.y = 0.4 + rng() * 0.5;
      this.scene.add(house);
    }
    const light = makeLighthouse();
    light.position.set(15.5, 0, TRACK_END - 55);
    this.scene.add(light);

    this.barrelTex = canvasTexture(128, 128, (g) => {
      g.fillStyle = '#b45309';
      g.fillRect(0, 0, 128, 128);
      g.fillStyle = '#f59e0b';
      g.fillRect(0, 22, 128, 20);
      g.fillRect(0, 86, 128, 20);
      g.fillStyle = '#111827';
      g.font = '900 52px system-ui';
      g.textAlign = 'center';
      g.fillText('!', 64, 76);
    });
    this.padTex = padTexture();

    this.resize();
    const loop = () => {
      if (this.disposed) return;
      this.frame();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  private resize() {
    const w = this.container.clientWidth || 1080;
    const h = this.container.clientHeight || 1920;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setView(v: KartView | null) {
    this.view = v;
  }

  private hazardMesh(kind: 'barrel' | 'oil'): THREE.Group {
    const g = new THREE.Group();
    if (kind === 'barrel') {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.15, 14), new THREE.MeshStandardMaterial({ map: this.barrelTex, roughness: 0.7 }));
      b.position.y = 0.58;
      g.add(b);
    } else {
      const o = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), new THREE.MeshPhongMaterial({ color: 0x111827, shininess: 160, specular: 0x888888 }));
      o.rotation.x = -Math.PI / 2;
      o.position.y = 0.03;
      g.add(o);
      const o2 = new THREE.Mesh(new THREE.CircleGeometry(0.8, 14), o.material);
      o2.rotation.x = -Math.PI / 2;
      o2.position.set(0.9, 0.03, 0.7);
      g.add(o2);
    }
    return g;
  }

  private frame() {
    const v = this.view;
    const nowMs = Date.now();
    const t = nowMs / 1000;
    if (!v) {
      this.camera.position.set(0, 9, -16);
      this.camera.lookAt(0, 1, 30);
      this.renderer.render(this.scene, this.camera);
      return;
    }
    const dtView = Math.min(0.65, Math.max(0, (nowMs - v.at) / 1000));
    const distOf = (r: RacerView) => r.dist + (v.phase === 'race' ? r.speed * dtView : 0);

    // ——— xe ———
    const seen = new Set<string>();
    for (const r of v.racers) {
      seen.add(r.username);
      let ko = this.karts.get(r.username);
      if (!ko) {
        ko = makeKart(KART_COLORS[r.color] ?? 0x94a3b8, r.nickname);
        ko.x = r.lane * LANE_X;
        this.karts.set(r.username, ko);
        this.scene.add(ko.group);
      }
      const d = distOf(r);
      const targetX = r.lane * LANE_X;
      ko.x += (targetX - ko.x) * 0.16;
      ko.group.position.set(ko.x, Math.sin(t * 24 + ko.phase) * 0.035 + 0.02, d);
      ko.group.rotation.z = THREE.MathUtils.clamp(-(targetX - ko.x) * 0.05, -0.14, 0.14) + (r.slowed ? Math.sin(t * 18 + ko.phase) * 0.045 : 0);
      ko.group.rotation.y = THREE.MathUtils.clamp(-(targetX - ko.x) * 0.03, -0.1, 0.1);
      const spin = t * r.speed * 1.4;
      for (const w of ko.wheels) w.rotation.x = spin;
      ko.flame.visible = r.boosting && v.phase === 'race';
      if (ko.flame.visible) {
        const f = 0.85 + Math.sin(t * 47 + ko.phase) * 0.25;
        ko.flame.scale.set(1, 1, f);
      }
      ko.shield.visible = r.shielded;
      if (r.shielded) (ko.shield.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(t * 5) * 0.06;
      ko.aura.visible = r.aura;
      if (r.aura) {
        ko.aura.rotation.z = t * 2.2;
        const s = r.auraVip ? 1.3 + Math.sin(t * 6) * 0.08 : 1;
        ko.aura.scale.set(s, s, 1);
        (ko.aura.material as THREE.MeshBasicMaterial).color.set(r.auraVip ? 0xf59e0b : 0xfde047);
      }
      ko.stars.visible = r.slowed;
      if (r.slowed) {
        for (const s of ko.stars.children) {
          const a = (s.userData.a as number) + t * 4;
          s.position.set(Math.cos(a) * 0.85, Math.sin(t * 3 + a) * 0.15, Math.sin(a) * 0.85);
        }
      }
      // biển tên: chỉ vẽ lại canvas khi nitro đổi nấc 10% hoặc thứ hạng đổi
      const key = `${r.nickname}|${KART_COLORS[r.color] ?? 0x94a3b8}|${Math.floor(r.nitro / 10)}|${r.place}`;
      if (key !== ko.labelKey) {
        const { sprite } = makeLabel(r.nickname, KART_COLORS[r.color] ?? 0x94a3b8, r.nitro, r.place);
        ko.label.material.map?.dispose();
        ko.label.material.map = sprite.material.map;
        ko.label.material.needsUpdate = true;
        ko.labelKey = key;
      }
    }
    for (const [u, ko] of this.karts) {
      if (!seen.has(u)) {
        this.scene.remove(ko.group);
        this.karts.delete(u);
      }
    }

    // ——— chướng ngại + đệm ———
    const hzSeen = new Set<string>();
    for (const hz of v.hazards) {
      for (const lane of hz.blocked) {
        const key = `${hz.dist}|${lane}|${hz.kind}`;
        hzSeen.add(key);
        if (!this.hazards.has(key)) {
          const group = this.hazardMesh(hz.kind);
          group.position.set(lane * LANE_X, 0, hz.dist);
          this.hazards.set(key, { group, key });
          this.scene.add(group);
        }
      }
    }
    for (const [key, o] of this.hazards) {
      if (!hzSeen.has(key)) {
        this.scene.remove(o.group);
        this.hazards.delete(key);
      }
    }
    const padSeen = new Set<string>();
    for (const p of v.pads) {
      const key = `${p.dist}|${p.lane}`;
      padSeen.add(key);
      if (!this.pads.has(key)) {
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2.7, 3.4),
          new THREE.MeshBasicMaterial({ map: this.padTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(p.lane * LANE_X, 0.04, p.dist);
        this.pads.set(key, { mesh, key });
        this.scene.add(mesh);
      }
    }
    for (const [key, o] of this.pads) {
      if (!padSeen.has(key)) {
        this.scene.remove(o.mesh);
        this.pads.delete(key);
      } else {
        const s = 1 + Math.sin(t * 6 + p0(key)) * 0.07;
        o.mesh.scale.set(s, s, 1);
      }
    }

    // ——— camera bám đoàn đua (lerp theo THỜI GIAN thật, không phụ thuộc fps) ———
    const dists = v.racers.map(distOf).sort((a, b) => a - b);
    const medianD = dists.length ? dists[Math.floor(dists.length / 2)] : 0;
    const targetFocus = v.phase === 'lobby' || v.phase === 'countdown' ? 6 : Math.max(6, medianD - 8);
    const dtFrame = Math.min(0.1, Math.max(0.001, (nowMs - this.lastFrameAt) / 1000));
    this.lastFrameAt = nowMs;
    let step = 1 - Math.exp(-dtFrame * 3);
    if (Math.abs(targetFocus - this.focusZ) > 30) step = Math.max(step, 0.55); // lệch xa: bắt kịp trong vài khung hình
    this.focusZ += (targetFocus - this.focusZ) * step;
    const cam = this.camera;
    cam.position.set(Math.sin(t * 0.11) * 1.2, 8.2, this.focusZ - 17.5);
    cam.lookAt(0, 1.0, this.focusZ + 20);

    // mây trôi chậm
    for (const c of this.clouds) {
      c.position.x += 0.008;
      if (c.position.x > 190) c.position.x = -190;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

function p0(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 97;
  return h / 10;
}
