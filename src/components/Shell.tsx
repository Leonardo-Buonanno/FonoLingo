import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowRight,
  AudioLines,
  Bell,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  History,
  House,
  Images,
  Menu,
  RotateCcw,
  Settings2,
  Sparkles,
  Trophy,
} from "lucide-react";

import { weaknesses } from "../../shared/scoring.mjs";

import { useApp } from "../state/context";
import { Brand } from "../components/ui";

export function Shell({ children }: { children: ReactNode }) {
  const { state, user, ai, toast } = useApp();
  const [mobile, setMobile] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    setMobile(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  const xp = state.history.reduce((n, s) => n + (s.xp || 0), 0);
  const level = Math.floor(xp / 500) + 1;
  const nav = [
    ["/dashboard", "Visão geral", House],
    ["/estudar", "Começar a estudar", BookOpen],
    ["/progresso", "Meu conhecimento", Brain],
    ["/revisao", "Revisão inteligente", RotateCcw],
    ["/historico", "Histórico de estudos", History],
    ["/conquistas", "Conquistas", Trophy],
    ["/biblioteca", "Biblioteca anatômica", Images],
  ] as const;
  if (!user) return <main id="main-content" className="public-main">{children}</main>;
  return (
    <div className="app-shell">
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <Brand />
        <div className="workspace-label">SEU ESPAÇO DE APRENDIZAGEM</div>
        <nav>
          {nav.map(([url, label, Icon], i) => (
            <NavLink
              key={url}
              to={url}
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <Icon size={19} />
              <span>{label}</span>
              {i === 1 && <span className="nav-plus">+</span>}
              {i === 3 && weaknesses(state.history).length > 0 && (
                <span className="nav-count">
                  {weaknesses(state.history).length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="journey-card">
            <div className="journey-icon">
              <Sparkles size={22} />
            </div>
            <h3>
              Um pouco a cada dia.
              <br />
              Muito mais para o futuro.
            </h3>
            <p>Seu próximo passo começa com uma nova descoberta.</p>
            <Link to="/estudar">
              Vamos aprender <ArrowRight size={16} />
            </Link>
          </div>
          <NavLink className="nav-item" to="/perfil">
            <Settings2 size={19} />
            Configurações e perfil
          </NavLink>
          <Link to="/perfil" className="sidebar-user">
            <span className="avatar">
              {state.profile.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{state.profile.name}</strong>
              <small>
                Conta conectada · Nível {level}
              </small>
            </div>
            <ChevronDown size={16} />
          </Link>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menu"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <GraduationCap size={19} />
            <span>Sua jornada de aprendizagem</span>
            <ChevronRight size={14} />
            <strong>
              {nav.find((n) => n[0] === loc.pathname)?.[1] || "FonoLingo"}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="status-pill">
              <span />
              {ai ? "IA conectada" : "IA indisponível"}
            </span>
            <button
              className="notification icon-button"
              aria-label="Ver lembretes de estudo"
              onClick={() =>
                toast(
                  weaknesses(state.history).length
                    ? "Você tem conceitos para revisar. Acesse Revisão inteligente."
                    : "Seu próximo aprendizado está a um desafio de distância.",
                )
              }
            >
              <Bell size={20} />
              <i />
            </button>
            <Link
              to="/perfil"
              className="avatar small"
              aria-label="Abrir meu perfil"
            >
              {state.profile.name.slice(0, 2).toUpperCase()}
            </Link>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer>
          <span>
            <AudioLines size={15} /> Seu conhecimento ganha voz.
          </span>
          <span>Feito para quem cuida da comunicação humana.</span>
          <span>FonoLingo © {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
