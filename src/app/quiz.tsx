import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { getQuizPhases, type QuizPhase } from '@/api/quiz';
import { OrganicSurface, OrganicText, ScreenBackground, SkillNode } from '@/components/organic';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type LoadState = 'loading' | 'error' | 'ready';

const QUIZ_PASS_PERCENT = 70;

function phaseRouteParam(phase: QuizPhase) {
  return phase.category ?? 'geral';
}

export default function QuizPhasesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [phases, setPhases] = useState<QuizPhase[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadPhases = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await getQuizPhases();
      setPhases(data);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível carregar o quiz.',
      );
      setLoadState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPhases();
    }, [loadPhases]),
  );

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
        <Stack.Screen options={{ title: 'Quiz de teoria' }} />
        <View style={styles.container}>
        <View style={styles.titleContainer}>
          <OrganicText color="textSecondary" style={styles.centerText}>
            Acerte pelo menos {QUIZ_PASS_PERCENT}% pra liberar a próxima fase.
          </OrganicText>
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
          </View>
        )}

        {loadState === 'ready' && phases.length === 0 && (
          <OrganicText color="textSecondary" style={styles.centerText}>
            Nenhuma fase de quiz cadastrada ainda.
          </OrganicText>
        )}

        {loadState === 'ready' && phases.length > 0 && (
          <View style={styles.phaseList}>
            {phases.map((phase) => {
              const passed =
                phase.best_score !== null &&
                phase.best_total !== null &&
                phase.best_total > 0 &&
                phase.best_score / phase.best_total >= QUIZ_PASS_PERCENT / 100;
              const state = passed ? 'done' : phase.unlocked ? 'current' : 'locked';

              return (
                <Pressable
                  key={phase.category ?? 'geral'}
                  disabled={!phase.unlocked}
                  onPress={() => router.push(`/quiz/${phaseRouteParam(phase)}`)}
                  style={({ pressed }) => pressed && phase.unlocked && styles.pressed}>
                  <OrganicSurface backgroundColor="backgroundElement" style={styles.phaseCard}>
                    <SkillNode state={state} label={phase.label} />
                    <View style={styles.phaseInfo}>
                      <OrganicText size="small">{phase.label}</OrganicText>
                      <OrganicText size="small" color="textSecondary">
                        {phase.question_count} pergunta{phase.question_count === 1 ? '' : 's'}
                        {phase.best_total !== null ? ` · recorde ${phase.best_score}/${phase.best_total}` : ''}
                      </OrganicText>
                      {!phase.unlocked && (
                        <OrganicText size="small" color="textSecondary">
                          🔒 complete a fase anterior com {QUIZ_PASS_PERCENT}% pra liberar
                        </OrganicText>
                      )}
                    </View>
                  </OrganicSurface>
                </Pressable>
              );
            })}
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
    alignItems: 'center',
    paddingTop: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  centerContent: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
  phaseList: {
    gap: Spacing.two,
  },
  phaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  phaseInfo: {
    flex: 1,
    gap: 2,
  },
});
