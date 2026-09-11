export const AI_TIMEOUT_MS = 23000;
export const aiTimeoutMessage = "A IA demorou além do prazo. Tente novamente em instantes ou escolha menos questões.";

export function thinkingConfig(model) {
  return /^gemini-3[.-]/.test(model) ? { thinkingConfig: { thinkingLevel: "LOW" } } : {};
}

export async function withAiDeadline(run, timeout = AI_TIMEOUT_MS) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      run(controller.signal),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error("AI_TIMEOUT");
          reject(error);
          controller.abort(error);
        }, timeout);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function generateWithFallback(run, model, fallback = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite", budget = AI_TIMEOUT_MS) {
  const started = Date.now();
  try {
    return await withAiDeadline(signal => run(model, signal), model === fallback ? budget : Math.floor(budget / 2));
  } catch (error) {
    const status = Number(error?.status || error?.code);
    if ([401, 403, 429].includes(status)) throw error;
    const temporary = [500, 502, 503, 504].includes(status) || /AI_TIMEOUT|timeout|timed out|abort|high demand|unavailable|overload/i.test(String(error?.message || ""));
    if (!temporary || model === fallback) throw error;
    const remaining = budget - (Date.now() - started);
    if (remaining <= 0) throw new Error("AI_TIMEOUT");
    return withAiDeadline(signal => run(fallback, signal), remaining);
  }
}
