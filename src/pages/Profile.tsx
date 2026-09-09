import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowRight,
  Bell,
  Check,
  GraduationCap,
  LoaderCircle,
  LogOut,
  Sparkles,
  Upload,
} from "lucide-react";

import { useApp } from "../state/context";
import { Button, PageHeading, BrainArt } from "../components/ui";
import { api } from "../state/context";

export function Profile() {
  const { state, setState, user, setUser, toast, ai } = useApp();
  const [name, setName] = useState(state.profile.name);
  const [semester, setSemester] = useState(state.profile.semester);
  const [goal, setGoal] = useState(state.profile.goal);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notifications, setNotifications] = useState(
    () =>
      typeof Notification !== "undefined" &&
      Notification.permission === "granted",
  );
  useEffect(() => {
    setName(state.profile.name);
    setSemester(state.profile.semester);
    setGoal(state.profile.goal);
  }, [state.profile]);
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fonolingo-meu-progresso.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importData(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast("O arquivo excede o limite de 5 MB.");
      return;
    }
    try {
      const imported = JSON.parse(await file.text());
      if (
        !imported ||
        !imported.profile ||
        typeof imported.profile.name !== "string" ||
        !Array.isArray(imported.history) ||
        !("active" in imported)
      )
        throw new Error("invalid");
      await api("state", imported, "PUT");
      setState(imported);
      toast("Backup importado e sincronizado.");
    } catch {
      toast("Este arquivo não contém um backup válido do FonoLingo.");
    }
  }
  return (
    <div className="narrow">
      <PageHeading
        eyebrow="DO SEU JEITO, NO SEU RITMO"
        title="Seu perfil"
        description="Ajuste sua experiência para o momento da sua jornada."
      />
      <form
        className="card profile-form"
        onSubmit={(e) => {
          e.preventDefault();
          setState((s) => ({
            ...s,
            profile: { name: name.trim(), semester, goal },
          }));
          toast("Perfil atualizado. Seu próximo passo já pode começar.");
        }}
      >
        <span className="avatar profile-avatar">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <label>
          Como podemos chamar você?
          <input
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={60}
          />
        </label>
        <label>
          Seu momento no curso
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i}>{i + 1}º semestre</option>
            ))}
            <option>Já sou profissional</option>
          </select>
        </label>
        <label>
          Meta diária de atividades
          <input
            className="text-input"
            type="number"
            value={goal}
            min={1}
            max={30}
            required
            onChange={(e) => setGoal(Number(e.target.value))}
          />
        </label>
        <Button type="submit">
          Salvar meu perfil
          <Check size={17} />
        </Button>
      </form>
      <div className="card settings-card">
        <h2>Seu aprendizado, com você</h2>
        <p>
          Você está conectado como {user.email}. Seu progresso é sincronizado com o servidor.
        </p>
        <div className="profile-actions">
          <Button
            secondary
            onClick={async () => {
              if (!("Notification" in window)) {
                toast("Este navegador não oferece notificações.");
                return;
              }
              const permission = await Notification.requestPermission();
              setNotifications(permission === "granted");
              if (permission === "granted") {
                new Notification("FonoLingo", {
                  body: "Lembretes ativados. Avisaremos quando houver conceitos para revisar.",
                  icon: "/favicon.svg",
                });
                toast("Lembretes de revisão ativados.");
              } else toast("Permissão de notificações não concedida.");
            }}
          >
            <Bell size={17} />
            {notifications ? "Lembretes ativados" : "Ativar lembretes"}
          </Button>
          <Button secondary onClick={exportData}>
            <ArrowDownToLine size={17} />
            Exportar progresso
          </Button>
          <label className="btn secondary file-button">
            <Upload size={17} />
            Importar backup
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                void importData(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          <Button
            secondary
            onClick={async () => {
              try {
                await api("state", state, "PUT");
                await api("logout", {});
                setUser(null);
                toast("Você saiu da conta.");
              } catch {
                toast("Não foi possível sair. Tente novamente.");
              }
            }}
          >
            <LogOut size={17} />
            Sair da conta
          </Button>
        </div>
        <div className="info-line">
          <Sparkles size={18} />
          {ai
            ? "IA disponível para geração e avaliação semântica."
            : "A conexão de IA precisa ser configurada pelo administrador."}
        </div>
        <form
          className="password-form"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await api("password", { currentPassword, newPassword }, "PUT");
              setCurrentPassword("");
              setNewPassword("");
              toast("Senha alterada com segurança.");
            } catch (error) {
              toast((error as Error).message);
            }
          }}
        >
          <h3>Alterar senha</h3>
          <label>
            Senha atual
            <input
              className="text-input"
              type="password"
              autoComplete="current-password"
              minLength={8}
              maxLength={128}
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <label>
            Nova senha
            <input
              className="text-input"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <Button type="submit" secondary>Atualizar senha</Button>
        </form>
      </div>
    </div>
  );
}

export function Login() {
  const { setUser } = useApp();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="auth-wrap">
      <div className="auth-illustration">
        <BrainArt />
        <span className="eyebrow">SEU CONHECIMENTO GANHA VOZ</span>
        <h1>
          Aprenda hoje.
          <br />
          Transforme o amanhã.
        </h1>
        <p>
          Um espaço para conectar a curiosidade de estudante ao cuidado de um
          futuro profissional.
        </p>
      </div>
      <form
        className="auth-form card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const u = await api("auth/" + (register ? "register" : "login"), {
              name: register ? name : undefined,
              email,
              password,
            });
            setUser(u);
            navigate("/dashboard");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className="icon-box purple">
          <GraduationCap />
        </span>
        <h2>{register ? "Sua jornada começa aqui." : "Bom ter você de volta."}</h2>
        <p>
          {register
            ? "Crie sua conta e guarde cada descoberta."
            : "Entre para continuar construindo seu conhecimento."}
        </p>
        {register && (
          <label>
            Seu nome
            <input
              className="text-input"
              autoComplete="name"
              required
              minLength={2}
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        <label>
          E-mail
          <input
            className="text-input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            className="text-input"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {register && (
          <small>Use pelo menos 8 caracteres.</small>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? (
            <LoaderCircle className="spin" size={17} />
          ) : register ? (
            "Criar minha conta"
          ) : (
            "Entrar na minha conta"
          )}
          <ArrowRight size={17} />
        </Button>
        <button
          type="button"
          className="text-link"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register ? "Já tenho uma conta" : "Quero criar minha conta"}
        </button>
      </form>
    </div>
  );
}
