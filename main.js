// 진로 퀘스트 - 6단계 맵 게임

const STORAGE_KEY = 'career_quest_v3';

// 게임 상태
let gameState = {
  currentStage: 1,
  completedStages: [],
  stageData: {
    1: { quizScores: {} },
    2: { dreams: '', activities: '', strengths: '', tracks: [] },
    3: { competencies: {} },
    4: { quizScores: {} },
    5: { general: [], career: [], fusion: [] },
    6: { year1: '', year2: '', year3: '', goal: '' }
  }
};

// 캐릭터 위치 데이터
const stagePositions = {
  0: { left: '5%', bottom: '15%' },
  1: { left: '15%', bottom: '30%' },
  2: { left: '28%', bottom: '45%' },
  3: { left: '42%', bottom: '55%' },
  4: { left: '56%', bottom: '45%' },
  5: { left: '70%', bottom: '30%' },
  6: { left: '82%', bottom: '18%' },
  7: { right: '5%', top: '10%' }
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateUI();
  setupQuizHandlers();
  setupRatingHandlers();
  setupSubjectHandlers();
  setupFormHandlers();
  console.log('🎓 진로 퀘스트 v2 로드 완료!');
});

// 상태 로드
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      gameState = JSON.parse(saved);
    } catch (e) {
      console.error('저장된 데이터 로드 실패:', e);
    }
  }
}

// 상태 저장
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

// UI 업데이트
function updateUI() {
  updateProgress();
  updateStageStates();
  moveCharacter();
}

// 진행률 업데이트
function updateProgress() {
  const completed = gameState.completedStages.length;
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  if (progressFill) {
    progressFill.style.width = `${(completed / 6) * 100}%`;
  }
  if (progressText) {
    progressText.textContent = `${completed} / 6`;
  }
}

// 스테이지 상태 업데이트
function updateStageStates() {
  for (let i = 1; i <= 6; i++) {
    const stage = document.querySelector(`.stage-${i}`);
    const status = document.getElementById(`status-${i}`);

    if (!stage || !status) continue;

    const isCompleted = gameState.completedStages.includes(i);
    const isUnlocked = i === 1 || gameState.completedStages.includes(i - 1);

    if (isCompleted) {
      stage.classList.remove('locked');
      stage.classList.add('completed');
      status.textContent = '✅';
    } else if (isUnlocked) {
      stage.classList.remove('locked');
      status.textContent = '';
    } else {
      stage.classList.add('locked');
      status.textContent = '🔒';
    }
  }

  // 골 상태
  const goal = document.querySelector('.stage-goal');
  if (goal) {
    if (gameState.completedStages.length >= 6) {
      goal.classList.remove('locked');
    }
  }
}

// 캐릭터 이동
function moveCharacter() {
  const character = document.getElementById('character');
  if (!character) return;

  const targetStage = gameState.completedStages.length;
  const pos = stagePositions[targetStage] || stagePositions[0];

  character.style.left = pos.left || 'auto';
  character.style.right = pos.right || 'auto';
  character.style.bottom = pos.bottom || 'auto';
  character.style.top = pos.top || 'auto';
}

// 맵으로 스크롤
function scrollToMap() {
  document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
}
window.scrollToMap = scrollToMap;

