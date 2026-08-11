// Загрузка JSON с человеческими сообщениями об ошибках.
export class DataError extends Error {}

// Обычно до этой ветки дело не доходит: страница с file:// не может
// загрузить модульный <script>, поэтому классический инлайн-скрипт в
// index.html/quiz.html показывает сообщение раньше, чем этот модуль вообще
// начнёт выполняться. Ветка остаётся на случай более снисходительных
// браузеров, которые всё-таки запустят модуль с file://.
export async function loadJson(path) {
  let response;
  try {
    response = await fetch(path);
  } catch (cause) {
    if (location.protocol === 'file:') {
      throw new DataError(
        'Страница открыта как файл, а браузер запрещает читать данные с file://. ' +
          'Запусти «npx serve» или «python -m http.server 3000» в папке проекта и открой http://localhost:3000',
      );
    }
    throw new DataError(`Не удалось загрузить ${path}: ${cause.message}`);
  }

  if (!response.ok) {
    throw new DataError(`Не удалось загрузить ${path}: HTTP ${response.status}`);
  }

  try {
    return await response.json();
  } catch {
    throw new DataError(`Файл ${path} повреждён: это не корректный JSON`);
  }
}

export function loadSections() {
  return loadJson('data/sections.json');
}

export async function loadSection(sectionId) {
  const sections = await loadSections();
  const section = sections.find((item) => item.id === sectionId);
  if (!section) {
    throw new DataError(`Раздел «${sectionId}» не найден`);
  }

  const questions = await loadJson(`data/${section.file}`);
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new DataError(`В разделе «${section.title}» пока нет вопросов`);
  }

  return { section, questions };
}
