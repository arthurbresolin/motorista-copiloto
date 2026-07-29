import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getChecklistSessions, type ChecklistSession } from '@/api/checklist';
import { ApiError } from '@/api/client';
import { getMonitorSessions, type MonitorSession } from '@/api/monitor-sessions';
import { getPracticeSessions, type PracticeSession } from '@/api/practice-sessions';
import { getQuizSessions, type QuizSession } from '@/api/quiz';
import { OrganicButton, OrganicPill, OrganicSurface, OrganicText, SkillTrail } from '@/components/organic';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { computeSkillProgress, computeStreak, computeXp } from '@/lib/gamification';

type LoadState = 'loading' | 'error' | 'ready';

export default function TrilhaScreen() {
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
      setSessions(practice);
      setChecklistSessions(checklist);
      setMonitorSessions(monitor);
      setQuizSessions(quiz);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível carregar sua trilha.',
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
  const skillProgress = computeSkillProgress(sessions, checklistSessions, monitorSessions);
  const doneCount = skillProgress.filter((item) => item.state === 'done').length;

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
        <View style={styles.pillRow}>
          <OrganicPill label={`🔥 ${streak}`} backgroundColor="backgroundElement" />
          <OrganicPill label={`⭐ ${xp}`} backgroundColor="backgroundElement" />
        </View>

        {loadState === 'ready' && (
          <OrganicSurface backgroundColor="accent" style={styles.unitBanner}>
            <OrganicText size="small" color="onAccent">
              SUA TRILHA
            </OrganicText>
            <OrganicText size="subtitle" color="onAccent">
              {doneCount} de {skillProgress.length} habilidades
            </OrganicText>
          </OrganicSurface>
        )}

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
          <View style={styles.trailWrapper}>
            <SkillTrail items={skillProgress} onPressSkill={(key) => router.push(`/skill/${key}`)} />
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
    gap: Spacing.three,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
  },
  unitBanner: {
    marginHorizontal: Spacing.four,
    gap: Spacing.half,
    padding: Spacing.three,
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
  trailWrapper: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
});
