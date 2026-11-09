// 진로 방탈출 - 메인 스크립트

document.addEventListener('DOMContentLoaded', () => {
  // 상태 관리
  const STORAGE_KEY = 'career_escape_data';
  let gameData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  // 기본 데이터 구조
  if (!gameData.rooms) {
    gameData = {
      rooms: {
        1: { completed: false, missions: {} },
        2: { completed: false, missions: {} },
        3: { completed: false, missions: {} }
      },
      currentRoom: 1,
      startTime: null,
      completedRooms: 0
    };
  }

  // DOM 요소
  const timerDisplay = document.getElementById('timer');
  const stageDisplay = document.getElementById('stage');
  const progressFill = document.getElementById('progress');

  // 타이머 관리
  let timerInterval = null;
  let remainingTime = 30 * 60; // 30분

  function startTimer() {
    if (timerInterval) return;

    gameData.startTime = Date.now();
    saveData();

    timerInterval = setInterval(() => {
      remainingTime--;
      updateTimerDisplay();

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        alert('시간 초과! 하지만 걱정 마세요, 저장된 데이터는 유지됩니다.');
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // 5분 이하면 빨간색
    if (remainingTime <= 300) {
      timerDisplay.style.color = '#ef4444';
    }
  }

  // 진행 상황 업데이트
  function updateProgress() {
    const completed = gameData.completedRooms;
    stageDisplay.textContent = `${completed} / 3`;
    progressFill.style.width = `${(completed / 3) * 100}%`;

    // 방 상태 업데이트
    updateRoomStates();
  }

  function updateRoomStates() {
    // Room 1 - 항상 열림
    const room1 = document.getElementById('room1');
    const lock1 = document.getElementById('lock1');
    if (gameData.rooms[1].completed) {
      room1.classList.add('completed');
      lock1.innerHTML = '<span class="lock-icon">✅</span>';
    }

    // Room 2 - Room 1 완료 시 열림
    const room2 = document.getElementById('room2');
    const lock2 = document.getElementById('lock2');
    const btn2 = room2.querySelector('.room-btn');
    if (gameData.rooms[1].completed) {
      room2.classList.remove('locked');
      lock2.innerHTML = '<span class="lock-icon">🔓</span>';
      btn2.disabled = false;
      btn2.textContent = '입장하기';
      btn2.onclick = () => enterRoom(2);
    }
    if (gameData.rooms[2].completed) {
      room2.classList.add('completed');
      lock2.innerHTML = '<span class="lock-icon">✅</span>';
    }

    // Room 3 - Room 2 완료 시 열림
    const room3 = document.getElementById('room3');
    const lock3 = document.getElementById('lock3');
    const btn3 = room3.querySelector('.room-btn');
    if (gameData.rooms[2].completed) {
      room3.classList.remove('locked');
      lock3.innerHTML = '<span class="lock-icon">🔓</span>';
      btn3.disabled = false;
      btn3.textContent = '입장하기';
      btn3.onclick = () => enterRoom(3);
    }
    if (gameData.rooms[3].completed) {
      room3.classList.add('completed');
      lock3.innerHTML = '<span class="lock-icon">✅</span>';
    }
  }

  // 방 입장
  window.enterRoom = function(roomNumber) {
    if (roomNumber === 1) {
      const modal = document.getElementById('room1-modal');
      modal.hidden = false;
      loadRoomData(roomNumber);
      setupMissionTabs();
    }
    // TODO: Room 2, 3 모달 추가
  };

  // 방 닫기
  window.closeRoom = function() {
    document.getElementById('room1-modal').hidden = true;
  };

  // 미션 탭 설정
  function setupMissionTabs() {
    const tabs = document.querySelectorAll('.mission-tab');
    const contents = document.querySelectorAll('.mission-content');

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        contents[index].classList.add('active');
      });
    });
  }

  // 방 데이터 로드
  function loadRoomData(roomNumber) {
    const roomData = gameData.rooms[roomNumber];
    if (!roomData.missions) return;

    // Room 1 필드들
    if (roomNumber === 1) {
      const fields = [
        'dream-child', 'dream-now', 'dream-why',
        'strength-praised', 'strength-good', 'strength-enjoy',
        'like-activities', 'like-timeless', 'like-type'
      ];

      fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && roomData.missions[fieldId]) {
          field.value = roomData.missions[fieldId];
        }
      });

      updateMissionStatus();
    }
  }

  // 미션 상태 업데이트
  function updateMissionStatus() {
    const mission1Fields = ['dream-child', 'dream-now', 'dream-why'];
    const mission2Fields = ['strength-praised', 'strength-good', 'strength-enjoy'];
    const mission3Fields = ['like-activities', 'like-timeless', 'like-type'];

    const tabs = document.querySelectorAll('.mission-tab');
    let completedCount = 0;

    // 미션 1 체크
    const mission1Done = mission1Fields.every(id => {
      const field = document.getElementById(id);
      return field && field.value.trim().length > 0;
    });
    if (mission1Done) {
      tabs[0].classList.add('completed');
      completedCount++;
    }

    // 미션 2 체크
    const mission2Done = mission2Fields.every(id => {
      const field = document.getElementById(id);
      return field && field.value.trim().length > 0;
    });
    if (mission2Done) {
      tabs[1].classList.add('completed');
      completedCount++;
    }

    // 미션 3 체크
    const mission3Done = mission3Fields.every(id => {
      const field = document.getElementById(id);
      return field && field.value.trim().length > 0;
    });
    if (mission3Done) {
      tabs[2].classList.add('completed');
      completedCount++;
    }

    // 완료 카운트 업데이트
    document.getElementById('mission-done').textContent = completedCount;

    // 탈출 버튼 활성화
    const escapeBtn = document.getElementById('escape-btn-1');
    if (completedCount === 3) {
      escapeBtn.disabled = false;
    } else {
      escapeBtn.disabled = true;
    }
  }

  // 미션 저장
  window.saveMission = function() {
    const fields = [
      'dream-child', 'dream-now', 'dream-why',
      'strength-praised', 'strength-good', 'strength-enjoy',
      'like-activities', 'like-timeless', 'like-type'
    ];

    fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        gameData.rooms[1].missions[fieldId] = field.value.trim();
      }
    });

    saveData();
    updateMissionStatus();
    showToast('💾 저장되었어요!');
  };

  // 탈출 시도
  window.tryEscape = function(roomNumber) {
    // 모든 미션 완료 체크
    updateMissionStatus();

    const completedCount = parseInt(document.getElementById('mission-done').textContent);
    if (completedCount < 3) {
      showToast('❌ 모든 미션을 완료해주세요!');
      return;
    }

    // 방 완료 처리
    gameData.rooms[roomNumber].completed = true;
    gameData.completedRooms++;
    saveData();

    // 모달 닫고 성공 모달 표시
    closeRoom();
    showSuccessModal(roomNumber);
    updateProgress();
  };

  // 성공 모달 표시
  function showSuccessModal(roomNumber) {
    const modal = document.getElementById('success-modal');
    const title = document.getElementById('success-title');
    const message = document.getElementById('success-message');

    const messages = {
      1: { title: 'ROOM 1 탈출 성공!', message: '나를 이해하는 첫 번째 단계를 완료했어요!' },
      2: { title: 'ROOM 2 탈출 성공!', message: '다양한 직업 세계를 탐험했어요!' },
      3: { title: '🎉 모든 방 탈출 완료!', message: '축하해요! 나만의 진로 로드맵을 완성했어요!' }
    };

    title.textContent = messages[roomNumber].title;
    message.textContent = messages[roomNumber].message;

    modal.hidden = false;
  }

  // 성공 모달 닫기
  window.closeSuccess = function() {
    document.getElementById('success-modal').hidden = true;

    // 모든 방 완료 시 축하 페이지로
    if (gameData.completedRooms >= 3) {
      showFinalCelebration();
    }
  };

  // 최종 축하
  function showFinalCelebration() {
    // TODO: 최종 결과 페이지 구현
    alert('🎉 축하합니다! 진로 방탈출을 완료했어요!\n\n곧 맞춤 과목 추천서가 준비됩니다.');
  }

  // 게임 시작
  window.startGame = function() {
    startTimer();
    document.getElementById('game').scrollIntoView({ behavior: 'smooth' });
  };

  // 데이터 저장
  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
  }

  // 토스트 메시지
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      padding: 16px 32px;
      background: rgba(0, 212, 255, 0.95);
      color: #0a0a0f;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      z-index: 3000;
      animation: toastIn 0.3s ease;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // 토스트 애니메이션 추가
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
  `;
  document.head.appendChild(style);

  // 초기화
  updateProgress();
  updateTimerDisplay();

  console.log('🚪 진로 방탈출 v1 로드 완료!');
});
