import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import type { HeroState } from './useHero';
import { blocksInRange, riverAt, seeded, BRIDGE_DECK_Y, type Block } from './city3d';
import { anchorsInRange } from './city3d';
import type { FxEvent, HeroScene } from './hero';
import { sfx } from './sfx';
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

/** Texture toà nhà + bản đồ phát sáng riêng (chỉ các ô cửa đang sáng đèn). */
function buildingTextures(base: string, frame: string, litRatio: number, seed: number): { map: THREE.Texture; emissive: THREE.Texture } {
  const cols = 6;
  const rows = 14;
  const rnd = seeded(seed);
  const cells: { lit: boolean; glint: boolean }[][] = [];
  for (let y = 0; y < rows; y++) {
    cells.push([]);
    for (let x = 0; x < cols; x++) {
      const lit = rnd() < litRatio;
      cells[y].push({ lit, glint: !lit && rnd() < 0.3 });
    }
  }
  const map = canvasTex(96, 192, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const cw = w / cols;
    const ch = h / rows;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = cells[y][x];
        g.fillStyle = c.lit ? '#ffd98a' : frame;
        g.fillRect(x * cw + 2, y * ch + 3, cw - 4, ch - 6);
        if (c.glint) {
          g.fillStyle = 'rgba(255,255,255,0.25)';
          g.fillRect(x * cw + 2, y * ch + 3, cw - 4, 3);
        }
      }
    }
  });
  const emissive = canvasTex(96, 192, (g, w, h) => {
    g.fillStyle = '#000000';
    g.fillRect(0, 0, w, h);
    const cw = w / cols;
    const ch = h / rows;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!cells[y][x].lit) continue;
        g.fillStyle = '#ffb45e';
        g.fillRect(x * cw + 2, y * ch + 3, cw - 4, ch - 6);
      }
    }
  });
  return { map, emissive };
}

function buildingMaterial(base: string, frame: string, litRatio: number, seed: number, roughness: number, metalness: number): THREE.MeshStandardMaterial {
  const t = buildingTextures(base, frame, litRatio, seed);
  return new THREE.MeshStandardMaterial({
    map: t.map,
    emissiveMap: t.emissive,
    emissive: 0xffc98a,
    emissiveIntensity: 0.85,
    roughness,
    metalness,
  });
}

