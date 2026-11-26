// 진로 퀘스트 - 게더타운 스타일 우주 탐험

const STORAGE_KEY = 'career_quest_gather_v1';

// 게임 상태
let gameState = {
  nickname: '탐험가',
  ship: '🚀',
  completedPlanets: [],
  stageData: {
    1: { quizScores: {} },
    2: { dreams: '', activities: '', strengths: '', tracks: [] },
    3: { competencies: {} },
    4: { quizScores: {} },
    5: { general: [], career: [], fusion: [] },
    6: { year1: '', year2: '', year3: '', goal: '' }
  }
};

// 맵 설정
const MAP_WIDTH = 2000;
const MAP_HEIGHT = 1500;

// 행성 데이터
const planets = [
  { id: 1, name: '기초 행성', icon: '📘', color: '#3b82f6', x: 300, y: 1200, radius: 60 },
  { id: 2, name: '탐색 행성', icon: '🔮', color: '#8b5cf6', x: 600, y: 900, radius: 60 },
  { id: 3, name: '역량 행성', icon: '⚡', color: '#ec4899', x: 1000, y: 700, radius: 60 },
  { id: 4, name: '지식 행성', icon: '📖', color: '#f97316', x: 1400, y: 900, radius: 60 },
  { id: 5, name: '선택 행성', icon: '🧪', color: '#22c55e', x: 1600, y: 500, radius: 60 },
  { id: 6, name: '설계 행성', icon: '🗺️', color: '#fbbf24', x: 1200, y: 300, radius: 60 },
];

// 별 배경 (랜덤 생성) - 더 많은 별로 우주 느낌
const stars = [];
for (let i = 0; i < 500; i++) {
  stars.push({
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    size: Math.random() * 2.5 + 0.3,
    brightness: Math.random(),
    twinkleSpeed: Math.random() * 3 + 1
  });
}

// 먼 은하들 (배경 장식)
const galaxies = [];
for (let i = 0; i < 8; i++) {
  galaxies.push({
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    radius: Math.random() * 80 + 40,
    rotation: Math.random() * Math.PI * 2,
    color: ['#8b5cf6', '#ec4899', '#3b82f6', '#06b6d4'][Math.floor(Math.random() * 4)]
  });
}

// 성운 (장식) - 더 풍부한 색상
const nebulae = [
  { x: 500, y: 500, radius: 350, color: 'rgba(139, 92, 246, 0.15)' },
  { x: 1500, y: 800, radius: 450, color: 'rgba(236, 72, 153, 0.12)' },
  { x: 900, y: 1200, radius: 400, color: 'rgba(59, 130, 246, 0.15)' },
  { x: 1800, y: 400, radius: 300, color: 'rgba(6, 182, 212, 0.1)' },
  { x: 300, y: 700, radius: 280, color: 'rgba(249, 115, 22, 0.08)' },
];

// 유성 (가끔 지나감)
let shootingStars = [];

// 플레이어 상태
let player = {
  x: 200,
  y: 1300,
  speed: 5,
  rotation: 0 // 라디안
};

// 카메라 (뷰포트)
let camera = {
  x: 0,
  y: 0
};

// 입력 상태
const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  action: false
};

// 클릭 이동 목표
let moveTarget = null;
let isMovingToTarget = false;

// 캔버스
let canvas, ctx;
let minimapCanvas, minimapCtx;
let animationId;
let nearPlanet = null;

// 효과음
const sounds = {
  fly: null,
  arrive: null
};

function initSounds() {
  // Web Audio API로 간단한 효과음 생성
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // 비행 소리 생성 함수
    sounds.flyCtx = audioCtx;
    sounds.flyOsc = null;
    
    sounds.arriveCtx = audioCtx;
  } catch (e) {
    console.log('오디오 초기화 실패');
  }
}

function playFlySound() {
  try {
    if (sounds.flyCtx && !sounds.flyOsc) {
      const ctx = sounds.flyCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      
      sounds.flyOsc = osc;
      sounds.flyGain = gain;
    }
  } catch (e) {}
}

function stopFlySound() {
  try {
    if (sounds.flyOsc) {
      sounds.flyOsc.stop();
      sounds.flyOsc = null;
    }
  } catch (e) {}
}

function playArriveSound() {
  try {
    if (sounds.arriveCtx) {
      const ctx = sounds.arriveCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  loadState();
});

// 상태 로드
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      gameState = { ...gameState, ...data };
    } catch (e) {
      console.error('로드 실패:', e);
    }
  }
}

