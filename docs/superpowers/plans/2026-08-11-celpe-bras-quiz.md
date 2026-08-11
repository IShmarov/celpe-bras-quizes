# Тренажёр Celpe-Bras — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Статический сайт с викторинами по пяти темам португальского языка, публикуемый на GitHub Pages.

**Architecture:** Две HTML-страницы (главная и универсальная страница викторины) и несколько ES-модулей без сборки. Вопросы лежат в JSON-файлах по одному на раздел, реестр разделов — в `data/sections.json`. Чистая логика (перемешивание, сессия прохождения) отделена от DOM и от хранилища, поэтому покрывается тестами `node --test` без единой зависимости.

**Tech Stack:** HTML, CSS, JavaScript (ES-модули), `localStorage`. Node.js — только для валидатора данных, тестов и локального сервера; в рантайме сайта его нет.

Спека: `docs/superpowers/specs/2026-08-11-celpe-bras-quiz-design.md`

## Global Constraints

- **Ноль зависимостей.** Ни `package.json`, ни `node_modules`, ни CDN-ссылок, ни подключаемых шрифтов и иконок. Всё, что использует код, — встроенные модули Node (`node:fs/promises`, `node:path`, `node:url`, `node:test`, `node:assert/strict`) и браузерные API.
- **Ноль сборки.** Файлы отдаются как есть. Никаких транспиляторов, минификаторов, CI-шагов.
- **Язык интерфейса — русский.** Учебный материал (вопросы, варианты ответов) — португальский, объяснения — русские.
- **Mobile-first.** Базовые стили под узкий экран, одна колонка, `max-width: 40rem`. Горизонтального скролла нет ни при какой ширине.
- **Шрифт** — только системный стек `system-ui, sans-serif`.
- **`id` вопроса неизменяем** после появления в репозитории: к нему привязана статистика в `localStorage`.
- **`explanation` обязателен** у каждого вопроса.
- **Префикс ключей `localStorage` — `celpe:`**, ровно в таком виде во всех модулях.
- **Состояние ответа передаётся не только цветом**, но и знаком (`✓` / `✗`) с текстовой подписью для скринридера.
- Данные проверяются `node tools/validate.mjs` перед каждым коммитом, который трогает `data/`.

## Структура файлов

| Файл | Ответственность |
| --- | --- |
| `index.html` | Разметка главной |
| `quiz.html` | Разметка страницы викторины |
| `assets/style.css` | Все стили проекта |
| `assets/data.js` | Загрузка JSON и понятные сообщения об ошибках загрузки |
| `assets/storage.js` | `localStorage`: статистика ответов, проценты, сброс |
| `assets/engine.js` | Чистая логика: перемешивание, подготовка вопросов, сессия прохождения. Не знает про DOM и про хранилище |
| `assets/quiz-page.js` | Рендер страницы викторины, обработка кликов |
| `assets/index-page.js` | Рендер главной, кнопки сброса |
| `tools/validate.mjs` | Проверка целостности `data/` |
| `tests/engine.test.mjs` | Тесты чистой логики |
| `data/*.json` | Реестр разделов и вопросы |

Разделение `engine.js` / `quiz-page.js` — намеренное: вся логика, в которой можно ошибиться, лежит в модуле без DOM и проверяется тестами; в модуле с DOM остаётся только отрисовка.

---

### Task 1: Валидатор данных и первый раздел

**Files:**
- Create: `data/sections.json`
- Create: `data/artigos.json`
- Create: `tools/validate.mjs`
- Create: `.gitignore`

**Interfaces:**
- Consumes: ничего.
- Produces: формат данных, на который опираются все следующие задачи. `sections.json` — массив объектов `{id, title, description, file}`. Файл раздела — массив объектов `{id, prompt, options, answer, explanation, tags?}`, где `answer` — индекс правильного варианта в массиве `options`, `tags` необязателен. Команда проверки: `node tools/validate.mjs`.

- [ ] **Шаг 1: Проверить версию Node**

Run: `node --version`
Expected: `v18.0.0` или выше. Если Node не установлен — поставить LTS с nodejs.org, иначе валидатор и тесты не запустятся.

- [ ] **Шаг 2: Создать `.gitignore`**

```gitignore
node_modules/
.DS_Store
Thumbs.db
```

- [ ] **Шаг 3: Создать `data/sections.json` с одним разделом**

Остальные четыре раздела добавляются в Task 8; сейчас реестр содержит только тот раздел, файл которого реально существует, иначе валидатор справедливо ругнётся.

```json
[
  {
    "id": "artigos",
    "title": "Артикли",
    "description": "Род, сложные случаи, страны и города",
    "file": "artigos.json"
  }
]
```

- [ ] **Шаг 4: Создать `data/artigos.json`**

```json
[
  {
    "id": "art-001",
    "prompt": "___ Brasil é um país enorme.",
    "options": ["O", "A", "Os", "—"],
    "answer": 0,
    "explanation": "Названия стран обычно идут с определённым артиклем: o Brasil, o Japão, a França, a Rússia.",
    "tags": ["países"]
  },
  {
    "id": "art-002",
    "prompt": "Моя подруга живёт в Португалии. Как это сказать?",
    "options": ["Minha amiga mora em Portugal.", "Minha amiga mora no Portugal.", "Minha amiga mora na Portugal.", "Minha amiga mora ao Portugal."],
    "answer": 0,
    "explanation": "Portugal — исключение, оно идёт без артикля. Так же ведут себя Angola, Moçambique, Israel, Cabo Verde. Отсюда «em Portugal», а не «no Portugal».",
    "tags": ["países", "исключения"]
  },
  {
    "id": "art-003",
    "prompt": "___ Estados Unidos ficam na América do Norte.",
    "options": ["Os", "O", "As", "—"],
    "answer": 0,
    "explanation": "Страны с названием во множественном числе берут артикль множественного числа: os Estados Unidos, os Países Baixos, as Filipinas.",
    "tags": ["países"]
  },
  {
    "id": "art-004",
    "prompt": "___ problema é mais sério do que parece.",
    "options": ["O", "A", "Os", "—"],
    "answer": 0,
    "explanation": "Слова греческого происхождения на -ma мужского рода, хотя и кончаются на -a: o problema, o tema, o sistema, o programa, o clima.",
    "tags": ["род"]
  },
  {
    "id": "art-005",
    "prompt": "___ viagem foi longa, mas valeu a pena.",
    "options": ["A", "O", "As", "—"],
    "answer": 0,
    "explanation": "Существительные на -agem женского рода: a viagem, a paisagem, a coragem, a mensagem.",
    "tags": ["род"]
  },
  {
    "id": "art-006",
    "prompt": "___ mão direita está machucada.",
    "options": ["A", "O", "As", "—"],
    "answer": 0,
    "explanation": "Большинство слов на -ão мужского рода (o pão, o coração, o irmão), но a mão — исключение. Всё на -ção и -são женского рода: a informação, a estação, a decisão.",
    "tags": ["род", "исключения"]
  },
  {
    "id": "art-007",
    "prompt": "Ele foi ___ Rio de Janeiro no verão passado.",
    "options": ["ao", "a", "em", "no"],
    "answer": 0,
    "explanation": "Rio de Janeiro — один из городов, которые употребляются с артиклем (o Rio, o Porto, a Bahia). Предлог a сливается с ним в «ao Rio».",
    "tags": ["города"]
  },
  {
    "id": "art-008",
    "prompt": "Ela mora ___ São Paulo há dez anos.",
    "options": ["em", "no", "na", "ao"],
    "answer": 0,
    "explanation": "Большинство городов идут без артикля: em São Paulo, em Lisboa, em Brasília. Сравни с городами-исключениями: no Rio, no Porto.",
    "tags": ["города"]
  }
]
```

- [ ] **Шаг 5: Создать `tools/validate.mjs`**

```js
#!/usr/bin/env node
// Проверка целостности data/. Запуск: node tools/validate.mjs
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

let sections;
try {
  sections = await readJson(join(dataDir, 'sections.json'));
} catch (error) {
  console.error(`sections.json не читается: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(sections) || sections.length === 0) {
  console.error('sections.json: ожидался непустой массив разделов');
  process.exit(1);
}

const sectionIds = new Set();

