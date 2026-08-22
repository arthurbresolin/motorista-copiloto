import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { getInstructorOverview, getInstructorQuizPhases } from '@/api/instructors';
import { OrganicButton, OrganicPill, OrganicSurface, OrganicText, ScreenBackground, SkillTrail } from '@/components/organic';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { computeSkillProgress, computeStreak, computeXp } from '@/lib/gamification';
import { clearInstructorToken, getInstructorToken } from '@/lib/instructor-auth-storage';

type LoadState = 'loading' | 'error' | 'unauthenticated' | 'ready';

export default function InstructorTrailScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = { ...safeAreaInsets, bottom: safeAreaInsets.bottom + Spacing.three };

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [skillProgress, setSkillProgress] = useState<ReturnType<typeof computeSkillProgress>>([]);

  const load = useCallback(async () => {
    setLoadState('loading');
    const token = await getInstructorToken();
    if (!token) {
      setLoadState('unauthenticated');
      return;
    }
    try {
      const [overview, quizPhases] = await Promise.all([
        getInstructorOverview(token),
        getInstructorQuizPhases(token),
      ]);
      setStreak(computeStreak(overview.practice_sessions));
      setXp(
        computeXp(
          overview.practice_sessions.length,
          overview.checklist_sessions.length,
          overview.quiz_sessions.length,
          overview.monitor_sessions,
        ),
      );
      setSkillProgress(
        computeSkillProgress(
          overview.practice_sessions,
          overview.checklist_sessions,
          overview.monitor_sessions,
          quizPhases,
        ),
      );
      setLoadState('ready');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearInstructorToken();
        setLoadState('unauthenticated');
        router.replace('/instrutor');
        return;
      }
      setErrorMessage(error instanceof ApiError ? error.message : 'Não foi possível carregar a trilha.');
      setLoadState('error');
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const doneCount = skillProgress.filter((item) => item.state === 'done').length;

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
          <Stack.Screen options={{ title: 'Trilha (leitura)' }} />
          <View style={styles.pillRow}>
            <OrganicPill label={`🔥 ${streak}`} backgroundColor="backgroundElement" />
            <OrganicPill label={`⭐ ${xp}`} backgroundColor="backgroundElement" />
          </View>

          {loadState === 'ready' && (
            <OrganicSurface backgroundColor="accent" style={styles.unitBanner}>
              <OrganicText size="small" color="onAccent">
                TRILHA (SÓ LEITURA)
              </OrganicText>
              <OrganicText size="subtitle" color="onAccent">
                {doneCount} de {skillProgress.length} habilidades
              </OrganicText>
            </OrganicSurface>
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
            <View style={styles.trailWrapper}>
              {/* Só leitura de propósito — o instrutor acompanha, não pratica
                  nem faz quiz no lugar do aluno, então tocar num nó não abre
                  nada aqui (SkillTrail exige o callback, mas ele fica inerte). */}
              <SkillTrail items={skillProgress} onPressSkill={() => {}} />
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
    gap: Spacing.three,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
  },
  unitBanner: {
    marginHorizontal: Spacing.four,
    gap: Spacing.half,
    padding: Spacing.three,
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
  trailWrapper: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
});
