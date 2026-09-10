import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { newRecovery, sendRecovery } from "../server/password-recovery.mjs";

test("recovery email contains a temporary fragment link and handles provider errors", async () => {
  const original = globalThis.fetch;
  const previous = { ...process.env };
  try {
    process.env.APP_ORIGIN = "https://fonolingo.netlify.app";
    process.env.RESEND_API_KEY = "test-only";
    process.env.RECOVERY_EMAIL_FROM = "FonoLingo <test@example.com>";
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://api.resend.com/emails");
      const body = JSON.parse(options.body);
      assert.deepEqual(body.to, ["student@example.com"]);
      assert.match(body.text, /https:\/\/fonolingo.netlify.app\/redefinir-senha#token=/);
      assert.match(body.text, /30 minutos/);
      return { ok: true };
    };
    await sendRecovery("student@example.com", newRecovery().token);
    globalThis.fetch = async () => ({ ok: false });
    await assert.rejects(sendRecovery("student@example.com", newRecovery().token));
  } finally { globalThis.fetch = original; process.env = previous; }
});

test("SQLite reset preserves progress, revokes sessions, rejects expired and reused links", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "fonolingo-recovery-"));
  const database = path.join(directory, "test.sqlite");
  const port = 19387;
  const child = spawn(process.execPath, ["server/index.mjs"], {
    env: { ...process.env, PORT: String(port), DB_PATH: database, GEMINI_API_KEY: "", RESEND_API_KEY: "", COOKIE_SECURE: "false" },
    stdio: "ignore",
  });
  let db;
  const request = async (route, body, cookie) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/${route}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
  };
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { await request("status"); ready = true; break; } catch { await new Promise((r) => setTimeout(r, 100)); }
    }
    assert.ok(ready, "test server started");
    const account = { email: "student@example.com", name: "Estudante", password: "old-password-123" };
    const registered = await request("auth/register", account);
    assert.equal(registered.status, 200);
    db = new DatabaseSync(database);
    const state = JSON.stringify({ profile: { name: "Estudante" }, history: [{ id: "preserved" }] });
    db.prepare("UPDATE users SET state=?").run(state);
    const install = (reset) => db.prepare("INSERT OR REPLACE INTO password_resets VALUES (?,?,?,?)").run(registered.body.id, reset.hash, reset.expires, Date.now());
    const expired = newRecovery();
    install({ ...expired, expires: Date.now() - 1 });
    assert.equal((await request("auth/reset-password", { token: expired.token, password: "new-password-123" })).status, 400);
    const reset = newRecovery();
    install(reset);
    assert.equal((await request("auth/reset-password", { token: reset.token, password: "short" })).status, 400);
    assert.equal((await request("auth/reset-password", { token: "0".repeat(64), password: "new-password-123" })).status, 400);
    const changes = await Promise.all([1, 2].map(() => request("auth/reset-password", { token: reset.token, password: "new-password-123" })));
    assert.deepEqual(changes.map((r) => r.status).sort(), [200, 400]);
    assert.equal((await request("me", undefined, registered.cookie)).body, null);
    assert.equal((await request("auth/login", account)).status, 401);
    const login = await request("auth/login", { ...account, password: "new-password-123" });
    assert.equal(login.status, 200);
    assert.deepEqual(login.body.state, JSON.parse(state));
    const second = await request("auth/register", { ...account, email: "second@example.com" });
    assert.equal(second.status, 200);
    assert.notEqual(second.body.id, registered.body.id);
    assert.equal((await request("me", undefined, second.cookie)).body.state, null);
    assert.deepEqual((await request("me", undefined, login.cookie)).body.state, JSON.parse(state));
    assert.equal((await request("auth/register", account)).status, 409);
    const missing = await request("auth/forgot-password", { email: account.email });
    assert.equal(missing.status, 503);
    assert.equal((await request("auth/forgot-password", { email: "invalid" })).status, 400);
  } finally {
    db?.close();
    const stopped = new Promise((resolve) => child.once("exit", resolve));
    child.kill();
    await stopped;
    rmSync(directory, { recursive: true, force: true });
  }
});
