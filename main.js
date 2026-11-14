// 진로 퀘스트 - 6단계 맵 게임

const STORAGE_KEY = 'career_quest_v3';

// 게임 상태
let gameState = {
  nickname: '',
  character: '🚀',
  currentStage: 1,
  completedStages: [],
  stageData: {
    1: { quizScores: {} },
    2: { dreams: '', activities: '', strengths: '', tracks: [] },
    3: { competencies: {}, answered: false },
    4: { quizScores: {} },
    5: { general: [], career: [], fusion: [] },
    6: { year1: '', year2: '', year3: '', goal: '' }
  }
};

// 캐릭터 위치 데이터 - 아이소메트릭 나선 궤도
const stagePositions = {
  0: { left: '10%', bottom: '6%' },
  1: { left: '4%', bottom: '28%' },
  2: { left: '12%', bottom: '50%' },
  3: { left: '32%', bottom: '62%' },
  4: { left: '54%', bottom: '52%' },
  5: { left: '72%', bottom: '34%' },
  6: { left: '62%', top: '14%' },
  7: { left: '40%', top: '2%' }
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateUI();
  setupQuizHandlers();
  setupCompetencyQuestionHandlers();
  setupSubjectHandlers();
  setupFormHandlers();
  setupNicknameHandler();
  showWelcomeMessage();
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
  updateCharacterDisplay();
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
function moveCharacter(animate = false) {
  const character = document.getElementById('character');
  if (!character) return;

  const targetStage = gameState.completedStages.length;
  const pos = stagePositions[targetStage] || stagePositions[0];

  if (animate) {
    character.classList.add('moving');
    setTimeout(() => character.classList.remove('moving'), 400);
  }

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
    playSFX('quest-start'); // 퀘스트 시작 효과음
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
    // 이미 진단을 완료했다면 결과 화면 표시
    if (data.answered && data.competencies) {
      showCompetencyResult(data.competencies);
    } else {
      // 아직 진단 전이면 질문 새로 생성
      const questionSection = document.getElementById('competency-questions');
      const resultSection = document.getElementById('competency-result');
      if (questionSection) questionSection.hidden = false;
      if (resultSection) resultSection.hidden = true;

      document.getElementById('submit-competency').hidden = false;
      document.getElementById('save-competency-result').hidden = true;
      document.getElementById('complete-3').hidden = true;

      // 질문 새로 생성
      generateCompetencyQuestions();
    }
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

      // 이미 정답을 맞춘 경우 무시
      if (quizItem.querySelector('.quiz-option.correct')) {
        return;
      }

      // 이전 오답 표시 제거
      quizItem.querySelectorAll('.quiz-option.wrong').forEach(opt => {
        opt.classList.remove('wrong');
      });

      // 답변 표시
      if (isCorrect) {
        this.classList.add('correct');
        quizItem.querySelector('.quiz-feedback').textContent = '✅ 정답!';
        quizItem.querySelector('.quiz-feedback').style.color = '#16a34a';
        gameState.stageData[stageNum].quizScores[quizId] = true;
        playSFX('correct');
        // 정답 맞추면 다른 옵션 비활성화
        quizItem.querySelectorAll('.quiz-option').forEach(opt => {
          opt.disabled = true;
        });
      } else {
        this.classList.add('wrong');
        quizItem.querySelector('.quiz-feedback').textContent = '❌ 다시 시도해보세요!';
        quizItem.querySelector('.quiz-feedback').style.color = '#dc2626';
        playSFX('wrong');
        // 틀리면 이 버튼만 잠시 비활성화
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
  if (scoreEl) {
    scoreEl.textContent = correctCount;
  }

  updateCompleteButton(stageNum);
}

// 역량별 12개 질문 데이터베이스
const competencyQuestions = {
  communication: [
    "내 생각을 다른 사람에게 조리있게 설명할 수 있다.",
    "친구의 이야기를 끝까지 잘 듣고 공감해준다.",
    "발표할 때 청중의 반응을 살피며 말한다.",
    "글이나 말로 내 의견을 분명하게 전달할 수 있다.",
    "대화할 때 상대방의 말을 끊지 않고 경청한다.",
    "다른 사람의 감정을 읽고 적절하게 반응한다.",
    "복잡한 내용도 쉽게 풀어서 설명할 수 있다.",
    "토론할 때 논리적으로 반박할 수 있다.",
    "비언어적 표현(몸짓, 표정)도 잘 활용한다.",
    "서로 다른 의견을 조율하는 대화를 잘한다.",
    "글쓰기로 내 생각을 정리하는 것을 좋아한다.",
    "모르는 사람에게도 자연스럽게 말을 걸 수 있다."
  ],
  collaboration: [
    "조별 과제에서 팀원들과 역할을 잘 나누고 협력한다.",
    "의견이 다른 친구와도 대화를 통해 합의점을 찾는다.",
    "팀 안에서 갈등이 생기면 중재하려고 노력한다.",
    "다른 사람의 의견을 존중하고 받아들인다.",
    "팀 목표를 위해 내 역할에 책임감을 느낀다.",
    "협업할 때 다른 사람의 강점을 잘 파악한다.",
    "공동 작업에서 나의 기여를 스스로 평가한다.",
    "팀원의 어려움을 보면 도와주려 한다.",
    "혼자보다 여럿이 함께할 때 더 좋은 결과가 나온다고 생각한다.",
    "회의나 토의에서 적극적으로 참여한다.",
    "다양한 배경의 사람들과 잘 어울린다.",
    "팀의 분위기를 긍정적으로 만들려고 노력한다."
  ],
  creativity: [
    "문제가 생기면 새로운 해결 방법을 떠올리려고 노력한다.",
    "남들과 다른 아이디어를 내는 것이 재미있다.",
    "기존의 방식에 의문을 품고 다르게 시도해본다.",
    "상상력을 발휘하는 활동을 좋아한다.",
    "실패해도 새로운 방법을 계속 시도한다.",
    "일상에서 영감을 얻어 창작활동을 한다.",
    "규칙이나 틀에 얽매이지 않고 생각한다.",
    "브레인스토밍할 때 많은 아이디어를 낸다.",
    "다양한 분야의 지식을 융합해 생각한다.",
    "예술, 음악, 글쓰기 등 창작활동에 관심이 있다.",
    "문제를 다양한 각도에서 바라보려 한다.",
    "호기심이 많고 새로운 것에 도전하길 좋아한다."
  ],
  critical: [
    "뉴스나 정보를 볼 때 '정말 그럴까?' 하고 의심해본다.",
    "여러 의견 중 어떤 게 맞는지 근거를 따져 판단한다.",
    "주장의 논리적 허점을 찾아내는 편이다.",
    "정보의 출처가 믿을 만한지 확인한다.",
    "감정에 휘둘리지 않고 객관적으로 판단하려 한다.",
    "다수의 의견이라도 틀릴 수 있다고 생각한다.",
    "문제의 원인을 깊이 분석하려 한다.",
    "결론을 내리기 전에 다양한 가능성을 검토한다.",
    "숨겨진 가정이나 전제를 파악하려 한다.",
    "증거 없이 믿는 것을 경계한다.",
    "자신의 생각도 비판적으로 돌아본다.",
    "복잡한 문제를 단계별로 분석할 수 있다."
  ],
  selfmanagement: [
    "스스로 공부 계획을 세우고 실천하는 편이다.",
    "감정이 격해져도 차분하게 행동하려고 노력한다.",
    "마감 기한을 잘 지킨다.",
    "스트레스를 건강하게 해소하는 방법이 있다.",
    "목표를 세우고 꾸준히 노력한다.",
    "시간을 효율적으로 관리한다.",
    "실패해도 포기하지 않고 다시 도전한다.",
    "나의 장단점을 잘 알고 있다.",
    "건강한 생활습관을 유지하려 한다.",
    "유혹에 흔들리지 않고 해야 할 일을 한다.",
    "자기 반성을 통해 성장하려 한다.",
    "어려운 상황에서도 긍정적 태도를 유지한다."
  ],
  knowledge: [
    "모르는 것이 있으면 인터넷이나 책에서 직접 찾아본다.",
    "여러 정보를 비교하고 정리해서 활용할 수 있다.",
    "새로운 지식을 배우는 것을 즐긴다.",
    "디지털 도구를 활용해 정보를 효율적으로 관리한다.",
    "가짜 뉴스와 진짜 뉴스를 구별하려 노력한다.",
    "필요한 정보를 빠르게 검색할 수 있다.",
    "배운 지식을 실생활에 적용해본다.",
    "다양한 매체(책, 영상, 기사 등)에서 정보를 얻는다.",
    "정보를 체계적으로 분류하고 저장한다.",
    "학습한 내용을 나만의 방식으로 정리한다.",
    "관심 분야의 최신 정보를 꾸준히 확인한다.",
    "정보의 신뢰성을 판단하는 기준이 있다."
  ]
};

// 역량 진단 질문 생성 (역량별 6개씩 = 36개 질문)
function generateCompetencyQuestions() {
  const questionList = document.getElementById('question-list');
  if (!questionList) return;

  // 각 역량에서 6개씩 랜덤 선택
  const selectedQuestions = [];
  Object.keys(competencyQuestions).forEach(competency => {
    const questions = [...competencyQuestions[competency]];
    // 셔플
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    // 6개 선택
    questions.slice(0, 6).forEach(q => {
      selectedQuestions.push({ competency, question: q });
    });
  });

  // 전체 질문 셔플
  for (let i = selectedQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
  }

  // HTML 생성
  let html = '';
  selectedQuestions.forEach((item, idx) => {
    const num = idx + 1;
    html += `
      <div class="question-item" data-competency="${item.competency}" data-question="${num}">
        <p class="question-text">${num}. ${item.question}</p>
        <div class="answer-options">
          <label><input type="radio" name="q${num}" value="1"><span>전혀 아니다</span></label>
          <label><input type="radio" name="q${num}" value="2"><span>아니다</span></label>
          <label><input type="radio" name="q${num}" value="3"><span>보통</span></label>
          <label><input type="radio" name="q${num}" value="4"><span>그렇다</span></label>
          <label><input type="radio" name="q${num}" value="5"><span>매우 그렇다</span></label>
        </div>
      </div>
    `;
  });

  questionList.innerHTML = html;

  // 이벤트 핸들러 설정
  setupCompetencyQuestionHandlers();
  updateQuestionProgress();
}

// 역량 진단 질문 핸들러 설정
function setupCompetencyQuestionHandlers() {
  const questions = document.querySelectorAll('.question-item');

  questions.forEach(item => {
    const inputs = item.querySelectorAll('input[type="radio"]');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        item.classList.add('answered');
        updateQuestionProgress();
        updateSubmitButton();
      });
    });
  });
}

