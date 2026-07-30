import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getChecklistSessions, type ChecklistSession } from '@/api/checklist';
import { ApiError } from '@/api/client';
import { getMonitorSessions, type MonitorSession } from '@/api/monitor-sessions';
import { getPracticeSessions, type PracticeSession } from '@/api/practice-sessions';
import {
  OrganicButton,
  OrganicProgressBar,
  OrganicSurface,
  OrganicText,
  ScreenBackground,
} from '@/components/organic';
import { MANEUVER_DONE_THRESHOLD, SKILLS } from '@/constants/skills';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { computeSkillProgress } from '@/lib/gamification';

type LoadState = 'loading' | 'error' | 'ready';

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const skill = SKILLS.find((candidate) => candidate.key === id);

  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  const [checklistSessions, setChecklistSessions] = useState<ChecklistSession[]>([]);
  const [monitorSessions, setMonitorSessions] = useState<MonitorSession[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadAll = useCallback(async () => {
    setLoadState('loading');
    try {
      const [practice, checklist, monitor] = await Promise.all([
        getPracticeSessions(),
        getChecklistSessions(),
        getMonitorSessions(),
      ]);
      setPracticeSessions(practice);
      setChecklistSessions(checklist);
      setMonitorSessions(monitor);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível carregar seu progresso.',
      );
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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

  if (!skill) {
    return (
      <ScreenBackground style={styles.centerContent}>
        <OrganicText color="textSecondary">Habilidade não encontrada.</OrganicText>
      </ScreenBackground>
    );
  }

  const progress = computeSkillProgress(practiceSessions, checklistSessions, monitorSessions).find(
    (item) => item.skill.key === skill.key,
  );
  const count = progress?.count ?? 0;

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <Stack.Screen options={{ title: skill.label }} />
        <View style={styles.container}>
        <View style={styles.titleContainer}>
          <OrganicText size="subtitle">{skill.label}</OrganicText>
          {loadState === 'ready' && (
            <>
              <OrganicProgressBar progress={count / MANEUVER_DONE_THRESHOLD} />
              <OrganicText size="small" color="textSecondary">
                {Math.min(count, MANEUVER_DONE_THRESHOLD)} de {MANEUVER_DONE_THRESHOLD} pra destravar
              </OrganicText>
            </>
          )}
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
            <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
              <OrganicText size="small">Sobre essa habilidade</OrganicText>
              <OrganicText color="textSecondary">{skill.description}</OrganicText>
            </OrganicSurface>

            <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
              <OrganicText size="small">Antes de praticar</OrganicText>
              {skill.tips.map((tip, index) => (
                <View key={index} style={styles.tipRow}>
                  <OrganicText color="textSecondary">•</OrganicText>
                  <OrganicText color="textSecondary" style={styles.tipText}>
                    {tip}
                  </OrganicText>
                </View>
              ))}
            </OrganicSurface>

            {skill.maneuver && (
              <OrganicButton
                label="🎙️ Modo Copiloto"
                onPress={() => router.push(`/copiloto/${skill.key}`)}
              />
            )}
            <OrganicButton
              label={skill.maneuver ? '📝 Registrar prática manual' : '🚗 Praticar agora'}
              variant={skill.maneuver ? 'neutral' : 'accent'}
              onPress={() => router.push('/nova-pratica')}
            />
            <OrganicButton
              label="❓ Quiz rápido"
              variant="neutral"
              onPress={() => router.push(`/quiz/${skill.key}`)}
            />
            {!skill.maneuver && (
              <OrganicButton label="🚦 Monitorar" variant="neutral" onPress={() => router.push('/monitor')} />
            )}
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
    gap: Spacing.four,
  },
  titleContainer: {
    gap: Spacing.two,
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
    gap: Spacing.three,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  tipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tipText: {
    flex: 1,
  },
});
