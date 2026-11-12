import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { HeroState } from './useHero';
import { blocksInRange, riverAt, seeded, BRIDGE_DECK_Y, type Block } from './city3d';
import { anchorsInRange } from './city3d';
import type { FxEvent, HeroScene } from './hero';
import './swing.css';

// ============================================================================
// Sân khấu 3D Spider Hero — Three.js, mọi mesh/texture đều sinh bằng code.
// Trang stage: rAF đọc thẳng engine (60fps). Trang điều khiển: vẽ theo ảnh
// chụp view.scene (bản xem trước, chấp nhận giật nhẹ như các phòng khác).
// ============================================================================

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat = false): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function buildingTexture(base: string, frame: string, litRatio: number, seed: number): THREE.Texture {
  return canvasTex(96, 192, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const rnd = seeded(seed);
    const cols = 6;
    const rows = 14;
    const cw = w / cols;
    const ch = h / rows;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const lit = rnd() < litRatio;
        g.fillStyle = lit ? '#ffd98a' : frame;
        g.fillRect(x * cw + 2, y * ch + 3, cw - 4, ch - 6);
        if (!lit && rnd() < 0.3) {
          g.fillStyle = 'rgba(255,255,255,0.25)';
          g.fillRect(x * cw + 2, y * ch + 3, cw - 4, 3);
        }
      }
    }
  });
}

function webDiscTexture(): THREE.Texture {
  return canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.lineWidth = 2;
    const cx = w / 2;
    const cy = h / 2;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(a) * cx, cy + Math.sin(a) * cy);
      g.stroke();
    }
    for (let r = 20; r < cx; r += 18) {
      g.beginPath();
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const rr = r + Math.sin(a * 5) * 3;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
  });
}

function glowTexture(): THREE.Texture {
  return canvasTex(128, 128, (g, w, h) => {
    const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

// ---------- dựng hình Hero: anh hùng nguyên bản, đỏ sẫm + xanh navy, huy hiệu bạc ----------
interface HeroRig {
  group: THREE.Group;
  torso: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  foreL: THREE.Group;
  foreR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
}

function buildHero(): HeroRig {
  const S = 1.7; // phóng to 1.7 lần cho dễ nhìn trên sóng
  const navy = new THREE.MeshStandardMaterial({ color: 0x1d2f52, roughness: 0.55, metalness: 0.1 });
  const red = new THREE.MeshStandardMaterial({ color: 0x9e1b25, roughness: 0.5, metalness: 0.1 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xd7dee8, roughness: 0.3, metalness: 0.85 });
  const lens = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbfe3ff, emissiveIntensity: 0.7, roughness: 0.2 });

  const group = new THREE.Group();
  const torso = new THREE.Group();
  torso.position.y = 0.1 * S;
  group.add(torso);

  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.30 * S, 0.42 * S, 6, 14), red);
  chest.position.y = 0.42 * S;
  chest.castShadow = true;
  torso.add(chest);
  // huy hiệu tia bạc trên ngực — dấu hiệu riêng, không dùng logo của ai
  const badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.13 * S), silver);
  badge.position.set(0, 0.52 * S, 0.30 * S);
  badge.scale.set(1, 1.5, 0.4);
  torso.add(badge);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.30 * S, 0.32 * S, 0.10 * S, 14), silver);
  belt.position.y = 0.02 * S;
  torso.add(belt);

  const headG = new THREE.Group();
  headG.position.y = 0.98 * S;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21 * S, 20, 16), navy);
  head.castShadow = true;
  headG.add(head);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055 * S, 10, 8), lens);
    eye.position.set(sx * 0.085 * S, 0.02 * S, 0.175 * S);
    eye.scale.set(1.15, 0.75, 0.5);
    headG.add(eye);
  }
  torso.add(headG);

  function arm(side: 1 | -1) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.38 * S, 0.72 * S, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.085 * S, 0.30 * S, 4, 10), navy);
    upper.position.y = -0.20 * S;
    upper.castShadow = true;
    shoulder.add(upper);
    const fore = new THREE.Group();
    fore.position.y = -0.40 * S;
    const foreMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075 * S, 0.28 * S, 4, 10), navy);
    foreMesh.position.y = -0.18 * S;
    foreMesh.castShadow = true;
    fore.add(foreMesh);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.09 * S, 10, 8), red);
    glove.position.y = -0.38 * S;
    fore.add(glove);
    shoulder.add(fore);
    torso.add(shoulder);
    return { shoulder, fore };
  }
  function leg(side: 1 | -1) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.16 * S, -0.05 * S, 0);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.105 * S, 0.34 * S, 4, 10), navy);
    thigh.position.y = -0.24 * S;
    thigh.castShadow = true;
    hip.add(thigh);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.15 * S, 0.34 * S, 0.22 * S), red);
    boot.position.set(0, -0.62 * S, 0.04 * S);
    boot.castShadow = true;
    hip.add(boot);
    torso.add(hip);
    return hip;
  }
  const aL = arm(-1);
  const aR = arm(1);
  return { group, torso, armL: aL.shoulder, armR: aR.shoulder, foreL: aL.fore, foreR: aR.fore, legL: leg(-1), legR: leg(1) };
}