// 질문 진행 상황 업데이트
function updateQuestionProgress() {
  const total = document.querySelectorAll('.question-item').length;
  const answered = document.querySelectorAll('.question-item.answered').length;
  const progressText = document.getElementById('question-progress-text');
  if (progressText) {
    progressText.textContent = `${answered} / ${total}`;
  }
}

// 제출 버튼 상태 업데이트
function updateSubmitButton() {
  const total = document.querySelectorAll('.question-item').length;
  const answered = document.querySelectorAll('.question-item.answered').length;
  const submitBtn = document.getElementById('submit-competency');
  if (submitBtn) {
    submitBtn.disabled = answered < total;
  }
}

// 역량 진단 제출
function submitCompetencyTest() {
  const competencyScores = {
    communication: [],
    collaboration: [],
    creativity: [],
    critical: [],
    selfmanagement: [],
    knowledge: []
  };

  // 각 질문의 응답 수집
  document.querySelectorAll('.question-item').forEach(item => {
    const competency = item.dataset.competency;
    const selected = item.querySelector('input[type="radio"]:checked');
    if (selected && competencyScores[competency]) {
      competencyScores[competency].push(parseInt(selected.value));
    }
  });

  // 역량별 평균 계산 (5점 만점)
  const results = {};
  Object.keys(competencyScores).forEach(key => {
    const scores = competencyScores[key];
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      results[key] = Math.round(avg * 10) / 10;
    }
  });

  // 저장
  gameState.stageData[3].competencies = results;
  gameState.stageData[3].answered = true;
  saveState();

  // 효과음
  playSFX('complete');

  // 결과 표시
  showCompetencyResult(results);
}
window.submitCompetencyTest = submitCompetencyTest;