// 상태 저장
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

// 게임 시작
function startGame() {
  const nickname = document.getElementById('nickname').value.trim() || '탐험가';
  const selectedShip = document.querySelector('input[name="ship"]:checked').value;
  
  gameState.nickname = nickname;
  gameState.ship = selectedShip;
  saveState();
  
  document.getElementById('intro').hidden = true;
  document.getElementById('game').hidden = false;
  document.getElementById('player-name').textContent = nickname;
  
  initSounds();
  initCanvas();
  setupInput();
  updateProgressUI();
  gameLoop();
}
window.startGame = startGame;

// 캔버스 초기화
function initCanvas() {
  canvas = document.getElementById('space-map');
  ctx = canvas.getContext('2d');
  
  minimapCanvas = document.getElementById('minimap-canvas');
  minimapCtx = minimapCanvas.getContext('2d');
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  minimapCanvas.width = 150;
  minimapCanvas.height = 150;
}

// 입력 설정
function setupInput() {
  // 키보드
  document.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
      case 'w': case 'arrowup': keys.up = true; break;
      case 's': case 'arrowdown': keys.down = true; break;
      case 'a': case 'arrowleft': keys.left = true; break;
      case 'd': case 'arrowright': keys.right = true; break;
      case ' ': case 'enter': keys.action = true; e.preventDefault(); break;
    }
  });
  
  document.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
      case 'w': case 'arrowup': keys.up = false; break;
      case 's': case 'arrowdown': keys.down = false; break;
      case 'a': case 'arrowleft': keys.left = false; break;
      case 'd': case 'arrowright': keys.right = false; break;
      case ' ': case 'enter': keys.action = false; break;
    }
  });
  
  // 모바일 조이스틱
  const joyBtns = document.querySelectorAll('.joy-btn');
  joyBtns.forEach(btn => {
    const dir = btn.dataset.dir;
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      keys[dir] = true;
    });
    btn.addEventListener('touchend', () => {
      keys[dir] = false;
    });
    btn.addEventListener('mousedown', () => keys[dir] = true);
    btn.addEventListener('mouseup', () => keys[dir] = false);
    btn.addEventListener('mouseleave', () => keys[dir] = false);
  });
  
  // 모바일 액션 버튼
  const actionBtn = document.getElementById('mobile-action');
  actionBtn.addEventListener('click', () => {
    if (nearPlanet) {
      openQuest(nearPlanet.id);
    }
  });
  
  // 캔버스 클릭으로 행성에 이동
  canvas.addEventListener('click', handleCanvasClick);
  canvas.addEventListener('touchend', handleCanvasTouch);
}

// 캔버스 클릭 처리
function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left + camera.x;
  const clickY = e.clientY - rect.top + camera.y;
  
  // 행성 클릭 체크
  for (const planet of planets) {
    const dist = distance(clickX, clickY, planet.x, planet.y);
    if (dist < planet.radius + 30) {
      // 행성 클릭 - 그 행성으로 이동 시작
      moveTarget = { x: planet.x, y: planet.y, planet: planet };
      isMovingToTarget = true;
      playFlySound();
      return;
    }
  }
  
  // 빈 공간 클릭 - 그 위치로 이동
  moveTarget = { x: clickX, y: clickY, planet: null };
  isMovingToTarget = true;
  playFlySound();
}

// 터치 처리
function handleCanvasTouch(e) {
  if (e.touches && e.touches.length > 0) return; // 멀티터치 무시
  const touch = e.changedTouches[0];
  const rect = canvas.getBoundingClientRect();
  const clickX = touch.clientX - rect.left + camera.x;
  const clickY = touch.clientY - rect.top + camera.y;
  
  for (const planet of planets) {
    const dist = distance(clickX, clickY, planet.x, planet.y);
    if (dist < planet.radius + 30) {
      moveTarget = { x: planet.x, y: planet.y, planet: planet };
      isMovingToTarget = true;
      playFlySound();
      return;
    }
  }
  
  moveTarget = { x: clickX, y: clickY, planet: null };
  isMovingToTarget = true;
  playFlySound();
}

// 게임 루프
function gameLoop() {
  update();
  render();
  animationId = requestAnimationFrame(gameLoop);
}

