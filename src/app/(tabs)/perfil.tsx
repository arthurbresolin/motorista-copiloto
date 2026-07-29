import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getChecklistSessions, type ChecklistSession } from '@/api/checklist';
import { ApiError } from '@/api/client';
import { getMonitorSessions, type MonitorSession } from '@/api/monitor-sessions';
import {
  getPracticeSessionStats,
  getPracticeSessions,
  type PracticeSession,
  type PracticeSessionStats,
} from '@/api/practice-sessions';
import { getQuizSessions, type QuizSession } from '@/api/quiz';
import {
  MascPlaceholder,
  OrganicButton,
  OrganicPill,
  OrganicSurface,
  OrganicText,
  SkillNode,
} from '@/components/organic';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { computeAchievements, computeStreak, computeXp } from '@/lib/gamification';
import { formatHoursMinutes } from '@/lib/format';

type LoadState = 'loading' | 'error' | 'ready';

export default function PerfilScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [checklistSessions, setChecklistSessions] = useState<ChecklistSession[]>([]);
  const [monitorSessions, setMonitorSessions] = useState<MonitorSession[]>([]);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [stats, setStats] = useState<PracticeSessionStats | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadAll = useCallback(async () => {
    setLoadState('loading');
    try {
      const [practice, checklist, monitor, quiz, practiceStats] = await Promise.all([
        getPracticeSessions(),
        getChecklistSessions(),
        getMonitorSessions(),
        getQuizSessions(),
        getPracticeSessionStats(),
      ]);
      setSessions(practice);
      setChecklistSessions(checklist);
      setMonitorSessions(monitor);
      setQuizSessions(quiz);
      setStats(practiceStats);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível carregar seu perfil.',
      );
      setLoadState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const streak = computeStreak(sessions);
  const xp = computeXp(sessions.length, checklistSessions.length, quizSessions.length);
  const achievements = computeAchievements(sessions, streak, monitorSessions, quizSessions.length);

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <View style={styles.container}>
        <View style={[styles.titleContainer, styles.titleRow]}>
          <View>
            <OrganicText size="title">Perfil</OrganicText>
            <OrganicText color="textSecondary">aprendiz · {sessions.length} práticas</OrganicText>
          </View>
          <MascPlaceholder size={52} />
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
            <View style={styles.statsRow}>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.statCard}>
                <OrganicText size="title">{streak > 0 ? `🔥 ${streak}` : '👋'}</OrganicText>
                <OrganicText size="small" color="textSecondary">
                  streak
                </OrganicText>
              </OrganicSurface>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.statCard}>
                <OrganicText size="title">{xp}</OrganicText>
                <OrganicText size="small" color="textSecondary">
                  XP
                </OrganicText>
              </OrganicSurface>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.statCard}>
                <OrganicText size="title">{stats ? formatHoursMinutes(stats.total_minutes) : '—'}</OrganicText>
                <OrganicText size="small" color="textSecondary">
                  no volante
                </OrganicText>
              </OrganicSurface>
            </View>

            <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
              <OrganicText size="small">Conquistas</OrganicText>
              <View style={styles.achievementsRow}>
                {achievements.map((achievement) => (
                  <View key={achievement.key} style={styles.achievementItem}>
                    <SkillNode
                      state={achievement.unlocked ? 'done' : 'locked'}
                      label={achievement.label}
                    />
                    <OrganicText size="small" color="textSecondary" style={styles.achievementLabel}>
                      {achievement.label}
                    </OrganicText>
                  </View>
                ))}
              </View>
            </OrganicSurface>

            <OrganicSurface backgroundColor="backgroundElement" shadow={false} style={styles.disabledCard}>
              <OrganicText size="small">Instrutor / acompanhante</OrganicText>
              <OrganicText size="small" color="textSecondary">
                Convide quem te acompanha pra ver seu progresso e avaliar suas manobras.
              </OrganicText>
              <OrganicPill label="em breve" backgroundColor="backgroundSelected" textColor="textSecondary" />
            </OrganicSurface>

            <OrganicButton
              label="🚗 Meus carros"
              variant="neutral"
              onPress={() => router.push('/meu-carro')}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
  },
  titleContainer: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  centerText: {
    textAlign: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    padding: Spacing.three,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  achievementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  achievementItem: {
    alignItems: 'center',
    gap: Spacing.one,
    width: 64,
  },
  achievementLabel: {
    textAlign: 'center',
  },
  disabledCard: {
    gap: Spacing.one,
    padding: Spacing.three,
    opacity: 0.6,
  },
});
