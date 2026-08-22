import type { ChecklistSession } from '@/api/checklist';
import type { MonitorSession } from '@/api/monitor-sessions';
import type { PracticeSession } from '@/api/practice-sessions';
import type { QuizPhase, QuizSession } from '@/api/quiz';
import type { SkillNodeState } from '@/components/organic';
import {
  MANEUVER_DONE_THRESHOLD,
  SKILLS,
  SMOOTH_DRIVING_MIN_DURATION_SECONDS,
  type Skill,
} from '@/constants/skills';

// Dentro de uma habilidade, o quiz (teórico) vem antes da prática — precisa
// passar no quiz pra desbloquear a prática, não o contrário.
export type SkillPhase = 'quiz' | 'practice';

export type SkillProgress = {
  skill: Skill;
  count: number;
  quizPassed: boolean;
  practiceDone: boolean;
  // Fase ativa/próxima dessa habilidade — só é realmente relevante quando
  // state === 'current', mas é computada pra todas por simplicidade.
  phase: SkillPhase;
  state: SkillNodeState;
};

const WEEKDAY_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeStreak(sessions: PracticeSession[]) {
  const practicedDates = new Set(sessions.map((session) => session.practiced_at));
  if (practicedDates.size === 0) {
    return 0;
  }

  const mostRecent = Array.from(practicedDates).sort().reverse()[0];
  const cursor = new Date(`${mostRecent}T00:00:00`);
  let streak = 0;
  while (practicedDates.has(isoDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeLastSevenDays(sessions: PracticeSession[]) {
  const minutesByDate = new Map<string, number>();
  const kmByDate = new Map<string, number>();
  for (const session of sessions) {
    minutesByDate.set(
      session.practiced_at,
      (minutesByDate.get(session.practiced_at) ?? 0) + session.duration_minutes,
    );
    kmByDate.set(session.practiced_at, (kmByDate.get(session.practiced_at) ?? 0) + session.distance_km);
  }

  const days: { label: string; minutes: number; km: number }[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 6);
  for (let i = 0; i < 7; i++) {
    const date = isoDate(cursor);
    days.push({
      label: WEEKDAY_LABELS[cursor.getDay()],
      minutes: minutesByDate.get(date) ?? 0,
      km: Math.round((kmByDate.get(date) ?? 0) * 10) / 10,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

const EVENT_TREND_SESSION_COUNT = 6;

// Últimas sessões de monitoramento, da mais antiga pra mais recente (ordem de
// leitura de um gráfico), pra visualizar se os eventos bruscos estão caindo.
export function computeMonitorEventTrend(monitorSessions: MonitorSession[]) {
  return [...monitorSessions]
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
    .slice(-EVENT_TREND_SESSION_COUNT)
    .map((session) => {
      const date = new Date(session.started_at);
      return {
        label: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        eventCount: session.event_count,
        severeEventCount: session.severe_event_count,
      };
    });
}

function isSmoothDrivingSession(session: MonitorSession) {
  return session.event_count === 0 && session.duration_seconds >= SMOOTH_DRIVING_MIN_DURATION_SECONDS;
}

// Mesmo limiar usado pelo backend pra destravar a próxima fase do quiz
// (backend/app/api/quiz.py QUIZ_PASS_THRESHOLD) — aqui só decide se o quiz
// daquela habilidade conta como "feito" na trilha, não controla acesso.
export const QUIZ_PASS_RATIO = 0.7;

// Melhor proporção de acertos (0 a 1) que o aluno já tirou no quiz de uma
// categoria, ou null se nunca tentou. As categorias do quiz usam as mesmas
// chaves de SKILLS (exceto "geral", que não corresponde a nenhuma habilidade).
//
// ATENÇÃO: isso conta QUALQUER sessão salva pra categoria, mesmo uma sessão
// antiga de um quiz que já mudou de tamanho (ex: um teste de 1 pergunta de
// quando o quiz de "baliza" só tinha 1, hoje tem 6) — o backend (quiz.py,
// _build_phases) já filtra isso comparando total_questions com a contagem
// atual de perguntas, e essa validação não é reproduzida aqui. Use
// `getQuizPhaseRatio` (abaixo) sempre que o resultado for usado pra liberar
// algo — é o mesmo cálculo que o backend usa pra destravar as fases.
export function getBestQuizRatio(quizSessions: QuizSession[], category: string): number | null {
  const relevant = quizSessions.filter(
    (session) => session.category === category && session.total_questions > 0,
  );
  if (relevant.length === 0) {
    return null;
  }
  return Math.max(...relevant.map((session) => session.score / session.total_questions));
}

// Mesma ideia de getBestQuizRatio, mas lida a partir de `GET /quiz/phases`
// (QuizPhase.best_score/best_total) em vez das sessões brutas — o backend já
// descarta ali sessões cujo total_questions não bate mais com o quiz atual,
// então isso reflete o que realmente conta pra destravar a próxima fase.
export function getQuizPhaseRatio(quizPhases: QuizPhase[], category: string): number | null {
  const phase = quizPhases.find((candidate) => (candidate.category ?? 'geral') === category);
  if (!phase || phase.best_score === null || phase.best_total === null || phase.best_total === 0) {
    return null;
  }
  return phase.best_score / phase.best_total;
}

export function computeSkillProgress(
  practiceSessions: PracticeSession[],
  checklistSessions: ChecklistSession[],
  monitorSessions: MonitorSession[],
  quizPhases: QuizPhase[],
): SkillProgress[] {
  // Só prática guiada (Modo Copiloto) conta pra trilha — o registro manual é
  // diário de bordo e não conclui habilidade. Ver `guided` em PracticeSession.
  const maneuverCounts = new Map<string, number>();
  for (const session of practiceSessions) {
    if (!session.guided) continue;
    for (const maneuver of session.maneuvers) {
      maneuverCounts.set(maneuver, (maneuverCounts.get(maneuver) ?? 0) + 1);
    }
  }

  const smoothDrivingCount = monitorSessions.filter(isSmoothDrivingSession).length;

  const counted = SKILLS.map((skill) => {
    let count = 0;
    if (skill.maneuver) {
      count = maneuverCounts.get(skill.maneuver) ?? 0;
    } else if (skill.key === 'checklist') {
      count = checklistSessions.length;
    } else if (skill.key === 'direcao-suave') {
      count = smoothDrivingCount;
    }
    const quizRatio = getQuizPhaseRatio(quizPhases, skill.key);
    const quizPassed = quizRatio !== null && quizRatio >= QUIZ_PASS_RATIO;
    const practiceDone = count >= MANEUVER_DONE_THRESHOLD;
    return { skill, count, quizPassed, practiceDone };
  });

  // A trilha é estritamente sequencial: só destrava a próxima habilidade quem
  // terminou a anterior. Assim que aparece a primeira incompleta, ela vira a
  // atual e TODO o resto fica travado — mesmo que já tenha quiz aprovado ou
  // práticas registradas.
  //
  // Isso importa porque os dados podem estar fora de ordem: quem praticou
  // baliza antes de existir a trilha atual tem sessões de uma habilidade lá do
  // meio sem ter feito as de trás. A regra antiga marcava essa habilidade como
  // concluída no meio de habilidades travadas, o que lia como trilha furada.
  // Contas nessa situação vão ver habilidades "voltarem" de concluída pra
  // travada — é o comportamento pedido, não um bug.
  let blocked = false;
  return counted.map(({ skill, count, quizPassed, practiceDone }) => {
    // Quiz sempre antes da prática — a fase "atual" da habilidade é o quiz
    // até ele ser aprovado, só depois passa a ser a prática.
    const phase: SkillPhase = quizPassed ? 'practice' : 'quiz';
    const base = { skill, count, quizPassed, practiceDone, phase };

    if (blocked) {
      return { ...base, state: 'locked' as SkillNodeState };
    }
    if (quizPassed && practiceDone) {
      return { ...base, state: 'done' as SkillNodeState };
    }
    blocked = true;
    return { ...base, state: 'current' as SkillNodeState };
  });
}

const XP_PER_PRACTICE_SESSION = 10;
const XP_PER_CHECKLIST_SESSION = 5;
const XP_PER_QUIZ_SESSION = 15;
const XP_PER_MONITOR_SESSION = 5;
const XP_BONUS_SMOOTH_MONITOR_SESSION = 5;
const XP_PER_LEVEL = 100;

// XP é sempre derivado das sessões já buscadas, nunca persistido no backend -
// mesmo raciocínio do streak/gráfico semanal: evita um contador mutável que
// pode dessincronizar se alguma chamada de criação de sessão falhar parcialmente.
export function computeXp(
  practiceSessionCount: number,
  checklistSessionCount: number,
  quizSessionCount: number,
  monitorSessions: MonitorSession[],
) {
  const monitorXp = monitorSessions.reduce(
    (total, session) =>
      total + XP_PER_MONITOR_SESSION + (session.event_count === 0 ? XP_BONUS_SMOOTH_MONITOR_SESSION : 0),
    0,
  );
  return (
    practiceSessionCount * XP_PER_PRACTICE_SESSION +
    checklistSessionCount * XP_PER_CHECKLIST_SESSION +
    quizSessionCount * XP_PER_QUIZ_SESSION +
    monitorXp
  );
}

export function computeLevel(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export type Achievement = {
  key: string;
  label: string;
  unlocked: boolean;
};

export function computeAchievements(
  practiceSessions: PracticeSession[],
  streak: number,
  monitorSessions: MonitorSession[],
  quizSessionCount: number,
  totalKm: number,
): Achievement[] {
  return [
    { key: 'primeira-pratica', label: 'Primeira prática', unlocked: practiceSessions.length >= 1 },
    { key: 'streak-3', label: '3 dias seguidos', unlocked: streak >= 3 },
    { key: 'streak-7', label: '7 dias seguidos', unlocked: streak >= 7 },
    {
      key: 'sem-sustos',
      label: 'Sessão sem sustos',
      unlocked: monitorSessions.some(isSmoothDrivingSession),
    },
    { key: 'dez-praticas', label: '10 práticas', unlocked: practiceSessions.length >= 10 },
    { key: 'cinquenta-km', label: '50 km rodados', unlocked: totalKm >= 50 },
    { key: 'quiz-completo', label: 'Quiz completo', unlocked: quizSessionCount >= 1 },
  ];
}
