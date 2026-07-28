import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getChecklistSessions, type ChecklistSession } from '@/api/checklist';
import { ApiError } from '@/api/client';
import { getMonitorSessions, type MonitorSession } from '@/api/monitor-sessions';
import { getPracticeSessions, type PracticeSession } from '@/api/practice-sessions';
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
import { computeAchievements, computeSkillProgress, computeXp } from '@/lib/gamification';

type LoadState = 'loading' | 'error' | 'ready';

const WEEKDAY_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const WEEK_CHART_HEIGHT = 44;

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function computeStreak(sessions: PracticeSession[]) {
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

function computeLastSevenDays(sessions: PracticeSession[]) {
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

export default function HomeScreen() {
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

  const loadSessions = useCallback(async () => {
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
        error instanceof ApiError ? error.message : 'Não foi possível carregar seu progresso.',
      );
      setLoadState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  const streak = computeStreak(sessions);
  const weekDays = computeLastSevenDays(sessions);
  const maxWeekMinutes = Math.max(1, ...weekDays.map((day) => day.minutes));
  const skillProgress = computeSkillProgress(sessions, checklistSessions, monitorSessions);
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
            <OrganicText size="subtitle">Oi! 👋</OrganicText>
            <OrganicText color="textSecondary">Pronto pra dirigir hoje?</OrganicText>
          </View>
          <MascPlaceholder size={40} />
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
            <OrganicButton label="Tentar novamente" variant="neutral" onPress={loadSessions} />
          </View>
        )}

        {loadState === 'ready' && (
          <View style={styles.sectionsWrapper}>
            <OrganicSurface backgroundColor="accent" style={styles.streakCard}>
              <OrganicText size="title" color="onAccent">
                {streak > 0 ? `🔥 ${streak}` : '👋'}
              </OrganicText>
              <OrganicText size="small" color="onAccent" style={styles.streakLabel}>
                {streak > 0
                  ? 'dias seguidos — não quebre a corrente!'
                  : 'comece uma sessão de prática pra iniciar sua sequência'}
              </OrganicText>
              <OrganicPill label={`XP ${xp}`} backgroundColor="background" />
            </OrganicSurface>

            <View style={styles.quickLinksRow}>
              <Pressable
                onPress={() => router.push('/checklist')}
                style={({ pressed }) => [styles.quickLink, pressed && styles.pressed]}>
                <OrganicSurface backgroundColor="backgroundElement" style={styles.quickLinkCard}>
                  <OrganicText size="small">✅ Checklist</OrganicText>
                  <OrganicText size="small" color="textSecondary">
                    antes de sair
                  </OrganicText>
                </OrganicSurface>
              </Pressable>
              <Pressable
                onPress={() => router.push('/nova-pratica')}
                style={({ pressed }) => [styles.quickLink, pressed && styles.pressed]}>
                <OrganicSurface backgroundColor="backgroundElement" style={styles.quickLinkCard}>
                  <OrganicText size="small">🚗 Praticar</OrganicText>
                  <OrganicText size="small" color="textSecondary">
                    nova sessão
                  </OrganicText>
                </OrganicSurface>
              </Pressable>
            </View>

            <OrganicSurface backgroundColor="backgroundElement" style={styles.weekCard}>
              <OrganicText size="small">Sua semana</OrganicText>
              <View style={styles.weekChart}>
                {weekDays.map((day, index) => (
                  <View key={index} style={styles.weekBarColumn}>
                    <View
                      style={[
                        styles.weekBar,
                        {
                          backgroundColor: theme.barFill,
                          height: Math.max(4, (day.minutes / maxWeekMinutes) * WEEK_CHART_HEIGHT),
                        },
                      ]}
                    />
                    <OrganicText size="small" color="textSecondary">
                      {day.label}
                    </OrganicText>
                  </View>
                ))}
              </View>
              <OrganicText size="small" color="textSecondary">
                min. de prática por dia
              </OrganicText>
            </OrganicSurface>

            <OrganicSurface backgroundColor="backgroundElement" style={styles.trailCard}>
              <OrganicText size="small">Sua trilha</OrganicText>
              <View style={styles.trailRow}>
                {skillProgress.map(({ skill, state }) => (
                  <Pressable
                    key={skill.key}
                    onPress={() => router.push(`/skill/${skill.key}`)}
                    style={({ pressed }) => [styles.trailItem, pressed && styles.pressed]}>
                    <SkillNode state={state} label={skill.label} />
                    <OrganicText size="small" color="textSecondary" style={styles.trailLabel}>
                      {skill.label}
                    </OrganicText>
                  </Pressable>
                ))}
              </View>
            </OrganicSurface>

            <OrganicSurface backgroundColor="backgroundElement" style={styles.trailCard}>
              <OrganicText size="small">Conquistas</OrganicText>
              <View style={styles.trailRow}>
                {achievements.map((achievement) => (
                  <View key={achievement.key} style={styles.trailItem}>
                    <SkillNode
                      state={achievement.unlocked ? 'done' : 'locked'}
                      label={achievement.label}
                    />
                    <OrganicText size="small" color="textSecondary" style={styles.trailLabel}>
                      {achievement.label}
                    </OrganicText>
                  </View>
                ))}
              </View>
            </OrganicSurface>

            <View style={styles.ctaWrapper}>
              <OrganicButton label="🚗 Sair pra dirigir" onPress={() => router.push('/monitor')} />
            </View>
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
  pressed: {
    opacity: 0.7,
  },
  sectionsWrapper: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  streakLabel: {
    flex: 1,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  quickLink: {
    flex: 1,
  },
  quickLinkCard: {
    gap: Spacing.half,
    padding: Spacing.three,
  },
  weekCard: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  weekChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    height: WEEK_CHART_HEIGHT + Spacing.four,
  },
  weekBarColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  weekBar: {
    width: '100%',
    borderRadius: Spacing.one,
  },
  trailCard: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  trailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  trailItem: {
    alignItems: 'center',
    gap: Spacing.one,
    width: 64,
  },
  trailLabel: {
    textAlign: 'center',
  },
  ctaWrapper: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
