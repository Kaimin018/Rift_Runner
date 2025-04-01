import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// --- 建立場景與基礎元件 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

// 攝影機 (模擬第一人稱眼睛高度)
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.6, 0);

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 加入 PointerLockControls ---
const controls = new PointerLockControls(camera, renderer.domElement);
document.addEventListener('click', () => {
  controls.lock();  // 點擊後鎖定滑鼠以捕捉滑鼠移動
}, false);

// --- 加入平面與光源 ---
// 地板平面
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x008000 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// 環境光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// 方向光 (可投射陰影)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// --- 鍵盤控制設定 ---
// 用來記錄 WASD 的按下狀態
const move = {
  forward: false,
  backward: false,
  left: false,
  right: false
};

// 監聽鍵盤按下
document.addEventListener('keydown', (event) => {
  switch (event.key.toLowerCase()) {
    case 'w':
      move.forward = true;
      break;
    case 'a':
      move.left = true;
      break;
    case 's':
      move.backward = true;
      break;
    case 'd':
      move.right = true;
      break;
  }
});

// 監聽鍵盤彈起
document.addEventListener('keyup', (event) => {
  switch (event.key.toLowerCase()) {
    case 'w':
      move.forward = false;
      break;
    case 'a':
      move.left = false;
      break;
    case 's':
      move.backward = false;
      break;
    case 'd':
      move.right = false;
      break;
  }
});

function addGroundCones(scene: THREE.Scene) {
  const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

  for (let i = 0; i < 150; i++) {
    const radius = 0.5 + Math.random();  // 底部半徑
    const height = 1 + Math.random() * 2; // 高度
    const radialSegments = 8;
    const coneGeometry = new THREE.ConeGeometry(radius, height, radialSegments);

    const cone = new THREE.Mesh(coneGeometry, coneMaterial);

    // 隨機位置在 -50 ~ 50 範圍內
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;

    cone.position.set(x, height / 2, z); // 讓底部接觸地面
    scene.add(cone);
  }
}


// --- 主動畫循環 ---
// 使用 clock 來計算每一幀的時間差，方便以速度（單位/秒）計算位移
const clock = new THREE.Clock();
const speed = 15; // 每秒移動的單位距離

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta(); // 獲得上一次更新至今的秒數

  // 每一幀根據攝影機的方向重新計算移動向量
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;        // 移除上下分量，只考慮水平面
  forward.normalize();  // 正規化向量

  // 右向量 = forward 與全域上方向 (0,1,0) 的叉積
  const right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  // 合成移動向量，根據按鍵狀態
  const movement = new THREE.Vector3();
  if (move.forward) movement.add(forward);
  if (move.backward) movement.sub(forward);
  if (move.left) movement.sub(right);
  if (move.right) movement.add(right);

  if (movement.length() > 0) {
    movement.normalize();                // 確保移動方向單位長度
    movement.multiplyScalar(speed * delta); // 以速度與幀時間計算位移
    camera.position.add(movement);        // 更新攝影機位置
  }

  renderer.render(scene, camera);
}

addGroundCones(scene); // 在地面上隨機放置三角形
animate();

// --- 自適應視窗大小 ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
