import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { createMonitorSession, getMonitorSessions, type MonitorSession } from '@/api/monitor-sessions';
import { OrganicButton, OrganicSurface, OrganicText, ScreenBackground } from '@/components/organic';
import { RouteMap } from '@/components/route-map';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useDrivingMonitor } from '@/hooks/use-driving-monitor';

type HistoryState = 'loading' | 'error' | 'ready';

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
  const { state, eventCount, alertVisible, start, stop } = useDrivingMonitor();

  const [history, setHistory] = useState<MonitorSession[]>([]);
  const [historyState, setHistoryState] = useState<HistoryState>('loading');
  const [historyError, setHistoryError] = useState('');

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

  function handleStop() {
    const summary = stop();
    if (!summary) {
      return;
    }
    // Resumo não é crítico para o fluxo: falha de rede não deve interromper o usuário.
    createMonitorSession({
      started_at: summary.startedAt.toISOString(),
      duration_seconds: summary.durationSeconds,
      event_count: summary.eventCount,
      route: summary.route.length > 0 ? summary.route : null,
    })
      .then(loadHistory)
      .catch(() => {});
  }

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom + Spacing.three,
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
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <Stack.Screen options={{ title: 'Monitor de direção' }} />
        <View style={styles.container}>
          <View style={styles.titleContainer}>
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
              <OrganicButton label="Tentar novamente" variant="neutral" onPress={start} />
            </View>
          )}

          {(state === 'idle' || state === 'checking') && (
            <View style={styles.centerContent}>
              <OrganicButton
                label={state === 'checking' ? 'Verificando sensor…' : 'Iniciar monitoramento'}
                disabled={state === 'checking'}
                onPress={start}
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
              <OrganicButton label="Parar monitoramento" variant="neutral" onPress={handleStop} />
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
                    {session.route && session.route.length > 0 && <RouteMap points={session.route} />}
                  </OrganicSurface>
                ))}
              </View>
            )}
          </View>
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
