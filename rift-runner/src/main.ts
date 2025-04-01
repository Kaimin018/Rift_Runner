import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// === 建立場景 ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee); // 淺灰背景

// === 建立攝影機 ===
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

// === 建立渲染器 ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // 開啟陰影
document.body.appendChild(renderer.domElement);

// === OrbitControls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// === 加平面地板 ===
const planeGeometry = new THREE.PlaneGeometry(50, 50);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // 讓地板平躺
plane.receiveShadow = true;
scene.add(plane);

// === 加光源 ===
// 1. 環境光（柔和整體亮度）
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// 2. 聚光燈（會產生陰影）
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(10, 20, 10);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// === 加一個測試物件（方塊）===
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const box = new THREE.Mesh(boxGeometry, boxMaterial);
box.position.set(0, 0.5, 0); // 放在地板上
box.castShadow = true;
scene.add(box);

// === 主動畫迴圈 ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
