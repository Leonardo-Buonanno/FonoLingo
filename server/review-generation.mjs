import { normalize } from "../shared/scoring.mjs";

const promptKey = value => normalize(value).replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export const equivalentReviewInstruction = "Para revisão, conserve EXATAMENTE os nomes de reviewConcepts no campo concept. Crie situações, exemplos e enunciados novos que avaliem a mesma habilidade; não faça apenas troca de palavras ou de alternativas das perguntas em exclude. Cubra todos os conceitos solicitados quando a quantidade permitir. Não mude o tema da revisão.";

export function validateEquivalentReview(result, config) {
  if (!config.reviewConcepts.length) return;
  const concepts = new Map(config.reviewConcepts.map(value => [normalize(value), value]));
  const seen = new Set(config.exclude.map(promptKey));
  const covered = new Set();
  for (const question of result.questions) {
    const concept = concepts.get(normalize(question.concept));
    if (!concept) throw new Error("Sessão incompleta: conceito fora da revisão solicitada.");
    const key = promptKey(question.prompt);
    if (seen.has(key)) throw new Error("Sessão incompleta: a revisão repetiu uma pergunta anterior.");
    seen.add(key);
    covered.add(concept);
    question.concept = concept;
  }
  if (config.count >= concepts.size && covered.size !== concepts.size)
    throw new Error("Sessão incompleta: faltam conceitos solicitados na revisão.");
  result.topic = config.topic;
}
