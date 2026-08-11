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
