export function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[.!?]+$/g, "");
}
export function objectiveScore(response, expected) {
  return normalize(response) === normalize(expected) ? 1 : 0;
}
export function sessionXp(answers) {
  return answers.reduce(
    (sum, answer) => sum + 5 + Math.round(answer.score * 15),
    0,
  );
}
export function accuracy(answers) {
  return answers.length
    ? Math.round(
        (100 * answers.reduce((sum, answer) => sum + answer.score, 0)) /
          answers.length,
      )
    : 0;
}
export function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function streak(history, now = Date.now()) {
  const dates = new Set(
    history.filter((s) => s.finished).map((s) => dayKey(s.finished)),
  );
  const date = new Date(now);
  if (!dates.has(dayKey(date))) date.setDate(date.getDate() - 1);
  let count = 0;
  while (dates.has(dayKey(date))) {
    count++;
    date.setDate(date.getDate() - 1);
  }
  return count;
}
export function weaknesses(history) {
  const concepts = new Map();
  for (const s of history)
    for (const a of s.answers) {
      const key = s.topic + "::" + a.question.concept;
      const prev = concepts.get(key) || {
        topic: s.topic,
        concept: a.question.concept,
        score: 0,
        count: 0,
      };
      prev.score += a.score;
      prev.count++;
      concepts.set(key, prev);
    }
  return [...concepts.values()]
    .map((c) => ({ ...c, accuracy: Math.round((c.score / c.count) * 100) }))
    .filter((c) => c.accuracy < 80)
    .sort((a, b) => a.accuracy - b.accuracy);
}

const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const DAY_MS = 86400000;
const conceptKey = (topic, concept) => JSON.stringify([normalize(topic), normalize(concept)]);

export function reviewSchedule(history, now = Date.now()) {
  const concepts = new Map();
  const seenSessions = new Set();
  const sessions = [...history].filter(s => s.finished).sort((a, b) => a.finished - b.finished);
  for (const session of sessions) {
    if (seenSessions.has(session.id)) continue;
    seenSessions.add(session.id);
    // One attempt per concept per session: a correct answer cannot hide an error.
    const attempts = new Map();
    for (const answer of session.answers) {
      const key = conceptKey(session.topic, answer.question.concept);
      const previous = attempts.get(key);
      attempts.set(key, {
        concept: answer.question.concept,
        score: Math.min(previous?.score ?? 1, answer.score),
      });
    }
    for (const [key, attempt] of attempts) {
      const previous = concepts.get(key);
      if (!previous && attempt.score === 1) continue;
      const failed = attempt.score < 1;
      const advance = previous && session.finished >= previous.dueAt;
      const step = failed ? 0 : advance ? Math.min(previous.step + 1, REVIEW_INTERVALS.length - 1) : previous.step;
      const interval = REVIEW_INTERVALS[step];
      concepts.set(key, {
        topic: session.topic,
        concept: attempt.concept,
        step,
        interval,
        dueAt: failed || advance ? session.finished + interval * DAY_MS : previous.dueAt,
        lastScore: attempt.score,
        lapses: (previous?.lapses || 0) + Number(failed),
        attempts: (previous?.attempts || 0) + 1,
        recovered: step >= 2,
        recurring: (previous?.lapses || 0) + Number(failed) >= 2 && step < 2,
      });
    }
  }
  return [...concepts.values()]
    .sort((a, b) => a.dueAt - b.dueAt || a.lastScore - b.lastScore)
    .map(item => ({ ...item, due: item.dueAt <= now, daysUntil: Math.ceil((item.dueAt - now) / DAY_MS) }));
}

export function reviewQuestions(history, topic, concept, limit = 5) {
  const key = conceptKey(topic, concept);
  const questions = new Map();
  for (const session of [...history].filter(s => s.finished).sort((a, b) => b.finished - a.finished)) {
    for (const answer of session.answers) {
      if (conceptKey(session.topic, answer.question.concept) !== key) continue;
      const prompt = normalize(answer.question.prompt);
      if (!questions.has(prompt)) questions.set(prompt, answer);
    }
  }
  return [...questions.values()]
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(answer => structuredClone(answer.question));
}
