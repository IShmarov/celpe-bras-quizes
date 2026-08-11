import { loadSections, DataError } from './data.js';
import {
  masteryPercent,
  wrongQuestionIds,
  resetSection,
  resetAll,
  storageAvailable,
} from './storage.js';

const container = document.getElementById('sections');
const footer = document.getElementById('footer');

async function loadQuestionIds(section) {
  const response = await fetch(`data/${section.file}`);
  if (!response.ok) throw new DataError(`Не удалось загрузить data/${section.file}: HTTP ${response.status}`);
  const questions = await response.json();
  return questions.map((question) => question.id);
}

function renderCard(section, questionIds) {
  const card = document.createElement('div');
  card.className = 'card';

  const link = document.createElement('a');
  link.className = 'card__link';
  link.href = `quiz.html?s=${encodeURIComponent(section.id)}`;
  link.textContent = section.title;

  const description = document.createElement('div');
  description.className = 'muted';
  description.textContent = section.description;

  const meta = document.createElement('div');
  meta.className = 'card__meta';

  const stats = document.createElement('span');
  const percent = masteryPercent(section.id, questionIds);
  stats.textContent = storageAvailable
    ? `${questionIds.length} вопросов · освоено ${percent}%`
    : `${questionIds.length} вопросов`;
  meta.append(stats);

  if (storageAvailable && percent > 0) {
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'button button--ghost card__reset';
    reset.textContent = 'Сбросить';
    reset.addEventListener('click', () => {
      if (!confirm(`Стереть статистику раздела «${section.title}»? Отменить будет нельзя.`)) return;
      resetSection(section.id);
      render();
    });
    meta.append(reset);
  }

  card.append(link, description, meta);

  // Ошибки живут в localStorage, поэтому повтор доступен и в новый заход,
  // а не только сразу после прохождения.
  const wrongIds = storageAvailable ? wrongQuestionIds(section.id) : [];
  if (wrongIds.length > 0) {
    const replay = document.createElement('a');
    replay.className = 'button button--ghost card__replay';
    replay.href = `quiz.html?s=${encodeURIComponent(section.id)}&wrong=1`;
    replay.textContent = `Повторить ошибки (${wrongIds.length})`;
    card.append(replay);
  }

  return card;
}

function renderFooter(hasProgress) {
  footer.replaceChildren();

  if (!storageAvailable) {
    const note = document.createElement('p');
    note.className = 'muted';
    note.textContent = 'Браузер не даёт сохранять данные, поэтому прогресс не запоминается.';
    footer.append(note);
    return;
  }

  if (!hasProgress) return;

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'button button--ghost';
  reset.textContent = 'Сбросить весь прогресс';
  reset.addEventListener('click', () => {
    if (!confirm('Стереть статистику по всем разделам? Отменить будет нельзя.')) return;
    resetAll();
    render();
  });
  footer.append(reset);
}

async function render() {
  try {
    const sections = await loadSections();
    const questionIdsBySection = await Promise.all(sections.map(loadQuestionIds));

    container.replaceChildren(
      ...sections.map((section, index) => renderCard(section, questionIdsBySection[index])),
    );

    const hasProgress = sections.some(
      (section, index) => masteryPercent(section.id, questionIdsBySection[index]) > 0,
    );
    renderFooter(hasProgress);
  } catch (error) {
    container.replaceChildren();
    const box = document.createElement('div');
    box.className = 'error';
    box.textContent = error instanceof DataError ? error.message : `Неожиданная ошибка: ${error.message}`;
    container.append(box);
  }
}

render();
