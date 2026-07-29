import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { ApiError } from '@/api/client';
import {
  getPracticeSessionStats,
  getPracticeSessions,
  type PracticeSession,
  type PracticeSessionStats,
} from '@/api/practice-sessions';
import { OrganicButton, OrganicPill, OrganicSurface, OrganicText } from '@/components/organic';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatHoursMinutes } from '@/lib/format';

type LoadState = 'loading' | 'error' | 'ready';

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export default function HistoricoScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [stats, setStats] = useState<PracticeSessionStats | null>(null);
  const [statsLoadState, setStatsLoadState] = useState<LoadState>('loading');

  const loadSessions = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await getPracticeSessions();
      setSessions(data);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível carregar o histórico.',
      );
      setLoadState('error');
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoadState('loading');
    try {
      const data = await getPracticeSessionStats();
      setStats(data);
      setStatsLoadState('ready');
    } catch {
      setStatsLoadState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
      loadStats();
    }, [loadSessions, loadStats]),
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
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <OrganicText size="subtitle">Práticas</OrganicText>
          <OrganicText color="textSecondary">
            Suas sessões de prática registradas, mais recentes primeiro.
          </OrganicText>

          {statsLoadState === 'ready' && stats && (
            <View style={styles.statsRow}>
              <OrganicPill label={`${stats.total_sessions} sessões`} backgroundColor="backgroundElement" />
              <OrganicPill label={`${stats.total_km} km`} backgroundColor="backgroundElement" />
              <OrganicPill
                label={formatHoursMinutes(stats.total_minutes)}
                backgroundColor="backgroundElement"
              />
            </View>
          )}

          <OrganicButton label="+ Nova sessão de prática" onPress={() => router.push('/nova-pratica')} />
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

        {loadState === 'ready' && sessions.length === 0 && (
          <View style={styles.centerContent}>
            <OrganicText color="textSecondary" style={styles.centerText}>
              Você ainda não registrou nenhuma sessão de prática.{'\n'}Toque em &quot;+ Nova sessão de
              prática&quot; para começar.
            </OrganicText>
          </View>
        )}

        {loadState === 'ready' && sessions.length > 0 && (
          <View style={styles.sessionsWrapper}>
            {sessions.map((session) => (
              <OrganicSurface key={session.id} backgroundColor="backgroundElement" style={styles.sessionCard}>
                <View style={styles.sessionHeaderRow}>
                  <OrganicText size="small">{formatDate(session.practiced_at)}</OrganicText>
                  <OrganicText size="small" color="textSecondary">
                    {session.duration_minutes} min · {session.distance_km} km
                  </OrganicText>
                </View>

                <OrganicText size="small" color="textSecondary">
                  {session.maneuvers.length > 0
                    ? session.maneuvers.join(', ')
                    : 'Nenhuma manobra registrada'}
                </OrganicText>

                {session.notes && <OrganicText size="small">{session.notes}</OrganicText>}
              </OrganicSurface>
            ))}
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
