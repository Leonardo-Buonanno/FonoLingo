import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, scryptSync } from "node:crypto";
import { registerHooks } from "node:module";

test("Netlify recovery sends once, hides unknown accounts and atomically consumes links", async () => {
  const records = new Map();
  let version = 0;
  globalThis.__recoveryTestStore = {
    async get(key) { return structuredClone(records.get(key)?.data || null); },
    async getWithMetadata(key) { return structuredClone(records.get(key) || null); },
    async setJSON(key, data, options = {}) {
      const current = records.get(key);
      if ((options.onlyIfNew && current) || (options.onlyIfMatch && current?.etag !== options.onlyIfMatch)) return { modified: false };
      records.set(key, { data: structuredClone(data), etag: String(++version) });
      return { modified: true };
    },
  };
  const hooks = registerHooks({
    resolve(specifier, context, next) {
      if (specifier === "@google/genai") return { url: "data:text/javascript,export class GoogleGenAI { models = { generateContent: async () => { if (globalThis.__reviewTestError) throw globalThis.__reviewTestError; return { text: JSON.stringify(globalThis.__reviewTestGeneration) }; } }; }", shortCircuit: true };
      if (specifier === "@netlify/blobs") return { url: "data:text/javascript,export const getStore = () => globalThis.__recoveryTestStore;", shortCircuit: true };
      return next(specifier, context);
    },
  });
  const originalFetch = globalThis.fetch;
  const previousEnv = { ...process.env };
  try {
    const { default: handler } = await import("../netlify/functions/api.mjs");
    const call = async (route, data, cookie, method) => {
      const response = await handler(new Request(`https://fonolingo.netlify.app/api/${route}`, {
        method: method || (data === undefined ? "GET" : "POST"),
        headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      }));
      return { status: response.status, body: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
    };
    process.env.OWNER_EMAIL = "";
    process.env.APP_ORIGIN = "https://fonolingo.netlify.app";
    process.env.RESEND_API_KEY = "test-only";
    process.env.RECOVERY_EMAIL_FROM = "test@example.com";
    let sent = 0;
    let token;
    globalThis.fetch = async (_url, options) => {
      sent++;
      token = JSON.parse(options.body).text.match(/#token=([a-f0-9]{64})/)[1];
      return { ok: true };
    };
    const account = { name: "Estudante", email: "student@example.com", password: "old-password-123" };
    const legacyToken = "legacy-session";
    const legacyState = { profile: { name: "Leonardo", semester: "1", goal: 10 }, history: [], active: null };
    await globalThis.__recoveryTestStore.setJSON("primary-user", {
      id: "primary", name: "Leonardo", email: "legacy@example.com", salt: "legacy-salt",
      password: scryptSync("legacy-password", "legacy-salt", 64).toString("hex"),
      state: legacyState,
      sessions: [{ hash: createHash("sha256").update(legacyToken).digest("hex"), expires: Date.now() + 600000 }],
    });
    const legacyCookie = "fl_session=" + legacyToken;
    assert.deepEqual((await call("me", undefined, legacyCookie)).body.state, legacyState);
    const registered = await call("auth/register", account);
    assert.equal(registered.status, 200);
    assert.notEqual(registered.body.id, "primary");
    assert.equal((await call("auth/register", { ...account, email: account.email.toUpperCase() })).status, 409);
    assert.equal((await call("auth/register", { ...account, email: "legacy@example.com" })).status, 409);
    assert.equal((await call("auth/login", { ...account, email: "legacy@example.com" })).status, 401);
    const second = await call("auth/register", { ...account, email: "second@example.com" });
    assert.equal(second.status, 200);
    const ownState = { ...legacyState, profile: { ...legacyState.profile, name: "Second" } };
    assert.equal((await call("state", ownState, second.cookie, "PUT")).status, 200);
    assert.deepEqual((await call("me", undefined, second.cookie)).body.state, ownState);
    assert.equal((await call("me", undefined, registered.cookie)).body.state, null);
    assert.deepEqual((await call("me", undefined, legacyCookie)).body.state, legacyState);
    const changed = await call("password", { currentPassword: account.password, newPassword: "second-new-password" }, second.cookie, "PUT");
    assert.equal(changed.status, 200);
    assert.equal((await call("me", undefined, second.cookie)).body, null);
    assert.equal((await call("me", undefined, changed.cookie)).body.email, "second@example.com");
    assert.equal((await call("logout", {}, changed.cookie)).status, 200);
    assert.equal((await call("me", undefined, changed.cookie)).body, null);
    assert.equal((await call("me", undefined, registered.cookie)).body.email, account.email);
    const duplicateRace = await Promise.all([1, 2].map(() => call("auth/register", { ...account, email: "race@example.com" })));
    assert.deepEqual(duplicateRace.map(r => r.status).sort(), [200, 409]);
    records.get("users/" + createHash("sha256").update(account.email).digest("hex")).data.state = { history: [{ id: "preserved" }] };
    const known = await call("auth/forgot-password", { email: account.email });
    const unknown = await call("auth/forgot-password", { email: "unknown@example.com" });
    assert.deepEqual(known.body, unknown.body);
    await call("auth/forgot-password", { email: account.email });
    assert.equal(sent, 1);
    assert.notEqual(records.get("users/" + createHash("sha256").update(account.email).digest("hex")).data.recovery.hash, token);
    const responses = await Promise.all([1, 2].map(() => call("auth/reset-password", { token, password: "new-password-123" })));
    assert.deepEqual(responses.map((r) => r.status).sort(), [200, 400]);
    assert.equal((await call("me", undefined, registered.cookie)).body, null);
    assert.deepEqual((await call("me", undefined, legacyCookie)).body.state, legacyState);
    assert.equal((await call("auth/login", account)).status, 401);
    const login = await call("auth/login", { ...account, password: "new-password-123" });
    assert.equal(login.status, 200);
    assert.deepEqual(login.body.state, { history: [{ id: "preserved" }] });
    await call("auth/forgot-password", { email: account.email });
    records.get("users/" + createHash("sha256").update(account.email).digest("hex")).data.recovery.expires = Date.now() - 1;
    assert.equal((await call("auth/reset-password", { token, password: "another-password" })).status, 400);
    const oldResetToken = "a".repeat(64);
    records.get("primary-user").data.recovery = { hash: createHash("sha256").update(oldResetToken).digest("hex"), expires: Date.now() + 600000 };
    assert.equal((await call("auth/reset-password", { token: oldResetToken, password: "legacy-new-password" })).status, 200);
    const legacyLogin = await call("auth/login", { email: "legacy@example.com", password: "legacy-new-password" });
    assert.equal(legacyLogin.status, 200);
    assert.deepEqual(legacyLogin.body.state, legacyState);
    assert.equal((await call("me", undefined, legacyCookie)).body, null);
    assert.equal((await call("me", undefined, login.cookie)).body.email, account.email);
    process.env.GEMINI_API_KEY = "test-only";
    globalThis.__reviewTestGeneration = { topic: "Renamed topic", summary: "Resumo da revisão.", questions: [{
      id: "generated", type: "choice", prompt: "Como a língua conduz o bolo na fase oral?",
      options: ["Elevação", "Audição"], answer: "Elevação", explanation: "A língua participa do transporte oral.",
      tip: "Pense na fase oral.", concept: "degluticao", source: "", rubric: [],
    }] };
    const config = { topic: "Disfagia", mode: "Revisar", difficulty: "Médio", count: 1, reviewConcepts: ["Deglutição"], exclude: ["Qual a função da língua?"] };
    const generated = await call("generate", config, login.cookie);
    assert.equal(generated.status, 200);
    assert.equal(generated.body.topic, "Disfagia");
    assert.equal(generated.body.questions[0].concept, "Deglutição");
    globalThis.__reviewTestGeneration.questions[0].prompt = config.exclude[0];
    assert.equal((await call("generate", config, login.cookie)).status, 502);
    globalThis.__reviewTestGeneration.questions[0].prompt = "Como perceber um som?";
    globalThis.__reviewTestGeneration.questions[0].concept = "Audição";
    assert.equal((await call("generate", config, login.cookie)).status, 502);
    globalThis.__reviewTestError = new Error("AI_TIMEOUT");
    const timedOut = await call("generate", config, login.cookie);
    assert.equal(timedOut.status, 504);
    assert.match(timedOut.body.error, /demorou além do prazo/);
  } finally {
    globalThis.fetch = originalFetch;
    process.env = previousEnv;
    hooks.deregister();
    delete globalThis.__recoveryTestStore;
    delete globalThis.__reviewTestGeneration;
    delete globalThis.__reviewTestError;
  }
});