// 퀘스트 열기
function openQuest(stageNum) {
  const stage = document.querySelector(`.stage-${stageNum}`);
  if (stage?.classList.contains('locked')) {
    showToast('🔒 이전 스테이지를 먼저 클리어하세요!');
    return;
  }

  const modal = document.getElementById(`quest-${stageNum}`);
  if (modal) {
    modal.hidden = false;
    loadStageData(stageNum);
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
    Object.entries(data.competencies || {}).forEach(([key, value]) => {
      const container = document.querySelector(`[data-competency="${key}"]`);
      if (container) {
        container.querySelectorAll('.star').forEach((star, idx) => {
          star.classList.toggle('active', idx < value);
        });
      }
    });
  }

  if (stageNum === 5) {
    // 선택한 계열 표시
    const tracks = gameState.stageData[2]?.tracks || [];
    const trackDisplay = document.getElementById('display-track');
    if (trackDisplay) {
      trackDisplay.textContent = tracks.length > 0 ? tracks.join(', ') : '아직 선택 안 함';
    }

    // 과목 선택 상태 복원
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

  updateCompleteButton(stageNum);
}

// 퀴즈 핸들러 설정
function setupQuizHandlers() {
  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', function() {
      const quizItem = this.closest('.quiz-item');
      const quizId = quizItem.dataset.quiz;
      const isCorrect = this.dataset.answer === 'correct';
      const stageNum = parseInt(quizId.split('-')[0]);

      // 이미 답변한 경우 무시
      if (quizItem.querySelector('.quiz-option.correct, .quiz-option.wrong')) {
        return;
      }

      // 답변 표시
      if (isCorrect) {
        this.classList.add('correct');
        quizItem.querySelector('.quiz-feedback').textContent = '✅ 정답!';
        gameState.stageData[stageNum].quizScores[quizId] = true;
      } else {
        this.classList.add('wrong');
        quizItem.querySelector('.quiz-feedback').textContent = '❌ 다시 생각해보세요';
        // 정답 표시
        quizItem.querySelectorAll('.quiz-option').forEach(opt => {
          if (opt.dataset.answer === 'correct') {
            opt.classList.add('correct');
          }
        });
      }

      // 모든 옵션 비활성화
      quizItem.querySelectorAll('.quiz-option').forEach(opt => {
        opt.disabled = true;
      });

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
  if (scoreEl) {
    scoreEl.textContent = correctCount;
  }

  updateCompleteButton(stageNum);
}

// 별점 핸들러 설정
function setupRatingHandlers() {
  document.querySelectorAll('.rating-stars').forEach(container => {
    const competency = container.dataset.competency;
    const stars = container.querySelectorAll('.star');

    stars.forEach((star, idx) => {
      star.addEventListener('click', () => {
        const value = idx + 1;

        // 별 업데이트
        stars.forEach((s, i) => {
          s.classList.toggle('active', i < value);
        });

        // 저장
        gameState.stageData[3].competencies[competency] = value;
        saveState();
        updateCompleteButton(3);
      });

      // 호버 효과
      star.addEventListener('mouseenter', () => {
        stars.forEach((s, i) => {
          s.style.opacity = i <= idx ? '1' : '0.3';
        });
      });

      container.addEventListener('mouseleave', () => {
        stars.forEach((s, i) => {
          const currentValue = gameState.stageData[3].competencies[competency] || 0;
          s.style.opacity = i < currentValue ? '1' : '0.3';
        });
      });
    });
  });
}

// 과목 선택 핸들러
function setupSubjectHandlers() {
  ['general', 'career', 'fusion'].forEach(type => {
    document.querySelectorAll(`input[name="${type}"]`).forEach(input => {
      input.addEventListener('change', () => {
        const checked = document.querySelectorAll(`input[name="${type}"]:checked`);
        gameState.stageData[5][type] = Array.from(checked).map(c => c.value);
        saveState();
        updateCompleteButton(5);
      });
    });
  });
}

// 폼 핸들러 설정
function setupFormHandlers() {
  // Stage 2 폼
  ['input-2-1', 'input-2-2', 'input-2-3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        updateCompleteButton(2);
      });
    }
  });

  document.querySelectorAll('input[name="track"]').forEach(input => {
    input.addEventListener('change', () => {
      updateCompleteButton(2);
    });
  });

  // Stage 6 폼
  ['plan-year1', 'plan-year2', 'plan-year3', 'plan-goal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        updateCompleteButton(6);
      });
    }
  });
}

