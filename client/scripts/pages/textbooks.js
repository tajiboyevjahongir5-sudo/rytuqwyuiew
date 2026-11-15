// Darsliklar va Video darslar sahifasi

import { TEXTBOOKS_DATA } from '../data/textbooks.js';
import { showToast } from '../components/toast.js';

export function render(ctx) {
  const root = document.createElement('div');
  root.className = 'page textbooks-page';

  root.innerHTML = `
    <header class="page__header">
      <h1 class="page__title">Fizika Darsliklari</h1>
      <p class="page__subtitle">7-sinf fizika kursi: qisqa tushuntirish, formulalar va video darslar</p>
    </header>

    <div class="topic-list" id="topicList"></div>
  `;

  const topicList = root.querySelector('#topicList');

  TEXTBOOKS_DATA.forEach((topic) => {
    const card = document.createElement('div');
    card.className = 'topic-card card';
    card.innerHTML = `
      <div class="topic-card__header">
        <span class="topic-badge">${topic.topicNumber}-Mavzu</span>
        <h2 class="topic-title">${topic.title}</h2>
        <p class="topic-sub">${topic.subtitle}</p>
      </div>

      <div class="topic-body">
        <p class="topic-summary">${topic.summary}</p>

        <!-- Formulalar -->
        <div class="formulas-section">
          <div class="section-label">Asosiy formulalar:</div>
          <div class="formula-items">
            ${topic.formulas
              .map(
                (f) => `
              <div class="formula-item">
                <span class="formula-name">${f.name}:</span>
                <code class="formula-code">${f.code}</code>
                <span class="formula-desc">${f.desc}</span>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>

        <!-- 3D Laboratoriya bog'lanishi -->
        ${
          topic.labLink
            ? `
          <div class="topic-lab-banner">
            <div>
              <strong>Ushbu mavzuni 3D Laboratoriyada sinab ko‘ring!</strong>
              <p>Galiley tajribasini o‘zingiz bajarib, grafiklarini ko‘ring.</p>
            </div>
            <button class="btn btn--primary btn--sm" data-lab="${topic.labLink}">Laboratoriyaga o‘tish</button>
          </div>
        `
            : ''
        }

        <!-- Mini test -->
        <div class="quiz-section">
          <div class="section-label">Bilimingizni tekshiring:</div>
          <div class="quiz-list">
            ${topic.quiz
              .map(
                (q, qIdx) => `
              <div class="quiz-item" data-topic="${topic.id}" data-q="${qIdx}">
                <div class="quiz-q">${qIdx + 1}. ${q.question}</div>
                <div class="quiz-options">
                  ${q.options
                    .map(
                      (opt, optIdx) => `
                    <button class="btn btn--subtle btn--sm quiz-opt-btn" data-opt="${optIdx}">${opt}</button>
                  `,
                    )
                    .join('')}
                </div>
                <div class="quiz-feedback" style="display:none;"></div>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>
      </div>
    `;

    // Laboratoriyaga o'tish
    const labBtn = card.querySelector('[data-lab]');
    if (labBtn) {
      labBtn.addEventListener('click', () => {
        ctx.navigate(labBtn.dataset.lab);
      });
    }

    // Mini test javoblari
    card.querySelectorAll('.quiz-item').forEach((qEl) => {
      const qIdx = Number(qEl.dataset.q);
      const qData = topic.quiz[qIdx];
      const feedback = qEl.querySelector('.quiz-feedback');

      qEl.querySelectorAll('.quiz-opt-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const selected = Number(btn.dataset.opt);
          feedback.style.display = 'block';
          if (selected === qData.answer) {
            feedback.innerHTML = '<span style="color:#22c55e;">To‘g‘ri javob! Barakalla! 🎉</span>';
            showToast('To‘g‘ri javob!', { type: 'success' });
          } else {
            feedback.innerHTML = `<span style="color:#f87171;">Noto‘g‘ri. To‘g‘ri javob: <strong>${qData.options[qData.answer]}</strong></span>`;
          }
        });
      });
    });

    topicList.appendChild(card);
  });

  return root;
}
