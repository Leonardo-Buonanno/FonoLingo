import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  Clock3,
  Flame,
  Heart,
  Layers,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { accuracy, dayKey, streak, reviewSchedule } from "../../shared/scoring.mjs";

import { useApp } from "../state/context";
import { Button, Tag, Progress, BrainArt } from "../components/ui";
import { categories } from "../state/catalog";
import { StudyInput } from "../components/StudyInput";

export function Dashboard() {
  const { state, startTopic } = useApp();
  const navigate = useNavigate();
  const total = state.history.reduce((n, s) => n + s.answers.length, 0);
  const xp = state.history.reduce((n, s) => n + (s.xp || 0), 0);
  const days = streak(state.history);
  const today = dayKey(Date.now());
  const todayCount = state.history
    .filter((s) => dayKey(s.finished!) === today)
    .reduce((n, s) => n + s.answers.length, 0);
  const last = state.history[0];
  const reviews = reviewSchedule(state.history);
  const dueReviews = reviews.filter(item => item.due);
  return (
    <>
      <div className="welcome-row">
        <div>
          <div className="greeting">
            SEU FUTURO COMEÇA NO QUE VOCÊ APRENDE HOJE
          </div>
          <h1>
            Olá,{" "}
            {state.profile.name.split(" ")[0]}{" "}
            <span className="wave">✦</span>
          </h1>
          <p>Bom ter você por aqui. Vamos dar voz ao seu conhecimento?</p>
        </div>
        <span className="date">
          <CalendarDays size={16} />
          {new Intl.DateTimeFormat("pt-BR", {
            day: "numeric",
            month: "long",
          }).format(new Date())}
        </span>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="icon-box orange">
            <Flame />
          </span>
          <div>
            <strong>
              {days} <small>{days === 1 ? "dia" : "dias"}</small>
            </strong>
            <span>Sequência de estudos</span>
          </div>
          <span className="stat-note">
            {days ? "Continue assim!" : "Um novo começo"}
          </span>
        </div>
        <div className="stat-card">
          <span className="icon-box purple">
            <Brain />
          </span>
          <div>
            <strong>{total.toLocaleString("pt-BR")}</strong>
            <span>Questões exploradas</span>
          </div>
          <span className="mini-bars" aria-hidden="true">
            ▂▃▂▅▄▇
          </span>
        </div>
        <div className="stat-card">
          <span className="icon-box green">
            <Zap />
          </span>
          <div>
            <strong>
              {xp.toLocaleString("pt-BR")} <small>XP</small>
            </strong>
            <span>Conhecimento que evolui</span>
          </div>
          <Tag color="green">Nível {Math.floor(xp / 500) + 1}</Tag>
        </div>
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-main">
          <section className="hero">
            <div className="hero-copy">
              <span className="hero-eyebrow">
                <Sparkles size={14} /> SEU ESTUDO, DO SEU JEITO
              </span>
              <h2>
                O que você quer
                <br />
                aprender <em>hoje?</em>
              </h2>
              <p>
                Transforme uma dúvida em descoberta.
                <br />
                Um conteúdo em um novo desafio.
              </p>
            </div>
            <BrainArt />
            <StudyInput compact />
            <div className="hero-foot">
              <ShieldCheck size={13} /> Aprendizado com propósito. No seu ritmo.
            </div>
          </section>
          <section className="areas-section">
            <div className="section-heading">
              <div>
                <h2>
                  Explore seu universo <span className="tiny-spark">✦</span>
                </h2>
                <p>Grandes descobertas começam com uma área de interesse.</p>
              </div>
              <span className="subtle-label">6 áreas de conhecimento</span>
            </div>
            <div className="category-grid">
              {categories.map(
                ({ name, description, icon: Icon, color, topic, tag }) => (
                  <button
                    className={`category-card ${color}`}
                    key={name}
                    onClick={() => startTopic(topic)}
                  >
                    <div className="category-top">
                      <span className={`icon-box ${color}`}>
                        <Icon size={23} />
                      </span>
                      <ArrowRight size={17} />
                    </div>
                    <h3>{name}</h3>
                    <p>{description}</p>
                    <span className="category-tag">{tag}</span>
                  </button>
                ),
              )}
            </div>
          </section>
          <div className="learning-banner">
            <span className="icon-box purple">
              <Heart size={22} />
            </span>
            <div>
              <h3>Aqui, cada erro também ensina.</h3>
              <p>
                Receba explicações, descubra conexões e avance com confiança.
              </p>
            </div>
            <BookOpen className="banner-book" size={42} />
          </div>
        </div>
        <aside className="dashboard-right">
          {reviews.length > 0 && (
            <section className="continue-card card">
              <div className="section-heading"><h3>Revisão espaçada</h3><CalendarDays size={19} /></div>
              <p>{dueReviews.length ? `${dueReviews.length} conceito(s) para revisar agora.` : `Próxima revisão: ${new Date(reviews[0].dueAt).toLocaleDateString("pt-BR")}.`}</p>
              <p>Retome suas dificuldades e acompanhe os próximos intervalos.</p>
              <Button secondary onClick={() => navigate("/revisao")}>{dueReviews.length ? "Revisar meus erros" : "Ver agendamento"}<ArrowRight size={16} /></Button>
            </section>
          )}
          <section className="daily-card">
            <div className="daily-top">
              <span>
                <Zap size={14} /> DESAFIO DO DIA
              </span>
              <span className="live-dot" />
            </div>
            <div className="daily-art" aria-hidden="true">
              <div className="daily-orbit" />
              <Target size={68} strokeWidth={1.4} />
              <span>✦</span>
            </div>
            <h2>
              Pequenos passos.
              <br />
              Grandes conexões.
            </h2>
            <p>
              Escolha um tema importante para
              <br />
              seu momento de estudo.
            </p>
            <div className="daily-meta">
              <span>
                <Layers size={13} />5 desafios
              </span>
              <span>
                <Clock3 size={13} />
                ~5 min
              </span>
            </div>
            <Button
              onClick={() => {
                navigate("/estudar");
              }}
            >
              Aceitar o desafio
              <ArrowRight size={17} />
            </Button>
            <span className="daily-reward">
              <Zap size={13} /> Até 100 XP para sua jornada
            </span>
          </section>
          <section className="card weekly-card">
            <div className="section-heading">
              <h3>Seu ritmo de estudo</h3>
              <Flame size={19} />
            </div>
            <p>Consistência vale mais que pressa.</p>
            <div className="week-days">
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - 6 + i);
                const done = state.history.some(
                  (s) => dayKey(s.finished!) === dayKey(d),
                );
                return (
                  <div key={i}>
                    <span>
                      {["D", "S", "T", "Q", "Q", "S", "S"][d.getDay()]}
                    </span>
                    <span
                      className={`day-circle ${done ? "done" : ""} ${i === 6 ? "today" : ""}`}
                    >
                      {done ? <Check size={14} /> : d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="goal-label">
              <span>Meta de hoje</span>
              <strong>
                {todayCount}/{state.profile.goal} questões
              </strong>
            </div>
            <Progress value={(todayCount / state.profile.goal) * 100} />
            <small>
              {todayCount >= state.profile.goal
                ? "Meta alcançada. Celebre sua dedicação!"
                : "Reserve um momento para você."}
            </small>
          </section>
          <section className="continue-card card">
            <div className="section-heading">
              <h3>
                {state.active
                  ? "Continue de onde parou"
                  : last
                    ? "Sua última descoberta"
                    : "Sua primeira descoberta"}
              </h3>
              <BookOpen size={17} />
            </div>
            <div className="continue-content">
              <span className="icon-box green">
                <Activity size={22} />
              </span>
              <div>
                <strong>
                  {state.active?.topic || last?.topic || "Nenhuma sessão concluída"}
                </strong>
                <small>
                  {state.active
                    ? `${state.active.answers.length} de ${state.active.questions.length} atividades`
                    : last
                      ? `${accuracy(last.answers)}% de aproveitamento`
                      : "Escolha seu primeiro tema"}
                </small>
              </div>
            </div>
            <button
              className="text-link"
              onClick={() =>
                state.active
                  ? navigate("/jogo")
                  : last
                    ? startTopic(last.topic)
                    : navigate("/estudar")
              }
            >
              {state.active ? "Retomar sessão" : "Explorar conteúdo"}
              <ArrowRight size={15} />
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