// 역량 결과 표시
function showCompetencyResult(results) {
  const questionSection = document.getElementById('competency-questions');
  const resultSection = document.getElementById('competency-result');
  const resultChart = document.getElementById('result-chart');
  const resultSummary = document.getElementById('result-summary');

  // 질문 숨기고 결과 표시
  questionSection.hidden = true;
  resultSection.hidden = false;

  // 버튼 상태 변경
  document.getElementById('submit-competency').hidden = true;
  document.getElementById('save-competency-result').hidden = false;
  document.getElementById('complete-3').hidden = false;
  document.getElementById('complete-3').disabled = false;

  const labels = {
    communication: { name: '의사소통', icon: '💬' },
    collaboration: { name: '협업', icon: '🤝' },
    creativity: { name: '창의적 사고', icon: '💡' },
    critical: { name: '비판적 사고', icon: '🔍' },
    selfmanagement: { name: '자기관리', icon: '📊' },
    knowledge: { name: '지식정보처리', icon: '🌐' }
  };

  // 차트 그리기
  let chartHTML = '';
  const sortedResults = Object.entries(results).sort((a, b) => b[1] - a[1]);

  sortedResults.forEach(([key, score]) => {
    const label = labels[key];
    const percent = (score / 5) * 100;
    let levelClass = 'normal';
    if (score >= 4.5) levelClass = 'excellent';
    else if (score >= 3.5) levelClass = 'good';
    else if (score < 2.5) levelClass = 'low';

    chartHTML += `
      <div class="result-bar-item">
        <div class="result-bar-label">
          <span>${label.icon}</span>
          <span>${label.name}</span>
        </div>
        <div class="result-bar-container">
          <div class="result-bar-fill ${levelClass}" style="width: 0%">
            <span class="result-bar-score">${score.toFixed(1)}</span>
          </div>
        </div>
      </div>
    `;
  });

  resultChart.innerHTML = chartHTML;

  // 애니메이션으로 바 채우기
  setTimeout(() => {
    document.querySelectorAll('.result-bar-fill').forEach((bar, idx) => {
      const score = sortedResults[idx][1];
      bar.style.width = `${(score / 5) * 100}%`;
    });
  }, 100);

  // 강점/성장 영역 분석
  const strengths = sortedResults.filter(([_, score]) => score >= 4).map(([key]) => labels[key].name);
  const growth = sortedResults.filter(([_, score]) => score < 3).map(([key]) => labels[key].name);

  let summaryHTML = '<h4>📋 분석 결과</h4>';

  if (strengths.length > 0) {
    summaryHTML += `<p>🌟 <strong>강점 역량:</strong> ${strengths.map(s => `<span class="strength-tag">${s}</span>`).join(' ')}</p>`;
  }

  if (growth.length > 0) {
    summaryHTML += `<p>🌱 <strong>성장 가능 영역:</strong> ${growth.map(g => `<span class="growth-tag">${g}</span>`).join(' ')}</p>`;
  }

  if (strengths.length === 0 && growth.length === 0) {
    summaryHTML += `<p>균형 잡힌 역량을 가지고 있어요! 다양한 분야에서 활약할 수 있는 잠재력이 있습니다.</p>`;
  } else {
    summaryHTML += `<p style="margin-top: 1rem;">강점을 살리고, 성장 영역을 발전시켜 나가세요! 고교학점제에서 이 역량들을 키울 수 있는 과목을 선택해보면 좋겠어요.</p>`;
  }

  resultSummary.innerHTML = summaryHTML;
}

