import { useCallback, useEffect, useState } from 'react';

import { getChecklistSessions, type ChecklistSession } from '@/api/checklist';
import { ApiError } from '@/api/client';
import { getMonitorSessions, type MonitorSession } from '@/api/monitor-sessions';
import { getPracticeSessions, type PracticeSession } from '@/api/practice-sessions';
import { getQuizPhases, type QuizPhase } from '@/api/quiz';
import { MANEUVER_DONE_THRESHOLD, SKILLS, type Skill, type SkillKey } from '@/constants/skills';
import { computeSkillProgress, getQuizPhaseRatio, QUIZ_PASS_RATIO, type SkillProgress } from '@/lib/gamification';

export type LoadState = 'loading' | 'error' | 'ready';

export function practiceAction(skill: Skill): { label: string; route: string } {
  if (skill.key === 'checklist') {
    return { label: '✅ Fazer checklist', route: '/checklist' };
  }
  if (skill.key === 'direcao-suave') {
    return { label: '🚦 Monitorar sessão', route: '/monitor' };
  }
  // Modo Copiloto é a segunda fase da aula (quiz → copiloto), então é ele que
  // aparece como a ação da fase de prática. Registrar prática manual continua
  // existindo, mas como diário de bordo — na aba Práticas, fora da trilha.
  return { label: '🎙️ Modo Copiloto', route: `/copiloto/${skill.key}` };
}

// Fetch + derivação compartilhados entre o popup compacto (SkillDetailSheet)
// e a tela cheia (SkillDetailContent, usada por skill/[id].tsx) — evita
// buscar/recalcular a mesma coisa duas vezes com implementações que podem
// divergir com o tempo.
export function useSkillDetail(skillKey: SkillKey | null) {
  const skill = skillKey ? SKILLS.find((candidate) => candidate.key === skillKey) : undefined;

  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  const [checklistSessions, setChecklistSessions] = useState<ChecklistSession[]>([]);
  const [monitorSessions, setMonitorSessions] = useState<MonitorSession[]>([]);
  const [quizPhases, setQuizPhases] = useState<QuizPhase[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadAll = useCallback(async () => {
    setLoadState('loading');
    try {
      const [practice, checklist, monitor, phases] = await Promise.all([
        getPracticeSessions(),
        getChecklistSessions(),
        getMonitorSessions(),
        getQuizPhases(),
      ]);
      setPracticeSessions(practice);
      setChecklistSessions(checklist);
      setMonitorSessions(monitor);
      setQuizPhases(phases);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível carregar seu progresso.',
      );
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    if (skillKey) {
      loadAll();
    }
  }, [skillKey, loadAll]);

  const progress: SkillProgress | undefined = skill
    ? computeSkillProgress(practiceSessions, checklistSessions, monitorSessions, quizPhases).find(
        (item) => item.skill.key === skill.key,
      )
    : undefined;
  const count = progress?.count ?? 0;
  const phase = progress?.phase ?? 'quiz';
  const bestQuizRatio = skill ? getQuizPhaseRatio(quizPhases, skill.key) : null;
  const quizLabel =
    bestQuizRatio !== null && bestQuizRatio >= QUIZ_PASS_RATIO ? '✅ Quiz aprovado — refazer' : '❓ Fazer o quiz';

  return {
    skill,
    loadState,
    errorMessage,
    reload: loadAll,
    count,
    phase,
    bestQuizRatio,
    quizLabel,
    practiceThreshold: MANEUVER_DONE_THRESHOLD,
  };
}
