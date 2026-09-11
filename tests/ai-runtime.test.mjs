import { test } from "node:test";
import assert from "node:assert/strict";
import { AI_TIMEOUT_MS, thinkingConfig, withAiDeadline, generateWithFallback } from "../server/ai-runtime.mjs";

test("AI deadline leaves headroom under Netlify's 30 second execution limit", async () => {
  assert.ok(AI_TIMEOUT_MS <= 23000);
  let signal;
  await assert.rejects(withAiDeadline(value => {
    signal = value;
    return new Promise(() => {});
  }, 10), /AI_TIMEOUT/);
  assert.equal(signal.aborted, true);
});

test("deadline preserves provider successes and errors", async () => {
  assert.deepEqual(await withAiDeadline(async () => ({ text: "ok" })), { text: "ok" });
  const error = new Error("quota exceeded");
  await assert.rejects(withAiDeadline(async () => { throw error; }), value => value === error);
});

test("lower thinking latency is configured only for Gemini 3 models", () => {
  assert.deepEqual(thinkingConfig("gemini-3.5-flash"), { thinkingConfig: { thinkingLevel: "LOW" } });
  assert.deepEqual(thinkingConfig("gemini-2.5-flash"), {});
});

test("temporary provider errors switch models within the shared deadline", async () => {
  const models = [];
  const result = await generateWithFallback(async model => {
    models.push(model);
    if (model === "primary") throw Object.assign(new Error("unavailable"), {status:503});
    return "generated";
  }, "primary", "fallback");
  assert.equal(result, "generated");
  assert.deepEqual(models, ["primary", "fallback"]);
});

test("a stalled primary is aborted before using the fallback", async () => {
  let primarySignal;
  const result = await generateWithFallback((model, signal) => {
    if (model === "fallback") return Promise.resolve("ok");
    primarySignal = signal;
    return new Promise(() => {});
  }, "primary", "fallback", 80);
  assert.equal(result, "ok");
  assert.equal(primarySignal.aborted, true);
});

test("authentication and quota errors are not retried with a different model", async () => {
  for (const status of [401, 403, 429]) {
    let calls = 0;
    await assert.rejects(generateWithFallback(async () => {
      calls++;
      throw Object.assign(new Error("provider error"), { status });
    }, "primary", "fallback"));
    assert.equal(calls, 1);
  }
});