for (const section of sections) {
  const where = `sections.json → ${section.id ?? '(без id)'}`;

  for (const field of ['id', 'title', 'description', 'file']) {
    if (typeof section[field] !== 'string' || section[field].trim() === '') {
      fail(where, `поле "${field}" пустое или не строка`);
    }
  }
  if (sectionIds.has(section.id)) fail(where, 'дублирующийся id раздела');
  sectionIds.add(section.id);

  let questions;
  try {
    questions = await readJson(join(dataDir, section.file));
  } catch (error) {
    fail(where, `не читается ${section.file}: ${error.message}`);
    continue;
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    fail(where, `${section.file}: ожидался непустой массив вопросов`);
    continue;
  }

  const questionIds = new Set();
  const promptOwners = new Map();

  questions.forEach((question, index) => {
    const at = `${section.file}[${index}] ${question.id ?? '(без id)'}`;

    if (typeof question.id !== 'string' || question.id.trim() === '') fail(at, 'нет id');
    else if (questionIds.has(question.id)) fail(at, 'дублирующийся id вопроса');
    else questionIds.add(question.id);

    if (typeof question.prompt !== 'string' || question.prompt.trim() === '') fail(at, 'пустой prompt');
    else {
      const promptKey = question.prompt.trim();
      const owner = question.id ?? `[${index}]`;
      if (promptOwners.has(promptKey)) promptOwners.get(promptKey).push(owner);
      else promptOwners.set(promptKey, [owner]);
    }
    if (typeof question.explanation !== 'string' || question.explanation.trim() === '') fail(at, 'пустой explanation');

    if (!Array.isArray(question.options) || question.options.length < 2) {
      fail(at, 'нужно минимум два варианта ответа');
      return;
    }
    if (question.options.some((option) => typeof option !== 'string' || option.trim() === '')) {
      fail(at, 'пустой вариант ответа');
    }
    if (new Set(question.options.map((option) => option.trim())).size !== question.options.length) {
      fail(at, 'варианты ответа дублируются');
    }
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) {
      fail(at, `answer=${question.answer} вне диапазона 0..${question.options.length - 1}`);
    }
    if (question.tags !== undefined && (!Array.isArray(question.tags) || question.tags.some((tag) => typeof tag !== 'string'))) {
      fail(at, 'tags должен быть массивом строк');
    }
  });

  // Дубли prompt не ловятся дублями id: на экране результата вопросы
  // перечисляются по тексту prompt, и два вопроса с одинаковым текстом
  // неразличимы в списке ошибок, даже если у них разные id.
  for (const [prompt, owners] of promptOwners) {
    if (owners.length > 1) {
      fail(`sections.json → ${section.id ?? '(без id)'}`, `дублирующийся prompt у вопросов ${owners.join(', ')}: «${prompt}»`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Ошибок: ${errors.length}\n`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(`Данные в порядке: разделов ${sections.length}.`);
```

- [ ] **Шаг 6: Запустить валидатор на корректных данных**

Run: `node tools/validate.mjs`
Expected: `Данные в порядке: разделов 1.`, код возврата 0.

- [ ] **Шаг 7: Проверить, что валидатор действительно ловит ошибку**

Временно поменять в `data/artigos.json` у вопроса `art-001` значение `"answer": 0` на `"answer": 9`.

Run: `node tools/validate.mjs`
Expected: код возврата 1 и строка `artigos.json[0] art-001: answer=9 вне диапазона 0..3`.

Вернуть `"answer": 0` обратно и снова запустить `node tools/validate.mjs` — должно быть `Данные в порядке: разделов 1.`

- [ ] **Шаг 8: Коммит**

```bash
git add .gitignore data tools && git commit -m "Add data format, first section and a validator"
```

---

### Task 2: Хранилище прогресса

**Files:**
- Create: `assets/storage.js`

**Interfaces:**
- Consumes: формат `id` вопроса из Task 1.
- Produces: модуль `assets/storage.js` с экспортами:
  - `storageAvailable: boolean`
  - `recordAnswer(sectionId: string, questionId: string, isCorrect: boolean): void`
  - `masteryPercent(sectionId: string, questionIds: string[]): number` — целое 0..100
  - `wrongQuestionIds(sectionId: string): string[]`
  - `hasAnyProgress(): boolean` — правда, если в localStorage есть хоть один ключ `celpe:*`; добавлена постфактум (финальный обзор), чтобы кнопка «Сбросить весь прогресс» на главной отражала именно то, что сотрёт `resetAll()`, а не только разделы, чей JSON успешно загрузился
  - `resetSection(sectionId: string): void`
  - `resetAll(): void`

- [ ] **Шаг 1: Создать `assets/storage.js`**

Каждое обращение к `localStorage` обёрнуто в try/catch: в приватном режиме браузера обращение бросает исключение, и викторина должна продолжать работать, просто не сохраняя прогресс.

```js
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
```

- [ ] **Шаг 2: Проверить модуль в браузере**

Запустить сервер: `npx serve` (в отдельном окне терминала, оставить работать до конца плана). Открыть `http://localhost:3000`, открыть консоль браузера (F12) и выполнить:

```js
const s = await import('/assets/storage.js');
s.resetAll();
s.recordAnswer('artigos', 'art-001', true);
s.recordAnswer('artigos', 'art-002', false);
console.log(s.storageAvailable, s.masteryPercent('artigos', ['art-001', 'art-002']), s.wrongQuestionIds('artigos'));
```

Expected: `true 50 ['art-002']`

Затем проверить сброс:

```js
s.resetSection('artigos');
console.log(s.masteryPercent('artigos', ['art-001', 'art-002']), s.wrongQuestionIds('artigos'));
```

Expected: `0 []`

- [ ] **Шаг 3: Коммит**

```bash
git add assets/storage.js && git commit -m "Add progress storage"
```

---

### Task 3: Логика викторины и тесты к ней

**Files:**
- Create: `tests/engine.test.mjs`
- Create: `assets/engine.js`

**Interfaces:**
- Consumes: формат вопроса из Task 1.
- Produces: модуль `assets/engine.js` с экспортами:
  - `shuffle(items: T[], random?: () => number): T[]` — новый массив, исходный не меняется
  - `prepareQuestions(rawQuestions, random?) -> PreparedQuestion[]`, где `PreparedQuestion = {id, prompt, explanation, tags: string[], options: {text: string, correct: boolean}[]}`
  - `createSession(preparedQuestions) -> Session` со свойствами `total`, `position`, `current`, `isAnswered`, `isLast`, `correctCount`, `wrongIds` и методами `answer(optionIndex) -> {isCorrect, correctIndex, explanation} | null` и `next() -> boolean`

Тесты пишутся до реализации. Здесь это оправдано: `prepareQuestions` переносит признак правильности с индекса на сам вариант, и ошибка в этом месте даёт викторину, которая молча засчитывает не тот ответ.

- [ ] **Шаг 1: Написать падающие тесты**

Create `tests/engine.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, prepareQuestions, createSession } from '../assets/engine.js';

// Предсказуемый «генератор случайности»: всегда 0, поэтому перемешивание
// детерминировано и тест не мигает.
const alwaysZero = () => 0;

const RAW = [
  { id: 'q1', prompt: 'Первый', options: ['a', 'b', 'c'], answer: 1, explanation: 'потому что b' },
  { id: 'q2', prompt: 'Второй', options: ['x', 'y'], answer: 0, explanation: 'потому что x', tags: ['t'] },
];

test('shuffle не меняет исходный массив и сохраняет состав', () => {
  const source = [1, 2, 3, 4];
  const result = shuffle(source, alwaysZero);
  assert.deepEqual(source, [1, 2, 3, 4]);
  assert.equal(result.length, 4);
  assert.deepEqual([...result].sort(), [1, 2, 3, 4]);

  // Числовой массив мог бы случайно пройти проверку, даже перепутав порядок
  // с составом (например, если бы shuffle тасовало индексы, а не элементы).
  // Строки этого не прощают: сравниваем именно тексты вариантов.
  const texts = ['café', 'avô', 'sofá', 'irmão'];
  const shuffledTexts = shuffle(texts, alwaysZero);
  assert.deepEqual(texts, ['café', 'avô', 'sofá', 'irmão']);
  assert.equal(shuffledTexts.length, texts.length);
  assert.deepEqual([...shuffledTexts].sort(), [...texts].sort());
});

test('prepareQuestions помечает правильный вариант, а не запоминает индекс', () => {
  const prepared = prepareQuestions(RAW, alwaysZero);
  const first = prepared.find((question) => question.id === 'q1');
  const correct = first.options.filter((option) => option.correct);
  assert.equal(correct.length, 1);
  assert.equal(correct[0].text, 'b');
  assert.equal(first.options.length, 3);
});

test('prepareQuestions подставляет пустые tags, если их нет', () => {
  const prepared = prepareQuestions(RAW, alwaysZero);
  assert.deepEqual(prepared.find((question) => question.id === 'q1').tags, []);
  assert.deepEqual(prepared.find((question) => question.id === 'q2').tags, ['t']);
});

test('сессия считает верные ответы и копит id ошибочных', () => {
  const prepared = prepareQuestions(RAW, alwaysZero);
  const session = createSession(prepared);

  assert.equal(session.total, 2);
  assert.equal(session.position, 1);
  assert.equal(session.isAnswered, false);
  assert.equal(session.isLast, false);

  const correctIndex = session.current.options.findIndex((option) => option.correct);
  const verdict = session.answer(correctIndex);
  assert.equal(verdict.isCorrect, true);
  assert.equal(verdict.correctIndex, correctIndex);
  assert.equal(session.isAnswered, true);
  assert.equal(session.correctCount, 1);

  assert.equal(session.next(), true);
  assert.equal(session.position, 2);
  assert.equal(session.isAnswered, false);
  assert.equal(session.isLast, true);

  const wrongIndex = session.current.options.findIndex((option) => !option.correct);
  assert.equal(session.answer(wrongIndex).isCorrect, false);
  assert.equal(session.correctCount, 1);
  assert.equal(session.wrongIds.length, 1);

  assert.equal(session.next(), false);
});

test('повторный ответ на тот же вопрос игнорируется', () => {
  const session = createSession(prepareQuestions(RAW, alwaysZero));
  const correctIndex = session.current.options.findIndex((option) => option.correct);
  session.answer(correctIndex);
  assert.equal(session.answer(correctIndex), null);
  assert.equal(session.correctCount, 1);
});

// Реальный сценарий: ровно один вопрос был отвечен неверно, пользователь
// нажимает «Повторить ошибки» — сессия стартует с total === 1. Добавлен
// постфактум (финальный обзор): до этого случай был не покрыт тестами.
test('сессия из одного вопроса: total и isLast верны сразу, next() возвращает false', () => {
  const prepared = prepareQuestions([RAW[0]], alwaysZero);
  const session = createSession(prepared);

  assert.equal(session.total, 1);
  assert.equal(session.position, 1);
  assert.equal(session.isAnswered, false);
  assert.equal(session.isLast, true);

  const correctIndex = session.current.options.findIndex((option) => option.correct);
  const verdict = session.answer(correctIndex);
  assert.equal(verdict.isCorrect, true);
  assert.equal(verdict.correctIndex, correctIndex);
  assert.equal(session.isAnswered, true);
  assert.equal(session.correctCount, 1);

  assert.equal(session.next(), false);
  assert.equal(session.position, 1);
  assert.equal(session.isLast, true);
});
```

- [ ] **Шаг 2: Запустить тесты и убедиться, что они падают**

Run: `node --test`
Expected: FAIL — `Cannot find module .../assets/engine.js`

- [ ] **Шаг 3: Написать `assets/engine.js`**

```js
// Чистая логика викторины: ни DOM, ни localStorage.
// random передаётся параметром, чтобы логику можно было тестировать.

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Признак правильности переносится на сам вариант ответа. После этого
// индекс из JSON больше нигде не нужен, и перемешивание не может его сбить.
export function prepareQuestions(rawQuestions, random = Math.random) {
  return shuffle(rawQuestions, random).map((question) => ({
    id: question.id,
    prompt: question.prompt,
    explanation: question.explanation,
    tags: question.tags ?? [],
    options: shuffle(
      question.options.map((text, index) => ({ text, correct: index === question.answer })),
      random,
    ),
  }));
}

export function createSession(questions) {
  let index = 0;
  let answered = false;
  let correctCount = 0;
  const wrongIds = [];

  return {
    total: questions.length,
    get position() {
      return index + 1;
    },
    get current() {
      return questions[index];
    },
    get isAnswered() {
      return answered;
    },
    get isLast() {
      return index === questions.length - 1;
    },
    get correctCount() {
      return correctCount;
    },
    get wrongIds() {
      return [...wrongIds];
    },
    answer(optionIndex) {
      if (answered) return null;
      answered = true;

      const question = questions[index];
      const chosen = question.options[optionIndex];
      if (chosen.correct) correctCount += 1;
      else wrongIds.push(question.id);

      return {
        isCorrect: chosen.correct,
        correctIndex: question.options.findIndex((option) => option.correct),
        explanation: question.explanation,
      };
    },
    next() {
      if (index >= questions.length - 1) return false;
      index += 1;
      answered = false;
      return true;
    },
  };
}
```

- [ ] **Шаг 4: Запустить тесты и убедиться, что они проходят**

Run: `node --test`
Expected: `# pass 6`, `# fail 0`

- [ ] **Шаг 5: Коммит**

```bash
git add assets/engine.js tests && git commit -m "Add quiz logic with tests"
```

---

### Task 4: Загрузка данных, страница викторины и стили

**Files:**
- Create: `assets/data.js`
- Create: `quiz.html`
- Create: `assets/quiz-page.js`
- Create: `assets/style.css`

**Interfaces:**
- Consumes: `prepareQuestions`, `createSession` из Task 3.
- Produces:
  - `assets/data.js`: класс `DataError extends Error`, `loadSections(): Promise<Section[]>`, `loadSection(sectionId): Promise<{section, questions}>`
  - `quiz.html` по адресу `quiz.html?s=<sectionId>`
  - CSS-классы, на которые опираются Task 5 и Task 7: `.page`, `.topbar`, `.option`, `.button`, `.button--ghost`, `.actions`, `.muted`, `.sr-only`. Классы главной страницы (`.card` и соседние) заводит Task 6 — здесь их нет.

Экран результата в этой задаче ещё не делается: после последнего ответа кнопка «дальше» просто не появляется. Его добавляет Task 5.

- [ ] **Шаг 1: Создать `assets/data.js`**

```js
// Загрузка JSON с человеческими сообщениями об ошибках.
export class DataError extends Error {}

// Обычно до этой ветки дело не доходит: страница с file:// не может
// загрузить модульный <script>, поэтому классический инлайн-скрипт в
// index.html/quiz.html показывает сообщение раньше, чем этот модуль вообще
// начнёт выполняться. Ветка остаётся на случай более снисходительных
// браузеров, которые всё-таки запустят модуль с file://.
// Экспортирован: index-page.js переиспользует его напрямую, а не
// заново реализует fetch + response.json() + обработку ошибок.
export async function loadJson(path) {
  let response;
  try {
    response = await fetch(path);
  } catch (cause) {
    if (location.protocol === 'file:') {
      throw new DataError(
        'Страница открыта как файл. Браузер запрещает читать данные с file://. ' +
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
```

- [ ] **Шаг 2: Создать `quiz.html`**

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Викторина — Celpe-Bras</title>
    <link rel="stylesheet" href="assets/style.css" />
  </head>
  <body>
    <main class="page" id="app">
      <p class="muted">Загрузка…</p>
    </main>
    <script>
      (function () {
        if (location.protocol !== 'file:') return;

        function showFileProtocolNotice() {
          var main = document.querySelector('main');
          if (!main) return;

          main.textContent = '';
          var notice = document.createElement('p');
          notice.className = 'error';
          notice.textContent =
            'Страница открыта как файл. Браузер запрещает читать данные с file://. ' +
            'Запусти «npx serve» или «python -m http.server 3000» в папке проекта и открой http://localhost:3000';
          main.append(notice);
        }

        if (document.querySelector('main')) {
          showFileProtocolNotice();
        } else {
          document.addEventListener('DOMContentLoaded', showFileProtocolNotice);
        }
      })();
    </script>
    <script type="module" src="assets/quiz-page.js"></script>
  </body>
</html>
```

`<script type="module">` не выполняется вовсе, когда документ открыт с `file://`
(непрозрачное происхождение, CORS блокирует загрузку самого модуля), поэтому
`fetch` внутри `data.js` до этой страницы никогда не доходит — пользователь
просто вечно видит «Загрузка…». Классический (не модульный) инлайн-скрипт
выше запускается и с `file://`, поэтому именно он показывает сообщение с
обоими вариантами локального сервера. Тот же скрипт добавлен и в `index.html`.

- [ ] **Шаг 3: Создать `assets/style.css`**

```css
:root {
  color-scheme: light dark;
  --bg: #fbfaf8;
  --surface: #ffffff;
  --text: #1a1a19;
  --muted: #6b6b66;
  --line: #e0ded8;
  --accent: #2f6f4e;
  --correct: #2f6f4e;
  --correct-bg: #eaf3ee;
  --wrong: #b03a2e;
  --wrong-bg: #f8ebe9;
  --radius: 0.75rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #16171a;
    --surface: #1e2024;
    --text: #ecebe8;
    --muted: #9b9a95;
    --line: #33363c;
    --accent: #6fbf8f;
    --correct: #6fbf8f;
    --correct-bg: #1d2a23;
    --wrong: #e0796a;
    --wrong-bg: #2c1f1d;
  }
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, sans-serif;
  font-size: clamp(1rem, 0.95rem + 0.3vw, 1.125rem);
  line-height: 1.55;
  -webkit-text-size-adjust: 100%;
}

.page {
  max-width: 40rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}

h1 {
  font-size: clamp(1.35rem, 1.2rem + 1vw, 1.75rem);
  line-height: 1.25;
  margin: 0 0 0.25rem;
}

.muted {
  color: var(--muted);
  font-size: 0.9rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.topbar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.topbar a {
  color: var(--muted);
  text-decoration: none;
}

.topbar a:hover {
  color: var(--accent);
}

.progress {
  height: 3px;
  background: var(--line);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.progress__bar {
  height: 100%;
  background: var(--accent);
  transition: width 0.2s ease;
}

.prompt {
  font-size: clamp(1.1rem, 1rem + 0.6vw, 1.35rem);
  margin: 0 0 1.5rem;
  white-space: pre-line;
}

.options {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.75rem 1rem;
  font: inherit;
  color: inherit;
  text-align: left;
  white-space: pre-line;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.option:hover:not(:disabled) {
  border-color: var(--accent);
}

.option:disabled {
  cursor: default;
}

.option--correct {
  border-color: var(--correct);
  background: var(--correct-bg);
}

.option--wrong {
  border-color: var(--wrong);
  background: var(--wrong-bg);
}

.option__mark {
  flex: none;
  font-weight: 700;
}

.option--correct .option__mark {
  color: var(--correct);
}

.option--wrong .option__mark {
  color: var(--wrong);
}

.explanation {
  margin: 1.25rem 0 0;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.75rem 1.25rem;
  font: inherit;
  color: var(--bg);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  cursor: pointer;
  text-decoration: none;
}

.button--ghost {
  color: var(--muted);
  background: transparent;
  border-color: var(--line);
}

.button--ghost:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.error {
  padding: 1rem;
  border: 1px solid var(--wrong);
  border-radius: var(--radius);
  background: var(--wrong-bg);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

- [ ] **Шаг 4: Создать `assets/quiz-page.js`**

```js
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
  // Программно фокусируемый, хотя обычно не интерактивный: renderQuestion
  // заменяет всё поддерево, и без этого фокус падает на <body>, поэтому
  // ни скринридер не объявляет новый вопрос, ни клавиатурный пользователь
  // не остаётся в разумном месте табуляции.
  prompt.tabIndex = -1;

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
  prompt.focus();
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
```

- [ ] **Шаг 5: Проверить в браузере**

При работающем `npx serve` открыть `http://localhost:3000/quiz.html?s=artigos`.

Expected:
- виден вопрос, счётчик `1 / 8` и полоса прогресса;
- клик по варианту подсвечивает правильный вариант зелёным со знаком `✓`, а ошибочный выбор — красным со знаком `✗`;
- под вариантами появляется объяснение;
- повторные клики по вариантам ничего не меняют;
- кнопка «Дальше» листает вопросы до восьмого, на восьмом её нет.

- [ ] **Шаг 6: Проверить обработку ошибок**

Открыть `http://localhost:3000/quiz.html` (без `?s=`).
Expected: «Не указан раздел. Открой викторину с главной страницы.» и ссылка на главную.

Открыть `http://localhost:3000/quiz.html?s=нетакого`.
Expected: «Раздел «нетакого» не найден».

- [ ] **Шаг 7: Проверить узкий экран**

В DevTools включить эмуляцию устройства (Ctrl+Shift+M), выбрать ширину 375px.
Expected: одна колонка, горизонтального скролла нет, варианты ответа растянуты на всю ширину.

- [ ] **Шаг 8: Коммит**

```bash
git add assets/data.js assets/quiz-page.js assets/style.css quiz.html && git commit -m "Add quiz page"
```

---

### Task 5: Экран результата и повтор ошибок

**Files:**
- Modify: `assets/quiz-page.js`
- Modify: `assets/style.css`

**Interfaces:**
- Consumes: `session.total`, `session.correctCount`, `session.wrongIds`, `session.isLast` из Task 3; функцию `createTopbar(sectionTitle, counterText?)`, классы `.button`, `.button--ghost`, `.actions`, `.muted` из Task 4.
- Produces: функция `renderResult(session, sectionTitle)` внутри `quiz-page.js`; исходные вопросы она берёт из модульной переменной `allQuestions`. Наружу ничего нового не экспортируется.

- [ ] **Шаг 1: Добавить стили результата в конец `assets/style.css`** (перед блоком `@media (prefers-reduced-motion: reduce)`)

```css
.score {
  font-size: clamp(2rem, 1.5rem + 3vw, 3rem);
  font-weight: 700;
  line-height: 1;
  margin: 0 0 0.5rem;
}

.result-list {
  margin: 1.5rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.5rem;
}

.result-list li {
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 3px solid var(--wrong);
  border-radius: var(--radius);
  white-space: pre-line;
}
```

- [ ] **Шаг 2: Сохранить исходные вопросы, чтобы можно было пересобрать сессию**

В `assets/quiz-page.js` заменить объявление

```js
let currentSectionId = '';
```

на

```js
let currentSectionId = '';
let allQuestions = [];
```

и в функции `start()` заменить строку

```js
    renderQuestion(createSession(prepareQuestions(questions)), section.title);
```

на

```js
    allQuestions = questions;
    renderQuestion(createSession(prepareQuestions(questions)), section.title);
```

- [ ] **Шаг 3: Показывать кнопку «Результат» на последнем вопросе**

В функции `handleAnswer` заменить блок

```js
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
```

на

```js
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'button';
  next.id = 'next';
  next.textContent = session.isLast ? 'Результат' : 'Дальше';
  next.addEventListener('click', () => {
    if (session.isLast) {
      renderResult(session, sectionTitle);
      return;
    }
    session.next();
    renderQuestion(session, sectionTitle);
  });
  actions.append(next);
```

- [ ] **Шаг 4: Добавить функцию `renderResult` в `assets/quiz-page.js`** (перед `let currentSectionId = '';`)

```js
function renderResult(session, sectionTitle) {
  app.replaceChildren();

  const topbar = createTopbar(sectionTitle);

  const score = document.createElement('p');
  score.className = 'score';
  score.textContent = `${session.correctCount} / ${session.total}`;

  const summary = document.createElement('p');
  summary.className = 'muted';
  const wrongIds = session.wrongIds;
  summary.textContent =
    wrongIds.length === 0
      ? 'Ни одной ошибки.'
      : `Ошибок: ${wrongIds.length}. Вот они:`;

  app.append(topbar, score, summary);

  if (wrongIds.length > 0) {
    const list = document.createElement('ul');
    list.className = 'result-list';
    for (const id of wrongIds) {
      const question = allQuestions.find((item) => item.id === id);
      const li = document.createElement('li');
      li.textContent = question.prompt;
      list.append(li);
    }
    app.append(list);
  }

  const actions = document.createElement('div');
  actions.className = 'actions';

  if (wrongIds.length > 0) {
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'button';
    again.textContent = 'Повторить ошибки';
    again.addEventListener('click', () => {
      const onlyWrong = allQuestions.filter((question) => wrongIds.includes(question.id));
      renderQuestion(createSession(prepareQuestions(onlyWrong)), sectionTitle);
    });
    actions.append(again);
  }

  const restart = document.createElement('button');
  restart.type = 'button';
  restart.className = 'button button--ghost';
  restart.textContent = 'Пройти раздел заново';
  restart.addEventListener('click', () => {
    renderQuestion(createSession(prepareQuestions(allQuestions)), sectionTitle);
  });
  actions.append(restart);

  app.append(actions);
}
```

- [ ] **Шаг 5: Проверить в браузере**

Открыть `http://localhost:3000/quiz.html?s=artigos`, пройти все восемь вопросов, намеренно ошибившись на двух.

Expected:
- на последнем вопросе кнопка называется «Результат»;
- экран результата показывает счёт вида `6 / 8`, строку «Ошибок: 2. Вот они:» и тексты этих двух вопросов;
- «Повторить ошибки» запускает викторину ровно из двух вопросов, счётчик показывает `1 / 2`;
- «Пройти раздел заново» запускает все восемь.

Пройти раздел без ошибок и убедиться, что на экране результата написано «Ни одной ошибки», а кнопки «Повторить ошибки» нет.

- [ ] **Шаг 6: Коммит**

```bash
git add assets/quiz-page.js assets/style.css && git commit -m "Add result screen and mistake replay"
```

---

### Task 6: Главная страница

**Files:**
- Create: `index.html`
- Create: `assets/index-page.js`
- Modify: `assets/style.css`
- Modify: `assets/quiz-page.js`

**Interfaces:**
- Consumes: `loadSections`, `DataError` из Task 4; `masteryPercent`, `wrongQuestionIds`, `resetSection`, `resetAll`, `storageAvailable` из Task 2.
- Produces: `index.html` — точка входа сайта. Ссылки вида `quiz.html?s=<id>` и `quiz.html?s=<id>&wrong=1` — второй адрес запускает раздел только из вопросов, на которые последний ответ был неверным.

Страница подгружает файл каждого раздела, чтобы знать число вопросов и их `id`. Это лишние запросы, но альтернатива — дублировать счётчик в `sections.json`, где он немедленно устареет. Файлы маленькие и статические, цена приемлема.

- [ ] **Шаг 1: Добавить стили главной в конец `assets/style.css`** (перед блоком `@media (prefers-reduced-motion: reduce)`)

```css
.lead {
  color: var(--muted);
  margin: 0 0 2rem;
}

.sections {
  display: grid;
  gap: 0.75rem;
}

.card {
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.card__link {
  color: inherit;
  font-weight: 600;
  text-decoration: none;
}

.card__link:hover {
  color: var(--accent);
}

.card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--muted);
  font-size: 0.85rem;
}

.card__reset {
  padding: 0.25rem 0.5rem;
  min-height: 0;
  font-size: 0.8rem;
}

.card__replay {
  justify-self: start;
  margin-top: 0.35rem;
  padding: 0.4rem 0.75rem;
  min-height: 0;
  font-size: 0.85rem;
}

.footer {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
}
```

- [ ] **Шаг 2: Создать `index.html`**

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Celpe-Bras — тренажёр</title>
    <link rel="stylesheet" href="assets/style.css" />
  </head>
  <body>
    <main class="page">
      <h1>Celpe-Bras</h1>
      <p class="lead">Викторины для подготовки к экзамену.</p>
      <div class="sections" id="sections">
        <p class="muted">Загрузка…</p>
      </div>
      <div class="footer" id="footer"></div>
    </main>
    <script>
      (function () {
        if (location.protocol !== 'file:') return;

        function showFileProtocolNotice() {
          var main = document.querySelector('main');
          if (!main) return;

          main.textContent = '';
          var notice = document.createElement('p');
          notice.className = 'error';
          notice.textContent =
            'Страница открыта как файл. Браузер запрещает читать данные с file://. ' +
            'Запусти «npx serve» или «python -m http.server 3000» в папке проекта и открой http://localhost:3000';
          main.append(notice);
        }

        if (document.querySelector('main')) {
          showFileProtocolNotice();
        } else {
          document.addEventListener('DOMContentLoaded', showFileProtocolNotice);
        }
      })();
    </script>
    <script type="module" src="assets/index-page.js"></script>
  </body>
</html>
```

Тот же классический инлайн-скрипт, что и в `quiz.html` — он выполняется даже
с `file://`, где модульный `<script>` вообще не загрузится.

- [ ] **Шаг 3: Создать `assets/index-page.js`**

```js
import { loadSections, loadJson, DataError } from './data.js';
import {
  masteryPercent,
  wrongQuestionIds,
  resetSection,
  resetAll,
  hasAnyProgress,
  storageAvailable,
} from './storage.js';

const container = document.getElementById('sections');
const footer = document.getElementById('footer');

// Делегирует сеть и разбор JSON общему loadJson из data.js — здесь остаётся
// только то, что специфично для этой страницы: список id вопросов раздела.
async function loadQuestionIds(section) {
  const questions = await loadJson(`data/${section.file}`);
  if (!Array.isArray(questions)) {
    throw new DataError(`Файл data/${section.file} повреждён: ожидался массив вопросов`);
  }
  return questions.map((question) => question.id);
}

// Раздел «имеет данные», если по нему есть хоть какая-то освоенность
// или сохранённые ошибки — именно от этого зависит, показывать ли сброс,
// а не от процента освоения, который у одних сплошных ошибок равен нулю.
function sectionHasProgress(sectionId, questionIds) {
  if (!storageAvailable) return false;
  return masteryPercent(sectionId, questionIds) > 0 || wrongQuestionIds(sectionId).length > 0;
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

  // Ошибки живут в localStorage, поэтому повтор доступен и в новый заход,
  // а не только сразу после прохождения. Фильтруем по questionIds раздела:
  // если id когда-нибудь пропадёт из JSON, счётчик не должен обещать больше,
  // чем реально запустится на странице викторины.
  const wrongIds = storageAvailable
    ? wrongQuestionIds(section.id).filter((id) => questionIds.includes(id))
    : [];

  if (sectionHasProgress(section.id, questionIds)) {
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

  if (wrongIds.length > 0) {
    const replay = document.createElement('a');
    replay.className = 'button button--ghost card__replay';
    replay.href = `quiz.html?s=${encodeURIComponent(section.id)}&wrong=1`;
    replay.textContent = `Повторить ошибки (${wrongIds.length})`;
    card.append(replay);
  }

  return card;
}

// Раздел, чей файл не загрузился: карточка есть, но без ссылки (открывать
// нечего) и без статистики — она всё равно неизвестна.
function renderFailedCard(section) {
  const card = document.createElement('div');
  card.className = 'card';

  const title = document.createElement('div');
  title.className = 'card__link';
  title.textContent = section.title;

  const description = document.createElement('div');
  description.className = 'muted';
  description.textContent = section.description;

  const error = document.createElement('div');
  error.className = 'muted';
  error.textContent = 'Не удалось загрузить вопросы';

  card.append(title, description, error);
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

    // Каждый раздел грузится независимо: один битый JSON не должен уносить
    // с собой карточки остальных разделов.
    const results = await Promise.allSettled(sections.map(loadQuestionIds));

    container.replaceChildren(
      ...sections.map((section, index) => {
        const result = results[index];
        return result.status === 'fulfilled' ? renderCard(section, result.value) : renderFailedCard(section);
      }),
    );

    // Не сканируем только успешно загруженные разделы: если у раздела,
    // чей файл сейчас не читается, в localStorage всё ещё лежит статистика,
    // resetAll() всё равно её сотрёт — значит, и кнопка должна быть видна.
    renderFooter(hasAnyProgress());
  } catch (error) {
    container.replaceChildren();
    const box = document.createElement('div');
    box.className = 'error';
    box.textContent = error instanceof DataError ? error.message : `Неожиданная ошибка: ${error.message}`;
    container.append(box);
  }
}

render();
```

- [ ] **Шаг 4: Научить `assets/quiz-page.js` понимать `&wrong=1`**

Добавить `wrongQuestionIds` в импорт из `./storage.js`:

```js
import { recordAnswer, wrongQuestionIds } from './storage.js';
```

Затем заменить тело функции `start()` целиком на:

```js
async function start() {
  const params = new URLSearchParams(location.search);
  currentSectionId = params.get('s') ?? '';
  if (currentSectionId === '') {
    showError('Не указан раздел. Открой викторину с главной страницы.');
    return;
  }

  try {
    const { section, questions } = await loadSection(currentSectionId);
    document.title = `${section.title} — Celpe-Bras`;
    allQuestions = questions;

    // При ?wrong=1 берём только вопросы с последним неверным ответом.
    // Если после фильтрации не осталось ни одного (список пуст, либо все его id
    // больше не существуют в разделе), честнее прогнать раздел целиком, чем
    // показать пустой экран.
    const wrongIds = params.get('wrong') === '1' ? wrongQuestionIds(currentSectionId) : [];
    const filtered = questions.filter((question) => wrongIds.includes(question.id));
    const selected = filtered.length > 0 ? filtered : questions;

    renderQuestion(createSession(prepareQuestions(selected)), section.title);
  } catch (error) {
    showError(error instanceof DataError ? error.message : `Неожиданная ошибка: ${error.message}`);
  }
}
```

`allQuestions` остаётся полным списком раздела, поэтому кнопка «Пройти раздел заново» на экране результата запускает весь раздел, а не только повтор ошибок.

- [ ] **Шаг 5: Проверить в браузере**

Открыть `http://localhost:3000/`.

Expected:
- карточка «Артикли» с описанием и строкой `8 вопросов`;
- клик по названию открывает викторину;
- после прохождения раздела с ошибками возврат на главную показывает `освоено N%` и кнопку «Сбросить»;
- «Сбросить» спрашивает подтверждение, после согласия процент исчезает, а кнопка пропадает;
- кнопка «Сбросить весь прогресс» внизу появляется только когда прогресс есть.

- [ ] **Шаг 6: Проверить повтор ошибок между заходами**

Пройти раздел «Артикли», ошибившись ровно на двух вопросах, вернуться на главную и **перезагрузить страницу**.

Expected:
- на карточке появилась кнопка «Повторить ошибки (2)»;
- она ведёт на `quiz.html?s=artigos&wrong=1` и запускает викторину из двух вопросов, счётчик `1 / 2`;
- после верных ответов на оба и перезагрузки главной кнопка «Повторить ошибки» исчезает, а процент освоения растёт.

- [ ] **Шаг 7: Проверить приватный режим**

Открыть `http://localhost:3000/` в приватном окне.
Expected: карточка показывает только число вопросов, кнопки «Повторить ошибки» нет, внизу — «Браузер не даёт сохранять данные, поэтому прогресс не запоминается», страница не падает.

- [ ] **Шаг 8: Коммит**

```bash
git add index.html assets/index-page.js assets/quiz-page.js assets/style.css && git commit -m "Add index page with progress, reset and mistake replay"
```

---

### Task 7: Клавиатура и видимый фокус

**Files:**
- Modify: `assets/quiz-page.js`
- Modify: `assets/style.css`

**Interfaces:**
- Consumes: `.option`, кнопка `#next` из Task 4 и Task 5.
- Produces: обработчик `keydown` на `document`; поведение: цифры `1`–`9` выбирают вариант, `Enter` и пробел нажимают кнопку перехода.

- [ ] **Шаг 1: Добавить стили фокуса в конец `assets/style.css`** (перед блоком `@media (prefers-reduced-motion: reduce)`)

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

- [ ] **Шаг 2: Добавить клавиатурный обработчик в конец `assets/quiz-page.js`** (после вызова `start();`)

```js
// Клавиатура на ноутбуке: цифра выбирает вариант, Enter или пробел листает дальше.
// Если фокус уже стоит на ссылке или кнопке (например, на ссылке «назад» в topbar,
// на самой #next или на варианте ответа), не перехватываем клавишу — пусть браузер
// обработает её нативно для того элемента, на котором реально стоит фокус.
document.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (event.key === 'Enter' || event.key === ' ') {
    const focusedControl = event.target.closest ? event.target.closest('a, button') : null;
    if (focusedControl && focusedControl.id !== 'next') return;

    const next = document.getElementById('next');
    if (next) {
      event.preventDefault();
      next.click();
    }
    return;
  }

  if (event.key >= '1' && event.key <= '9') {
    const option = app.querySelector(`.option[data-index="${Number(event.key) - 1}"]`);
    if (option && !option.disabled) {
      event.preventDefault();
      option.click();
    }
  }
});
```

- [ ] **Шаг 3: Проверить в браузере**

Открыть `http://localhost:3000/quiz.html?s=artigos`.

Expected:
- нажатие `2` выбирает второй вариант так же, как клик;
- повторное нажатие цифры после ответа ничего не меняет;
- `Enter` переходит к следующему вопросу;
- обход по `Tab` даёт видимую рамку на вариантах и кнопках;
- пробел не прокручивает страницу, пока на экране есть кнопка перехода.

- [ ] **Шаг 4: Коммит**

```bash
git add assets/quiz-page.js assets/style.css && git commit -m "Add keyboard control and focus styles"
```

---

### Task 8: Остальные четыре раздела

**Files:**
- Modify: `data/sections.json`
- Create: `data/tipos-de-texto.json`
- Create: `data/preposicoes.json`
- Create: `data/acentos.json`
- Create: `data/conectivos.json`

**Interfaces:**
- Consumes: формат данных из Task 1.
- Produces: пять разделов в реестре. Порядок в `sections.json` определяет порядок карточек на главной.

Префиксы `id`: `txt-`, `prep-`, `ac-`, `con-`. Нумерация с трёх цифр, сквозная внутри раздела.

- [ ] **Шаг 1: Создать `data/tipos-de-texto.json`**

```json
[
  {
    "id": "txt-001",
    "prompt": "Записка друзьям, с которыми снимаешь квартиру: просишь купить хлеб.\n\nКакой набор формул уместен?",
    "options": [
      "Oi, gente! Alguém pode trazer pão hoje? Valeu!",
      "Prezados senhores, venho por meio desta solicitar a aquisição de pão. Atenciosamente.",
      "É inadmissível que ainda não haja pão nesta casa. Exigimos providências imediatas.",
      "Ilustríssimo colega, cumpre-me informar que o pão se esgotou."
    ],
    "answer": 0,
    "explanation": "Записка близким людям — неформальный регистр: обращение «Oi, gente», прямая просьба, короткое прощание «Valeu». Остальные варианты взяты из официального письма, манифеста и делового документа.",
    "tags": ["bilhete"]
  },
  {
    "id": "txt-002",
    "prompt": "Письмо в редакцию газеты: не согласна со статьёй о транспорте.\n\nКак начать?",
    "options": [
      "Prezado Editor, li com atenção a reportagem publicada em 12 de maio e gostaria de apresentar outro ponto de vista.",
      "Oi! Vi sua matéria e discordo total, viu?",
      "Nós, moradores da zona leste, exigimos transporte digno!",
      "Querido amigo, faz tempo que não nos falamos."
    ],
    "answer": 0,
    "explanation": "Письмо в редакцию — формальное обращение к незнакомому адресату: «Prezado Editor», ссылка на конкретную публикацию с датой, сдержанное несогласие. Третий вариант — манифест, он звучит требованием, а не письмом.",
    "tags": ["carta do leitor"]
  },
  {
    "id": "txt-003",
    "prompt": "Какая концовка подходит формальному письму в организацию?",
    "options": [
      "Atenciosamente,\nMaria Silva",
      "Beijos, Maria",
      "Falou, até mais!",
      "Contamos com a adesão de todos!"
    ],
    "answer": 0,
    "explanation": "«Atenciosamente» — стандартное завершение формального письма, наравне с «Cordialmente». «Beijos» и «Falou» — для близких, а «Contamos com a adesão de todos» завершает призыв или манифест.",
    "tags": ["carta formal", "fecho"]
  },
  {
    "id": "txt-004",
    "prompt": "Манифест жильцов дома против сноса детской площадки.\n\nКакое начало соответствует жанру?",
    "options": [
      "Nós, moradores do Edifício Aurora, vimos a público manifestar nossa indignação com a demolição do parquinho.",
      "Prezado síndico, gostaria de saber se haverá demolição.",
      "Oi, pessoal, alguém sabe o que vai acontecer com o parquinho?",
      "Segue anexo o orçamento da demolição."
    ],
    "answer": 0,
    "explanation": "Манифест говорит от лица коллектива («Nós, moradores…»), обращён к публике, а не к одному адресату, и прямо называет чувство и требование. Остальные варианты — запрос, сообщение в чат и деловая переписка.",
    "tags": ["manifesto"]
  },
  {
    "id": "txt-005",
    "prompt": "Объявление на доске в подъезде о собрании жильцов.\n\nЧто выбрать?",
    "options": [
      "AVISO AOS MORADORES\nReunião no dia 15/06, às 19h, no salão de festas.\nParticipação de todos é importante.",
      "Amigos, sinto muito a falta de vocês e queria conversar sobre a nossa vida.",
      "Venho por meio desta solicitar autorização para realizar uma reunião.",
      "Não aceitaremos mais o descaso da administração!"
    ],
    "answer": 0,
    "explanation": "Объявление безлично и функционально: заголовок, дата, время, место, короткий призыв. Оно не обращается к конкретному человеку и не выражает эмоций.",
    "tags": ["aviso"]
  },
  {
    "id": "txt-006",
    "prompt": "Электронное письмо преподавателю с просьбой перенести экзамен.\n\nКакой тон правильный?",
    "options": [
      "Prezada professora, boa tarde. Gostaria de saber se seria possível remarcar a prova, pois estarei viajando a trabalho.",
      "Oi prof, não vou poder fazer a prova, remarca aí pra mim.",
      "Exigimos a remarcação imediata da avaliação!",
      "Prezada professora, venho por meio desta impetrar recurso administrativo."
    ],
    "answer": 0,
    "explanation": "С преподавателем принят вежливый полуформальный регистр: обращение, приветствие, просьба через «seria possível» и объяснение причины. Не панибратство, но и не канцелярит вроде «impetrar recurso».",
    "tags": ["e-mail"]
  },
  {
    "id": "txt-007",
    "prompt": "Что отличает жанр «carta do leitor» от обычного письма?",
    "options": [
      "Оно адресовано редакции, но написано в расчёте на читателей газеты",
      "Оно всегда пишется от руки",
      "В нём запрещено выражать личное мнение",
      "Оно не может ссылаться на опубликованные материалы"
    ],
    "answer": 0,
    "explanation": "Carta do leitor формально адресована редакции, а фактически обращена к публике: поэтому в ней есть ссылка на публикацию, аргументы и позиция автора. На экзамене это частый жанр, и оценивается именно двойная адресация.",
    "tags": ["carta do leitor"]
  }
]
```

- [ ] **Шаг 2: Создать `data/preposicoes.json`**

```json
[
  {
    "id": "prep-001",
    "prompt": "Moro ___ São Paulo, mas nasci ___ Rio.",
    "options": ["em … no", "no … em", "na … no", "em … em"],
    "answer": 0,
    "explanation": "Города без артикля берут «em» (em São Paulo), города с артиклем дают слияние: em + o Rio = no Rio.",
    "tags": ["em"]
  },
  {
    "id": "prep-002",
    "prompt": "Este presente é ___ minha mãe.",
    "options": ["para", "por", "pela", "pelo"],
    "answer": 0,
    "explanation": "«Para» указывает адресата и цель: подарок предназначен маме. «Por» отвечает за причину, обмен и способ.",
    "tags": ["para/por"]
  },
  {
    "id": "prep-003",
    "prompt": "Обменяла машину на велосипед: «Troquei o carro ___ uma bicicleta.»",
    "options": ["por", "para", "pela", "em"],
    "answer": 0,
    "explanation": "Обмен и замена — всегда «por»: trocar algo por algo, pagar dez reais por um livro.",
    "tags": ["para/por"]
  },
  {
    "id": "prep-004",
    "prompt": "Passei ___ ponte e cheguei ___ centro.",
    "options": ["pela … ao", "para … no", "pela … no", "por … ao"],
    "answer": 0,
    "explanation": "Движение сквозь или вдоль — «por»: por + a ponte = pela ponte. Прибытие — «chegar a»: a + o centro = ao centro. Обрати внимание, что в португальском «chegar em» распространено в разговорной речи Бразилии, но на письме безопаснее «chegar a».",
    "tags": ["por", "contração"]
  },
  {
    "id": "prep-005",
    "prompt": "Vou viajar ___ Portugal ___ agosto.",
    "options": ["para … em", "a … no", "para … no", "em … em"],
    "answer": 0,
    "explanation": "«Viajar para» указывает направление поездки: viajar para Portugal, а не «em Portugal» (это значило бы «путешествовать по Португалии»). Portugal идёт без артикля, поэтому слияния с предлогом не происходит. Второй предлог — всегда «em» с месяцами: em agosto, em janeiro, поэтому варианты с «no» после месяца отпадают.",
    "tags": ["para", "em"]
  },
  {
    "id": "prep-006",
    "prompt": "O livro está ___ mesa, ao lado ___ janela.",
    "options": ["na … da", "em … de", "na … de", "no … da"],
    "answer": 0,
    "explanation": "Слияния обязательны: em + a mesa = na mesa, de + a janela = da janela. Оставлять «em a» или «de a» нельзя.",
    "tags": ["contração"]
  },
  {
    "id": "prep-007",
    "prompt": "Estudo português ___ dois anos.",
    "options": ["há", "por", "para", "desde"],
    "answer": 0,
    "explanation": "Длительность до настоящего момента передаётся через «há»: há dois anos. «Desde» требует точки отсчёта: desde 2023.",
    "tags": ["tempo"]
  },
  {
    "id": "prep-008",
    "prompt": "Obrigada ___ ajuda!",
    "options": ["pela", "para", "por a", "pelo"],
    "answer": 0,
    "explanation": "Благодарность — «por»: por + a ajuda = pela ajuda. Форма «por a» не существует, слияние обязательно.",
    "tags": ["contração", "por"]
  }
]
```

- [ ] **Шаг 3: Создать `data/acentos.json`**

```json
[
  {
    "id": "ac-001",
    "prompt": "Как правильно пишется слово со значением «кофе»?",
    "options": ["café", "cafe", "cáfe", "cafê"],
    "answer": 0,
    "explanation": "Слова с ударением на последний слог, оканчивающиеся на -a, -e, -o (oxítonas), получают знак ударения: café, avô, sofá.",
    "tags": ["oxítona"]
  },
  {
    "id": "ac-002",
    "prompt": "Что означает тильда в слове «irmão»?",
    "options": [
      "Носовой гласный",
      "Ударение на этот слог",
      "Слияние двух слов",
      "Открытый гласный"
    ],
    "answer": 0,
    "explanation": "Тильда (til) обозначает носовое произношение: mão, irmão, coração, manhã. Знак ударения она обозначает только попутно, её основная задача — носовой звук.",
    "tags": ["til"]
  },
  {
    "id": "ac-003",
    "prompt": "Слово с ударением на предпоследний слог (paroxítona) — какой вариант написан верно?",
    "options": ["fácil", "facil", "facíl", "fâcil"],
    "answer": 0,
    "explanation": "Слова с ударением на предпоследний слог (paroxítonas), оканчивающиеся на -l, -r, -n, -x, -i, -us, требуют знака: fácil, açúcar, tórax, táxi.",
    "tags": ["paroxítona"]
  },
  {
    "id": "ac-004",
    "prompt": "Чем «avó» отличается от «avô»?",
    "options": [
      "avó — бабушка, avô — дедушка",
      "Это одно и то же слово в разных регионах",
      "avó — множественное число",
      "avô — уменьшительная форма"
    ],
    "answer": 0,
    "explanation": "Открытый знак (acento agudo) даёт открытый звук: avó — бабушка. Закрытый (circunflexo) — закрытый звук: avô — дедушка. Знак меняет смысл, а не только произношение.",
    "tags": ["agudo/circunflexo"]
  },
  {
    "id": "ac-005",
    "prompt": "Vou ___ praia amanhã.",
    "options": ["à", "a", "há", "ah"],
    "answer": 0,
    "explanation": "Crase — слияние предлога «a» с артиклем «a»: ir a + a praia = à praia. Знак ставится именно там, где сошлись предлог и артикль женского рода.",
    "tags": ["crase"]
  },
  {
    "id": "ac-006",
    "prompt": "Зачем нужна седиль в слове «começar»?",
    "options": [
      "Чтобы c перед a, o, u читалась как [s]",
      "Чтобы обозначить ударение",
      "Чтобы обозначить носовой звук",
      "Она факультативна и ни на что не влияет"
    ],
    "answer": 0,
    "explanation": "Ç читается как [s] перед a, o, u: começar, açúcar, moço. Перед e и i она не нужна, потому что c там и так читается как [s]: cedo, cidade.",
    "tags": ["cedilha"]
  },
  {
    "id": "ac-007",
    "prompt": "Какая пара написана верно?",
    "options": ["pôde (прошедшее) / pode (настоящее)", "pode / pôde — наоборот", "оба пишутся без знака", "оба пишутся со знаком"],
    "answer": 0,
    "explanation": "Знак различает время: ele pode — может сейчас, ele pôde — смог тогда. Такой различительный знак называется acento diferencial, и после реформы 2009 года их осталось совсем немного.",
    "tags": ["acento diferencial"]
  },
  {
    "id": "ac-008",
    "prompt": "Слово с ударением на третий слог от конца (proparoxítona) — какой вариант написан верно?",
    "options": ["próximo", "proximo", "proxímo", "prôximo"],
    "answer": 0,
    "explanation": "Слова с ударением на третий слог от конца (proparoxítonas) получают знак всегда, без исключений: próximo, médico, sábado, número.",
    "tags": ["proparoxítona"]
  }
]
```

`ac-003` и `ac-008` изначально делили один и тот же prompt «Какое слово
написано верно?» — на экране результата, где ошибки перечисляются по тексту
вопроса, они были неотличимы друг от друга. Prompt каждого теперь называет
свою категорию (paroxítona / proparoxítona), не выдавая сам ответ.
`tools/validate.mjs` с тех пор проверяет и это: дублирующийся prompt внутри
файла раздела — ошибка валидации, называющая оба id.

- [ ] **Шаг 4: Создать `data/conectivos.json`**

```json
[
  {
    "id": "con-001",
    "prompt": "Начинаешь аргументацию в письме. Какая связка открывает первый довод?",
    "options": ["Em primeiro lugar,", "Portanto,", "Em suma,", "No entanto,"],
    "answer": 0,
    "explanation": "«Em primeiro lugar» открывает перечисление доводов. «Portanto» вводит вывод, «Em suma» — итог, «No entanto» — возражение.",
    "tags": ["ordem"]
  },
  {
    "id": "con-002",
    "prompt": "Добавляешь ещё один довод в поддержку той же мысли.",
    "options": ["Além disso,", "Por outro lado,", "Ou seja,", "Apesar disso,"],
    "answer": 0,
    "explanation": "«Além disso» присоединяет однородный довод. Синонимы: «Ademais», «Ainda mais». «Por outro lado» вводит противопоставление.",
    "tags": ["adição"]
  },
  {
    "id": "con-003",
    "prompt": "Вводишь возражение, признавая правоту оппонента частично.",
    "options": ["No entanto,", "Portanto,", "Em primeiro lugar,", "Por exemplo,"],
    "answer": 0,
    "explanation": "«No entanto» — сдержанное «однако». Того же ряда: «Contudo», «Entretanto», «Todavia». В письменной части экзамена они звучат уместнее разговорного «mas».",
    "tags": ["oposição"]
  },
  {
    "id": "con-004",
    "prompt": "Вводишь следствие из сказанного.",
    "options": ["Portanto,", "Além disso,", "Por exemplo,", "Em primeiro lugar,"],
    "answer": 0,
    "explanation": "«Portanto» вводит вывод из аргумента. Рядом: «Assim», «Logo», «Por conseguinte», «Dessa forma».",
    "tags": ["conclusão"]
  },
  {
    "id": "con-005",
    "prompt": "Завершаешь текст, собирая сказанное воедино.",
    "options": ["Em suma,", "Em primeiro lugar,", "Por outro lado,", "Ou seja,"],
    "answer": 0,
    "explanation": "«Em suma» подводит итог всему тексту. Синонимы: «Em resumo», «Por fim», «Concluindo». Не путать с «Ou seja», которое переформулирует одну мысль, а не итожит текст.",
    "tags": ["conclusão"]
  },
  {
    "id": "con-006",
    "prompt": "Переформулируешь мысль понятнее, не добавляя нового.",
    "options": ["Ou seja,", "Além disso,", "Portanto,", "No entanto,"],
    "answer": 0,
    "explanation": "«Ou seja» и «isto é» вводят пояснение того же самого другими словами. Новый довод они не вводят — для этого есть «Além disso».",
    "tags": ["explicação"]
  },
  {
    "id": "con-007",
    "prompt": "Приводишь конкретный случай в подтверждение довода.",
    "options": ["Por exemplo,", "Em suma,", "Apesar disso,", "Em primeiro lugar,"],
    "answer": 0,
    "explanation": "«Por exemplo» вводит иллюстрацию. Рядом: «A título de exemplo», «Como no caso de».",
    "tags": ["exemplo"]
  }
]
```

- [ ] **Шаг 5: Дописать реестр `data/sections.json`**

Порядок раздела «Виды текстов» первым не случаен: это самая объёмная тема экзамена.

```json
[
  {
    "id": "tipos-de-texto",
    "title": "Виды текстов",
    "description": "Какие формулы к какому жанру относятся",
    "file": "tipos-de-texto.json"
  },
  {
    "id": "artigos",
    "title": "Артикли",
    "description": "Род, сложные случаи, страны и города",
    "file": "artigos.json"
  },
  {
    "id": "preposicoes",
    "title": "Предлоги",
    "description": "em, para, por и слитные формы",
    "file": "preposicoes.json"
  },
  {
    "id": "acentos",
    "title": "Акценты",
    "description": "Где ставятся палки, домики и загогулины",
    "file": "acentos.json"
  },
  {
    "id": "conectivos",
    "title": "Вводные конструкции",
    "description": "Связки для письменной части",
    "file": "conectivos.json"
  }
]
```

- [ ] **Шаг 6: Проверить данные**

Run: `node tools/validate.mjs`
Expected: `Данные в порядке: разделов 5.`

- [ ] **Шаг 7: Проверить в браузере**

Открыть `http://localhost:3000/`.

Expected: пять карточек в порядке из реестра; каждая открывается и проходится до экрана результата. Особое внимание разделу «Виды текстов»: длинные варианты ответа должны переноситься по строкам и не вылезать за пределы карточки ни на 375px, ни на широком экране.

- [ ] **Шаг 8: Коммит**

```bash
git add data && git commit -m "Add remaining four sections"
```

---

### Task 9: README и публикация

**Files:**
- Create: `README.md`
- Create: `materiais/README.md`

**Interfaces:**
- Consumes: всё предыдущее.
- Produces: инструкцию по локальному запуску и по публикации на GitHub Pages.

Создание репозитория на GitHub и включение Pages выполняет владелец проекта — эти шаги описаны, но не автоматизируются.

- [ ] **Шаг 1: Создать `materiais/README.md`**

```markdown
# Материалы

Сюда складываются примеры экзаменационных заданий, конспекты и шпаргалки.
Это хранилище, а не часть сайта: приложение сюда не заглядывает.

Когда из материала можно сделать вопросы, они переносятся в соответствующий
файл в `data/`.
```

- [ ] **Шаг 2: Создать `README.md`**

````markdown
# Celpe-Bras — тренажёр

Викторины для подготовки к экзамену Celpe-Bras: виды текстов, артикли,
предлоги, акценты, вводные конструкции.

Статический сайт без сборки и без зависимостей. Node нужен только для
проверок и (по желанию) локального сервера — после публикации на GitHub
Pages он не нужен вообще.

## Локальный запуск

Открывать `index.html` двойным кликом нельзя: браузер запрещает читать JSON
с `file://`. `<script type="module">` при этом вообще не запускается — у
документа `file://` непрозрачное происхождение, и CORS блокирует загрузку
модуля ещё до того, как он успеет что-то сделать. Поэтому сообщение об этом
показывает отдельный, обычный (не модульный) инлайн-скрипт — он стоит в `<body>` перед подключением модуля
каждой страницы — он выполняется даже с `file://`. Нужен локальный сервер —
подойдёт любой из двух вариантов ниже, они равнозначны.

```bash
npx serve
```

или, если нет доступа в сеть (`npx serve` при первом запуске скачивает
пакет, а `python` уже есть на этой машине):

```bash
python -m http.server 3000
```

Оба варианта отдают корень проекта, затем открыть http://localhost:3000

## Проверки

```bash
node tools/validate.mjs
```

```bash
node --test
```

Валидатор проверяет вопросы: уникальность `id`, наличие объяснения,
что `answer` не выходит за границы вариантов, что варианты не дублируются.
Запускать перед каждым коммитом, который трогает `data/`.

## Как добавить вопрос

Дописать объект в нужный файл `data/*.json`:

```json
{
  "id": "art-009",
  "prompt": "___ Japão fica na Ásia.",
  "options": ["O", "A", "Os", "—"],
  "answer": 0,
  "explanation": "Страны обычно с артиклем: o Japão, o Brasil, a França.",
  "tags": ["países"]
}
```

`answer` — индекс правильного варианта, считая с нуля. `explanation`
обязателен. `id` существующего вопроса менять нельзя: к нему привязана
статистика в браузере.

## Как добавить раздел

1. Положить файл вопросов в `data/`.
2. Дописать раздел в `data/sections.json`.
3. Запустить `node tools/validate.mjs`.

Ни HTML, ни JavaScript трогать не нужно.

## Публикация

Сборки нет, поэтому Pages отдаёт репозиторий как есть.

1. Создать пустой репозиторий на GitHub.
2. `git remote add origin <адрес>` и `git push -u origin main`.
3. В настройках репозитория: Settings → Pages → Source: Deploy from a branch,
   ветка `main`, папка `/ (root)`.

Дальше любой `git push` обновляет сайт.

## Прогресс

Хранится в `localStorage` браузера, между устройствами не синхронизируется.
Сбросить можно кнопками на главной странице.
````

- [ ] **Шаг 3: Проверить, что README не врёт**

Выполнить обе команды из раздела «Проверки».

Run: `node tools/validate.mjs`
Expected: `Данные в порядке: разделов 5.`

Run: `node --test`
Expected: `# fail 0`

- [ ] **Шаг 4: Коммит**

```bash
git add README.md materiais && git commit -m "Add README and materials folder"
```

- [ ] **Шаг 5: Финальная проверка перед публикацией**

Пройти каждый из пяти разделов до экрана результата на ширине 375px и на широком экране. Убедиться, что горизонтального скролла нет нигде, что кнопки сброса работают, и что после перезагрузки страницы прогресс на главной сохраняется.
