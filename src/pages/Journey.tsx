import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Flame,
  GraduationCap,
  History,
  Layers,
  Lightbulb,
  RotateCcw,
  Search,
  Sparkles,
  Stethoscope,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import type { Session } from "../types";
import {
  accuracy,
  reviewSchedule,
  reviewQuestions,
  streak,
  weaknesses,
} from "../../shared/scoring.mjs";

import { useApp } from "../state/context";
import {
  Button,
  Tag,
  Progress,
  Empty,
  PageHeading,
  Source,
} from "../components/ui";

export function Results() {
  const { state, setConfig } = useApp();
  const navigate = useNavigate();
  const s = state.history[0];
  if (!s)
    return (
      <Empty
        title="Toda jornada tem uma primeira descoberta."
        description="Conclua uma sessão para conhecer seu desempenho."
      />
    );
  const errors = s.answers.filter((a) => a.score < 1);
  const score = accuracy(s.answers);
  const nextReviews = reviewSchedule(state.history).filter(item => item.topic === s.topic);
  const concepts = [...new Set(s.answers.map((a) => a.question.concept))];
  return (
    <div className="narrow result-page">
      <div className="result-icon">
        <Trophy size={42} />
        <span>✦</span>
      </div>
      <span className="eyebrow">MAIS UM PASSO NA SUA JORNADA</span>
      <h1>Desafio concluído!</h1>
      <p>Você dedicou um tempo a aprender. Isso já é uma conquista.</p>
      <div className="result-stats card">
        <div>
          <strong>
            {s.answers.filter((a) => a.score === 1).length}
            <small>/{s.questions.length}</small>
          </strong>
          <span>Respostas completas</span>
        </div>
        <div>
          <strong>
            {score}
            <small>%</small>
          </strong>
          <span>Aproveitamento</span>
        </div>
        <div>
          <strong>+{s.xp}</strong>
          <span>XP conquistado</span>
        </div>
        <div>
          <strong>
            {Math.max(1, Math.round((s.finished! - s.started) / 60000))}
            <small> min</small>
          </strong>
          <span>Tempo decorrido</span>
        </div>
      </div>
      {s.answers.some((a) => a.selfAssessed) && (
        <p className="field-hint">
          O resultado inclui respostas abertas autoavaliadas por você.
        </p>
      )}
      <div className="card results-details">
        <h2>O que você está construindo</h2>
        {concepts.map((c) => {
          const items = s.answers.filter((a) => a.question.concept === c);
          const n = accuracy(items);
          return (
            <div className="concept-row" key={c}>
              <div>
                <strong>{c}</strong>
                <span>
                  {n >= 80
                    ? "Boa base"
                    : n >= 50
                      ? "Em desenvolvimento"
                      : "Vale revisar"}{" "}
                  · {n}%
                </span>
              </div>
              <Progress value={n} />
            </div>
          );
        })}
        <div className="tip">
          <Lightbulb />
          <p>
            <strong>Seu próximo passo</strong>
            <br />
            {errors.length
              ? `Vamos fortalecer ${errors[0].question.concept.toLowerCase()} com uma nova situação?`
              : "Sua base está crescendo. Experimente um nível mais desafiador."}
          </p>
        </div>
      </div>
      {nextReviews.length > 0 && (
        <div className="card results-details">
          <h2>Suas próximas revisões</h2>
          <p>Agendamento atualizado com suas respostas.</p>
          {nextReviews.map(item => (
            <p key={item.concept}><strong>{item.concept}</strong> · {item.due ? "Disponível agora" : new Date(item.dueAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
          ))}
          <button className="text-link" onClick={() => navigate("/revisao")}>Ver revisões<ArrowRight size={16} /></button>
        </div>
      )}
      <div className="result-actions">
        {errors.length > 0 && (
          <Button
            onClick={() => {
              setConfig({
                topic: s.topic,
                mode: "Dificuldades",
                difficulty: s.difficulty,
                count: Math.min(10, errors.length),
                reviewConcepts: [
                  ...new Set(errors.map((a) => a.question.concept)),
                ],
                exclude: s.questions.map((q) => q.prompt),
              });
              navigate("/configurar");
            }}
          >
            <RotateCcw size={17} />
            Revisar meus erros
          </Button>
        )}
        <Button secondary onClick={() => navigate("/dashboard")}>
          Voltar ao meu espaço
          <ArrowRight size={17} />
        </Button>
      </div>
      <div className="section-heading">
        <h2>Suas respostas, com contexto</h2>
      </div>
      <AnswerReview session={s} />
    </div>
  );
}

export function AnswerReview({ session }: { session: Session }) {
  return (
    <div className="answer-review">
      {session.answers.map((a, i) => (
        <details className="card" key={i}>
          <summary>
            <span
              className={`review-score ${a.score === 1 ? "good" : "partial"}`}
            >
              {a.score === 1 ? <Check size={17} /> : <RotateCcw size={17} />}
            </span>
            <span>{a.question.prompt}</span>
            <ChevronDown size={17} />
          </summary>
          <div className="review-body">
            <p>
              <strong>Sua resposta:</strong> {a.response}
            </p>
            <p>
              <strong>Resposta esperada:</strong> {a.question.answer}
            </p>
            <p>{a.feedback}</p>
            {a.selfAssessed && <Tag color="orange">Autoavaliação</Tag>}
            <Source question={a.question} />
          </div>
        </details>
      ))}
    </div>
  );
}

export function Knowledge() {
  const { state, startTopic } = useApp();
  return (
    <>
      <PageHeading
        eyebrow="APRENDER É CONECTAR"
        title="Meu conhecimento"
        description="Um mapa em construção. Cada sessão revela novas habilidades e caminhos para explorar."
      />
      {!state.history.length ? (
        <Empty
          icon={Brain}
          title="Seu mapa começa com uma descoberta."
          description="Estude um tema para visualizar seu domínio por conceito. Seu progresso será calculado com suas respostas."
        />
      ) : (
        <div className="knowledge-grid">
          {[...new Set(state.history.map((s) => s.topic))].map((topic) => {
            const sessions = state.history.filter((s) => s.topic === topic);
            const answers = sessions.flatMap((s) => s.answers);
            return (
              <div className="card knowledge-card" key={topic}>
                <span className="icon-box purple">
                  <Brain />
                </span>
                <h2>{topic}</h2>
                <p>
                  {answers.length} respostas · {sessions.length} sessões
                </p>
                {[...new Set(answers.map((a) => a.question.concept))].map(
                  (c) => (
                    <div className="concept-row" key={c}>
                      <div>
                        <strong>{c}</strong>
                        <span>
                          {accuracy(
                            answers.filter((a) => a.question.concept === c),
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={accuracy(
                          answers.filter((a) => a.question.concept === c),
                        )}
                      />
                    </div>
                  ),
                )}
                <button
                  className="text-link"
                  onClick={() => startTopic(topic, "Revisar")}
                >
                  Continuar explorando
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <p className="info-line">
        <Lightbulb size={17} />
        Os indicadores descrevem estas atividades e podem incluir autoavaliação.
        Não representam certificação profissional.
      </p>
    </>
  );
}

export function Revision() {
  const { state, setState } = useApp();
  const navigate = useNavigate();
  const schedule = reviewSchedule(state.history);
  const due = schedule.filter(item => item.due);
  return (
    <>
      <PageHeading
        eyebrow="REVER TAMBÉM É AVANÇAR"
        title="Revisão espaçada"
        description="Seus erros e respostas parciais viram revisões. Acerte na data prevista para ampliar o intervalo; uma nova dificuldade traz o conceito de volta em 1 dia."
      />
      {schedule.length > 0 && (
        <div className="review-summary card">
          <div>
            <span className="icon-box purple"><CalendarDays /></span>
            <div>
              <h2>{due.length} {due.length === 1 ? "conceito para revisar agora" : "conceitos para revisar agora"}</h2>
              <p>Intervalos: 1, 3, 7, 14 e 30 dias. Treinar antes da data mantém o agendamento após um acerto.</p>
            </div>
          </div>
          <div className="review-calendar">
            {schedule.slice(0, 6).map(item => (
              <span key={JSON.stringify([item.topic, item.concept])} className={item.due ? "due" : ""}>
                <strong>{item.due ? "Disponível" : new Date(item.dueAt).toLocaleDateString("pt-BR")}</strong>
                {item.concept}
              </span>
            ))}
          </div>
        </div>
      )}
      {!schedule.length ? (
        <Empty icon={CircleCheck} title="Nenhuma revisão agendada."
          description="Conclua uma sessão. Conceitos com erros ou respostas parciais aparecerão aqui automaticamente." />
      ) : (
        <>
          {state.active && <p className="field-hint">Você tem uma sessão em andamento. Conclua-a antes de iniciar uma revisão. <button className="text-link" onClick={() => navigate("/jogo")}>Retomar sessão</button></p>}
          <div className="revision-list">
            {schedule.map(item => (
              <div className="card revision-card" key={JSON.stringify([item.topic, item.concept])}>
                <span className="icon-box orange"><Target /></span>
                <div>
                  <Tag color={item.due ? "orange" : "green"}>{item.due ? "Revisão disponível" : "Agendada"}</Tag>
                  <h2>{item.concept}</h2>
                  <p>{item.topic} · Última tentativa: {Math.round(item.lastScore * 100)}%</p>
                  <p>Próxima revisão: {new Date(item.dueAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · Intervalo: {item.interval} {item.interval === 1 ? "dia" : "dias"}</p>
                </div>
                <Button disabled={!!state.active} onClick={() => {
                  const questions = reviewQuestions(state.history, item.topic, item.concept);
                  if (!questions.length) return;
                  setState(previous => ({ ...previous, active: {
                    id: crypto.randomUUID(), topic: item.topic, mode: "Revisão espaçada",
                    difficulty: "Médio", questions, answers: [], started: Date.now(),
                    provider: "ai", summary: "Revisão de questões do seu histórico, priorizando dificuldades.",
                  } }));
                  navigate("/jogo");
                }}>
                  {item.due ? "Revisar agora" : "Treinar antes da data"}<ArrowRight size={16} />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function StudyHistory() {
  const { state } = useApp();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Session | null>(null);
  const sessions = state.history.filter((s) =>
    s.topic.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="CADA PASSO CONTA"
        title="Histórico de estudos"
        description="Relembre suas descobertas, reveja respostas e acompanhe sua evolução."
      />
      {!state.history.length ? (
        <Empty
          icon={History}
          title="Sua história de aprendizado começa agora."
          description="As sessões concluídas serão guardadas aqui, com cada resposta e explicação."
        />
      ) : (
        <>
          <div className="history-search">
            <Search size={18} />
            <input
              aria-label="Buscar no histórico"
              placeholder="Buscar por assunto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="history-list">
            {sessions.map((s) => (
              <button
                className="card history-item"
                key={s.id}
                onClick={() => setSelected(selected?.id === s.id ? null : s)}
              >
                <span className="icon-box purple">
                  <BookOpen />
                </span>
                <div>
                  <strong>{s.topic}</strong>
                  <span>
                    {new Date(s.finished!).toLocaleDateString("pt-BR")} ·{" "}
                    {s.mode} · {s.difficulty}
                  </span>
                </div>
                <span>{s.questions.length} desafios</span>
                <strong>{accuracy(s.answers)}%</strong>
                <Tag color="green">+{s.xp} XP</Tag>
                <ChevronDown size={17} />
              </button>
            ))}
          </div>
          {!sessions.length && (
            <p>Nenhuma sessão encontrada para esse assunto.</p>
          )}
          {selected && (
            <div className="history-detail">
              <div className="section-heading">
                <h2>{selected.topic} · Detalhes da sessão</h2>
                <button
                  className="icon-button"
                  aria-label="Fechar detalhes"
                  onClick={() => setSelected(null)}
                >
                  <X />
                </button>
              </div>
              <AnswerReview session={selected} />
            </div>
          )}
        </>
      )}
    </>
  );
}

export function Achievements() {
  const { state } = useApp();
  const xp = state.history.reduce((n, s) => n + (s.xp || 0), 0);
  const questions = state.history.flatMap((s) => s.answers);
  const medals = [
    {
      name: "Primeira descoberta",
      text: "Conclua seu primeiro desafio.",
      icon: Sparkles,
      now: state.history.length,
      max: 1,
    },
    {
      name: "Sempre em movimento",
      text: "Conclua 10 sessões de estudo.",
      icon: Zap,
      now: state.history.length,
      max: 10,
    },
    {
      name: "Uma semana de conexões",
      text: "Estude por 7 dias seguidos.",
      icon: Flame,
      now: streak(state.history),
      max: 7,
    },
    {
      name: "Mente curiosa",
      text: "Responda 100 atividades.",
      icon: Brain,
      now: questions.length,
      max: 100,
    },
    {
      name: "Olhar clínico",
      text: "Resolva 10 casos simulados.",
      icon: Stethoscope,
      now: questions.filter((a) => a.question.type === "clinical").length,
      max: 10,
    },
    {
      name: "Conhecimento em expansão",
      text: "Explore 3 assuntos diferentes.",
      icon: Layers,
      now: new Set(state.history.map((s) => s.topic)).size,
      max: 3,
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="CELEBRE O SEU CAMINHO"
        title="Pequenas vitórias. Grandes conquistas."
        description="Aprender é a recompensa. Estas são algumas lembranças da sua dedicação."
      />
      <div className="level-card card">
        <span className="level-medal">
          <GraduationCap size={36} />
        </span>
        <div>
          <Tag>Nível {Math.floor(xp / 500) + 1}</Tag>
          <h2>
            {xp < 500
              ? "Mente curiosa"
              : xp < 1500
                ? "Explorador do conhecimento"
                : "Aprendiz em evolução"}
          </h2>
          <p>{xp % 500} / 500 XP para o próximo nível</p>
          <Progress value={(xp % 500) / 5} />
        </div>
        <strong>
          {xp} <small>XP total</small>
        </strong>
      </div>
      <div className="achievement-grid">
        {medals.map((m) => (
          <div
            key={m.name}
            className={`card achievement-card ${m.now >= m.max ? "unlocked" : ""}`}
          >
            <span className="medal">
              <m.icon size={33} />
            </span>
            <Tag color={m.now >= m.max ? "green" : "neutral"}>
              {m.now >= m.max ? "Conquistada" : "Em construção"}
            </Tag>
            <h3>{m.name}</h3>
            <p>{m.text}</p>
            <Progress value={Math.min(100, (m.now / m.max) * 100)} />
            <small>
              {Math.min(m.now, m.max)} de {m.max}
            </small>
          </div>
        ))}
      </div>
    </>
  );
}
