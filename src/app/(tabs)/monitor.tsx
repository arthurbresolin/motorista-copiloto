import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import {
  createMonitorSession,
  getMonitorSessions,
  type MonitorSession,
  type RoutePoint,
} from '@/api/monitor-sessions';
import { OrganicButton, OrganicSurface, OrganicText } from '@/components/organic';
import { RouteMap } from '@/components/route-map';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isHarshEvent, type AccelerometerReading } from '@/lib/harsh-event-detector';

const LOCATION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 5000,
  distanceInterval: 15,
};

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
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const routeRef = useRef<RoutePoint[]>([]);

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

  function markLastRoutePointHarsh() {
    const route = routeRef.current;
    if (route.length === 0) {
      return;
    }
    const last = route[route.length - 1];
    if (last.harsh) {
      return;
    }
    routeRef.current = [...route.slice(0, -1), { ...last, harsh: true }];
  }

  // GPS é uma melhoria aditiva: qualquer falha aqui (permissão negada,
  // sensor indisponível) não pode interromper o monitoramento por
  // acelerômetro, que é o núcleo já validado da funcionalidade.
  async function startLocationTracking() {
    routeRef.current = [];
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        LOCATION_OPTIONS,
        (location) => {
          routeRef.current = [
            ...routeRef.current,
            { lat: location.coords.latitude, lng: location.coords.longitude, harsh: false },
          ];
        },
      );
    } catch {
      locationSubscriptionRef.current = null;
    }
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

    try {
      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
      subscriptionRef.current = Accelerometer.addListener((reading) => {
        const previous = previousReadingRef.current;
        if (previous && isHarshEvent(previous, reading)) {
          setEventCount((count) => count + 1);
          markLastRoutePointHarsh();
          showAlert();
        }
        previousReadingRef.current = reading;
      });
    } catch {
      // expo-sensors@57.0.1 relata o acelerômetro como disponível no navegador,
      // mas o shim web não implementa addListener de verdade — bug do pacote,
      // não do app. Sem isso não tem como monitorar, então cai pro estado
      // "unavailable" em vez de deixar a tela travar com erro não tratado.
      startedAtRef.current = null;
      setState('unavailable');
      return;
    }

    startLocationTracking();
    setState('monitoring');
  }

  function stopMonitoring() {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    previousReadingRef.current = null;
    locationSubscriptionRef.current?.remove();
    locationSubscriptionRef.current = null;
    setState('idle');

    const startedAt = startedAtRef.current;
    startedAtRef.current = null;
    const route = routeRef.current;
    routeRef.current = [];
    if (startedAt) {
      const durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);
      // Resumo não é crítico para o fluxo: falha de rede não deve interromper o usuário.
      createMonitorSession({
        started_at: startedAt.toISOString(),
        duration_seconds: durationSeconds,
        event_count: eventCount,
        route: route.length > 0 ? route : null,
      })
        .then(loadHistory)
        .catch(() => {});
    }
  }

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      locationSubscriptionRef.current?.remove();
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
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <OrganicText size="subtitle">Monitor de direção</OrganicText>
          <OrganicText color="textSecondary" style={styles.centerText}>
            Avisa com vibração quando detecta uma freada ou aceleração brusca durante a prática.
          </OrganicText>
        </View>

        {alertVisible && (
          <OrganicSurface backgroundColor="warning" style={styles.alertBanner}>
            <OrganicText size="small" color="onWarning">
              Movimento brusco detectado!
            </OrganicText>
          </OrganicSurface>
        )}

        {state === 'unavailable' && (
          <View style={styles.centerContent}>
            <OrganicText color="textSecondary" style={styles.centerText}>
              {Platform.OS === 'web'
                ? 'O monitor por acelerômetro não funciona no navegador (limitação do expo-sensors na web) — abra o app no celular pra usar essa tela.'
                : 'Não foi possível acessar o sensor de movimento neste aparelho.'}
            </OrganicText>
            <OrganicButton label="Tentar novamente" variant="neutral" onPress={startMonitoring} />
          </View>
        )}

        {(state === 'idle' || state === 'checking') && (
          <View style={styles.centerContent}>
            <OrganicButton
              label={state === 'checking' ? 'Verificando sensor…' : 'Iniciar monitoramento'}
              disabled={state === 'checking'}
              onPress={startMonitoring}
            />
          </View>
        )}

        {state === 'monitoring' && (
          <View style={styles.centerContent}>
            <OrganicText size="small">Monitorando…</OrganicText>
            <OrganicText color="textSecondary">
              {eventCount === 0
                ? 'Nenhum movimento brusco até agora.'
                : `${eventCount} movimento(s) brusco(s) detectado(s).`}
            </OrganicText>
            <OrganicButton label="Parar monitoramento" variant="neutral" onPress={stopMonitoring} />
          </View>
        )}

        <View style={styles.historySection}>
          <OrganicText size="small">Sessões anteriores</OrganicText>

          {historyState === 'loading' && (
            <View style={styles.centerContent}>
              <ActivityIndicator />
            </View>
          )}

          {historyState === 'error' && (
            <View style={styles.centerContent}>
              <OrganicText color="textSecondary" style={styles.centerText}>
                {historyError}
              </OrganicText>
              <OrganicButton label="Tentar novamente" variant="neutral" onPress={loadHistory} />
            </View>
          )}

          {historyState === 'ready' && history.length === 0 && (
            <OrganicText color="textSecondary" style={styles.centerText}>
              Nenhuma sessão de monitoramento registrada ainda.
            </OrganicText>
          )}

          {historyState === 'ready' && history.length > 0 && (
            <View style={styles.historyWrapper}>
              {history.map((session) => (
                <OrganicSurface key={session.id} backgroundColor="backgroundElement" style={styles.historyCard}>
                  <OrganicText size="small">{formatDateTime(session.started_at)}</OrganicText>
                  <OrganicText size="small" color="textSecondary">
                    {formatDuration(session.duration_seconds)} ·{' '}
                    {session.event_count === 0
                      ? 'nenhum movimento brusco'
                      : `${session.event_count} movimento(s) brusco(s)`}
                  </OrganicText>
                  {session.route && session.route.length > 0 && (
                    <RouteMap points={session.route} />
                  )}
                </OrganicSurface>
              ))}
            </View>
          )}
        </View>
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
  alertBanner: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
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
  },
});