/** Bầu trời hoàng hôn: dải màu dọc vẽ bằng canvas (đỉnh trời xanh → chân trời vàng cam). */
function skyTexture(): THREE.Texture {
  return canvasTex(16, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#4f9fd8');
    grad.addColorStop(0.38, '#93c7ec');
    grad.addColorStop(0.68, '#f9cf9d');
    grad.addColorStop(0.86, '#ffb27d');
    grad.addColorStop(1, '#ff9d6e');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
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

// ---------- dựng hình Hero: anh hùng NGUYÊN BẢN dáng chibi đầu to ----------
// Đầu đỏ TRƠN (không kẻ mạng nhện, không logo hãng nào), mắt trắng to, thân ngắn
// đỏ tươi, tay chân ngắn mập, huy hiệu tia bạc trên ngực — dấu hiệu riêng.
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
  // toon shading 3 nấc sáng — phẳng, đậm chất hoạt hình truyện tranh
  const gradData = new Uint8Array([110, 175, 255]);
  const gradientMap = new THREE.DataTexture(gradData, 3, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  const navy = new THREE.MeshToonMaterial({ color: 0x2c4a7c, gradientMap });
  const red = new THREE.MeshToonMaterial({ color: 0xd42a35, gradientMap });
  const silver = new THREE.MeshStandardMaterial({ color: 0xd7dee8, roughness: 0.3, metalness: 0.85 });
  const lens = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xd8f2ff, emissiveIntensity: 1.4, roughness: 0.2 });
  // viền đen kiểu comic: vỏ ngược (BackSide) phình nhẹ bọc ngoài từng bộ phận
  const outlineMat = new THREE.MeshBasicMaterial({ color: 0x1a0f0a, side: THREE.BackSide });
  const outlined = (mesh: THREE.Mesh, k = 1.08): THREE.Mesh => {
    const shell = new THREE.Mesh(mesh.geometry, outlineMat);
    shell.scale.setScalar(k);
    mesh.add(shell);
    return mesh;
  };

  const group = new THREE.Group();
  const torso = new THREE.Group();
  torso.position.y = 0.1 * S;
  group.add(torso);

  // thân ngắn, tròn — dáng chibi
  const chest = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.30 * S, 0.22 * S, 6, 14), red), 1.07);
  chest.position.y = 0.34 * S;
  chest.castShadow = true;
  torso.add(chest);
  // huy hiệu tia bạc trên ngực — dấu hiệu riêng, không dùng logo của ai
  const badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.15 * S), silver);
  badge.position.set(0, 0.42 * S, 0.29 * S);
  badge.scale.set(1, 1.5, 0.4);
  torso.add(badge);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.30 * S, 0.32 * S, 0.10 * S, 14), silver);
  belt.position.y = 0.04 * S;
  torso.add(belt);

  // đầu TO (gần 40% chiều cao), đỏ trơn, mắt trắng lớn có viền navy
  const headG = new THREE.Group();
  headG.position.y = 0.84 * S;
  const head = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.34 * S, 24, 18), red), 1.05);
  head.castShadow = true;
  headG.add(head);
  for (const sx of [-1, 1]) {
    const rimEye = new THREE.Mesh(new THREE.SphereGeometry(0.118 * S, 12, 10), navy);
    rimEye.position.set(sx * 0.135 * S, 0.03 * S, 0.265 * S);
    rimEye.scale.set(1.2, 1.5, 0.45);
    headG.add(rimEye);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.102 * S, 12, 10), lens);
    eye.position.set(sx * 0.135 * S, 0.03 * S, 0.285 * S);
    eye.scale.set(1.2, 1.5, 0.45);
    headG.add(eye);
  }
  torso.add(headG);

  function arm(side: 1 | -1) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.36 * S, 0.56 * S, 0);
    const upper = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.10 * S, 0.20 * S, 4, 10), navy), 1.1);
    upper.position.y = -0.15 * S;
    upper.castShadow = true;
    shoulder.add(upper);
    const fore = new THREE.Group();
    fore.position.y = -0.30 * S;
    const foreMesh = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.09 * S, 0.18 * S, 4, 10), navy), 1.1);
    foreMesh.position.y = -0.13 * S;
    foreMesh.castShadow = true;
    fore.add(foreMesh);
    const glove = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.115 * S, 10, 8), red), 1.1);
    glove.position.y = -0.28 * S;
    fore.add(glove);
    shoulder.add(fore);
    torso.add(shoulder);
    return { shoulder, fore };
  }
  function leg(side: 1 | -1) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.15 * S, -0.02 * S, 0);
    const thigh = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.12 * S, 0.22 * S, 4, 10), navy), 1.1);
    thigh.position.y = -0.17 * S;
    thigh.castShadow = true;
    hip.add(thigh);
    const boot = outlined(new THREE.Mesh(new THREE.BoxGeometry(0.17 * S, 0.26 * S, 0.27 * S), red), 1.09);
    boot.position.set(0, -0.44 * S, 0.05 * S);
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
  const vignetteRef = useRef<HTMLDivElement>(null);
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = skyTexture();
    scene.fog = new THREE.Fog(0xf2c491, 120, 430);
    const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.1, 1200);

    // hậu kỳ: bloom cho cửa sổ phát sáng/mắt hero/tơ + OutputPass áp ACES
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1080, 1920), 0.5, 0.55, 0.82);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const resize = () => {
      const w = mount.clientWidth || 1080;
      const h = mount.clientHeight || 1920;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const hemi = new THREE.HemisphereLight(0xffe3c0, 0x6e5a68, 0.9);
    scene.add(hemi);
    // đèn viền từ phía sau-trái: tách hero khỏi nền toà nhà tối
    const rim = new THREE.DirectionalLight(0xbcd7ff, 0.5);
    scene.add(rim);
    scene.add(rim.target);
    const sun = new THREE.DirectionalLight(0xffbe78, 2.3);
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
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffcf8a, transparent: true, opacity: 0.95, depthWrite: false }));
    sunSprite.scale.set(130, 130, 1);
    scene.add(sunSprite);
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xfff1de, emissive: 0x8a6a52, roughness: 1, transparent: true, opacity: 0.95 });
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
      buildingMaterial('#7fb2d9', '#33506b', 0.16, 11, 0.25, 0.35),
      buildingMaterial('#c9a184', '#5d4433', 0.2, 22, 0.8, 0),
      buildingMaterial('#5b7290', '#1f303f', 0.3, 33, 0.2, 0.5),
      buildingMaterial('#b9c2cc', '#54616e', 0.12, 44, 0.6, 0),
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
    // Ống tơ thon hai đầu (to ở tay, nhỏ ở điểm bám) uốn theo đường cong võng —
    // hình học cấp phát sẵn, mỗi khung chỉ ghi lại toạ độ (không cấp phát mới).
    const ROPE_RINGS = 16;
    const ROPE_SIDES = 7;
    const ropePos = new Float32Array(ROPE_RINGS * ROPE_SIDES * 3);
    const ropeNor = new Float32Array(ROPE_RINGS * ROPE_SIDES * 3);
    const ropeGeo = new THREE.BufferGeometry();
    ropeGeo.setAttribute('position', new THREE.BufferAttribute(ropePos, 3).setUsage(THREE.DynamicDrawUsage));
    ropeGeo.setAttribute('normal', new THREE.BufferAttribute(ropeNor, 3).setUsage(THREE.DynamicDrawUsage));
    {
      const idx: number[] = [];
      for (let r = 0; r < ROPE_RINGS - 1; r++) {
        for (let s = 0; s < ROPE_SIDES; s++) {
          const a = r * ROPE_SIDES + s;
          const b = r * ROPE_SIDES + ((s + 1) % ROPE_SIDES);
          const c = a + ROPE_SIDES;
          const d = b + ROPE_SIDES;
          idx.push(a, c, b, b, c, d);
        }
      }
      ropeGeo.setIndex(idx);
    }
    const rope = new THREE.Mesh(ropeGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 1.7, 1.7) }));
    rope.visible = false;
    rope.frustumCulled = false;
    scene.add(rope);
    const _hand = new THREE.Vector3();
    const _anchor = new THREE.Vector3();
    const _mid = new THREE.Vector3();
    const _pt = new THREE.Vector3();
    const _tan = new THREE.Vector3();
    const _n1 = new THREE.Vector3();
    const _n2 = new THREE.Vector3();
    function updateRope(hand: THREE.Vector3, anchor: THREE.Vector3, sag: number) {
      _mid.lerpVectors(hand, anchor, 0.5);
      _mid.y -= sag;
      for (let r = 0; r < ROPE_RINGS; r++) {
        const t = r / (ROPE_RINGS - 1);
        // đường cong Bezier bậc 2: tay -> điểm võng giữa -> điểm bám
        const a = (1 - t) * (1 - t);
        const b = 2 * (1 - t) * t;
        const c = t * t;
        _pt.set(
          a * hand.x + b * _mid.x + c * anchor.x,
          a * hand.y + b * _mid.y + c * anchor.y,
          a * hand.z + b * _mid.z + c * anchor.z,
        );
        _tan
          .set(
            2 * (1 - t) * (_mid.x - hand.x) + 2 * t * (anchor.x - _mid.x),
            2 * (1 - t) * (_mid.y - hand.y) + 2 * t * (anchor.y - _mid.y),
            2 * (1 - t) * (_mid.z - hand.z) + 2 * t * (anchor.z - _mid.z),
          )
          .normalize();
        _n1.set(-_tan.y, _tan.x, 0);
        if (_n1.lengthSq() < 0.01) _n1.set(1, 0, 0);
        _n1.normalize();
        _n2.crossVectors(_tan, _n1);
        const radius = 0.085 * (1 - t) + 0.038 * t; // thon dần về điểm bám
        for (let s = 0; s < ROPE_SIDES; s++) {
          const ang = (s / ROPE_SIDES) * Math.PI * 2;
          const cos = Math.cos(ang);
          const sin = Math.sin(ang);
          const o = (r * ROPE_SIDES + s) * 3;
          ropePos[o] = _pt.x + (_n1.x * cos + _n2.x * sin) * radius;
          ropePos[o + 1] = _pt.y + (_n1.y * cos + _n2.y * sin) * radius;
          ropePos[o + 2] = _pt.z + (_n1.z * cos + _n2.z * sin) * radius;
          ropeNor[o] = _n1.x * cos + _n2.x * sin;
          ropeNor[o + 1] = _n1.y * cos + _n2.y * sin;
          ropeNor[o + 2] = _n1.z * cos + _n2.z * sin;
        }
      }
      (ropeGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (ropeGeo.getAttribute('normal') as THREE.BufferAttribute).needsUpdate = true;
    }
    // vết tơ dính ở điểm bám (đĩa mạng nhện nhỏ, luôn quay mặt về camera)
    const splat = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 3.0),
      new THREE.MeshBasicMaterial({ map: webDiscTexture(), transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }),
    );
    splat.visible = false;
    scene.add(splat);

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
    const tmpA = new THREE.Vector3();
    const tmpB = new THREE.Vector3();

    function onFx(f: FxEvent, hx: number, hy: number, hz: number, now: number) {
      if (f.fx === 'explosion' || f.fx === 'mega') {
        ring.position.set(hx, hy, hz);
        ringAt = now;
        ring.visible = true;
        shake = f.fx === 'mega' ? 1.6 : 1.1;
        flashVal = f.fx === 'mega' ? 0.7 : 0.5;
        sfx.pop(f.fx === 'mega');
      } else if (f.fx === 'storm') {
        shake = Math.max(shake, 0.35);
        sfx.pop(false);
      } else if (f.fx === 'speed') {
        sfx.whoosh(0.9);
      }
    }

    function poseHero(h: { x: number; y: number; z: number; rot: number; vx: number; vy: number; mode: string; ax: number; ay: number; az: number; runPhase: number; landAt: number }, dt: number, now: number) {
      hero.group.position.set(h.x, h.y, h.z);
      const damp = 1 - Math.exp(-dt * 11);
      const dampSlow = 1 - Math.exp(-dt * 6);
      // góc lật: đang quay nhanh thì bám theo engine, không thì ngả theo hướng bay
      const dRot = h.rot - prevRot;
      prevRot = h.rot;
      let targetRot: number;
      if (h.mode === 'hang') {
        targetRot = Math.PI + Math.sin(now / 430) * 0.06; // lộn ngược hẳn, đung đưa rất nhẹ
      } else if (h.mode === 'swing') {
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
      } else if (h.mode === 'hang') {
        // treo ngược: hai tay buông thõng về phía mặt đất, một chân duỗi móc tơ, một chân co
        P.armL = Math.PI - 0.35;
        P.armR = Math.PI + 0.3;
        P.foreL = -0.5;
        P.foreR = -0.65;
        P.legL = 0.12;
        P.legR = 0.85;
        P.torso = 0.03;
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

      // squash & stretch: đáp nóc nhà thì nén người, vọt lên/đu nhanh thì giãn nhẹ
      let sy = 1;
      const sinceLand = now - h.landAt;
      if (h.mode === 'run' && sinceLand >= 0 && sinceLand < 260) {
        sy = 1 - 0.22 * Math.sin((sinceLand / 260) * Math.PI);
      } else if (h.mode === 'air' && h.vy > 7) {
        sy = 1 + Math.min(0.1, (h.vy - 7) * 0.008);
      } else if (h.mode === 'swing') {
        sy = 1 + Math.min(0.06, Math.hypot(h.vx, h.vy) * 0.0016);
      }
      const sxz = 1 + (1 - sy) * 0.7;
      hero.group.scale.set(sxz, sy, sxz);

      // dây tơ chính khi đang đu/treo: ống tơ võng theo lực căng + vết tơ ở điểm bám
      if (h.mode === 'swing' || h.mode === 'hang') {
        rope.visible = true;
        if (h.mode === 'hang') {
          _hand.set(h.x - 0.1, h.y + 1.3, h.z); // treo ngược: sợi tơ nối vào chân đang móc phía trên đầu
        } else {
          _hand.set(h.x + 0.4, h.y + 1.3, h.z); // tay chibi ngắn: điểm bắn tơ hạ theo tỉ lệ mới
        }
        _anchor.set(h.ax, h.ay, h.az);
        const dist = _hand.distanceTo(_anchor);
        const spd = Math.hypot(h.vx, h.vy);
        const sag = h.mode === 'hang' ? 0.1 : THREE.MathUtils.clamp(dist * 0.055 - spd * 0.05, 0.12, 2.4); // bay nhanh = tơ căng, chậm = tơ võng
        updateRope(_hand, _anchor, sag);
        splat.visible = true;
        splat.position.copy(_anchor);
        splat.lookAt(camera.position);
        const ss = 1 + 0.07 * Math.sin(now / 110);
        splat.scale.set(ss, ss, ss);
      } else {
        rope.visible = false;
        splat.visible = false;
      }
    }

    // ---------- vệt tốc độ (speed lines) bám theo camera ----------
    const STREAKS = 26;
    const streakPos = new Float32Array(STREAKS * 6);
    const streakDat: { x: number; y: number; z: number; len: number }[] = [];
    for (let i = 0; i < STREAKS; i++) {
      streakDat.push({
        x: (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 13),
        y: (Math.random() - 0.5) * 20,
        z: -14 - Math.random() * 34,
        len: 2.5 + Math.random() * 3,
      });
    }
    const streakGeo = new THREE.BufferGeometry();
    streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3).setUsage(THREE.DynamicDrawUsage));
    const streakMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const streaks = new THREE.LineSegments(streakGeo, streakMat);
    streaks.frustumCulled = false;
    scene.add(streaks);

    // ---------- âm thanh hiệu ứng: mở khoá theo tương tác đầu tiên (như nhạc/giọng) ----------
    if (new URLSearchParams(window.location.search).get('mute') === '1') sfx.enabled = false;
    const unlockSfx = () => sfx.resume();
    window.addEventListener('pointerdown', unlockSfx);
    window.addEventListener('focus', unlockSfx);
    document.addEventListener('visibilitychange', unlockSfx);
    const sfxWatchdog = setInterval(unlockSfx, 1500);
    let prevMode = '';
    let prevLandAt = 0;

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
      sun.position.set(heroX + 48, 58, 38); // nắng chiều thấp: bóng đổ dài, ánh vàng
      sun.target.position.set(heroX + 10, 0, 0);
      rim.position.set(heroX - 35, 26, -42);
      rim.target.position.set(heroX, 14, 0);
      sunSprite.position.set(heroX + 260, 92, -215);
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
      // âm thanh theo chuyển trạng thái vật lý
      if (prevMode && prevMode !== h.mode) {
        const spdNow = Math.hypot(h.vx, h.vy);
        if (h.mode === 'swing') sfx.thwip();
        else if (h.mode === 'hang') sfx.whoosh(0.3);
        else if (prevMode === 'hang' && h.mode === 'air') sfx.whoosh(0.55);
        else if (prevMode === 'swing' && h.mode === 'air') sfx.whoosh(Math.min(1, spdNow / 26));
        else if (prevMode === 'run' && h.mode === 'air') sfx.whoosh(0.35);
      }
      if (h.landAt !== prevLandAt) {
        if (prevMode === 'air') sfx.thud();
        prevLandAt = h.landAt;
      }
      prevMode = h.mode;
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
      // FOV giãn theo tốc độ (cảm giác lao nhanh) + rung rất nhẹ ở tốc độ cực cao
      const spdKmh = Math.hypot(h.vx, h.vy) * 3.6;
      const targetFov = 62 + THREE.MathUtils.clamp((spdKmh - 55) / 6, 0, 6) + (sc.burst ? 4 : 0);
      fov += (targetFov - fov) * (1 - Math.exp(-dt * 2.6));
      if (Math.abs(fov - camera.fov) > 0.05) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      if (spdKmh > 95) {
        const amp = (spdKmh - 95) / 300;
        camera.position.x += (Math.random() - 0.5) * amp;
        camera.position.y += (Math.random() - 0.5) * amp;
      }
      if (vignetteRef.current) {
        const vig = THREE.MathUtils.clamp((spdKmh - 68) / 55, 0, 0.8);
        vignetteRef.current.style.opacity = vig > 0.02 ? String(vig) : '0';
      }

      // vệt tốc độ: các vệt trắng lao ngược qua hai bên camera khi bay nhanh
      const sFactor = THREE.MathUtils.clamp((spdKmh - 62) / 45, 0, 1);
      streakMat.opacity = sFactor * 0.5;
      if (sFactor > 0) {
        streaks.position.copy(camera.position);
        streaks.quaternion.copy(camera.quaternion);
        for (let i = 0; i < STREAKS; i++) {
          const s = streakDat[i];
          s.z += dt * (26 + spdKmh * 0.55);
          if (s.z > -5) {
            s.z = -38 - Math.random() * 10;
            s.x = (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 13);
            s.y = (Math.random() - 0.5) * 20;
          }
          const o = i * 6;
          streakPos[o] = s.x;
          streakPos[o + 1] = s.y;
          streakPos[o + 2] = s.z;
          streakPos[o + 3] = s.x;
          streakPos[o + 4] = s.y;
          streakPos[o + 5] = s.z - s.len;
        }
        (streakGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      }
      streaks.visible = sFactor > 0;

      composer.render();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', unlockSfx);
      window.removeEventListener('focus', unlockSfx);
      document.removeEventListener('visibilitychange', unlockSfx);
      clearInterval(sfxWatchdog);
      composer.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const v = game.view;
  const modeLabel = v?.mode === 'run' ? '🏃 Đang chạy nóc nhà' : v?.mode === 'swing' ? '🕸️ Đang đu tơ' : v?.mode === 'hang' ? '🙃 Đang treo ngược ngắm phố' : '🌀 Đang bay';
  const nextPct = v?.nextTier ? Math.min(100, (v.nextTier.have / v.nextTier.cost) * 100) : 100;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#93c7ec]">
      <div ref={mountRef} className="absolute inset-0" />
      <div ref={flashRef} className="pointer-events-none absolute inset-0 bg-white opacity-0" />
      <div
        ref={vignetteRef}
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 52%, rgba(26,8,38,0.55) 100%)' }}
      />

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