// 역량 결과 저장 (다운로드)
function saveCompetencyResult() {
  const results = gameState.stageData[3].competencies;
  const nickname = gameState.nickname || '모험가';

  const labels = {
    communication: '의사소통',
    collaboration: '협업',
    creativity: '창의적 사고',
    critical: '비판적 사고',
    selfmanagement: '자기관리',
    knowledge: '지식정보처리'
  };

  let text = `
══════════════════════════════════════
     💪 ${nickname}의 핵심역량 진단 결과
══════════════════════════════════════

📅 진단일: ${new Date().toLocaleDateString('ko-KR')}

──────────────────────────────────────
🎯 역량별 점수 (5점 만점)
──────────────────────────────────────
${Object.entries(results).map(([key, score]) => {
  const stars = '★'.repeat(Math.round(score)) + '☆'.repeat(5 - Math.round(score));
  return `• ${labels[key]}: ${stars} (${score.toFixed(1)}점)`;
}).join('\n')}

──────────────────────────────────────
📋 분석
──────────────────────────────────────
${Object.entries(results).filter(([_, s]) => s >= 4).length > 0
  ? '🌟 강점: ' + Object.entries(results).filter(([_, s]) => s >= 4).map(([k]) => labels[k]).join(', ')
  : ''}
${Object.entries(results).filter(([_, s]) => s < 3).length > 0
  ? '🌱 성장 영역: ' + Object.entries(results).filter(([_, s]) => s < 3).map(([k]) => labels[k]).join(', ')
  : ''}

══════════════════════════════════════
     나의 강점을 살려 진로를 설계하자! 🚀
══════════════════════════════════════
`.trim();

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `역량진단_${nickname}_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('📥 역량 진단 결과가 저장되었어요!');
}
window.saveCompetencyResult = saveCompetencyResult;

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
    canComplete = gameState.stageData[3].answered === true;
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
  updateProgress();
  updateStageStates();

  // 우주선 이동 효과음 + 애니메이션
  playSFX('whoosh');
  moveCharacter(true);

  // 완료 효과음은 약간 딜레이 후
  setTimeout(() => playSFX('complete'), 500);

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
  const nickname = gameState.nickname || '모험가';

  // 결과 헤더에 닉네임 표시
  const resultHeader = document.querySelector('.result-header h2');
  if (resultHeader) {
    resultHeader.textContent = `🏆 ${nickname} 모험가, 퀘스트 완료!`;
  }

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
        const starCount = Math.round(value);
        return `<div class="result-item"><strong>${labels[key]}:</strong> ${'⭐'.repeat(starCount)}${'☆'.repeat(5-starCount)} (${value.toFixed(1)}점)</div>`;
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

  const nickname = gameState.nickname || '모험가';

  let text = `
══════════════════════════════════════
     🎓 ${nickname}의 진로 로드맵
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
  const starCount = Math.round(value);
  return `• ${labels[key]}: ${'★'.repeat(starCount)}${'☆'.repeat(5-starCount)} (${value.toFixed ? value.toFixed(1) : value}점)`;
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

// BGM 관련
let bgmPlaying = false;

function playSFX(type) {
  const sfx = document.getElementById(`sfx-${type}`);
  if (sfx) {
    sfx.currentTime = 0;
    sfx.volume = 0.5;
    sfx.play().catch(() => {});
  }
}

function toggleBGM() {
  const bgm = document.getElementById('bgm');
  const btn = document.getElementById('bgm-btn');
  const icon = btn?.querySelector('.bgm-icon');

  if (!bgm) return;

  if (bgmPlaying) {
    bgm.pause();
    bgmPlaying = false;
    btn?.classList.remove('playing');
    if (icon) icon.textContent = '🔇';
  } else {
    bgm.volume = 0.3;
    bgm.play().catch(e => console.log('BGM 재생 실패:', e));
    bgmPlaying = true;
    btn?.classList.add('playing');
    if (icon) icon.textContent = '🔊';
  }
}
window.toggleBGM = toggleBGM;

// 모험 소개 모달 열기
function showAdventureInfo() {
  const modal = document.getElementById('adventure-modal');
  const input = document.getElementById('nickname-input');

  if (modal) {
    modal.hidden = false;
    // 기존 닉네임 있으면 표시
    if (gameState.nickname) {
      input.value = gameState.nickname;
      updateStartButton();
    }
    // 기존 캐릭터 선택 복원
    if (gameState.character) {
      const charRadio = document.querySelector(`input[name="character"][value="${gameState.character}"]`);
      if (charRadio) charRadio.checked = true;
    }
  }
}
window.showAdventureInfo = showAdventureInfo;

// 모험 소개 모달 닫기
function closeAdventureInfo() {
  const modal = document.getElementById('adventure-modal');
  if (modal) {
    modal.hidden = true;
  }
}
window.closeAdventureInfo = closeAdventureInfo;

// 닉네임 입력 핸들러
function setupNicknameHandler() {
  const input = document.getElementById('nickname-input');
  if (input) {
    input.addEventListener('input', updateStartButton);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        startAdventure();
      }
    });
  }
}

