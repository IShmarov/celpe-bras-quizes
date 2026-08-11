// Статистика ответов в localStorage. Ключ раздела: celpe:<sectionId>
const PREFIX = 'celpe:';

function probeStorage() {
  try {
    const probe = `${PREFIX}__probe`;
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export const storageAvailable = probeStorage();

const keyOf = (sectionId) => PREFIX + sectionId;

function loadStats(sectionId) {
  if (!storageAvailable) return {};
  try {
    const raw = localStorage.getItem(keyOf(sectionId));
    const parsed = raw === null ? null : JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveStats(sectionId, stats) {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(keyOf(sectionId), JSON.stringify(stats));
  } catch {
    // Переполненное или недоступное хранилище не должно ломать прохождение.
  }
}

// Повреждённая (не-объектная) запись заменяется новой, а не используется как есть.
function normalizeEntry(value) {
  return value !== null && typeof value === 'object' ? value : { correct: 0, wrong: 0, last: null };
}

export function recordAnswer(sectionId, questionId, isCorrect) {
  const stats = loadStats(sectionId);
  const entry = normalizeEntry(stats[questionId]);
  if (isCorrect) entry.correct += 1;
  else entry.wrong += 1;
  entry.last = isCorrect ? 'correct' : 'wrong';
  stats[questionId] = entry;
  saveStats(sectionId, stats);
}

export function masteryPercent(sectionId, questionIds) {
  if (questionIds.length === 0) return 0;
  const stats = loadStats(sectionId);
  const mastered = questionIds.filter((id) => stats[id]?.last === 'correct').length;
  return Math.round((mastered / questionIds.length) * 100);
}

export function wrongQuestionIds(sectionId) {
  const stats = loadStats(sectionId);
  return Object.keys(stats).filter((id) => stats[id]?.last === 'wrong');
}

export function resetSection(sectionId) {
  if (!storageAvailable) return;
  try {
    localStorage.removeItem(keyOf(sectionId));
  } catch {
    // Нечего делать: сбросить нельзя, но и падать незачем.
  }
}

// В отличие от сканирования уже загруженных разделов на странице, эта
// функция смотрит прямо в localStorage — поэтому видит и статистику
// разделов, чей файл вопросов сейчас недоступен, и отражает именно то,
// что реально сотрёт resetAll().
export function hasAnyProgress() {
  if (!storageAvailable) return false;
  try {
    return Object.keys(localStorage).some((key) => key.startsWith(PREFIX));
  } catch {
    return false;
  }
}

export function resetAll() {
  if (!storageAvailable) return;
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    // См. выше.
  }
}