const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} km` : `${m} m`);

export function HeroStage({ game }: { game: HeroState }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    const resize = () => {
      const w = mount.clientWidth || 1080;
      const h = mount.clientHeight || 1920;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x93c7ec);
    scene.fog = new THREE.Fog(0xa9cfee, 130, 460);
    const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.1, 1200);

    const hemi = new THREE.HemisphereLight(0xd6ecff, 0x77694f, 1.05);
    scene.add(hemi);
    // đèn viền từ phía sau-trái: tách hero khỏi nền toà nhà tối
    const rim = new THREE.DirectionalLight(0xbcd7ff, 0.6);
    scene.add(rim);
    scene.add(rim.target);
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -110;
    sun.shadow.camera.right = 110;
    sun.shadow.camera.top = 110;
    sun.shadow.camera.bottom = -60;
    sun.shadow.camera.far = 400;
    sun.shadow.bias = -0.0006;
    scene.add(sun);
    scene.add(sun.target);

    // mặt trời + mây
    const glowTex = glowTexture();
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffe9a8, transparent: true, opacity: 0.95, depthWrite: false }));
    sunSprite.scale.set(90, 90, 1);
    scene.add(sunSprite);
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x5d6a76, roughness: 1, transparent: true, opacity: 0.95 });
    const clouds: THREE.Group[] = [];
    for (let i = 0; i < 14; i++) {
      const cl = new THREE.Group();
      const rnd = seeded(900 + i);
      const n = 3 + Math.floor(rnd() * 3);
      for (let j = 0; j < n; j++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(4 + rnd() * 6, 12, 10), cloudMat);
        s.position.set(j * 5 - n * 2.2, rnd() * 2, rnd() * 4 - 2);
        s.scale.y = 0.45;
        cl.add(s);
      }
      cl.position.set(i * 47 - 100, 122 + rnd() * 55, -70 + rnd() * 130);
      clouds.push(cl);
      scene.add(cl);
    }

    // mặt đất + đường xe
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 700), new THREE.MeshStandardMaterial({ color: 0x707a72, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.08;
    ground.receiveShadow = true;
    scene.add(ground);
    const roadTex = canvasTex(
      128,
      128,
      (g, w, h) => {
        g.fillStyle = '#3c434b';
        g.fillRect(0, 0, w, h);
        g.fillStyle = '#f5d76e';
        g.fillRect(0, h / 2 - 3, w / 2, 6);
      },
      true,
    );
    roadTex.repeat.set(60, 1);
    const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.95 });
    const roads: THREE.Mesh[] = [];
    for (const z of [-16, 16]) {
      const road = new THREE.Mesh(new THREE.BoxGeometry(1400, 0.06, 9), roadMat);
      road.position.set(0, 0.02, z);
      road.receiveShadow = true;
      roads.push(road);
      scene.add(road);
    }

    // xe cộ
    const carBodyGeo = new THREE.BoxGeometry(4.2, 1.1, 1.9);
    const carTopGeo = new THREE.BoxGeometry(2.2, 0.8, 1.7);
    const carMats = [0xd64545, 0x3f7fbf, 0xe8b93e, 0xdadfe5, 0x53a06a, 0x8a5fc0].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.4 }),
    );
    const carTopMat = new THREE.MeshStandardMaterial({ color: 0x22303f, roughness: 0.15, metalness: 0.6 });
    interface Car {
      g: THREE.Group;
      speed: number;
      lane: number;
    }
    const cars: Car[] = [];
    for (let i = 0; i < 12; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(carBodyGeo, carMats[i % carMats.length]);
      body.position.y = 0.75;
      body.castShadow = true;
      const top = new THREE.Mesh(carTopGeo, carTopMat);
      top.position.y = 1.65;
      g.add(body, top);
      const lane = i % 4;
      const z = [-19.5, -12.5, 12.5, 19.5][lane];
      g.position.set(i * 61 - 150, 0, z);
      if (lane < 2) g.rotation.y = Math.PI;
      scene.add(g);
      cars.push({ g, speed: (lane < 2 ? -1 : 1) * (8 + (i % 5) * 2.2), lane });
    }

    // ---------- pool toà nhà / cầu ----------
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const mats = [
      new THREE.MeshStandardMaterial({ map: buildingTexture('#7fb2d9', '#33506b', 0.16, 11), roughness: 0.25, metalness: 0.35 }),
      new THREE.MeshStandardMaterial({ map: buildingTexture('#c9a184', '#5d4433', 0.2, 22), roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: buildingTexture('#5b7290', '#1f303f', 0.3, 33), roughness: 0.2, metalness: 0.5 }),
      new THREE.MeshStandardMaterial({ map: buildingTexture('#b9c2cc', '#54616e', 0.12, 44), roughness: 0.6 }),
    ];
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8d9299, roughness: 0.95 });
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x5da24e, roughness: 1 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3e7d32, roughness: 1 });
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xe8a33d, roughness: 0.6 });
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xd8dee6, roughness: 0.5 });

    const blockGroups = new Map<number, THREE.Group>();
    function buildBlock(b: Block): THREE.Group {
      const g = new THREE.Group();
      const rnd = seeded(3000 + b.i * 17);
      const mat = mats[b.kind % mats.length];
      const tower = (h: number, z: number, wMul = 1) => {
        const m = new THREE.Mesh(unitBox, mat);
        m.scale.set(b.w * wMul, h, 20);
        m.position.set(b.x + (b.w * wMul) / 2, h / 2, z);
        m.castShadow = true;
        m.receiveShadow = true;
        g.add(m);
        // ăng-ten trên tháp cao
        if (h > 85) {
          const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 9, 6), towerMat);
          ant.position.set(b.x + b.w / 2, h + 4.5, z);
          g.add(ant);
        }
      };
      tower(b.leftH, -32);
      tower(b.rightH, 32);
      if (b.park) {
        const lawn = new THREE.Mesh(unitBox, grassMat);
        lawn.scale.set(b.w, 0.5, 22);
        lawn.position.set(b.x + b.w / 2, 0.25, 0);
        lawn.receiveShadow = true;
        g.add(lawn);
        for (let i = 0; i < 5; i++) {
          const tx = b.x + 3 + rnd() * (b.w - 6);
          const tz = -8 + rnd() * 16;
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.4, 6), trunkMat);
          trunk.position.set(tx, 1.4, tz);
          const leaf = new THREE.Mesh(new THREE.ConeGeometry(2.2 + rnd() * 1.4, 5 + rnd() * 3, 8), leafMat);
          leaf.position.set(tx, 5, tz);
          leaf.castShadow = true;
          g.add(trunk, leaf);
        }
      } else if (b.midH > 0) {
        const mid = new THREE.Mesh(unitBox, mat);
        mid.scale.set(b.w, b.midH, 19);
        mid.position.set(b.x + b.w / 2, b.midH / 2, 0);
        mid.castShadow = true;
        mid.receiveShadow = true;
        g.add(mid);
        const cap = new THREE.Mesh(unitBox, roofMat);
        cap.scale.set(b.w + 0.7, 0.5, 19.7);
        cap.position.set(b.x + b.w / 2, b.midH + 0.25, 0);
        g.add(cap);
        // đồ trên nóc: hộp điều hoà / bể nước
        const nProps = 1 + Math.floor(rnd() * 3);
        for (let i = 0; i < nProps; i++) {
          if (rnd() < 0.4) {
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.8, 10), trunkMat);
            tank.position.set(b.x + 3 + rnd() * (b.w - 6), b.midH + 1.9, -5 + rnd() * 10);
            tank.castShadow = true;
            g.add(tank);
          } else {
            const ac = new THREE.Mesh(unitBox, roofMat);
            ac.scale.set(2.2, 1.1, 1.8);
            ac.position.set(b.x + 2 + rnd() * (b.w - 4), b.midH + 1.05, -6 + rnd() * 12);
            ac.castShadow = true;
            g.add(ac);
          }
        }
      }
      if (b.crane) {
        const topY = Math.max(b.leftH, b.rightH);
        const cx = b.x + b.w / 2;
        const mast = new THREE.Mesh(unitBox, craneMat);
        mast.scale.set(1.1, 14, 1.1);
        mast.position.set(cx, topY + 7, 0);
        const jib = new THREE.Mesh(unitBox, craneMat);
        jib.scale.set(17, 0.9, 0.9);
        jib.position.set(cx + 4, topY + 13.6, 0);
        g.add(mast, jib);
      }
      return g;
    }

    // cầu + sông
    const waterTex = canvasTex(
      128,
      128,
      (g, w, h) => {
        g.fillStyle = '#2e7cb5';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(255,255,255,0.35)';
        g.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
          g.beginPath();
          const y = 10 + i * 17;
          for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x / 14 + i) * 3);
          g.stroke();
        }
      },
      true,
    );
    waterTex.repeat.set(8, 8);
    const waterMat = new THREE.MeshStandardMaterial({ map: waterTex, transparent: true, opacity: 0.92, roughness: 0.25, metalness: 0.3 });
    const bridgeGroups = new Map<number, THREE.Group>();
    function buildBridge(x0: number, x1: number): THREE.Group {
      const g = new THREE.Group();
      const w = x1 - x0;
      const water = new THREE.Mesh(new THREE.PlaneGeometry(w + 60, 620), waterMat);
      water.rotation.x = -Math.PI / 2;
      water.position.set(x0 + w / 2, 0.05, 0);
      g.add(water);
      const deck = new THREE.Mesh(unitBox, roofMat);
      deck.scale.set(w, 1.2, 24);
      deck.position.set(x0 + w / 2, BRIDGE_DECK_Y - 0.6, 0);
      deck.castShadow = true;
      deck.receiveShadow = true;
      g.add(deck);
      const cablePts: number[] = [];
      for (const px of [x0 + 30, x1 - 30]) {
        for (const pz of [-10, 10]) {
          const py = new THREE.Mesh(unitBox, towerMat);
          py.scale.set(2.4, 62, 2.4);
          py.position.set(px, 31, pz);
          py.castShadow = true;
          g.add(py);
        }
        // dây văng từ đỉnh tháp xuống mặt cầu
        for (let k = 0; k <= 6; k++) {
          const dx = x0 + (w * k) / 6;
          cablePts.push(px, 60, -10, dx, BRIDGE_DECK_Y, -10.6, px, 60, 10, dx, BRIDGE_DECK_Y, 10.6);
        }
      }
      const cableGeo = new THREE.BufferGeometry();
      cableGeo.setAttribute('position', new THREE.Float32BufferAttribute(cablePts, 3));
      const cables = new THREE.LineSegments(cableGeo, new THREE.LineBasicMaterial({ color: 0xe8eef4, transparent: true, opacity: 0.8 }));
      g.add(cables);
      return g;
    }

    // ---------- hero + dây tơ chính ----------
    const hero = buildHero();
    scene.add(hero.group);
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1, 5), ropeMat);
    rope.visible = false;
    scene.add(rope);

    // ---------- tơ trang trí: LineSegments gộp chung 1 draw call ----------
    const MAXSEG = 260;
    const segPos = new Float32Array(MAXSEG * 6);
    const segCol = new Float32Array(MAXSEG * 6);
    const segGeo = new THREE.BufferGeometry();
    segGeo.setAttribute('position', new THREE.BufferAttribute(segPos, 3).setUsage(THREE.DynamicDrawUsage));
    segGeo.setAttribute('color', new THREE.BufferAttribute(segCol, 3).setUsage(THREE.DynamicDrawUsage));
    const segLines = new THREE.LineSegments(segGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }));
    segLines.frustumCulled = false;
    scene.add(segLines);
    interface LocalStrand {
      x1: number; y1: number; z1: number; x2: number; y2: number; z2: number; born: number; ttl: number; gold: boolean;
    }
    let localStrands: LocalStrand[] = [];

    // ---------- hạt hiệu ứng (điểm sáng) ----------
    const MAXP = 320;
    const pPos = new Float32Array(MAXP * 3);
    const pCol = new Float32Array(MAXP * 3);
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
    const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 1.15, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    points.frustumCulled = false;
    scene.add(points);

    // ---------- đĩa mạng nhện dán tường (bão tơ) + vòng nổ ----------
    const discTex = webDiscTexture();
    interface Disc { m: THREE.Mesh; born: number; ttl: number }
    const discs: Disc[] = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(13, 13),
        new THREE.MeshBasicMaterial({ map: discTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
      );
      m.visible = false;
      scene.add(m);
      discs.push({ m, born: 0, ttl: 2600 });
    }
    let discIdx = 0;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.16, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0 }),
    );
    ring.visible = false;
    scene.add(ring);
    let ringAt = 0;

    // ---------- trạng thái vòng lặp ----------
    let raf = 0;
    let lastFxId = 0;
    const seenFx = new Set<number>();
    let shake = 0;
    let flashVal = 0;
    let lastAmbient = 0;
    let lastDisc = 0;
    let displayRot = 0;
    let prevRot = 0;
    const camPos = new THREE.Vector3(-8.8, 3.4, 7.6); // offset camera so với hero (được làm mượt)
    const camLook = new THREE.Vector3(20, 22, 0);
    let fov = 62;
    const upVec = new THREE.Vector3(0, 1, 0);
    const tmpA = new THREE.Vector3();
    const tmpB = new THREE.Vector3();

    function onFx(f: FxEvent, hx: number, hy: number, hz: number, now: number) {
      if (f.fx === 'explosion' || f.fx === 'mega') {
        ring.position.set(hx, hy, hz);
        ringAt = now;
        ring.visible = true;
        shake = f.fx === 'mega' ? 1.6 : 1.1;
        flashVal = f.fx === 'mega' ? 0.7 : 0.5;
      } else if (f.fx === 'storm') {
        shake = Math.max(shake, 0.35);
      }
    }

    function poseHero(h: { x: number; y: number; z: number; rot: number; vx: number; vy: number; mode: string; ax: number; ay: number; az: number; runPhase: number }, dt: number, now: number) {
      hero.group.position.set(h.x, h.y, h.z);
      const damp = 1 - Math.exp(-dt * 11);
      const dampSlow = 1 - Math.exp(-dt * 6);
      // góc lật: đang quay nhanh thì bám theo engine, không thì ngả theo hướng bay
      const dRot = h.rot - prevRot;
      prevRot = h.rot;
      let targetRot: number;
      if (h.mode === 'swing') {
        targetRot = Math.atan2(-(h.ax - h.x), h.ay - h.y) * 0.85;
      } else if (h.mode === 'run') {
        targetRot = -0.10;
      } else if (Math.abs(dRot) > 0.02) {
        targetRot = displayRot + dRot;
      } else {
        const tilt = THREE.MathUtils.clamp(Math.atan2(h.vy, Math.max(4, h.vx)), -0.85, 0.85) * 0.6;
        targetRot = displayRot + ((((tilt - displayRot) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI) * 0.12;
      }
      displayRot += (targetRot - displayRot) * (h.mode === 'air' && Math.abs(dRot) > 0.02 ? 1 : dampSlow);
      hero.group.rotation.z = displayRot;
      hero.group.position.y += h.mode === 'run' ? Math.abs(Math.sin(h.runPhase)) * 0.22 : 0;

      const P = {
        armL: 0, armR: 0, foreL: -0.4, foreR: -0.4, legL: 0, legR: 0, torso: 0,
      };
      if (h.mode === 'run') {
        const s = Math.sin(h.runPhase);
        P.armL = s * 0.85;
        P.armR = -s * 0.85;
        P.foreL = -0.55 - Math.max(0, s) * 0.5;
        P.foreR = -0.55 - Math.max(0, -s) * 0.5;
        P.legL = -s * 0.95;
        P.legR = s * 0.95;
        P.torso = -0.14;
      } else if (h.mode === 'swing') {
        P.armR = Math.PI - 0.3; // tay phải giơ cao bám tơ
        P.foreR = -0.12;
        P.armL = -0.65;
        P.foreL = -0.7;
        P.legL = -0.5;
        P.legR = -0.2;
        P.torso = 0.05;
      } else {
        P.armR = 2.5;
        P.foreR = -0.25;
        P.armL = -2.1;
        P.foreL = -0.5;
        P.legL = -0.55;
        P.legR = 0.3;
        P.torso = -0.06;
      }
      hero.armL.rotation.z += (P.armL - hero.armL.rotation.z) * damp;
      hero.armR.rotation.z += (P.armR - hero.armR.rotation.z) * damp;
      hero.foreL.rotation.z += (P.foreL - hero.foreL.rotation.z) * damp;
      hero.foreR.rotation.z += (P.foreR - hero.foreR.rotation.z) * damp;
      hero.legL.rotation.z += (P.legL - hero.legL.rotation.z) * damp;
      hero.legR.rotation.z += (P.legR - hero.legR.rotation.z) * damp;
      hero.torso.rotation.z += (P.torso - hero.torso.rotation.z) * damp;

      // dây tơ chính khi đang đu
      if (h.mode === 'swing') {
        rope.visible = true;
        tmpA.set(h.x + 0.4, h.y + 1.6, h.z);
        tmpB.set(h.ax, h.ay, h.az);
        const len = tmpA.distanceTo(tmpB);
        rope.position.copy(tmpA).add(tmpB).multiplyScalar(0.5);
        rope.scale.set(1, len, 1);
        tmpB.sub(tmpA).normalize();
        rope.quaternion.setFromUnitVectors(upVec, tmpB);
      } else {
        rope.visible = false;
      }
      void now;
    }

    resize();
    window.addEventListener('resize', resize);

    let lastT = performance.now();
    const loop = () => {
      if (disposed) return;
      raf = requestAnimationFrame(loop);
      const now = Date.now();
      const dt = Math.min(0.05, (performance.now() - lastT) / 1000);
      lastT = performance.now();
      const g = gameRef.current;
      const room = g.roomRef?.current ?? null;
      let sc: HeroScene | null = null;
      if (room) {
        room.advance(now);
        sc = room.scene(now);
        for (const f of room.fxSince(lastFxId)) {
          lastFxId = f.id;
          onFx(f, sc.hero.x, sc.hero.y, sc.hero.z, now);
        }
      } else if (g.view) {
        sc = g.view.scene;
        for (const f of g.view.fxRecent) {
          if (!seenFx.has(f.id)) {
            seenFx.add(f.id);
            onFx(f, sc.hero.x, sc.hero.y, sc.hero.z, now);
          }
        }
      }
      if (!sc) return;
      const h = sc.hero;
      const heroX = h.x;

      // --- pool toà nhà + cầu ---
      for (const b of blocksInRange(heroX - 70, heroX + 215)) {
        if (!blockGroups.has(b.i)) {
          const grp = buildBlock(b);
          blockGroups.set(b.i, grp);
          scene.add(grp);
        }
      }
      // dọn các khu phố đã lùi xa: tính lại tập cần giữ (đủ rẻ với vài chục group)
      const keep = new Set(blocksInRange(heroX - 90, heroX + 240).map((b) => b.i));
      for (const [i, grp] of blockGroups) {
        if (!keep.has(i)) {
          scene.remove(grp);
          grp.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (mesh.geometry && mesh.geometry !== unitBox) mesh.geometry.dispose();
          });
          blockGroups.delete(i);
        }
      }
      const riversSeen = new Set<number>();
      for (const probe of [heroX - 40, heroX + 60, heroX + 180]) {
        const r = riverAt(probe);
        if (r) riversSeen.add(r.x0);
      }
      for (const x0 of riversSeen) {
        if (!bridgeGroups.has(x0)) {
          // tìm x1 từ riverAt
          let x1 = x0 + 260;
          for (let px = x0; px < x0 + 500; px += 10) {
            if (!riverAt(px)) {
              x1 = px;
              break;
            }
          }
          const grp = buildBridge(x0, x1);
          bridgeGroups.set(x0, grp);
          scene.add(grp);
        }
      }
      for (const [x0, grp] of bridgeGroups) {
        if (!riversSeen.has(x0)) {
          scene.remove(grp);
          grp.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (mesh.geometry && mesh.geometry !== unitBox) mesh.geometry.dispose();
          });
          bridgeGroups.delete(x0);
        }
      }

      // --- nền/đường/mây/xe/ánh sáng bám theo hero ---
      ground.position.x = heroX;
      for (const road of roads) road.position.x = heroX - (heroX % 23.33);
      sun.position.set(heroX + 40, 100, 55);
      sun.target.position.set(heroX + 10, 0, 0);
      rim.position.set(heroX - 35, 26, -42);
      rim.target.position.set(heroX, 14, 0);
      sunSprite.position.set(heroX + 230, 128, -190);
      for (const cl of clouds) {
        cl.position.x += dt * 1.1;
        if (cl.position.x < heroX - 180) cl.position.x += 760;
        if (cl.position.x > heroX + 580) cl.position.x -= 760;
      }
      for (const car of cars) {
        car.g.position.x += car.speed * dt;
        if (car.g.position.x < heroX - 90) car.g.position.x += 340;
        if (car.g.position.x > heroX + 260) car.g.position.x -= 340;
      }
      waterTex.offset.x = (now / 9000) % 1;
      waterTex.offset.y = (now / 13000) % 1;

      // --- hero + tơ ---
      poseHero(h, dt, now);
      let seg = 0;
      const pushSeg = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, gold: boolean, fade: number) => {
        if (seg >= MAXSEG) return;
        const o = seg * 6;
        segPos[o] = x1; segPos[o + 1] = y1; segPos[o + 2] = z1;
        segPos[o + 3] = x2; segPos[o + 4] = y2; segPos[o + 5] = z2;
        const base = gold ? [1.0, 0.8, 0.3] : [1.0, 1.0, 1.0];
        const f = Math.max(0.15, fade);
        segCol[o] = base[0] * f; segCol[o + 1] = base[1] * f; segCol[o + 2] = base[2] * f;
        segCol[o + 3] = base[0] * f; segCol[o + 4] = base[1] * f; segCol[o + 5] = base[2] * f;
        seg++;
      };
      for (const w of sc.webs) {
        const age = now - w.born;
        if (age < 0 || age > w.ttl) continue;
        pushSeg(w.x1, w.y1, w.z1, w.x2, w.y2, w.z2, w.gold, 1 - age / w.ttl);
      }
      localStrands = localStrands.filter((s) => now - s.born < s.ttl);
      for (const s of localStrands) pushSeg(s.x1, s.y1, s.z1, s.x2, s.y2, s.z2, s.gold, 1 - (now - s.born) / s.ttl);
      segGeo.setDrawRange(0, seg * 2);
      (segGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (segGeo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;

      // bão tơ: tự giăng thêm tơ + dán đĩa nhện lên tường
      if (sc.storm && now - lastAmbient > 90) {
        lastAmbient = now;
        const anchors = anchorsInRange(h.x - 20, h.x + 80);
        for (let k = 0; k < 3 && anchors.length; k++) {
          const a = anchors[Math.floor(Math.random() * anchors.length)];
          localStrands.push({ x1: h.x + (Math.random() - 0.5) * 26, y1: h.y + Math.random() * 14 - 4, z1: (Math.random() - 0.5) * 30, x2: a.x, y2: a.y, z2: a.z, born: now, ttl: 1500, gold: Math.random() < 0.4 });
        }
      }
      if (sc.storm && now - lastDisc > 650) {
        lastDisc = now;
        const d = discs[discIdx++ % discs.length];
        const side = Math.random() < 0.5 ? -1 : 1;
        d.m.position.set(h.x + 12 + Math.random() * 65, 14 + Math.random() * 48, side * 21.5);
        d.m.rotation.y = side < 0 ? 0 : Math.PI;
        d.born = now;
        d.m.visible = true;
      }
      for (const d of discs) {
        if (!d.m.visible) continue;
        const age = now - d.born;
        const mat = d.m.material as THREE.MeshBasicMaterial;
        if (age > d.ttl) {
          d.m.visible = false;
          mat.opacity = 0;
        } else {
          mat.opacity = 0.9 * Math.min(1, age / 200) * (age > d.ttl - 500 ? (d.ttl - age) / 500 : 1);
        }
      }

      // hạt hiệu ứng từ engine
      let pi = 0;
      for (const s of sc.sparks) {
        const age = (now - s.born) / 1000;
        if (age < 0 || pi >= MAXP) continue;
        const o = pi * 3;
        pPos[o] = s.x + s.vx * age;
        pPos[o + 1] = s.y + s.vy * age - 4.2 * age * age;
        pPos[o + 2] = s.z + s.vz * age;
        const c = s.kind === 'heart' ? [1, 0.42, 0.62] : s.kind === 'poof' ? [0.75, 0.78, 0.8] : [1, 0.84, 0.4];
        const fade = Math.max(0, 1 - (age * 1000) / s.ttl);
        pCol[o] = c[0] * fade; pCol[o + 1] = c[1] * fade; pCol[o + 2] = c[2] * fade;
        pi++;
      }
      pGeo.setDrawRange(0, pi);
      (pGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (pGeo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;

      // vòng nổ + chớp sáng + rung camera
      if (ring.visible) {
        const age = (now - ringAt) / 750;
        if (age >= 1) {
          ring.visible = false;
          (ring.material as THREE.MeshBasicMaterial).opacity = 0;
        } else {
          const rr = 1 + age * 30;
          ring.scale.set(rr, rr, rr);
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - age);
        }
      }
      if (flashRef.current) {
        flashVal *= Math.exp(-dt * 5);
        flashRef.current.style.opacity = flashVal > 0.01 ? String(flashVal) : '0';
      }
      shake *= Math.exp(-dt * 3.2);

      // --- camera bám theo kiểu 3/4 sau lưng ---
      // Vị trí = vị trí hero + offset đã làm mượt: camera KHÔNG bao giờ bị tụt
      // lại phía sau dù khung hình có chậm (máy yếu), hero luôn ở đúng khung.
      tmpA.set(sc.burst ? -9.5 : -7.8, sc.burst ? 5.6 : 5.0, sc.burst ? 10.5 : 9.0);
      camPos.lerp(tmpA, 1 - Math.exp(-dt * 2.2)); // camPos ở đây đóng vai trò offset
      camera.position.set(h.x + camPos.x, h.y + camPos.y, h.z + camPos.z);
      // Điểm nhìn khoá cứng theo hero (chỉ cộng chút dự đoán theo vận tốc):
      // dù khung hình chậm đến đâu hero vẫn nằm giữa khung, không bị trôi ra rìa.
      // Khung dọc hẹp nên điểm nhìn chỉ được nhích trước rất ít.
      camLook.set(h.x + 2.4 + h.vx * 0.045, h.y + 0.9, h.z);
      if (shake > 0.01) {
        camera.position.x += (Math.random() - 0.5) * shake * 1.4;
        camera.position.y += (Math.random() - 0.5) * shake * 1.1;
      }
      camera.lookAt(camLook);
      const targetFov = sc.burst ? 71 : 62;
      fov += (targetFov - fov) * (1 - Math.exp(-dt * 2.6));
      if (Math.abs(fov - camera.fov) > 0.05) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const v = game.view;
  const modeLabel = v?.mode === 'run' ? '🏃 Đang chạy nóc nhà' : v?.mode === 'swing' ? '🕸️ Đang đu tơ' : '🌀 Đang bay';
  const nextPct = v?.nextTier ? Math.min(100, (v.nextTier.have / v.nextTier.cost) * 100) : 100;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#93c7ec]">
      <div ref={mountRef} className="absolute inset-0" />
      <div ref={flashRef} className="pointer-events-none absolute inset-0 bg-white opacity-0" />

      {/* HUD trên: quãng đường + tốc độ */}
      <div className="pointer-events-none absolute left-4 top-4 rounded-2xl bg-slate-950/55 px-5 py-3 text-white shadow-lg backdrop-blur-sm">
        <div className="text-[26px] font-black leading-none tracking-wide">🕷️ SPIDER HERO</div>
        <div className="mt-1 text-[15px] font-semibold text-sky-200">{game.channelName}</div>
        <div className="mt-2 flex items-end gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase text-sky-300">Đã bay</div>
            <div className="text-[24px] font-black leading-none">{fmtDist(v?.dist ?? 0)}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-sky-300">Tốc độ</div>
            <div className="text-[24px] font-black leading-none">{v?.speedKmh ?? 0} km/h</div>
          </div>
          <div className="pb-[2px] text-[15px] font-bold text-amber-300">{modeLabel}</div>
        </div>
      </div>

      {/* HUD phải: quỹ tim + mốc kế tiếp */}
      <div className="pointer-events-none absolute right-4 top-4 w-[348px] rounded-2xl bg-slate-950/55 px-5 py-3 text-white shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold text-rose-300">❤️ Tổng tim</span>
          <span className="text-[24px] font-black leading-none">{(v?.totalLikes ?? 0).toLocaleString('vi-VN')}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[13px] font-semibold text-sky-200">
          <span>Quỹ tim: {v?.credit ?? 0}</span>
          <span>{v?.nextTier ? `Tiếp theo: ${v.nextTier.label} (${v.nextTier.cost} tim)` : 'Đã mở mọi hiệu ứng!'}</span>
        </div>
        <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-amber-300 transition-all duration-500" style={{ width: `${nextPct}%` }} />
        </div>
        <div className="mt-2 flex gap-2 text-[12px] font-bold">
          <span className="whitespace-nowrap rounded-full bg-white/12 px-2 py-[2px]">🌀 Lộn ×{v?.totals.flips ?? 0}</span>
          <span className="whitespace-nowrap rounded-full bg-white/12 px-2 py-[2px]">🕸️ Bão ×{v?.totals.storms ?? 0}</span>
          <span className="whitespace-nowrap rounded-full bg-white/12 px-2 py-[2px]">🦘 Nhảy ×{v?.totals.jumps ?? 0}</span>
        </div>
      </div>

      {/* Banner sự kiện giữa màn hình */}
      {v?.banner && (
        <div key={v.banner + String(v.dist)} className="hero-pop pointer-events-none absolute left-1/2 top-[21%] -translate-x-1/2 whitespace-nowrap rounded-[26px] bg-rose-600/90 px-8 py-4 text-center text-[38px] font-black text-white shadow-2xl">
          {v.banner}
        </div>
      )}
      {v?.scene.storm && (
        <div className="pointer-events-none absolute left-1/2 top-[13%] -translate-x-1/2 rounded-full bg-indigo-950/60 px-6 py-2 text-[22px] font-black text-sky-200">
          🕸️ Đang có BÃO TƠ — tơ giăng khắp phố!
        </div>
      )}

      {/* Dòng hướng dẫn dưới cùng */}
      <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl bg-slate-950/55 px-5 py-3 text-center text-[19px] font-semibold leading-snug text-white backdrop-blur-sm">
        ❤️ Thả tim để Hero bắn tơ — tim cộng dồn cả phòng: 10 tim nhảy cao · 50 đu tốc độ · 100 lộn vòng · 200 mưa tơ · 500 Bão Tơ · 1.000 Vụ Nổ Tơ · 5.000 Siêu Bão Tơ
      </div>
    </div>
  );
}
