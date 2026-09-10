import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export const recoveryEmail = z.object({ email: z.email().max(254) });
export const recoveryPassword = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  password: z.string().min(8).max(128),
});
export const recoveryMessage = "Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Confira também a pasta de spam.";
export const invalidRecovery = "O link é inválido ou expirou. Solicite um novo link de recuperação.";
export const recoveryHash = (token) => createHash("sha256").update(token).digest("hex");
export function newRecovery() {
  const token = randomBytes(32).toString("hex");
  return { token, hash: recoveryHash(token), expires: Date.now() + 30 * 60 * 1000 };
}
export function recoveryOrigin() {
  const url = new URL(process.env.APP_ORIGIN || process.env.URL || "http://localhost:5188");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
    throw new Error("APP_ORIGIN precisa usar HTTPS.");
  return url.origin;
}
export function recoveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RECOVERY_EMAIL_FROM);
}
export async function sendRecovery(email, token) {
  const link = `${recoveryOrigin()}/redefinir-senha#token=${token}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RECOVERY_EMAIL_FROM,
      to: [email],
      subject: "Redefina sua senha do FonoLingo",
      text: `Para criar uma nova senha do FonoLingo, abra o link abaixo. Ele vale por 30 minutos e só pode ser usado uma vez.\n\n${link}\n\nSe você não solicitou esta alteração, ignore este e-mail. Sua senha permanece a mesma.`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Falha no envio de recuperação.");
}
