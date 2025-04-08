import * as THREE from 'three';

// --- 建立場景與基礎元件 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

// 加入一個cube
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 顯示 cube 模型以恢復第三人稱視角
cube.visible = true;

// 攝影機位於cube斜後方
const groundLevel = 1.6;
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, groundLevel + 2, 5); // 從斜後方看

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 旋轉參數
let pitch = 0;
let yaw = 0;

// 滑鼠控制 box 旋轉
document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === renderer.domElement) {
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    yaw -= movementX * 0.002;
    pitch -= movementY * 0.002;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

    cube.rotation.set(0, yaw, 0); // 只旋轉 Y 軸，讓物體平行於地面
    cube.rotation.x = pitch; // 單獨設置 X 軸旋轉，可解決萬向鎖問題
  }
});

// 更新攝影機位置以跟隨物體並保持斜後方視角
function updateCameraPosition() {
  if (cube) {
    // 計算相對於立方體的偏移位置
    const offsetDistance = 5; // 距離
    const offsetHeight = 2;   // 高度偏移
    
    // 獲取立方體的前進方向（基於其旋轉）
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(cube.quaternion);
    
    // 計算攝影機位置
    camera.position.copy(cube.position)
      .add(new THREE.Vector3(0, offsetHeight, 0)) // 高度偏移
      .add(direction.clone().multiplyScalar(-offsetDistance)); // 後方距離
    
    // 攝影機看向立方體略高的位置
    camera.lookAt(cube.position.clone().add(new THREE.Vector3(0, 0.5, 0)));
  }
}

// - --- 加入平面與光源 ---
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

// 跳躍物理參數
let velocityY = 0;            // 垂直速度
const jumpSpeed = 20;          // 跳躍初始速度
const gravity = -9.8;         // 重力加速度

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
    case ' ': // 空白鍵
      // 只有在接觸地面時才能跳躍
      if (cube.position.y <= groundLevel + 0.05) {
        velocityY = jumpSpeed;
        console.log("空白鍵觸發跳躍");
      }
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

// 鎖定滑鼠指針
document.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

const walkableObjects: THREE.Object3D[] = [plane]; // 加入地面作為可行走物體

function addGroundCones(scene: THREE.Scene) {
  const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

  for (let i = 0; i < 150; i++) {
    const radius = 0.5 + Math.random();  // 底部半徑
    const height = 1 + Math.random() * 2; // 高度
    const radialSegments = 8;
    const coneGeometry = new THREE.ConeGeometry(radius, height, radialSegments);
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.castShadow = true;
    cone.receiveShadow = true;

    // 隨機位置在 -50 ~ 50 範圍內
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;

    cone.position.set(x, height / 2, z); // 讓底部接觸地面
    scene.add(cone);
    walkableObjects.push(cone);
  }
}

const raycaster = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0);

function updateGroundCollision() {
  const ObjPosition = cube.position.clone();
  // 從物體位置向下發射射線
  ObjPosition.y += 0.1; // 稍微提高起點以確保檢測到地面
  raycaster.set(ObjPosition, down);
  const intersects = raycaster.intersectObjects(walkableObjects, true);

  if (intersects.length > 0) {
    const y = intersects[0].point.y;
    if (cube.position.y <= y + 0.5) { // 0.5 為 cube 的半高
      cube.position.y = y + 0.5;
      velocityY = 0;
    }
  }
}

// --- 主動畫循環 ---
// 使用 clock 來計算每一幀的時間差，方便以速度（單位/秒）計算位移
const clock = new THREE.Clock();
const speed = 10; // 每秒移動的單位距離

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // 更新物體移動邏輯
  const moveDirection = new THREE.Vector3(0, 0, 0);
  
  // 根據物體的旋轉獲取前後左右方向
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cube.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cube.quaternion);
  
  // 組合移動方向
  if (move.forward) moveDirection.add(forward);
  if (move.backward) moveDirection.sub(forward);
  if (move.left) moveDirection.sub(right);
  if (move.right) moveDirection.add(right);
  
  // 標準化移動方向並應用速度
  if (moveDirection.length() > 0) {
    moveDirection.normalize();
    moveDirection.multiplyScalar(speed * delta);
    cube.position.add(moveDirection);
  }

  // 應用重力
  velocityY += gravity * delta;
  cube.position.y += velocityY * delta;

  // 簡單地面碰撞檢查
  if (cube.position.y < groundLevel) {
    cube.position.y = groundLevel;
    velocityY = 0;
  }

  // 更新與其他物體的碰撞
  updateGroundCollision();
  
  // 更新攝影機位置
  updateCameraPosition();
  
  // 渲染場景
  renderer.render(scene, camera);
}

addGroundCones(scene); // 在地面上隨機放置三角形
clock.start();
animate();

// --- 自適應視窗大小 ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});