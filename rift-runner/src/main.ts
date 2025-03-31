import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

// --- 基本場景、攝影機、渲染器設定 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 地板、玩家、燈光設定 ---
const floorGeometry = new THREE.BoxGeometry(100, 1, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = -0.5;
scene.add(floor);

const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 0.5;
scene.add(player);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// --- 控制邏輯 ---

// 1. 建立 PointerLockControls 控制的虛擬目標物件
const controlTarget = new THREE.Object3D();
controlTarget.rotation.set(0, 0, 0);

// 2. PointerLockControls 控制 controlTarget
const controls = new PointerLockControls(controlTarget, document.body);

// 點擊鎖定滑鼠
document.addEventListener('click', () => {
  // 檢查 controls 是否已被鎖定，避免重複鎖定或潛在錯誤
  if (!controls.isLocked) {
      controls.lock();
  }
});

// 監聽鎖定/解鎖事件 (可選)
controls.addEventListener('lock', () => console.log('Pointer locked'));
controls.addEventListener('unlock', () => console.log('Pointer unlocked'));


// 鍵盤控制記錄
const keys: Record<string, boolean> = {};
document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// --- 移動與動畫參數 ---
const moveSpeed = 0.1;
const rotationSlerpFactor = 0.1; // 玩家旋轉平滑度
const cameraLerpFactor = 0.15;    // 攝影機移動平滑度

// 攝影機基礎偏移量 (相對於 lookAtPoint)
const cameraBaseOffset = new THREE.Vector3(0, 2, 5); // 後方 5, 上方 2
// 攝影機看向玩家的目標點偏移 (相對於 player.position)
const playerLookAtOffset = new THREE.Vector3(0, 1.0, 0); // 看向玩家身體稍高處

// --- 視窗大小調整 ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 動畫循環 ---
// --- (省略前面的設定代碼，使用上一回答中的完整代碼) ---

// --- 動畫循環 ---
function animate() {
  requestAnimationFrame(animate); // 請求下一幀

  // 1. 讀取最新的滑鼠輸入 (PointerLockControls 更新 controlTarget)
  //    這一步是隱式的，PointerLockControls 在背景處理滑鼠移動事件，
  //    並更新 controlTarget.rotation 和 controlTarget.quaternion。
  //    所以在這一點，controlTarget 的旋轉值反映了最新的滑鼠位置。

  // --- 計算"當前幀"的移動方向 ---
  // 2. 從 controlTarget 取得 "最新的" 水平視角 (Yaw)
  const cameraYaw = controlTarget.rotation.y;

  // 3. **** 即時計算 ****
  //    根據 "最新的" cameraYaw，計算出 "當前幀" 的前進方向
  const forwardDirection = new THREE.Vector3(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw)).normalize();
  //    根據 "最新的" cameraYaw，計算出 "當前幀" 的右側方向
  const rightDirection = new THREE.Vector3(-forwardDirection.z, 0, forwardDirection.x).normalize();

  // 4. 檢查 "當前幀" 的按鍵狀態
  const moveDirection = new THREE.Vector3();
  if (keys['w']) { // 如果 'W' *現在* 是按下的...
      moveDirection.add(forwardDirection); // ...就使用 *當前幀計算出的* forwardDirection
  }
  if (keys['s']) { // 同理...
      moveDirection.sub(forwardDirection);
  }
  if (keys['a']) { // 同理...
      moveDirection.sub(rightDirection);
  }
  if (keys['d']) { // 同理...
      moveDirection.add(rightDirection);
  }

  // --- 更新玩家和攝影機 ---
  // 5. 應用基於 "當前幀計算出的" moveDirection 來移動玩家
  if (moveDirection.lengthSq() > 0.001) {
    moveDirection.normalize().multiplyScalar(moveSpeed);
    player.position.add(moveDirection);
  }

  // 6. 根據 "最新的" cameraYaw 來旋轉玩家 (平滑過渡)
  const playerTargetQuaternion = new THREE.Quaternion();
  playerTargetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
  player.quaternion.slerp(playerTargetQuaternion, rotationSlerpFactor);

  // 7. 根據 "最新的" controlTarget 旋轉 和 玩家位置 來更新攝影機 (平滑過渡)
  const lookAtPoint = player.position.clone().add(playerLookAtOffset);
  const desiredOffset = cameraBaseOffset.clone();
  desiredOffset.applyQuaternion(controlTarget.quaternion); // 使用最新的完整旋轉
  const desiredCameraPosition = lookAtPoint.clone().add(desiredOffset);
  camera.position.lerp(desiredCameraPosition, cameraLerpFactor);
  camera.lookAt(lookAtPoint);

  // --- 渲染 ---
  renderer.render(scene, camera);
}

animate();