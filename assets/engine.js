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
