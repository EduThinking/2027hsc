// 진로 퀘스트 - 게더타운 스타일 (Phaser 3)

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 18;

// 게임 설정
const config = {
  type: Phaser.AUTO,
  width: MAP_WIDTH * TILE_SIZE,
  height: MAP_HEIGHT * TILE_SIZE,
  parent: 'game-container',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

// 게임 상태
let player;
let cursors;
let interactKey;
let planets = [];
let currentPlanet = null;
let dialogBox = null;
let isDialogOpen = false;
let playerName = '탐험가';
let completedQuests = [];

// 행성/건물 데이터
const locations = [
  { id: 1, name: '기초 연구소', emoji: '📘', gridX: 4, gridY: 4, color: 0x3b82f6, quest: '고교학점제 이해하기' },
  { id: 2, name: '탐색 센터', emoji: '🔮', gridX: 12, gridY: 3, color: 0x8b5cf6, quest: '나의 계열 탐색' },
  { id: 3, name: '역량 훈련장', emoji: '⚡', gridX: 20, gridY: 5, color: 0xec4899, quest: '핵심역량 체크' },
  { id: 4, name: '지식 도서관', emoji: '📖', gridX: 5, gridY: 12, color: 0xf97316, quest: '교육과정표 읽기' },
  { id: 5, name: '선택 실험실', emoji: '🧪', gridX: 12, gridY: 14, color: 0x22c55e, quest: '과목 선택하기' },
  { id: 6, name: '설계 본부', emoji: '🗺️', gridX: 20, gridY: 12, color: 0xfbbf24, quest: '학업계획서 작성' },
];

function preload() {
  // 스프라이트 시트 생성 (런타임)
  this.load.on('complete', () => {
    createSprites(this);
  });
}

function createSprites(scene) {
  // 캐릭터 스프라이트 (도트 스타일 우주인)
  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  
  // 플레이어 스프라이트 (4방향 x 2프레임 = 8프레임)
  const spriteWidth = 32;
  const spriteHeight = 32;
  
  // 간단한 우주인 그리기
  for (let dir = 0; dir < 4; dir++) {
    for (let frame = 0; frame < 2; frame++) {
      const x = (dir * 2 + frame) * spriteWidth;
      
      // 헬멧 (흰색 원)
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(x + 16, 10, 8);
      
      // 얼굴 유리 (하늘색)
      graphics.fillStyle(0x87ceeb);
      graphics.fillCircle(x + 16, 10, 5);
      
      // 몸통 (우주복 - 주황색)
      graphics.fillStyle(0xff7f50);
      graphics.fillRoundedRect(x + 10, 16, 12, 10, 3);
      
      // 다리 (걷기 애니메이션)
      graphics.fillStyle(0xff6347);
      if (frame === 0) {
        graphics.fillRect(x + 11, 26, 4, 5);
        graphics.fillRect(x + 17, 26, 4, 5);
      } else {
        graphics.fillRect(x + 10, 26, 4, 5);
        graphics.fillRect(x + 18, 26, 4, 5);
      }
      
      // 배낭 (파란색)
      graphics.fillStyle(0x4169e1);
      graphics.fillRoundedRect(x + 6, 17, 4, 7, 2);
    }
  }
  
  graphics.generateTexture('player', spriteWidth * 8, spriteHeight);
  graphics.destroy();
}

function create() {
  // 배경 (우주 타일)
  createBackground(this);
  
  // 행성/건물 생성
  createLocations(this);
  
  // 플레이어 생성
  createPlayer(this);
  
  // 입력 설정
  cursors = this.input.keyboard.createCursorKeys();
  this.input.keyboard.addKeys('W,A,S,D');
  interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  
  // UI 생성
  createUI(this);
  
  // 카메라 설정
  this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
}

function createBackground(scene) {
  const graphics = scene.add.graphics();
  
  // 우주 배경 그라데이션
  for (let y = 0; y < MAP_HEIGHT * TILE_SIZE; y += 4) {
    const ratio = y / (MAP_HEIGHT * TILE_SIZE);
    const r = Math.floor(26 + ratio * 10);
    const g = Math.floor(26 + ratio * 5);
    const b = Math.floor(46 + ratio * 20);
    graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
    graphics.fillRect(0, y, MAP_WIDTH * TILE_SIZE, 4);
  }
  
  // 별 그리기
  for (let i = 0; i < 100; i++) {
    const x = Phaser.Math.Between(0, MAP_WIDTH * TILE_SIZE);
    const y = Phaser.Math.Between(0, MAP_HEIGHT * TILE_SIZE);
    const size = Phaser.Math.Between(1, 3);
    const alpha = Phaser.Math.FloatBetween(0.3, 1);
    
    graphics.fillStyle(0xffffff, alpha);
    graphics.fillCircle(x, y, size);
  }
  
  // 바닥 타일 (우주 정거장 느낌)
  for (let x = 0; x < MAP_WIDTH; x++) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      // 체크무늬 바닥
      const isLight = (x + y) % 2 === 0;
      graphics.fillStyle(isLight ? 0x2a2a4a : 0x252545, 0.5);
      graphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      
      // 타일 테두리
      graphics.lineStyle(1, 0x3a3a6a, 0.3);
      graphics.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

function createLocations(scene) {
  locations.forEach(loc => {
    // 건물 그래픽
    const building = scene.add.graphics();
    const x = loc.gridX * TILE_SIZE;
    const y = loc.gridY * TILE_SIZE;
    
    // 건물 그림자
    building.fillStyle(0x000000, 0.3);
    building.fillRoundedRect(x + 4, y + 4, TILE_SIZE * 2, TILE_SIZE * 2, 8);
    
    // 건물 본체
    building.fillStyle(loc.color, 0.9);
    building.fillRoundedRect(x, y, TILE_SIZE * 2, TILE_SIZE * 2, 8);
    
    // 건물 하이라이트
    building.fillStyle(0xffffff, 0.2);
    building.fillRoundedRect(x + 4, y + 4, TILE_SIZE * 2 - 8, 8, 4);
    
    // 이모지 표시
    const emoji = scene.add.text(x + TILE_SIZE, y + TILE_SIZE - 5, loc.emoji, {
      fontSize: '28px'
    }).setOrigin(0.5);
    
    // 건물 이름
    const nameTag = scene.add.text(x + TILE_SIZE, y + TILE_SIZE * 2 + 8, loc.name, {
      fontSize: '11px',
      fontFamily: 'Noto Sans KR',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    // 상호작용 영역
    const zone = scene.add.zone(x + TILE_SIZE, y + TILE_SIZE, TILE_SIZE * 3, TILE_SIZE * 3);
    zone.locationData = loc;
    planets.push(zone);
  });
}

function createPlayer(scene) {
  // 플레이어 시작 위치
  const startX = 12 * TILE_SIZE + TILE_SIZE / 2;
  const startY = 9 * TILE_SIZE + TILE_SIZE / 2;
  
  // 플레이어 스프라이트
  player = scene.add.graphics();
  player.x = startX;
  player.y = startY;
  player.setDepth(10);
  
  // 플레이어 그리기
  drawPlayer(0);
  
  // 플레이어 이름표
  player.nameTag = scene.add.text(startX, startY - 24, playerName, {
    fontSize: '10px',
    fontFamily: 'Noto Sans KR',
    color: '#ffffff',
    backgroundColor: '#6b46c1',
    padding: { x: 4, y: 2 }
  }).setOrigin(0.5).setDepth(11);
  
  player.speed = 3;
  player.direction = 0; // 0: down, 1: left, 2: right, 3: up
  player.frame = 0;
  player.frameTimer = 0;
}

function drawPlayer(frame) {
  player.clear();
  
  // 그림자
  player.fillStyle(0x000000, 0.3);
  player.fillEllipse(0, 12, 20, 8);
  
  // 헬멧
  player.fillStyle(0xffffff);
  player.fillCircle(0, -6, 10);
  
  // 얼굴 유리
  player.fillStyle(0x87ceeb);
  player.fillCircle(0, -6, 7);
  
  // 눈
  player.fillStyle(0x000000);
  player.fillCircle(-3, -7, 2);
  player.fillCircle(3, -7, 2);
  
  // 볼
  player.fillStyle(0xffb6c1, 0.6);
  player.fillCircle(-5, -4, 2);
  player.fillCircle(5, -4, 2);
  
  // 몸통
  player.fillStyle(0xff7f50);
  player.fillRoundedRect(-8, 2, 16, 12, 4);
  
  // 배낭
  player.fillStyle(0x4169e1);
  player.fillRoundedRect(-12, 4, 5, 8, 2);
  
  // 다리 (걷기 애니메이션)
  player.fillStyle(0xff6347);
  const legOffset = frame === 0 ? 0 : 2;
  player.fillRect(-6 - legOffset, 14, 5, 6);
  player.fillRect(1 + legOffset, 14, 5, 6);
  
  // 발
  player.fillStyle(0xffffff);
  player.fillRect(-6 - legOffset, 18, 5, 3);
  player.fillRect(1 + legOffset, 18, 5, 3);
}

function createUI(scene) {
  // 상단 HUD
  const hudBg = scene.add.graphics();
  hudBg.fillStyle(0x000000, 0.6);
  hudBg.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, 40);
  hudBg.setScrollFactor(0).setDepth(100);
  
  // 진행 상황
  scene.add.text(10, 10, '🚀 진로 퀘스트', {
    fontSize: '14px',
    fontFamily: 'Noto Sans KR',
    fontStyle: 'bold',
    color: '#ffd700'
  }).setScrollFactor(0).setDepth(101);
  
  // 완료 카운트
  scene.progressText = scene.add.text(MAP_WIDTH * TILE_SIZE - 10, 10, '0/6 완료', {
    fontSize: '12px',
    fontFamily: 'Noto Sans KR',
    color: '#ffffff'
  }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);
  
  // 하단 안내
  const bottomHud = scene.add.graphics();
  bottomHud.fillStyle(0x000000, 0.6);
  bottomHud.fillRect(0, MAP_HEIGHT * TILE_SIZE - 30, MAP_WIDTH * TILE_SIZE, 30);
  bottomHud.setScrollFactor(0).setDepth(100);
  
  scene.hintText = scene.add.text(MAP_WIDTH * TILE_SIZE / 2, MAP_HEIGHT * TILE_SIZE - 15, '방향키로 이동 | SPACE로 상호작용', {
    fontSize: '11px',
    fontFamily: 'Noto Sans KR',
    color: '#aaaaaa'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
}

function update(time, delta) {
  if (isDialogOpen) return;
  
  // 이동 처리
  let dx = 0, dy = 0;
  const keys = this.input.keyboard.addKeys('W,A,S,D');
  
  if (cursors.left.isDown || keys.A.isDown) { dx = -1; player.direction = 1; }
  else if (cursors.right.isDown || keys.D.isDown) { dx = 1; player.direction = 2; }
  if (cursors.up.isDown || keys.W.isDown) { dy = -1; player.direction = 3; }
  else if (cursors.down.isDown || keys.S.isDown) { dy = 1; player.direction = 0; }
  
  // 대각선 이동 정규화
  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }
  
  // 이동 적용
  if (dx !== 0 || dy !== 0) {
    player.x += dx * player.speed;
    player.y += dy * player.speed;
    
    // 맵 경계
    player.x = Phaser.Math.Clamp(player.x, 20, MAP_WIDTH * TILE_SIZE - 20);
    player.y = Phaser.Math.Clamp(player.y, 50, MAP_HEIGHT * TILE_SIZE - 40);
    
    // 이름표 위치
    player.nameTag.x = player.x;
    player.nameTag.y = player.y - 24;
    
    // 걷기 애니메이션
    player.frameTimer += delta;
    if (player.frameTimer > 150) {
      player.frame = (player.frame + 1) % 2;
      drawPlayer(player.frame);
      player.frameTimer = 0;
    }
  }
  
  // 상호작용 체크
  currentPlanet = null;
  planets.forEach(zone => {
    const dist = Phaser.Math.Distance.Between(player.x, player.y, zone.x, zone.y);
    if (dist < 60) {
      currentPlanet = zone.locationData;
    }
  });
  
  // 힌트 텍스트 업데이트
  if (currentPlanet) {
    const isCompleted = completedQuests.includes(currentPlanet.id);
    this.hintText.setText(`${currentPlanet.emoji} ${currentPlanet.name} - SPACE로 ${isCompleted ? '다시 보기' : '퀘스트 시작'}`);
    this.hintText.setColor('#ffd700');
  } else {
    this.hintText.setText('방향키로 이동 | SPACE로 상호작용');
    this.hintText.setColor('#aaaaaa');
  }
  
  // SPACE 키로 상호작용
  if (Phaser.Input.Keyboard.JustDown(interactKey) && currentPlanet) {
    openQuestDialog(this, currentPlanet);
  }
}

function openQuestDialog(scene, location) {
  isDialogOpen = true;
  
  // 다이얼로그 배경
  const overlay = scene.add.graphics();
  overlay.fillStyle(0x000000, 0.7);
  overlay.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
  overlay.setScrollFactor(0).setDepth(200);
  
  // 다이얼로그 박스
  const boxWidth = 400;
  const boxHeight = 300;
  const boxX = (MAP_WIDTH * TILE_SIZE - boxWidth) / 2;
  const boxY = (MAP_HEIGHT * TILE_SIZE - boxHeight) / 2;
  
  const dialog = scene.add.graphics();
  dialog.fillStyle(0x1a1a3e);
  dialog.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, 16);
  dialog.lineStyle(3, location.color);
  dialog.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, 16);
  dialog.setScrollFactor(0).setDepth(201);
  
  // 제목
  const title = scene.add.text(boxX + boxWidth/2, boxY + 30, `${location.emoji} ${location.name}`, {
    fontSize: '20px',
    fontFamily: 'Noto Sans KR',
    fontStyle: 'bold',
    color: '#ffffff'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
  
  // 퀘스트 설명
  const questText = scene.add.text(boxX + boxWidth/2, boxY + 80, `퀘스트: ${location.quest}`, {
    fontSize: '14px',
    fontFamily: 'Noto Sans KR',
    color: '#ffd700'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
  
  // 완료 여부
  const isCompleted = completedQuests.includes(location.id);
  const statusText = scene.add.text(boxX + boxWidth/2, boxY + 120, 
    isCompleted ? '✅ 완료됨!' : '🔓 진행 가능', {
    fontSize: '16px',
    fontFamily: 'Noto Sans KR',
    color: isCompleted ? '#4ade80' : '#60a5fa'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
  
  // 버튼들
  const buttonY = boxY + boxHeight - 60;
  
  // 시작/완료 버튼
  const startBtn = createButton(scene, boxX + boxWidth/2 - 70, buttonY, 
    isCompleted ? '다시 보기' : '시작하기', location.color, () => {
    if (!isCompleted) {
      completedQuests.push(location.id);
      scene.progressText.setText(`${completedQuests.length}/6 완료`);
    }
    closeDialog();
  });
  
  // 닫기 버튼
  const closeBtn = createButton(scene, boxX + boxWidth/2 + 70, buttonY, 
    '닫기', 0x666666, () => {
    closeDialog();
  });
  
  // 다이얼로그 요소 저장
  dialogBox = { overlay, dialog, title, questText, statusText, startBtn, closeBtn };
  
  function closeDialog() {
    Object.values(dialogBox).forEach(obj => {
      if (obj.destroy) obj.destroy();
    });
    dialogBox = null;
    isDialogOpen = false;
  }
}

function createButton(scene, x, y, text, color, callback) {
  const btn = scene.add.graphics();
  btn.fillStyle(color);
  btn.fillRoundedRect(x - 55, y - 15, 110, 30, 8);
  btn.setScrollFactor(0).setDepth(203);
  btn.setInteractive(new Phaser.Geom.Rectangle(x - 55, y - 15, 110, 30), Phaser.Geom.Rectangle.Contains);
  
  const btnText = scene.add.text(x, y, text, {
    fontSize: '13px',
    fontFamily: 'Noto Sans KR',
    fontStyle: 'bold',
    color: '#ffffff'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(204);
  
  btn.on('pointerover', () => {
    btn.clear();
    btn.fillStyle(Phaser.Display.Color.Lighten(new Phaser.Display.Color().setFromRGB(Phaser.Display.Color.IntegerToRGB(color)), 20).color);
    btn.fillRoundedRect(x - 55, y - 15, 110, 30, 8);
  });
  
  btn.on('pointerout', () => {
    btn.clear();
    btn.fillStyle(color);
    btn.fillRoundedRect(x - 55, y - 15, 110, 30, 8);
  });
  
  btn.on('pointerdown', callback);
  
  return { btn, btnText, destroy: () => { btn.destroy(); btnText.destroy(); } };
}

console.log('🚀 진로 퀘스트 - 게더타운 스타일 로드 완료!');