// 업데이트
function update() {
  // 이동 방향 계산
  let dx = 0, dy = 0;
  
  // 키보드 입력이 있으면 클릭 이동 취소
  if (keys.up || keys.down || keys.left || keys.right) {
    if (isMovingToTarget) {
      stopFlySound();
    }
    isMovingToTarget = false;
    moveTarget = null;
  }
  
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  
  // 클릭 이동 처리
  if (isMovingToTarget && moveTarget) {
    const distToTarget = distance(player.x, player.y, moveTarget.x, moveTarget.y);
    
    if (distToTarget < 10) {
      // 목표에 도착
      isMovingToTarget = false;
      stopFlySound();
      playArriveSound();
      if (moveTarget.planet) {
        // 행성에 도착하면 자동으로 퀘스트 열기
        nearPlanet = moveTarget.planet;
      }
      moveTarget = null;
    } else {
      // 목표를 향해 이동
      dx = (moveTarget.x - player.x) / distToTarget;
      dy = (moveTarget.y - player.y) / distToTarget;
    }
  }
  
  // 정규화
  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;
    
    // 회전 (이동 방향으로)
    player.rotation = Math.atan2(dy, dx) + Math.PI / 2;
  }
  
  // 이동
  player.x += dx * player.speed;
  player.y += dy * player.speed;
  
  // 유성 업데이트
  updateShootingStars();
  
  // 맵 경계
  player.x = Math.max(50, Math.min(MAP_WIDTH - 50, player.x));
  player.y = Math.max(50, Math.min(MAP_HEIGHT - 50, player.y));
  
  // 카메라 추적 (부드럽게)
  const targetCamX = player.x - canvas.width / 2;
  const targetCamY = player.y - canvas.height / 2;
  camera.x += (targetCamX - camera.x) * 0.1;
  camera.y += (targetCamY - camera.y) * 0.1;
  
  // 카메라 경계
  camera.x = Math.max(0, Math.min(MAP_WIDTH - canvas.width, camera.x));
  camera.y = Math.max(0, Math.min(MAP_HEIGHT - canvas.height, camera.y));
  
  // 행성 근접 체크
  nearPlanet = null;
  for (const planet of planets) {
    const dist = distance(player.x, player.y, planet.x, planet.y);
    if (dist < planet.radius + 80) { // 접근 범위
      nearPlanet = planet;
      break;
    }
  }
  
  // 상호작용 힌트 표시
  const hint = document.getElementById('interaction-hint');
  if (nearPlanet) {
    hint.hidden = false;
    document.getElementById('hint-planet-name').textContent = nearPlanet.name;
    
    // 스페이스바로 착륙
    if (keys.action) {
      keys.action = false; // 한 번만 처리
      openQuest(nearPlanet.id);
    }
  } else {
    hint.hidden = true;
  }
}

// 유성 업데이트
function updateShootingStars() {
  // 가끔 새 유성 생성
  if (Math.random() < 0.005 && shootingStars.length < 3) {
    shootingStars.push({
      x: Math.random() * MAP_WIDTH,
      y: Math.random() * 200,
      vx: (Math.random() - 0.5) * 15 - 5,
      vy: Math.random() * 10 + 5,
      life: 1,
      length: Math.random() * 80 + 40
    });
  }
  
  // 유성 이동 및 소멸
  shootingStars = shootingStars.filter(s => {
    s.x += s.vx;
    s.y += s.vy;
    s.life -= 0.02;
    return s.life > 0 && s.y < MAP_HEIGHT;
  });
}

