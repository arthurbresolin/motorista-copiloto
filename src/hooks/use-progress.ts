import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getChecklistSessions, type ChecklistSession } from '@/api/checklist';
import { ApiError } from '@/api/client';
import { getMonitorSessions, type MonitorSession } from '@/api/monitor-sessions';
import {
  getPracticeSessionStats,
  getPracticeSessions,
  type PracticeSession,
  type PracticeSessionStats,
} from '@/api/practice-sessions';
import { getQuizPhases, getQuizSessions, type QuizPhase, type QuizSession } from '@/api/quiz';
import {
  computeAchievements,
  computeLastSevenDays,
  computeLevel,
  computeMonitorEventTrend,
  computeSkillProgress,
  computeStreak,
  computeXp,
} from '@/lib/gamification';

export type LoadState = 'loading' | 'error' | 'ready';

// Único lugar que busca sessões (prática/checklist/monitor/quiz) e deriva
// streak/XP/trilha/conquistas — Início, Trilha e Perfil consomem daqui em
// vez de cada um refazer o mesmo fetch e o mesmo cálculo.
export function useProgress() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [checklistSessions, setChecklistSessions] = useState<ChecklistSession[]>([]);
  const [monitorSessions, setMonitorSessions] = useState<MonitorSession[]>([]);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [quizPhases, setQuizPhases] = useState<QuizPhase[]>([]);
  const [stats, setStats] = useState<PracticeSessionStats | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const reload = useCallback(async () => {
    setLoadState('loading');
    try {
      const [practice, checklist, monitor, quiz, phases, practiceStats] = await Promise.all([
        getPracticeSessions(),
        getChecklistSessions(),
        getMonitorSessions(),
        getQuizSessions(),
        getQuizPhases(),
        getPracticeSessionStats(),
      ]);
      setSessions(practice);
      setChecklistSessions(checklist);
      setMonitorSessions(monitor);
      setQuizSessions(quiz);
      setQuizPhases(phases);
      setStats(practiceStats);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível carregar seu progresso.',
      );
      setLoadState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const streak = computeStreak(sessions);
  const weekDays = computeLastSevenDays(sessions);
  const xp = computeXp(sessions.length, checklistSessions.length, quizSessions.length, monitorSessions);
  const level = computeLevel(xp);
  const eventTrend = computeMonitorEventTrend(monitorSessions);
  const skillProgress = computeSkillProgress(sessions, checklistSessions, monitorSessions, quizPhases);
  const achievements = computeAchievements(
    sessions,
    streak,
    monitorSessions,
    quizSessions.length,
    stats?.total_km ?? 0,
  );

  return {
    loadState,
    errorMessage,
    reload,
    sessions,
    checklistSessions,
    monitorSessions,
    quizSessions,
    quizPhases,
    stats,
    streak,
    weekDays,
    xp,
    level,
    eventTrend,
    skillProgress,
    achievements,
  };
}
