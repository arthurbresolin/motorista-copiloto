import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import {
  createMonitorSession,
  getMonitorSessions,
  type MonitorSession,
} from '@/api/monitor-sessions';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isHarshEvent, type AccelerometerReading } from '@/lib/harsh-event-detector';

type MonitorState = 'idle' | 'checking' | 'unavailable' | 'monitoring';
type HistoryState = 'loading' | 'error' | 'ready';

const ALERT_VISIBLE_DURATION_MS = 2500;
const UPDATE_INTERVAL_MS = 200;

function formatDateTime(isoDateTime: string) {
  const date = new Date(isoDateTime);
  const day = date.toLocaleDateString('pt-BR');
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day} às ${time}`;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}min ${seconds.toString().padStart(2, '0')}s`;
}

export default function MonitorScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [state, setState] = useState<MonitorState>('idle');
  const [eventCount, setEventCount] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);

  const [history, setHistory] = useState<MonitorSession[]>([]);
  const [historyState, setHistoryState] = useState<HistoryState>('loading');
  const [historyError, setHistoryError] = useState('');

  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const previousReadingRef = useRef<AccelerometerReading | null>(null);
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<Date | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryState('loading');
    try {
      const data = await getMonitorSessions();
      setHistory(data);
      setHistoryState('ready');
    } catch (error) {
      setHistoryError(
        error instanceof ApiError ? error.message : 'Não foi possível carregar o histórico.',
      );
      setHistoryState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  function showAlert() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setAlertVisible(true);
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    alertTimeoutRef.current = setTimeout(() => setAlertVisible(false), ALERT_VISIBLE_DURATION_MS);
  }

  async function startMonitoring() {
    setState('checking');

    const isAvailable = await Accelerometer.isAvailableAsync();
    if (!isAvailable) {
      setState('unavailable');
      return;
    }

    if (Platform.OS === 'web') {
      const { granted } = await Accelerometer.requestPermissionsAsync();
      if (!granted) {
        setState('unavailable');
        return;
      }
    }

    previousReadingRef.current = null;
    startedAtRef.current = new Date();
    setEventCount(0);
    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    subscriptionRef.current = Accelerometer.addListener((reading) => {
      const previous = previousReadingRef.current;
      if (previous && isHarshEvent(previous, reading)) {
        setEventCount((count) => count + 1);
        showAlert();
      }
      previousReadingRef.current = reading;
    });
    setState('monitoring');
  }

  function stopMonitoring() {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    previousReadingRef.current = null;
    setState('idle');

    const startedAt = startedAtRef.current;
    startedAtRef.current = null;
    if (startedAt) {
      const durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);
      // Resumo não é crítico para o fluxo: falha de rede não deve interromper o usuário.
      createMonitorSession({
        started_at: startedAt.toISOString(),
        duration_seconds: durationSeconds,
        event_count: eventCount,
      })
        .then(loadHistory)
        .catch(() => {});
    }
  }

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Monitor de direção</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            Avisa com vibração quando detecta uma freada ou aceleração brusca durante a prática.
          </ThemedText>
        </ThemedView>

        {alertVisible && (
          <ThemedView style={styles.alertBanner}>
            <ThemedText type="smallBold" style={styles.alertText}>
              Movimento brusco detectado!
            </ThemedText>
          </ThemedView>
        )}

        {state === 'unavailable' && (
          <ThemedView style={styles.centerContent}>
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              Não foi possível acessar o sensor de movimento neste aparelho.
            </ThemedText>
            <Pressable onPress={startMonitoring} style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.actionButton}>
                <ThemedText type="link">Tentar novamente</ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        )}

        {(state === 'idle' || state === 'checking') && (
          <ThemedView style={styles.centerContent}>
            <Pressable
              disabled={state === 'checking'}
              onPress={startMonitoring}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.actionButton}>
                <ThemedText type="link">
                  {state === 'checking' ? 'Verificando sensor…' : 'Iniciar monitoramento'}
                </ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        )}

        {state === 'monitoring' && (
          <ThemedView style={styles.centerContent}>
            <ThemedText type="smallBold">Monitorando…</ThemedText>
            <ThemedText themeColor="textSecondary">
              {eventCount === 0
                ? 'Nenhum movimento brusco até agora.'
                : `${eventCount} movimento(s) brusco(s) detectado(s).`}
            </ThemedText>
            <Pressable onPress={stopMonitoring} style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.actionButton}>
                <ThemedText type="link">Parar monitoramento</ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        )}

        <ThemedView style={styles.historySection}>
          <ThemedText type="smallBold">Sessões anteriores</ThemedText>

          {historyState === 'loading' && (
            <ThemedView style={styles.centerContent}>
              <ActivityIndicator />
            </ThemedView>
          )}

          {historyState === 'error' && (
            <ThemedView style={styles.centerContent}>
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                {historyError}
              </ThemedText>
              <Pressable onPress={loadHistory} style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView type="backgroundElement" style={styles.actionButton}>
                  <ThemedText type="link">Tentar novamente</ThemedText>
                </ThemedView>
              </Pressable>
            </ThemedView>
          )}

          {historyState === 'ready' && history.length === 0 && (
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              Nenhuma sessão de monitoramento registrada ainda.
            </ThemedText>
          )}

          {historyState === 'ready' && history.length > 0 && (
            <ThemedView style={styles.historyWrapper}>
              {history.map((session) => (
                <ThemedView key={session.id} type="backgroundElement" style={styles.historyCard}>
                  <ThemedText type="small">{formatDateTime(session.started_at)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatDuration(session.duration_seconds)} ·{' '}
                    {session.event_count === 0
                      ? 'nenhum movimento brusco'
                      : `${session.event_count} movimento(s) brusco(s)`}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          )}
        </ThemedView>
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
    paddingHorizontal: Spacing.four,
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
    gap: Spacing.four,
  },
  titleContainer: {
    gap: Spacing.two,
    alignItems: 'center',
    paddingTop: Spacing.three,
  },
  centerContent: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  actionButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  alertBanner: {
    backgroundColor: '#E0B400',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  alertText: {
    color: '#000000',
  },
  historySection: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  historyWrapper: {
    gap: Spacing.two,
  },
  historyCard: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