// 렌더링
function render() {
  // 우주 배경 그라데이션
  const bgGradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
  );
  bgGradient.addColorStop(0, '#0d0d20');
  bgGradient.addColorStop(0.5, '#080815');
  bgGradient.addColorStop(1, '#020208');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 먼 은하들 (매우 희미하게)
  for (const galaxy of galaxies) {
    const screenX = galaxy.x - camera.x * 0.3; // 패럴랙스 효과
    const screenY = galaxy.y - camera.y * 0.3;
    
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(galaxy.rotation);
    ctx.globalAlpha = 0.15;
    
    // 나선 은하 모양
    const galaxyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.radius);
    galaxyGradient.addColorStop(0, galaxy.color);
    galaxyGradient.addColorStop(0.5, galaxy.color + '40');
    galaxyGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = galaxyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, galaxy.radius, galaxy.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  
  // 성운 (배경 장식)
  for (const neb of nebulae) {
    const screenX = neb.x - camera.x * 0.7; // 약간의 패럴랙스
    const screenY = neb.y - camera.y * 0.7;
    
    const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, neb.radius);
    gradient.addColorStop(0, neb.color);
    gradient.addColorStop(0.6, neb.color.replace(/[\d.]+\)$/, '0.05)'));
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(screenX - neb.radius, screenY - neb.radius, neb.radius * 2, neb.radius * 2);
  }
  
  // 별
  const time = Date.now() / 1000;
  for (const star of stars) {
    const screenX = star.x - camera.x * 0.9; // 별도 약간 패럴랙스
    const screenY = star.y - camera.y * 0.9;
    
    // 화면 밖이면 스킵
    if (screenX < -10 || screenX > canvas.width + 10 || screenY < -10 || screenY > canvas.height + 10) continue;
    
    const twinkle = 0.4 + 0.6 * Math.sin(time * star.twinkleSpeed + star.brightness * 10);
    const alpha = star.brightness * twinkle;
    
    // 밝은 별은 약간 색상 추가
    if (star.brightness > 0.8) {
      ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
    } else if (star.brightness > 0.6) {
      ctx.fillStyle = `rgba(255, 240, 220, ${alpha})`;
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    }
    
    ctx.beginPath();
    ctx.arc(screenX, screenY, star.size, 0, Math.PI * 2);
    ctx.fill();
    
    // 아주 밝은 별은 빛나는 효과
    if (star.brightness > 0.85 && star.size > 1.5) {
      ctx.beginPath();
      ctx.arc(screenX, screenY, star.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.1})`;
      ctx.fill();
    }
  }
  
  // 유성
  for (const s of shootingStars) {
    const screenX = s.x - camera.x;
    const screenY = s.y - camera.y;
    
    const gradient = ctx.createLinearGradient(
      screenX, screenY,
      screenX - s.vx * 3, screenY - s.vy * 3
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${s.life})`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX - s.vx * 3, screenY - s.vy * 3);
    ctx.stroke();
  }
  
  // 궤도선 (행성들을 연결)
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  
  // 시작점
  ctx.moveTo(200 - camera.x, 1300 - camera.y);
  for (const planet of planets) {
    ctx.lineTo(planet.x - camera.x, planet.y - camera.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  
  // 행성들
  for (const planet of planets) {
    drawPlanet(planet);
  }
  
  // 플레이어
  drawPlayer();
  
  // 클릭 이동 목표 표시
  if (isMovingToTarget && moveTarget) {
    const targetX = moveTarget.x - camera.x;
    const targetY = moveTarget.y - camera.y;
    
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(player.x - camera.x, player.y - camera.y);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 목표 지점 마커
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 15 + Math.sin(Date.now() / 200) * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 미니맵
  renderMinimap();
}

// 행성 그리기
function drawPlanet(planet) {
  const screenX = planet.x - camera.x;
  const screenY = planet.y - camera.y;
  
  // 화면 밖이면 스킵
  if (screenX < -100 || screenX > canvas.width + 100 || screenY < -100 || screenY > canvas.height + 100) return;
  
  const isCompleted = gameState.completedPlanets.includes(planet.id);
  const isLocked = planet.id > 1 && !gameState.completedPlanets.includes(planet.id - 1);
  const isNear = nearPlanet && nearPlanet.id === planet.id;
  
  // 글로우 효과
  if (isNear) {
    ctx.shadowColor = planet.color;
    ctx.shadowBlur = 40;
  }
  
  // 행성 본체
  const gradient = ctx.createRadialGradient(
    screenX - planet.radius * 0.3, screenY - planet.radius * 0.3, 0,
    screenX, screenY, planet.radius
  );
  
  if (isLocked) {
    gradient.addColorStop(0, 'rgba(100, 100, 120, 0.8)');
    gradient.addColorStop(1, 'rgba(50, 50, 70, 0.8)');
  } else if (isCompleted) {
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.9)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0.9)');
  } else {
    gradient.addColorStop(0, `${planet.color}ee`);
    gradient.addColorStop(1, `${planet.color}99`);
  }
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(screenX, screenY, planet.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // 행성 고리
  ctx.strokeStyle = isLocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(screenX, screenY, planet.radius * 1.4, planet.radius * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.shadowBlur = 0;
  
  // 아이콘
  ctx.font = `${planet.radius * 0.8}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(planet.icon, screenX, screenY);
  
  // 이름
  ctx.font = 'bold 14px "Noto Sans KR"';
  ctx.fillStyle = isLocked ? 'rgba(255,255,255,0.3)' : '#ffffff';
  ctx.fillText(planet.name, screenX, screenY + planet.radius + 20);
  
  // 상태 표시
  if (isCompleted) {
    ctx.font = '20px sans-serif';
    ctx.fillText('✅', screenX + planet.radius - 10, screenY - planet.radius + 10);
  } else if (isLocked) {
    ctx.font = '20px sans-serif';
    ctx.fillText('🔒', screenX + planet.radius - 10, screenY - planet.radius + 10);
  }
}

// 플레이어 그리기
function drawPlayer() {
  const screenX = player.x - camera.x;
  const screenY = player.y - camera.y;
  
  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.rotate(player.rotation);
  
  // 추진 불꽃 (이동 중일 때)
  if (keys.up || keys.down || keys.left || keys.right) {
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥', 0, 25);
  }
  
  // 우주선
  ctx.font = '40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(gameState.ship, 0, 0);
  
  ctx.restore();
}

// 미니맵 렌더링
function renderMinimap() {
  const scale = 150 / Math.max(MAP_WIDTH, MAP_HEIGHT);
  
  minimapCtx.fillStyle = 'rgba(10, 10, 24, 0.9)';
  minimapCtx.fillRect(0, 0, 150, 150);
  
  // 행성들
  for (const planet of planets) {
    const x = planet.x * scale;
    const y = planet.y * scale;
    
    const isCompleted = gameState.completedPlanets.includes(planet.id);
    const isLocked = planet.id > 1 && !gameState.completedPlanets.includes(planet.id - 1);
    
    minimapCtx.fillStyle = isLocked ? '#555' : isCompleted ? '#4ade80' : planet.color;
    minimapCtx.beginPath();
    minimapCtx.arc(x, y, 5, 0, Math.PI * 2);
    minimapCtx.fill();
  }
  
  // 플레이어
  minimapCtx.fillStyle = '#ffd700';
  minimapCtx.beginPath();
  minimapCtx.arc(player.x * scale, player.y * scale, 4, 0, Math.PI * 2);
  minimapCtx.fill();
  
  // 뷰포트 영역
  minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(
    camera.x * scale,
    camera.y * scale,
    canvas.width * scale,
    canvas.height * scale
  );
}

// 거리 계산
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// 퀘스트 열기
function openQuest(planetId) {
  const planet = planets.find(p => p.id === planetId);
  if (!planet) return;
  
  // 잠금 체크
  if (planetId > 1 && !gameState.completedPlanets.includes(planetId - 1)) {
    showToast('🔒 이전 행성을 먼저 클리어하세요!');
    return;
  }
  
  const modal = document.getElementById(`quest-${planetId}`);
  if (modal) {
    modal.hidden = false;
    loadStageData(planetId);
  }
}
window.openQuest = openQuest;

// 퀘스트 닫기
function closeQuest() {
  document.querySelectorAll('.quest-modal').forEach(m => m.hidden = true);
}
window.closeQuest = closeQuest;

// 스테이지 데이터 로드
function loadStageData(stageNum) {
  const data = gameState.stageData[stageNum];
  if (!data) return;
  
  if (stageNum === 2) {
    document.getElementById('input-2-1').value = data.dreams || '';
    document.getElementById('input-2-2').value = data.activities || '';
    document.getElementById('input-2-3').value = data.strengths || '';
    document.querySelectorAll('input[name="track"]').forEach(input => {
      input.checked = data.tracks?.includes(input.value) || false;
    });
  }
  
  if (stageNum === 3) {
    document.querySelectorAll('.competency-item').forEach(item => {
      const comp = item.dataset.comp;
      const val = data.competencies?.[comp] || 0;
      item.querySelectorAll('.star').forEach((star, idx) => {
        star.classList.toggle('active', idx < val);
      });
    });
    setupStarRatings();
  }
  
  if (stageNum === 5) {
    ['general', 'career', 'fusion'].forEach(type => {
      document.querySelectorAll(`input[name="${type}"]`).forEach(input => {
        input.checked = data[type]?.includes(input.value) || false;
      });
    });
  }
  
  if (stageNum === 6) {
    document.getElementById('plan-year1').value = data.year1 || '';
    document.getElementById('plan-year2').value = data.year2 || '';
    document.getElementById('plan-year3').value = data.year3 || '';
    document.getElementById('plan-goal').value = data.goal || '';
  }
  
  setupQuizHandlers();
  setupFormHandlers(stageNum);
  updateCompleteButton(stageNum);
}

// 퀴즈 핸들러
function setupQuizHandlers() {
  document.querySelectorAll('.quiz-option').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = 'true';
    
    btn.addEventListener('click', function() {
      const quizItem = this.closest('.quiz-item');
      const quizId = quizItem.dataset.quiz;
      const isCorrect = this.dataset.answer === 'correct';
      const stageNum = parseInt(quizId.split('-')[0]);
      
      if (quizItem.querySelector('.quiz-option.correct')) return;
      
      quizItem.querySelectorAll('.quiz-option.wrong').forEach(opt => opt.classList.remove('wrong'));
      
      if (isCorrect) {
        this.classList.add('correct');
        quizItem.querySelector('.quiz-feedback').textContent = '✅ 정답!';
        quizItem.querySelector('.quiz-feedback').style.color = '#4ade80';
        gameState.stageData[stageNum].quizScores[quizId] = true;
        quizItem.querySelectorAll('.quiz-option').forEach(opt => opt.disabled = true);
      } else {
        this.classList.add('wrong');
        quizItem.querySelector('.quiz-feedback').textContent = '❌ 다시 시도!';
        quizItem.querySelector('.quiz-feedback').style.color = '#ef4444';
        this.disabled = true;
        setTimeout(() => {
          if (!quizItem.querySelector('.quiz-option.correct')) {
            this.disabled = false;
            this.classList.remove('wrong');
            quizItem.querySelector('.quiz-feedback').textContent = '';
          }
        }, 1000);
      }
      
      saveState();
      updateQuizScore(stageNum);
    });
  });
}

// 퀴즈 점수 업데이트
function updateQuizScore(stageNum) {
  const scores = gameState.stageData[stageNum].quizScores;
  const correctCount = Object.values(scores).filter(v => v).length;
  const scoreEl = document.getElementById(`quiz-score-${stageNum}`);
  if (scoreEl) scoreEl.textContent = correctCount;
  updateCompleteButton(stageNum);
}

// 별점 설정
function setupStarRatings() {
  document.querySelectorAll('.competency-item').forEach(item => {
    const comp = item.dataset.comp;
    item.querySelectorAll('.star').forEach(star => {
      if (star.dataset.bound) return;
      star.dataset.bound = 'true';
      
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val);
        gameState.stageData[3].competencies[comp] = val;
        
        item.querySelectorAll('.star').forEach((s, idx) => {
          s.classList.toggle('active', idx < val);
        });
        
        saveState();
        updateCompleteButton(3);
      });
    });
  });
}

// 폼 핸들러
function setupFormHandlers(stageNum) {
  if (stageNum === 2) {
    ['input-2-1', 'input-2-2', 'input-2-3'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.bound) {
        el.dataset.bound = 'true';
        el.addEventListener('input', () => updateCompleteButton(2));
      }
    });
    document.querySelectorAll('input[name="track"]').forEach(input => {
      if (!input.dataset.bound) {
        input.dataset.bound = 'true';
        input.addEventListener('change', () => updateCompleteButton(2));
      }
    });
  }
  
  if (stageNum === 5) {
    ['general', 'career', 'fusion'].forEach(type => {
      document.querySelectorAll(`input[name="${type}"]`).forEach(input => {
        if (!input.dataset.bound) {
          input.dataset.bound = 'true';
          input.addEventListener('change', () => updateCompleteButton(5));
        }
      });
    });
  }
  
  if (stageNum === 6) {
    ['plan-year1', 'plan-year2', 'plan-year3', 'plan-goal'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.bound) {
        el.dataset.bound = 'true';
        el.addEventListener('input', () => updateCompleteButton(6));
      }
    });
  }
}

// 저장
function saveQuest(stageNum) {
  if (stageNum === 2) {
    gameState.stageData[2] = {
      dreams: document.getElementById('input-2-1')?.value || '',
      activities: document.getElementById('input-2-2')?.value || '',
      strengths: document.getElementById('input-2-3')?.value || '',
      tracks: Array.from(document.querySelectorAll('input[name="track"]:checked')).map(c => c.value)
    };
  }
  
  if (stageNum === 5) {
    gameState.stageData[5] = {
      general: Array.from(document.querySelectorAll('input[name="general"]:checked')).map(c => c.value),
      career: Array.from(document.querySelectorAll('input[name="career"]:checked')).map(c => c.value),
      fusion: Array.from(document.querySelectorAll('input[name="fusion"]:checked')).map(c => c.value)
    };
  }
  
  if (stageNum === 6) {
    gameState.stageData[6] = {
      year1: document.getElementById('plan-year1')?.value || '',
      year2: document.getElementById('plan-year2')?.value || '',
      year3: document.getElementById('plan-year3')?.value || '',
      goal: document.getElementById('plan-goal')?.value || ''
    };
  }
  
  saveState();
  showToast('💾 저장됨!');
  updateCompleteButton(stageNum);
}
window.saveQuest = saveQuest;

// 완료 버튼 상태
function updateCompleteButton(stageNum) {
  const btn = document.getElementById(`complete-${stageNum}`);
  if (!btn) return;
  
  let canComplete = false;
  
  if (stageNum === 1) {
    const scores = gameState.stageData[1].quizScores;
    canComplete = Object.values(scores).filter(v => v).length >= 3;
  }
  
  if (stageNum === 2) {
    const d1 = document.getElementById('input-2-1')?.value?.trim();
    const d2 = document.getElementById('input-2-2')?.value?.trim();
    const d3 = document.getElementById('input-2-3')?.value?.trim();
    const tracks = document.querySelectorAll('input[name="track"]:checked');
    canComplete = d1 && d2 && d3 && tracks.length > 0;
  }
  
  if (stageNum === 3) {
    const comps = gameState.stageData[3].competencies;
    canComplete = Object.keys(comps).length >= 6;
  }
  
  if (stageNum === 4) {
    const scores = gameState.stageData[4].quizScores;
    canComplete = Object.values(scores).filter(v => v).length >= 2;
  }
  
  if (stageNum === 5) {
    const generalCount = document.querySelectorAll('input[name="general"]:checked').length;
    const careerCount = document.querySelectorAll('input[name="career"]:checked').length;
    const fusionCount = document.querySelectorAll('input[name="fusion"]:checked').length;
    canComplete = generalCount >= 3 && careerCount >= 3 && fusionCount >= 2;
  }
  
  if (stageNum === 6) {
    const y1 = document.getElementById('plan-year1')?.value?.trim();
    const y2 = document.getElementById('plan-year2')?.value?.trim();
    const y3 = document.getElementById('plan-year3')?.value?.trim();
    const goal = document.getElementById('plan-goal')?.value?.trim();
    canComplete = y1 && y2 && y3 && goal;
  }
  
  btn.disabled = !canComplete;
}

// 퀘스트 완료
function completeQuest(stageNum) {
  saveQuest(stageNum);
  
  if (!gameState.completedPlanets.includes(stageNum)) {
    gameState.completedPlanets.push(stageNum);
    saveState();
  }
  
  closeQuest();
  updateProgressUI();
  
  // 완료 모달
  const modal = document.getElementById('complete-modal');
  const msg = document.getElementById('complete-message');
  const planet = planets.find(p => p.id === stageNum);
  
  if (stageNum === 6) {
    msg.textContent = '모든 행성을 탐험했어요! 🎉';
  } else {
    msg.textContent = `${planet?.name} 탐험 완료!`;
  }
  
  modal.hidden = false;
}
window.completeQuest = completeQuest;

// 완료 모달 닫기
function closeComplete() {
  document.getElementById('complete-modal').hidden = true;
  
  if (gameState.completedPlanets.length >= 6) {
    showFinalResult();
  }
}
window.closeComplete = closeComplete;

// 진행 UI 업데이트
function updateProgressUI() {
  document.getElementById('progress-count').textContent = gameState.completedPlanets.length;
  
  // 메뉴의 행성 목록
  const list = document.getElementById('planet-list');
  if (list) {
    list.innerHTML = planets.map(p => {
      const completed = gameState.completedPlanets.includes(p.id);
      const locked = p.id > 1 && !gameState.completedPlanets.includes(p.id - 1);
      return `
        <div class="planet-item ${completed ? 'completed' : ''} ${locked ? 'locked' : ''}">
          <span>${p.icon}</span>
          <span>${p.name}</span>
          <span>${completed ? '✅' : locked ? '🔒' : ''}</span>
        </div>
      `;
    }).join('');
  }
}

// 메뉴 토글
function toggleMenu() {
  const panel = document.getElementById('menu-panel');
  panel.hidden = !panel.hidden;
  updateProgressUI();
}
window.toggleMenu = toggleMenu;

// 최종 결과
function showFinalResult() {
  const body = document.getElementById('final-body');
  const data = gameState.stageData;
  
  body.innerHTML = `
    <div class="final-section">
      <h3>🔍 나의 자기 이해</h3>
      <div class="final-item"><strong>꿈:</strong> ${data[2].dreams || '-'}</div>
      <div class="final-item"><strong>좋아하는 활동:</strong> ${data[2].activities || '-'}</div>
      <div class="final-item"><strong>강점:</strong> ${data[2].strengths || '-'}</div>
    </div>
    <div class="final-section">
      <h3>🎯 선택한 계열</h3>
      <div class="final-tags">${(data[2].tracks || []).map(t => `<span class="final-tag">${t}</span>`).join('')}</div>
    </div>
    <div class="final-section">
      <h3>📚 선택한 과목</h3>
      <div class="final-item"><strong>일반선택:</strong></div>
      <div class="final-tags">${(data[5].general || []).map(s => `<span class="final-tag">${s}</span>`).join('')}</div>
      <div class="final-item"><strong>진로선택:</strong></div>
      <div class="final-tags">${(data[5].career || []).map(s => `<span class="final-tag">${s}</span>`).join('')}</div>
      <div class="final-item"><strong>융합선택:</strong></div>
      <div class="final-tags">${(data[5].fusion || []).map(s => `<span class="final-tag">${s}</span>`).join('')}</div>
    </div>
    <div class="final-section">
      <h3>📅 3년 계획</h3>
      <div class="final-item"><strong>1학년:</strong> ${data[6].year1 || '-'}</div>
      <div class="final-item"><strong>2학년:</strong> ${data[6].year2 || '-'}</div>
      <div class="final-item"><strong>3학년:</strong> ${data[6].year3 || '-'}</div>
      <div class="final-item"><strong>진로 목표:</strong> ${data[6].goal || '-'}</div>
    </div>
  `;
  
  document.getElementById('final-modal').hidden = false;
}

function closeFinal() {
  document.getElementById('final-modal').hidden = true;
}
window.closeFinal = closeFinal;

// 결과 다운로드
function downloadResult() {
  const data = gameState.stageData;
  const nickname = gameState.nickname;
  
  const text = `
═══════════════════════════════════════
   🚀 ${nickname}의 진로 로드맵
═══════════════════════════════════════

📅 작성일: ${new Date().toLocaleDateString('ko-KR')}

──────────────────────────────────────
🔍 나의 자기 이해
──────────────────────────────────────
• 어릴 때 꿈: ${data[2].dreams || '-'}
• 좋아하는 활동: ${data[2].activities || '-'}
• 나의 강점: ${data[2].strengths || '-'}

──────────────────────────────────────
🎯 관심 계열
──────────────────────────────────────
${(data[2].tracks || []).join(', ') || '-'}

──────────────────────────────────────
📚 선택한 과목
──────────────────────────────────────
• 일반선택: ${(data[5].general || []).join(', ') || '-'}
• 진로선택: ${(data[5].career || []).join(', ') || '-'}
• 융합선택: ${(data[5].fusion || []).join(', ') || '-'}

──────────────────────────────────────
📅 3년 학업계획
──────────────────────────────────────
[1학년] ${data[6].year1 || '-'}
[2학년] ${data[6].year2 || '-'}
[3학년] ${data[6].year3 || '-'}

[진로 목표] ${data[6].goal || '-'}

═══════════════════════════════════════
   나의 꿈을 향해 한 걸음씩! 🌟
═══════════════════════════════════════
  `.trim();
  
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `진로로드맵_${nickname}_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('📥 저장 완료!');
}
window.downloadResult = downloadResult;

// 리셋
function resetGame() {
  if (confirm('모든 진행 상황이 초기화됩니다. 계속할까요?')) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}
window.resetGame = resetGame;

// 토스트
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: rgba(168, 85, 247, 0.95);
    color: white;
    border-radius: 10px;
    font-weight: 600;
    z-index: 1000;
    animation: fadeInOut 2s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// 애니메이션 스타일 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  }
`;
document.head.appendChild(style);

console.log('🚀 진로 퀘스트 - 게더타운 스타일 로드 완료!');
