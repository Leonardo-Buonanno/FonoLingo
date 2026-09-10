import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewSchedule, reviewQuestions } from "../shared/scoring.mjs";

const day = 86400000;
const start = Date.UTC(2026, 8, 1, 12);
const question = (concept = "Deglutição", prompt = "Qual estrutura participa?") => ({ id: prompt, concept, prompt, answer: "Língua", options: ["Língua", "Cóclea"] });
const session = (offset, scores, topic = "Disfagia") => ({
  id: String(offset), topic, finished: start + offset * day,
  answers: scores.map(score => ({ score, question: question() })),
});

test("only errors and partial answers schedule reviews; unfinished sessions are ignored", () => {
  assert.deepEqual(reviewSchedule([session(0, [1])]), []);
  assert.deepEqual(reviewSchedule([{ ...session(0, [0]), finished: undefined }]), []);
  for (const score of [0, 0.5]) {
    const [review] = reviewSchedule([session(0, [score])], start);
    assert.equal(review.interval, 1);
    assert.equal(review.dueAt, start + day);
    assert.equal(review.due, false);
    assert.equal(reviewSchedule([session(0, [score])], start + day)[0].due, true);
  }
});

test("chronological attempts advance once per session through 1, 3, 7, 14 and 30 days", () => {
  const history = [session(0, [0])];
  let offset = 0;
  for (const interval of [3, 7, 14, 30, 30]) {
    offset += reviewSchedule(history)[0].interval;
    history.unshift(session(offset, [1, 1, 1]));
    assert.equal(reviewSchedule(history)[0].interval, interval);
  }
  assert.deepEqual(reviewSchedule(history, start), reviewSchedule([...history].reverse(), start));
  assert.deepEqual(reviewSchedule([...history, history[0]], start), reviewSchedule(history, start));
});

test("early practice cannot extend a review; an error in a mixed session resets it", () => {
  const history = [session(0, [0]), session(1, [1])];
  assert.equal(reviewSchedule(history)[0].interval, 3);
  history.push(session(2, [1]));
  assert.equal(reviewSchedule(history)[0].dueAt, start + 4 * day);
  history.push(session(3, [0.5, 1, 1]));
  const [review] = reviewSchedule(history);
  assert.equal(review.interval, 1);
  assert.equal(review.lastScore, 0.5);
  assert.equal(review.dueAt, start + 4 * day);
});

test("concept spelling variants stay together and topics remain separate", () => {
  const failed = session(0, [0]);
  const passed = session(1, [1], " DISFAGIA ");
  passed.answers[0].question.concept = "degluticao";
  const reviews = reviewSchedule([failed, passed, { ...session(2, [0], "Voz"), id: "other" }]);
  assert.equal(reviews.length, 2);
  assert.equal(reviews.find(r => r.topic.trim() === "DISFAGIA").interval, 3);
});

test("practice selects original questions from this concept and prioritizes latest errors", () => {
  const first = session(0, [0]);
  first.answers.push({ score: 1, question: question("Audição", "Qual som?") });
  const second = session(1, [1]);
  second.answers.push({ score: 0, question: question("Deglutição", "Qual fase?") });
  const history = [first, second, session(2, [0], "Outro tema")];
  const snapshot = structuredClone(history);
  const selected = reviewQuestions(history, "Disfagia", "degluticao");
  assert.equal(selected.length, 2);
  assert.equal(selected[0].prompt, "Qual fase?");
  assert.equal(reviewQuestions(history, "Disfagia", "degluticao", 1).length, 1);
  selected[0].options.push("Alteração");
  assert.deepEqual(history, snapshot);
  assert.deepEqual(reviewQuestions(history, "Voz", "Sem histórico"), []);
});

test("recovery requires two spaced successes; recurring errors are counted by session", () => {
  const history = [session(0, [0, 0]), session(1, [0.5]), session(2, [1])];
  let review = reviewSchedule(history)[0];
  assert.equal(review.lapses, 2);
  assert.equal(review.recurring, true);
  assert.equal(review.recovered, false);
  history.push(session(3, [1]));
  assert.equal(reviewSchedule(history)[0].recovered, false);
  history.push(session(5, [1]));
  review = reviewSchedule(history)[0];
  assert.equal(review.recovered, true);
  assert.equal(review.recurring, false);
  history.push(session(6, [0]));
  assert.equal(reviewSchedule(history)[0].recovered, false);
  assert.equal(reviewSchedule(history)[0].recurring, true);
});
