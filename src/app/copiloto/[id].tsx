import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrganicButton, OrganicProgressBar, OrganicText, ScreenBackground } from '@/components/organic';
import { SKILLS } from '@/constants/skills';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function CopilotoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const skill = SKILLS.find((candidate) => candidate.key === id && candidate.maneuver);
  const steps = skill?.tips ?? [];

  const [stepIndex, setStepIndex] = useState(0);
  const isFinished = stepIndex >= steps.length;

  useEffect(() => {
    if (!isFinished && steps[stepIndex]) {
      Speech.speak(steps[stepIndex], { language: 'pt-BR' });
    }
    return () => {
      Speech.stop();
    };
  }, [stepIndex, isFinished, steps]);

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
        <OrganicText color="textSecondary">Exercício não encontrado.</OrganicText>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <Stack.Screen options={{ title: `Copiloto · ${skill.label}` }} />
        <View style={styles.container}>
          {!isFinished && (
            <>
              <View style={styles.progressWrapper}>
                <OrganicText size="small" color="textSecondary">
                  Passo {stepIndex + 1} de {steps.length}
                </OrganicText>
                <OrganicProgressBar progress={(stepIndex + 1) / steps.length} />
              </View>

              <View style={styles.stepWrapper}>
                <OrganicText size="title" style={styles.centerText}>
                  {steps[stepIndex]}
                </OrganicText>
              </View>

              <View style={styles.actionsWrapper}>
                <OrganicButton
                  label="🔊 Repetir"
                  variant="neutral"
                  onPress={() => Speech.speak(steps[stepIndex], { language: 'pt-BR' })}
                />
                <OrganicButton
                  label={stepIndex + 1 < steps.length ? 'Próximo passo' : 'Concluir'}
                  onPress={() => setStepIndex((current) => current + 1)}
                />
              </View>
            </>
          )}

          {isFinished && (
            <View style={styles.stepWrapper}>
              <OrganicText size="title" style={styles.centerText}>
                Exercício concluído! 🎉
              </OrganicText>
              <OrganicText color="textSecondary" style={styles.centerText}>
                Agora é hora de praticar de verdade.
              </OrganicText>

              <View style={styles.actionsWrapper}>
                <OrganicButton label="🚗 Praticar agora" onPress={() => router.push('/nova-pratica')} />
                <OrganicButton label="Voltar" variant="neutral" onPress={() => router.back()} />
              </View>
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
    gap: Spacing.five,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  progressWrapper: {
    gap: Spacing.two,
  },
  stepWrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  actionsWrapper: {
    gap: Spacing.two,
  },
});
