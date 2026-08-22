import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { getInstructorOverview, getInstructorProfile, type Instructor } from '@/api/instructors';
import { OrganicButton, OrganicSurface, OrganicText, ScreenBackground, SkillNode } from '@/components/organic';
import { MaxContentWidth, RadiusSm, Spacing } from '@/constants/theme';
import {
  computeAchievements,
  computeLastSevenDays,
  computeLevel,
  computeMonitorEventTrend,
  computeStreak,
  computeXp,
} from '@/lib/gamification';
import { clearInstructorToken, getInstructorToken } from '@/lib/instructor-auth-storage';
import { formatHoursMinutes } from '@/lib/format';

type LoadState = 'loading' | 'error' | 'unauthenticated' | 'ready';

const TREND_CHART_HEIGHT = 44;

export default function InstructorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [weekDays, setWeekDays] = useState<{ label: string; minutes: number; km: number }[]>([]);
  const [eventTrend, setEventTrend] = useState<
    { label: string; eventCount: number; severeEventCount: number }[]
  >([]);
  const [achievements, setAchievements] = useState<ReturnType<typeof computeAchievements>>([]);

  const load = useCallback(async () => {
    setLoadState('loading');
    const token = await getInstructorToken();
    if (!token) {
      setLoadState('unauthenticated');
      return;
    }
    try {
      const [profile, overview] = await Promise.all([
        getInstructorProfile(token),
        getInstructorOverview(token),
      ]);
      setInstructor(profile);
      setStreak(computeStreak(overview.practice_sessions));
      setXp(
        computeXp(
          overview.practice_sessions.length,
          overview.checklist_sessions.length,
          overview.quiz_sessions.length,
          overview.monitor_sessions,
        ),
      );
      setTotalMinutes(overview.practice_stats.total_minutes);
      setWeekDays(computeLastSevenDays(overview.practice_sessions));
      setEventTrend(computeMonitorEventTrend(overview.monitor_sessions));
      setAchievements(
        computeAchievements(
          overview.practice_sessions,
          computeStreak(overview.practice_sessions),
          overview.monitor_sessions,
          overview.quiz_sessions.length,
          overview.practice_stats.total_km,
        ),
      );
      setLoadState('ready');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearInstructorToken();
        setLoadState('unauthenticated');
        return;
      }
      setErrorMessage(error instanceof ApiError ? error.message : 'Não foi possível carregar o painel.');
      setLoadState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (loadState === 'unauthenticated') {
      router.replace('/instrutor');
    }
  }, [loadState, router]);

  async function handleLogout() {
    await clearInstructorToken();
    router.replace('/instrutor');
  }

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom + Spacing.four,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  const maxWeekKm = Math.max(1, ...weekDays.map((day) => day.km));
  const maxTrendEvents = Math.max(1, ...eventTrend.map((session) => session.eventCount));

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <View style={styles.container}>
          <Stack.Screen options={{ title: 'Painel do instrutor' }} />

          <OrganicText size="title">Painel</OrganicText>
          {instructor && (
            <OrganicText color="textSecondary">
              {instructor.name ? `${instructor.name} · ` : ''}
              acompanhando o progresso — visão só leitura
            </OrganicText>
          )}

          {(loadState === 'loading' || loadState === 'unauthenticated') && (
            <View style={styles.centerContent}>
              <ActivityIndicator />
            </View>
          )}

          {loadState === 'error' && (
            <View style={styles.centerContent}>
              <OrganicText color="textSecondary" style={styles.centerText}>
                {errorMessage}
              </OrganicText>
              <OrganicButton label="Tentar novamente" variant="neutral" onPress={load} />
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
                  <OrganicText size="title">{`nível ${computeLevel(xp)}`}</OrganicText>
                  <OrganicText size="small" color="textSecondary">
                    {xp} XP
                  </OrganicText>
                </OrganicSurface>
                <OrganicSurface backgroundColor="backgroundElement" style={styles.statCard}>
                  <OrganicText size="title">{formatHoursMinutes(totalMinutes)}</OrganicText>
                  <OrganicText size="small" color="textSecondary">
                    no volante
                  </OrganicText>
                </OrganicSurface>
              </View>

              <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
                <OrganicText size="small">Km rodados (7 dias)</OrganicText>
                <View style={styles.trendChart}>
                  {weekDays.map((day, index) => (
                    <View key={index} style={styles.trendBarColumn}>
                      <View style={[styles.trendBarTrack, { height: TREND_CHART_HEIGHT }]}>
                        <OrganicSurface
                          backgroundColor={day.km > 0 ? 'accent' : 'backgroundSelected'}
                          inset={day.km === 0}
                          shadow={false}
                          borderRadius={RadiusSm * 0.5}
                          style={{
                            width: '100%',
                            height: Math.max(4, (day.km / maxWeekKm) * TREND_CHART_HEIGHT),
                          }}
                        />
                      </View>
                      <OrganicText size="small" color="textSecondary">
                        {day.label}
                      </OrganicText>
                    </View>
                  ))}
                </View>
              </OrganicSurface>

              <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
                <OrganicText size="small">Eventos bruscos por sessão monitorada</OrganicText>
                {eventTrend.length === 0 ? (
                  <OrganicText size="small" color="textSecondary">
                    Nenhuma sessão de monitoramento registrada ainda.
                  </OrganicText>
                ) : (
                  <View style={styles.trendChart}>
                    {eventTrend.map((session, index) => (
                      <View key={index} style={styles.trendBarColumn}>
                        <View style={[styles.trendBarTrack, { height: TREND_CHART_HEIGHT }]}>
                          <OrganicSurface
                            backgroundColor={
                              session.severeEventCount > 0
                                ? 'warning'
                                : session.eventCount > 0
                                  ? 'accent'
                                  : 'backgroundSelected'
                            }
                            inset={session.eventCount === 0}
                            shadow={false}
                            borderRadius={RadiusSm * 0.5}
                            style={{
                              width: '100%',
                              height: Math.max(4, (session.eventCount / maxTrendEvents) * TREND_CHART_HEIGHT),
                            }}
                          />
                        </View>
                        <OrganicText size="small" color="textSecondary">
                          {session.label}
                        </OrganicText>
                      </View>
                    ))}
                  </View>
                )}
              </OrganicSurface>

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

              <OrganicButton label="🛣️ Ver trilha" variant="neutral" onPress={() => router.push('/instrutor/trilha')} />
              <OrganicButton label="🚗 Ver práticas" variant="neutral" onPress={() => router.push('/instrutor/praticas')} />
              <OrganicButton label="Sair" variant="neutral" onPress={handleLogout} />
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
    gap: Spacing.three,
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
    gap: Spacing.four,
    paddingTop: Spacing.two,
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
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  trendBarColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  trendBarTrack: {
    width: '100%',
    justifyContent: 'flex-end',
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
});