// 저장 버튼 처리
function saveQuest(stageNum) {
  if (stageNum === 2) {
    gameState.stageData[2] = {
      dreams: document.getElementById('input-2-1')?.value || '',
      activities: document.getElementById('input-2-2')?.value || '',
      strengths: document.getElementById('input-2-3')?.value || '',
      tracks: Array.from(document.querySelectorAll('input[name="track"]:checked')).map(c => c.value)
    };
  }

  if (stageNum === 3) {
    // 이미 실시간 저장됨
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
  showToast('💾 저장되었어요!');
  updateCompleteButton(stageNum);
}
window.saveQuest = saveQuest;

// 완료 버튼 상태 업데이트
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
    const data = gameState.stageData[5];
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

// 스테이지 완료
function completeQuest(stageNum) {
  // 최종 저장
  saveQuest(stageNum);

  // 완료 상태 추가
  if (!gameState.completedStages.includes(stageNum)) {
    gameState.completedStages.push(stageNum);
    gameState.currentStage = stageNum + 1;
    saveState();
  }

  closeQuest();
  updateUI();

  // 성공 모달
  const successModal = document.getElementById('success-modal');
  const successMessage = document.getElementById('success-message');

  if (stageNum === 6) {
    successMessage.textContent = '모든 퀘스트를 클리어했어요! 결과를 확인해보세요!';
  } else {
    const messages = [
      '',
      '고교학점제의 기본을 이해했어요!',
      '나의 관심 계열을 찾았어요!',
      '핵심역량을 파악했어요!',
      '교육과정표를 이해했어요!',
      '나에게 맞는 과목을 선택했어요!'
    ];
    successMessage.textContent = messages[stageNum];
  }

  successModal.hidden = false;
}
window.completeQuest = completeQuest;

// 성공 모달 닫기
function closeSuccess() {
  document.getElementById('success-modal').hidden = true;

  // 모든 스테이지 완료 시 결과 모달
  if (gameState.completedStages.length >= 6) {
    showFinalResult();
  }
}
window.closeSuccess = closeSuccess;

// 최종 결과 표시
function showFinalResult() {
  const resultBody = document.getElementById('result-body');
  const data = gameState.stageData;

  let html = `
    <div class="result-section">
      <h3>🔍 나의 자기 이해</h3>
      <div class="result-item">
        <strong>어릴 때 꿈:</strong> ${data[2].dreams || '-'}
      </div>
      <div class="result-item">
        <strong>좋아하는 활동:</strong> ${data[2].activities || '-'}
      </div>
      <div class="result-item">
        <strong>나의 강점:</strong> ${data[2].strengths || '-'}
      </div>
    </div>

    <div class="result-section">
      <h3>🎯 선택한 계열</h3>
      <div class="result-tags">
        ${(data[2].tracks || []).map(t => `<span class="result-tag">${t}</span>`).join('')}
      </div>
    </div>

    <div class="result-section">
      <h3>💪 핵심역량 프로필</h3>
      ${Object.entries(data[3].competencies || {}).map(([key, value]) => {
        const labels = {
          communication: '의사소통',
          collaboration: '협업',
          creativity: '창의적 사고',
          critical: '비판적 사고',
          selfmanagement: '자기관리',
          knowledge: '지식정보처리'
        };
        return `<div class="result-item"><strong>${labels[key]}:</strong> ${'⭐'.repeat(value)}</div>`;
      }).join('')}
    </div>

    <div class="result-section">
      <h3>📚 선택한 과목</h3>
      <div class="result-item">
        <strong>일반선택:</strong>
        <div class="result-tags">
          ${(data[5].general || []).map(s => `<span class="result-tag">${s}</span>`).join('')}
        </div>
      </div>
      <div class="result-item">
        <strong>진로선택:</strong>
        <div class="result-tags">
          ${(data[5].career || []).map(s => `<span class="result-tag">${s}</span>`).join('')}
        </div>
      </div>
      <div class="result-item">
        <strong>융합선택:</strong>
        <div class="result-tags">
          ${(data[5].fusion || []).map(s => `<span class="result-tag">${s}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="result-section">
      <h3>📅 3년 학업계획</h3>
      <div class="result-item"><strong>1학년:</strong> ${data[6].year1 || '-'}</div>
      <div class="result-item"><strong>2학년:</strong> ${data[6].year2 || '-'}</div>
      <div class="result-item"><strong>3학년:</strong> ${data[6].year3 || '-'}</div>
      <div class="result-item"><strong>진로 목표:</strong> ${data[6].goal || '-'}</div>
    </div>
  `;

  resultBody.innerHTML = html;
  document.getElementById('result-modal').hidden = false;
}

// 결과 모달 닫기
function closeResult() {
  document.getElementById('result-modal').hidden = true;
}
window.closeResult = closeResult;

// 결과 다운로드
function downloadResult() {
  const data = gameState.stageData;

  let text = `
══════════════════════════════════════
     🎓 나의 진로 로드맵
══════════════════════════════════════

📝 작성일: ${new Date().toLocaleDateString('ko-KR')}

──────────────────────────────────────
🔍 나의 자기 이해
──────────────────────────────────────
• 어릴 때 꿈: ${data[2].dreams || '-'}
• 좋아하는 활동: ${data[2].activities || '-'}
• 나의 강점: ${data[2].strengths || '-'}

──────────────────────────────────────
🎯 선택한 계열
──────────────────────────────────────
${(data[2].tracks || []).join(', ') || '-'}

──────────────────────────────────────
💪 핵심역량 프로필
──────────────────────────────────────
${Object.entries(data[3].competencies || {}).map(([key, value]) => {
  const labels = {
    communication: '의사소통',
    collaboration: '협업',
    creativity: '창의적 사고',
    critical: '비판적 사고',
    selfmanagement: '자기관리',
    knowledge: '지식정보처리'
  };
  return `• ${labels[key]}: ${'★'.repeat(value)}${'☆'.repeat(5-value)}`;
}).join('\n')}

──────────────────────────────────────
📚 선택한 과목
──────────────────────────────────────
• 일반선택: ${(data[5].general || []).join(', ') || '-'}
• 진로선택: ${(data[5].career || []).join(', ') || '-'}
• 융합선택: ${(data[5].fusion || []).join(', ') || '-'}

──────────────────────────────────────
📅 3년 학업계획
──────────────────────────────────────
[1학년]
${data[6].year1 || '-'}

[2학년]
${data[6].year2 || '-'}

[3학년]
${data[6].year3 || '-'}

[진로 목표]
${data[6].goal || '-'}

══════════════════════════════════════
     고교학점제와 함께 꿈을 향해! 🚀
══════════════════════════════════════
  `.trim();

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `진로로드맵_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('📥 결과가 저장되었어요!');
}
window.downloadResult = downloadResult;

// 토스트 메시지
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    padding: 16px 32px;
    background: linear-gradient(135deg, #4ade80, #60a5fa);
    color: white;
    border-radius: 50px;
    font-weight: 700;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    animation: toastIn 0.3s ease;
  `;
  document.body.appendChild(toast);

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

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 게임 리셋
function resetGame() {
  if (confirm('정말 처음부터 다시 시작할까요? 모든 진행 상황이 삭제됩니다.')) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}
window.resetGame = resetGame;
