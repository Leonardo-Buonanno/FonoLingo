import { test } from "node:test";
import assert from "node:assert/strict";
import { validateEquivalentReview } from "../server/review-generation.mjs";

const config = { topic: "Disfagia", reviewConcepts: ["Deglutição"], exclude: ["Qual a função da língua?"], count: 1 };
const result = (prompt = "Como a língua conduz o bolo na fase oral?", concept = "degluticao") => ({ topic: "Tema alterado", questions: [{ prompt, concept }] });

test("equivalent questions retain the original topic and canonical concept", () => {
  const generated = result();
  validateEquivalentReview(generated, config);
  assert.equal(generated.topic, config.topic);
  assert.equal(generated.questions[0].concept, "Deglutição");
});

test("rejects repeated prompts, spelling variants, unrelated concepts and uncovered concepts", () => {
  assert.throws(() => validateEquivalentReview(result("QUAL A FUNÇÃO DA LÍNGUA!"), config), /repetiu/);
  assert.throws(() => validateEquivalentReview(result(undefined, "Audição"), config), /conceito fora/);
  const duplicate = result();
  duplicate.questions.push({ ...duplicate.questions[0] });
  assert.throws(() => validateEquivalentReview(duplicate, config), /repetiu/);
  assert.throws(() => validateEquivalentReview(result(), { ...config, count: 2, reviewConcepts: ["Deglutição", "Fase oral"] }), /faltam conceitos/);
});

test("ordinary generation is unchanged", () => {
  const generated = result();
  const previous = structuredClone(generated);
  validateEquivalentReview(generated, { ...config, reviewConcepts: [] });
  assert.deepEqual(generated, previous);
});