// 시작 버튼 상태 업데이트
function updateStartButton() {
  const input = document.getElementById('nickname-input');
  const btn = document.getElementById('adventure-start-btn');

  if (input && btn) {
    const hasNickname = input.value.trim().length > 0;
    btn.disabled = !hasNickname;
  }
}

// 모험 시작
function startAdventure() {
  const input = document.getElementById('nickname-input');
  const nickname = input?.value.trim();
  const selectedChar = document.querySelector('input[name="character"]:checked')?.value || '🧙';

  if (!nickname) {
    showToast('🚀 탐험가 이름을 입력해주세요!');
    return;
  }

  // 닉네임과 캐릭터 저장
  gameState.nickname = nickname;
  gameState.character = selectedChar;
  saveState();

  // 맵에서 캐릭터 업데이트
  updateCharacterDisplay();

  // 모달 닫기
  closeAdventureInfo();

  // 맵으로 이동
  scrollToMap();

  // 환영 메시지 표시
  showWelcomeMessage();

  // BGM 시작 시도
  const bgm = document.getElementById('bgm');
  const btn = document.getElementById('bgm-btn');
  const icon = btn?.querySelector('.bgm-icon');

  if (bgm && !bgmPlaying) {
    bgm.volume = 0.3;
    bgm.play().then(() => {
      bgmPlaying = true;
      btn?.classList.add('playing');
      if (icon) icon.textContent = '🔊';
    }).catch(e => {
      console.log('BGM 자동재생 불가 - 버튼 클릭 필요');
    });
  }
}
window.startAdventure = startAdventure;

// 환영 메시지 표시
function showWelcomeMessage() {
  const mapSection = document.getElementById('map');
  const existingWelcome = document.querySelector('.welcome-message');

  // 기존 메시지 제거
  if (existingWelcome) {
    existingWelcome.remove();
  }

  // 닉네임이 있으면 환영 메시지 표시
  if (gameState.nickname && mapSection) {
    const char = gameState.character || '🧙';
    const welcome = document.createElement('div');
    welcome.className = 'welcome-message';
    welcome.textContent = `${char} ${gameState.nickname} 탐험가, 환영해요!`;
    mapSection.prepend(welcome);
  }
}

// 캐릭터 표시 업데이트
function updateCharacterDisplay() {
  const character = document.getElementById('character');
  if (character && gameState.character) {
    character.querySelector('span').textContent = gameState.character;
  }
}

// 게임 시작 (인트로에서 맵으로) - 기존 함수 유지 (호환성)
function startGame() {
  showAdventureInfo();
}
window.startGame = startGame;
