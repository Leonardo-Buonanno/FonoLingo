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

export function reviewSchedule(history, now = Date.now()) {
  const latest = new Map();
  for (const session of [...history].reverse()) {
    if (!session.finished) continue;
    for (const answer of session.answers) {
      const key = `${session.topic}::${answer.question.concept}`;
      const previous = latest.get(key);
      const success = answer.score >= 0.8;
      const interval = success
        ? Math.min(30, previous?.interval ? previous.interval * 2 : 3)
        : 1;
      latest.set(key, {
        topic: session.topic,
        concept: answer.question.concept,
        interval,
        dueAt: session.finished + interval * 86400000,
        lastScore: answer.score,
      });
    }
  }
  return [...latest.values()]
    .sort((a, b) => a.dueAt - b.dueAt)
    .map((item) => ({
      ...item,
      due: item.dueAt <= now,
      daysUntil: Math.ceil((item.dueAt - now) / 86400000),
    }));
}
