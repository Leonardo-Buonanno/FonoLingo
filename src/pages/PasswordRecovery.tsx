import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GraduationCap, LoaderCircle } from "lucide-react";
import { Button } from "../components/ui";
import { api, useApp } from "../state/context";

export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const location = useLocation();
  const { setUser } = useApp();
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get("token") || "");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const validToken = /^[a-f0-9]{64}$/.test(token);
  return (
    <div className="narrow" style={{ padding: "48px 20px" }}>
      <form className="auth-form card" onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        setError("");
        if (reset && password !== confirmation) { setError("As senhas não coincidem."); return; }
        setBusy(true);
        try {
          if (reset) {
            await api("auth/reset-password", { token, password });
            setUser(null);
            setPassword("");
            setConfirmation("");
            window.history.replaceState(null, "", location.pathname);
            setMessage("Senha redefinida! Entre na sua conta com a nova senha. Seu progresso foi preservado.");
          } else {
            const result = await api("auth/forgot-password", { email: email.trim() });
            setMessage(result.message);
          }
        } catch (err) { setError((err as Error).message); }
        finally { setBusy(false); }
      }}>
        <span className="icon-box purple"><GraduationCap /></span>
        <h1>{reset ? "Crie sua nova senha" : "Esqueceu sua senha?"}</h1>
        <p>{reset ? "Use de 8 a 128 caracteres para proteger sua conta." : "Informe o e-mail da sua conta. Enviaremos um link válido por 30 minutos."}</p>
        {message ? <p role="status">{message}</p> : reset && !validToken ? (
          <p className="error-message" role="alert">O link é inválido ou está incompleto. Solicite um novo link.</p>
        ) : <>
          {reset ? <>
            <label>Nova senha<input className="text-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={busy} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <label>Confirme a nova senha<input className="text-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={busy} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label>
          </> : <label>E-mail da conta<input className="text-input" type="email" autoComplete="email" maxLength={254} required disabled={busy} value={email} onChange={(e) => setEmail(e.target.value)} /></label>}
          {error && <p className="error-message" role="alert">{error}</p>}
          <Button type="submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} /> Aguarde…</> : reset ? "Salvar nova senha" : "Enviar link de recuperação"}</Button>
        </>}
        {reset && !message && <Link className="text-link" to="/esqueci-minha-senha">Solicitar novo link</Link>}
        {!reset && message && <button type="button" className="text-link" onClick={() => { setMessage(""); setError(""); }}>Tentar novamente ou corrigir e-mail</button>}
        <Link className="text-link" to="/login">Voltar para o login</Link>
      </form>
    </div>
  );
}
