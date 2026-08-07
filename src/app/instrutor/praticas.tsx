import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { getInstructorOverview, type InstructorOverview } from '@/api/instructors';
import { OrganicButton, OrganicPill, OrganicSurface, OrganicText, ScreenBackground } from '@/components/organic';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { formatHoursMinutes } from '@/lib/format';
import { clearInstructorToken, getInstructorToken } from '@/lib/instructor-auth-storage';

type LoadState = 'loading' | 'error' | 'unauthenticated' | 'ready';

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export default function InstructorPracticesScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = { ...safeAreaInsets, bottom: safeAreaInsets.bottom + Spacing.three };

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [overview, setOverview] = useState<InstructorOverview | null>(null);

  const load = useCallback(async () => {
    setLoadState('loading');
    const token = await getInstructorToken();
    if (!token) {
      setLoadState('unauthenticated');
      return;
    }
    try {
      setOverview(await getInstructorOverview(token));
      setLoadState('ready');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearInstructorToken();
        setLoadState('unauthenticated');
        router.replace('/instrutor');
        return;
      }
      setErrorMessage(error instanceof ApiError ? error.message : 'Não foi possível carregar as práticas.');
      setLoadState('error');
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentInset={insets}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <View style={styles.container}>
          <Stack.Screen options={{ title: 'Práticas (leitura)' }} />
          <View style={styles.titleContainer}>
            <OrganicText size="subtitle">Práticas</OrganicText>
            <OrganicText color="textSecondary">
              Sessões de prática do aluno, mais recentes primeiro — só leitura.
            </OrganicText>

            {loadState === 'ready' && overview && (
              <View style={styles.statsRow}>
                <OrganicPill label={`${overview.practice_stats.total_sessions} sessões`} backgroundColor="backgroundElement" />
                <OrganicPill label={`${overview.practice_stats.total_km} km`} backgroundColor="backgroundElement" />
                <OrganicPill
                  label={formatHoursMinutes(overview.practice_stats.total_minutes)}
                  backgroundColor="backgroundElement"
                />
              </View>
            )}
          </View>

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

          {loadState === 'ready' && overview && overview.practice_sessions.length === 0 && (
            <View style={styles.centerContent}>
              <OrganicText color="textSecondary" style={styles.centerText}>
                O aluno ainda não registrou nenhuma sessão de prática.
              </OrganicText>
            </View>
          )}

          {loadState === 'ready' && overview && overview.practice_sessions.length > 0 && (
            <View style={styles.sessionsWrapper}>
              {overview.practice_sessions.map((session) => (
                <OrganicSurface key={session.id} backgroundColor="backgroundElement" style={styles.sessionCard}>
                  <View style={styles.sessionHeaderRow}>
                    <OrganicText size="small">{formatDate(session.practiced_at)}</OrganicText>
                    <OrganicText size="small" color="textSecondary">
                      {session.duration_minutes} min · {session.distance_km} km
                    </OrganicText>
                  </View>
                  <OrganicText size="small" color="textSecondary">
                    {session.maneuvers.length > 0 ? session.maneuvers.join(', ') : 'Nenhuma manobra registrada'}
                  </OrganicText>
                  {session.notes && <OrganicText size="small">{session.notes}</OrganicText>}
                </OrganicSurface>
              ))}
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
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sessionsWrapper: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  sessionCard: {
    gap: Spacing.one,
    padding: Spacing.three,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
