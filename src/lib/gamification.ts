import type { ChecklistSession } from '@/api/checklist';
import type { MonitorSession } from '@/api/monitor-sessions';
import type { PracticeSession } from '@/api/practice-sessions';
import type { SkillNodeState } from '@/components/organic';
import {
  MANEUVER_DONE_THRESHOLD,
  SKILLS,
  SMOOTH_DRIVING_MIN_DURATION_SECONDS,
  type Skill,
} from '@/constants/skills';

export type SkillProgress = {
  skill: Skill;
  count: number;
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
  for (const session of sessions) {
    minutesByDate.set(
      session.practiced_at,
      (minutesByDate.get(session.practiced_at) ?? 0) + session.duration_minutes,
    );
  }

  const days: { label: string; minutes: number }[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 6);
  for (let i = 0; i < 7; i++) {
    days.push({
      label: WEEKDAY_LABELS[cursor.getDay()],
      minutes: minutesByDate.get(isoDate(cursor)) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function isSmoothDrivingSession(session: MonitorSession) {
  return session.event_count === 0 && session.duration_seconds >= SMOOTH_DRIVING_MIN_DURATION_SECONDS;
}

export function computeSkillProgress(
  practiceSessions: PracticeSession[],
  checklistSessions: ChecklistSession[],
  monitorSessions: MonitorSession[],
): SkillProgress[] {
  const maneuverCounts = new Map<string, number>();
  for (const session of practiceSessions) {
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
    return { skill, count };
  });

  let currentAssigned = false;
  return counted.map(({ skill, count }) => {
    if (count >= MANEUVER_DONE_THRESHOLD) {
      return { skill, count, state: 'done' as SkillNodeState };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return { skill, count, state: 'current' as SkillNodeState };
    }
    return { skill, count, state: 'locked' as SkillNodeState };
  });
}

const XP_PER_PRACTICE_SESSION = 10;
const XP_PER_CHECKLIST_SESSION = 5;
const XP_PER_QUIZ_SESSION = 15;

// XP é sempre derivado das sessões já buscadas, nunca persistido no backend -
// mesmo raciocínio do streak/gráfico semanal: evita um contador mutável que
// pode dessincronizar se alguma chamada de criação de sessão falhar parcialmente.
export function computeXp(
  practiceSessionCount: number,
  checklistSessionCount: number,
  quizSessionCount: number,
) {
  return (
    practiceSessionCount * XP_PER_PRACTICE_SESSION +
    checklistSessionCount * XP_PER_CHECKLIST_SESSION +
    quizSessionCount * XP_PER_QUIZ_SESSION
  );
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
): Achievement[] {
  return [
    { key: 'primeira-pratica', label: 'Primeira prática', unlocked: practiceSessions.length >= 1 },
    { key: 'streak-3', label: '3 dias seguidos', unlocked: streak >= 3 },
    {
      key: 'sem-sustos',
      label: 'Sessão sem sustos',
      unlocked: monitorSessions.some(isSmoothDrivingSession),
    },
    { key: 'quiz-completo', label: 'Quiz completo', unlocked: quizSessionCount >= 1 },
  ];
}
