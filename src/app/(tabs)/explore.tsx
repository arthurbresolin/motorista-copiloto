import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { ApiError } from '@/api/client';
import {
  getPracticeSessionStats,
  getPracticeSessions,
  type PracticeSession,
  type PracticeSessionStats,
} from '@/api/practice-sessions';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LoadState = 'loading' | 'error' | 'ready';

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function formatHoursMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h${String(minutes).padStart(2, '0')}` : `${minutes}min`;
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
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Práticas</ThemedText>
          <ThemedText themeColor="textSecondary">
            Suas sessões de prática registradas, mais recentes primeiro.
          </ThemedText>

          {statsLoadState === 'ready' && stats && (
            <ThemedView style={styles.statsRow}>
              <ThemedView type="backgroundElement" style={styles.statPill}>
                <ThemedText type="small">{stats.total_sessions} sessões</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.statPill}>
                <ThemedText type="small">{stats.total_km} km</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.statPill}>
                <ThemedText type="small">{formatHoursMinutes(stats.total_minutes)}</ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          <Pressable
            onPress={() => router.push('/nova-pratica')}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="accent" style={styles.linkButton}>
              <ThemedText type="link" themeColor="onAccent">
                + Nova sessão de prática
              </ThemedText>
            </ThemedView>
          </Pressable>
        </ThemedView>

        {loadState === 'loading' && (
          <ThemedView style={styles.centerContent}>
            <ActivityIndicator />
          </ThemedView>
        )}

        {loadState === 'error' && (
          <ThemedView style={styles.centerContent}>
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              {errorMessage}
            </ThemedText>
            <Pressable onPress={loadSessions} style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.linkButton}>
                <ThemedText type="link">Tentar novamente</ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        )}

        {loadState === 'ready' && sessions.length === 0 && (
          <ThemedView style={styles.centerContent}>
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              Você ainda não registrou nenhuma sessão de prática.{'\n'}Toque em &quot;+ Nova sessão
              de prática&quot; para começar.
            </ThemedText>
          </ThemedView>
        )}

        {loadState === 'ready' && sessions.length > 0 && (
          <ThemedView style={styles.sessionsWrapper}>
            {sessions.map((session) => (
              <ThemedView key={session.id} type="backgroundElement" style={styles.sessionCard}>
                <ThemedView style={styles.sessionHeaderRow}>
                  <ThemedText type="smallBold">{formatDate(session.practiced_at)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {session.duration_minutes} min · {session.distance_km} km
                  </ThemedText>
                </ThemedView>

                <ThemedText type="small" themeColor="textSecondary">
                  {session.maneuvers.length > 0
                    ? session.maneuvers.join(', ')
                    : 'Nenhuma manobra registrada'}
                </ThemedText>

                {session.notes && <ThemedText type="small">{session.notes}</ThemedText>}
              </ThemedView>
            ))}
          </ThemedView>
        )}
      </ThemedView>
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
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
  },
  sessionsWrapper: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  sessionCard: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
