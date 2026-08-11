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
