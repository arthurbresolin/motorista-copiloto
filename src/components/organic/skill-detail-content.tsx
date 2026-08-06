import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getChecklistSessions, type ChecklistSession } from '@/api/checklist';
import { ApiError } from '@/api/client';
import { getMonitorSessions, type MonitorSession } from '@/api/monitor-sessions';
import { getPracticeSessions, type PracticeSession } from '@/api/practice-sessions';
import { getQuizSessions, type QuizSession } from '@/api/quiz';
import { OrganicButton } from './button';
import { OrganicProgressBar } from './progress-bar';
import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import { MANEUVER_DONE_THRESHOLD, SKILLS, type Skill, type SkillKey } from '@/constants/skills';
import { Spacing } from '@/constants/theme';
import { computeSkillProgress, getBestQuizRatio, QUIZ_PASS_RATIO } from '@/lib/gamification';

type LoadState = 'loading' | 'error' | 'ready';

function practiceAction(skill: Skill): { label: string; route: string } {
  if (skill.key === 'checklist') {
    return { label: '✅ Fazer checklist', route: '/checklist' };
  }
  if (skill.key === 'direcao-suave') {
    return { label: '🚦 Monitorar sessão', route: '/monitor' };
  }
  return { label: '📝 Registrar prática manual', route: '/nova-pratica' };
}

export function SkillDetailContent({ skillKey }: { skillKey: SkillKey }) {
  const router = useRouter();
  const skill = SKILLS.find((candidate) => candidate.key === skillKey);

  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  const [checklistSessions, setChecklistSessions] = useState<ChecklistSession[]>([]);
  const [monitorSessions, setMonitorSessions] = useState<MonitorSession[]>([]);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadAll = useCallback(async () => {
    setLoadState('loading');
    try {
      const [practice, checklist, monitor, quiz] = await Promise.all([
        getPracticeSessions(),
        getChecklistSessions(),
        getMonitorSessions(),
        getQuizSessions(),
      ]);
      setPracticeSessions(practice);
      setChecklistSessions(checklist);
      setMonitorSessions(monitor);
      setQuizSessions(quiz);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível carregar seu progresso.',
      );
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (!skill) {
    return (
      <View style={styles.centerContent}>
        <OrganicText color="textSecondary">Habilidade não encontrada.</OrganicText>
      </View>
    );
  }

  const progress = computeSkillProgress(
    practiceSessions,
    checklistSessions,
    monitorSessions,
    quizSessions,
  ).find((item) => item.skill.key === skill.key);
  const count = progress?.count ?? 0;
  const phase = progress?.phase ?? 'quiz';
  const bestQuizRatio = getBestQuizRatio(quizSessions, skill.key);
  const quizLabel =
    bestQuizRatio !== null && bestQuizRatio >= QUIZ_PASS_RATIO ? '✅ Quiz aprovado — refazer' : '❓ Fazer o quiz';
  const practice = practiceAction(skill);

  return (
    <View style={styles.wrapper}>
      <View style={styles.titleContainer}>
        <OrganicText size="subtitle">{skill.label}</OrganicText>
        {loadState === 'ready' && (
          <>
            <OrganicProgressBar progress={count / MANEUVER_DONE_THRESHOLD} />
            <OrganicText size="small" color="textSecondary">
              {Math.min(count, MANEUVER_DONE_THRESHOLD)} de {MANEUVER_DONE_THRESHOLD} pra destravar
            </OrganicText>
          </>
        )}
      </View>

      {loadState === 'loading' && (
        <View style={styles.centerContent}>
          <ActivityIndicator />
        </View>
      )}

      {loadState === 'error' && (
        <View style={styles.centerContent}>
          <OrganicText color="textSecondary" style={styles.centerText}>
            {errorMessage}
          </OrganicText>
          <OrganicButton label="Tentar novamente" variant="neutral" onPress={loadAll} />
        </View>
      )}

      {loadState === 'ready' && (
        <View style={styles.sectionsWrapper}>
          <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
            <OrganicText size="small">Sobre essa habilidade</OrganicText>
            <OrganicText color="textSecondary">{skill.description}</OrganicText>
          </OrganicSurface>

          <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
            <OrganicText size="small">Antes de praticar</OrganicText>
            {skill.tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <OrganicText color="textSecondary">•</OrganicText>
                <OrganicText color="textSecondary" style={styles.tipText}>
                  {tip}
                </OrganicText>
              </View>
            ))}
          </OrganicSurface>

          {phase === 'quiz' ? (
            <>
              <OrganicButton label={quizLabel} onPress={() => router.push(`/quiz/${skill.key}`)} />
              {skill.maneuver && (
                <OrganicButton label="🎙️ Modo Copiloto" variant="neutral" disabled onPress={() => {}} />
              )}
              <OrganicButton label={practice.label} variant="neutral" disabled onPress={() => {}} />
              <OrganicText size="small" color="textSecondary" style={styles.centerText}>
                Conclua o quiz primeiro pra liberar a prática.
              </OrganicText>
            </>
          ) : (
            <>
              {skill.maneuver && (
                <OrganicButton
                  label="🎙️ Modo Copiloto"
                  onPress={() => router.push(`/copiloto/${skill.key}`)}
                />
              )}
              <OrganicButton
                label={practice.label}
                variant={skill.maneuver ? 'neutral' : 'accent'}
                onPress={() => router.push(practice.route as never)}
              />
              <OrganicButton label={quizLabel} variant="neutral" onPress={() => router.push(`/quiz/${skill.key}`)} />
            </>
          )}

          {bestQuizRatio !== null && (
            <OrganicText size="small" color="textSecondary" style={styles.centerText}>
              Melhor resultado no quiz: {Math.round(bestQuizRatio * 100)}%
            </OrganicText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.four,
  },
  titleContainer: {
    gap: Spacing.two,
  },
  centerContent: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  centerText: {
    textAlign: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.three,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  tipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tipText: {
    flex: 1,
  },
});
