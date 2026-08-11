import { loadSection, DataError } from './data.js';
import { prepareQuestions, createSession } from './engine.js';
import { recordAnswer } from './storage.js';

const app = document.getElementById('app');

function showError(message) {
  app.replaceChildren();

  const box = document.createElement('div');
  box.className = 'error';
  box.textContent = message;

  const paragraph = document.createElement('p');
  const link = document.createElement('a');
  link.href = 'index.html';
  link.textContent = 'На главную';
  paragraph.append(link);

  app.append(box, paragraph);
}

// Верхняя панель одинакова на экране вопроса и на экране результата,
// отличается только наличием счётчика.
function createTopbar(sectionTitle, counterText = '') {
  const topbar = document.createElement('div');
  topbar.className = 'topbar';

  const back = document.createElement('a');
  back.href = 'index.html';
  back.textContent = `← ${sectionTitle}`;
  topbar.append(back);

  if (counterText !== '') {
    const counter = document.createElement('span');
    counter.className = 'muted';
    counter.textContent = counterText;
    topbar.append(counter);
  }

  return topbar;
}

function renderQuestion(session, sectionTitle) {
  app.replaceChildren();

  const topbar = createTopbar(sectionTitle, `${session.position} / ${session.total}`);

  const progress = document.createElement('div');
  progress.className = 'progress';
  const bar = document.createElement('div');
  bar.className = 'progress__bar';
  bar.style.width = `${((session.position - 1) / session.total) * 100}%`;
  progress.append(bar);

  const prompt = document.createElement('h1');
  prompt.className = 'prompt';
  prompt.textContent = session.current.prompt;

  const options = document.createElement('div');
  options.className = 'options';

  session.current.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';
    button.dataset.index = String(index);

    const text = document.createElement('span');
    text.textContent = option.text;
    button.append(text);

    button.addEventListener('click', () => handleAnswer(session, sectionTitle, index));
    options.append(button);
  });

  app.append(topbar, progress, prompt, options);
}

function handleAnswer(session, sectionTitle, optionIndex) {
  const questionId = session.current.id;
  const verdict = session.answer(optionIndex);
  if (verdict === null) return;

  const buttons = [...app.querySelectorAll('.option')];
  buttons.forEach((button) => {
    button.disabled = true;
  });

  markOption(buttons[verdict.correctIndex], 'correct');
  if (!verdict.isCorrect) markOption(buttons[optionIndex], 'wrong');

  const explanation = document.createElement('p');
  explanation.className = 'explanation';
  explanation.textContent = verdict.explanation;
  explanation.tabIndex = -1;

  const actions = document.createElement('div');
  actions.className = 'actions';

  if (!session.isLast) {
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'button';
    next.id = 'next';
    next.textContent = 'Дальше';
    next.addEventListener('click', () => {
      session.next();
      renderQuestion(session, sectionTitle);
    });
    actions.append(next);
  }

  app.append(explanation, actions);
  explanation.focus();

  recordAnswer(currentSectionId, questionId, verdict.isCorrect);
}

function markOption(button, kind) {
  button.classList.add(kind === 'correct' ? 'option--correct' : 'option--wrong');
  const mark = document.createElement('span');
  mark.className = 'option__mark';
  mark.textContent = kind === 'correct' ? '✓' : '✗';
  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = kind === 'correct' ? ' верно' : ' неверно';
  mark.append(label);
  button.append(mark);
}

let currentSectionId = '';

async function start() {
  currentSectionId = new URLSearchParams(location.search).get('s') ?? '';
  if (currentSectionId === '') {
    showError('Не указан раздел. Открой викторину с главной страницы.');
    return;
  }

  try {
    const { section, questions } = await loadSection(currentSectionId);
    document.title = `${section.title} — Celpe-Bras`;
    renderQuestion(createSession(prepareQuestions(questions)), section.title);
  } catch (error) {
    showError(error instanceof DataError ? error.message : `Неожиданная ошибка: ${error.message}`);
  }
}

start();
