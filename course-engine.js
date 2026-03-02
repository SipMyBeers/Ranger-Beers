// ============================================
// RANGER BEERS — Course Engine
// Progress tracking, quizzes, offline queue
// ============================================

(function () {
  const Auth = window.RangerAuth;
  if (!Auth) return;

  const QUEUE_KEY = 'rb_offline_queue';

  // ── Offline Queue ──
  function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; }
  }
  function saveQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
  function enqueue(action) {
    const q = getQueue();
    q.push(action);
    saveQueue(q);
  }

  async function flushQueue() {
    const q = getQueue();
    if (!q.length || !navigator.onLine) return;
    const remaining = [];
    for (const action of q) {
      try {
        await Auth.apiFetch(action.path, { method: 'POST', body: JSON.stringify(action.body) });
      } catch {
        remaining.push(action);
      }
    }
    saveQueue(remaining);
  }

  window.addEventListener('online', flushQueue);

  // ── Init Course Engine ──
  async function initCourseEngine() {
    const hero = document.querySelector('[data-course-id]');
    if (!hero) return;
    const courseId = hero.dataset.courseId;

    if (!Auth.isLoggedIn()) return;

    const access = await Auth.getCourseAccess();
    if (!access.includes(courseId)) return; // No access, no engine features

    // Flush any queued offline progress
    flushQueue();

    // Load progress
    let completedModules = [];
    try {
      const data = await Auth.apiFetch(`/courses/${courseId}/progress`);
      completedModules = (data.modules || []).map(m => m.module_id);
    } catch { /* offline — use local */ }

    // Also load local progress for instant display
    const localProgress = getLocalProgress(courseId);

    const allModules = document.querySelectorAll('.course-module[data-module]');
    const totalModules = allModules.length;

    // Build progress bar in hero
    const progressBar = createProgressBar(completedModules, localProgress, totalModules);
    const heroMeta = hero.querySelector('.course-hero-meta');
    if (heroMeta) heroMeta.after(progressBar);

    // Add "Mark Complete" buttons + sidebar checkmarks
    allModules.forEach(mod => {
      const modId = mod.dataset.module;
      const isComplete = completedModules.includes(modId) || localProgress.includes(modId);

      // Mark Complete button
      const btn = document.createElement('button');
      btn.className = 'btn btn-mark-complete' + (isComplete ? ' completed' : '');
      btn.innerHTML = isComplete ? '&#10003; Completed' : 'Mark Complete';
      btn.addEventListener('click', async () => {
        if (btn.classList.contains('completed')) return;
        btn.classList.add('completed');
        btn.innerHTML = '&#10003; Completed';

        // Update sidebar
        updateSidebarCheck(modId, true);

        // Save locally
        addLocalProgress(courseId, modId);

        // Update progress bar
        updateProgressBar(courseId);

        // Sync to API (or queue offline)
        if (navigator.onLine) {
          try {
            await Auth.apiFetch(`/courses/${courseId}/progress`, {
              method: 'POST',
              body: JSON.stringify({ module_id: modId }),
            });
          } catch {
            enqueue({ path: `/courses/${courseId}/progress`, body: { module_id: modId } });
          }
        } else {
          enqueue({ path: `/courses/${courseId}/progress`, body: { module_id: modId } });
        }
      });
      mod.appendChild(btn);

      // Sidebar checkmark
      if (isComplete) updateSidebarCheck(modId, true);
    });

    // Init quizzes
    initQuizzes(courseId);
  }

  // ── Progress Bar ──
  function createProgressBar(serverProgress, localProgress, total) {
    const merged = [...new Set([...serverProgress, ...localProgress])];
    const count = merged.length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

    const el = document.createElement('div');
    el.className = 'course-progress-container';
    el.id = 'course-progress';
    el.innerHTML = `
      <div class="course-progress-header">
        <span class="course-progress-label">Progress</span>
        <span class="course-progress-count">${count} / ${total} modules</span>
      </div>
      <div class="course-progress-bar">
        <div class="course-progress-fill" style="width: ${pct}%"></div>
      </div>
    `;
    return el;
  }

  function updateProgressBar(courseId) {
    const el = document.getElementById('course-progress');
    if (!el) return;

    const allModules = document.querySelectorAll('.course-module[data-module]');
    const total = allModules.length;
    const local = getLocalProgress(courseId);
    const count = local.length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

    el.querySelector('.course-progress-count').textContent = `${count} / ${total} modules`;
    el.querySelector('.course-progress-fill').style.width = `${pct}%`;
  }

  // ── Sidebar Checkmarks ──
  function updateSidebarCheck(modId, complete) {
    const link = document.querySelector(`.course-sidebar-link[href="#${modId}"]`);
    if (!link) return;
    if (complete) {
      link.classList.add('module-complete');
      if (!link.querySelector('.check-icon')) {
        const check = document.createElement('span');
        check.className = 'check-icon';
        check.innerHTML = '&#10003;';
        link.prepend(check);
      }
    }
  }

  // ── Local Progress Storage ──
  function getLocalProgress(courseId) {
    try {
      const all = JSON.parse(localStorage.getItem('rb_progress')) || {};
      return all[courseId] || [];
    } catch { return []; }
  }

  function addLocalProgress(courseId, modId) {
    try {
      const all = JSON.parse(localStorage.getItem('rb_progress')) || {};
      if (!all[courseId]) all[courseId] = [];
      if (!all[courseId].includes(modId)) all[courseId].push(modId);
      localStorage.setItem('rb_progress', JSON.stringify(all));
    } catch { /* ignore */ }
  }

  // ── Quiz Engine ──
  function initQuizzes(courseId) {
    const quizDataEl = document.getElementById('quiz-data');
    if (!quizDataEl) return;

    let quizData;
    try {
      quizData = JSON.parse(quizDataEl.textContent);
    } catch { return; }

    // Module quizzes
    if (quizData.moduleQuizzes) {
      for (const [modId, quiz] of Object.entries(quizData.moduleQuizzes)) {
        const mod = document.getElementById(modId);
        if (!mod) continue;
        const quizEl = buildQuizUI(quiz, courseId, `${modId}-quiz`, false);
        mod.appendChild(quizEl);
      }
    }

    // Final assessment
    if (quizData.finalAssessment) {
      const contentArea = document.querySelector('.course-content-area');
      if (!contentArea) return;

      const section = document.createElement('div');
      section.className = 'course-module quiz-final';
      section.innerHTML = `
        <div class="course-module-label">Final Assessment</div>
        <div class="course-module-title">${quizData.finalAssessment.title || 'Course Assessment'}</div>
        <p>${quizData.finalAssessment.description || 'Complete this assessment to earn your course completion. 80% required to pass.'}</p>
      `;
      const quizEl = buildQuizUI(quizData.finalAssessment, courseId, 'final', true);
      section.appendChild(quizEl);
      contentArea.appendChild(section);
    }
  }

  function buildQuizUI(quiz, courseId, quizId, isFinal) {
    const container = document.createElement('div');
    container.className = 'quiz-container' + (isFinal ? ' quiz-final-container' : '');

    const questions = quiz.questions || [];
    const passThreshold = isFinal ? 0.8 : 0;

    let html = `<div class="quiz-title">${isFinal ? '' : 'Quick Check'}</div>`;

    questions.forEach((q, qi) => {
      html += `
        <div class="quiz-question" data-qi="${qi}">
          <div class="quiz-q-text">${qi + 1}. ${q.question}</div>
          <div class="quiz-options">
      `;
      q.options.forEach((opt, oi) => {
        html += `
          <label class="quiz-option">
            <input type="radio" name="q-${quizId}-${qi}" value="${oi}" data-correct="${q.correct}">
            <span class="quiz-option-text">${opt}</span>
          </label>
        `;
      });
      html += `
          </div>
          <div class="quiz-feedback" id="feedback-${quizId}-${qi}" style="display:none;"></div>
        </div>
      `;
    });

    html += `<button class="btn btn-primary quiz-submit" data-quiz-id="${quizId}">Submit Answers</button>`;
    html += `<div class="quiz-result" id="result-${quizId}" style="display:none;"></div>`;

    container.innerHTML = html;

    // Bind submit
    setTimeout(() => {
      const submitBtn = container.querySelector('.quiz-submit');
      if (!submitBtn) return;

      submitBtn.addEventListener('click', async () => {
        let correct = 0;
        const answers = [];

        questions.forEach((q, qi) => {
          const selected = container.querySelector(`input[name="q-${quizId}-${qi}"]:checked`);
          const feedbackEl = container.querySelector(`#feedback-${quizId}-${qi}`);

          if (!selected) {
            answers.push(null);
            if (feedbackEl) {
              feedbackEl.textContent = 'Please select an answer.';
              feedbackEl.className = 'quiz-feedback quiz-feedback-wrong';
              feedbackEl.style.display = 'block';
            }
            return;
          }

          const selectedVal = parseInt(selected.value);
          const isCorrect = selectedVal === q.correct;
          answers.push(selectedVal);

          if (feedbackEl) {
            feedbackEl.textContent = isCorrect
              ? (q.explanation ? `Correct! ${q.explanation}` : 'Correct!')
              : (q.explanation ? `Incorrect. ${q.explanation}` : `Incorrect. The correct answer is: ${q.options[q.correct]}`);
            feedbackEl.className = `quiz-feedback ${isCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-wrong'}`;
            feedbackEl.style.display = 'block';
          }

          if (isCorrect) correct++;

          // Highlight options
          container.querySelectorAll(`input[name="q-${quizId}-${qi}"]`).forEach(input => {
            const label = input.closest('.quiz-option');
            input.disabled = true;
            if (parseInt(input.value) === q.correct) {
              label.classList.add('quiz-option-correct');
            } else if (input.checked && !isCorrect) {
              label.classList.add('quiz-option-wrong');
            }
          });
        });

        // Check if all answered
        if (answers.includes(null)) return;

        const score = questions.length > 0 ? correct / questions.length : 0;
        const passed = score >= passThreshold;
        const pct = Math.round(score * 100);

        submitBtn.disabled = true;
        submitBtn.style.display = 'none';

        const resultEl = container.querySelector(`#result-${quizId}`);
        if (resultEl) {
          resultEl.innerHTML = isFinal
            ? `<div class="quiz-score ${passed ? 'quiz-pass' : 'quiz-fail'}">
                Score: ${pct}% (${correct}/${questions.length}) — ${passed ? 'PASSED' : 'Did not pass (80% required)'}
               </div>`
            : `<div class="quiz-score quiz-pass">Score: ${pct}% (${correct}/${questions.length})</div>`;
          resultEl.style.display = 'block';
        }

        // Submit to API if final
        if (isFinal && Auth.isLoggedIn()) {
          try {
            await Auth.apiFetch(`/courses/${courseId}/quiz`, {
              method: 'POST',
              body: JSON.stringify({ quiz_id: quizId, answers, score: pct, passed }),
            });
          } catch { /* offline — ignore for now */ }
        }
      });
    }, 0);

    return container;
  }

  // ── Auto-init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCourseEngine);
  } else {
    initCourseEngine();
  }

  window.RangerCourse = { initCourseEngine, flushQueue };
})();
