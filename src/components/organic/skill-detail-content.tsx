import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { OrganicButton } from './button';
import { OrganicProgressBar } from './progress-bar';
import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import type { SkillKey } from '@/constants/skills';
import { Spacing } from '@/constants/theme';
import { practiceAction, useSkillDetail } from '@/hooks/use-skill-detail';

export function SkillDetailContent({
  skillKey,
  onBeforeNavigate,
}: {
  skillKey: SkillKey;
  /** Chamado antes de navegar pra outra rota (Modo Copiloto, quiz, prática,
   * checklist, monitor) — quando esse conteúdo está dentro do SkillDetailSheet,
   * precisa fechar o overlay primeiro, senão ele fica por cima da tela nova
   * e parece que "não abriu nada". */
  onBeforeNavigate?: () => void;
}) {
  const router = useRouter();
  const { skill, loadState, errorMessage, reload, count, phase, bestQuizRatio, quizLabel, practiceThreshold } =
    useSkillDetail(skillKey);

  const navigate = useCallback(
    (route: string) => {
      onBeforeNavigate?.();
      router.push(route as never);
    },
    [onBeforeNavigate, router],
  );

  if (!skill) {
    return (
      <View style={styles.centerContent}>
        <OrganicText color="textSecondary">Habilidade não encontrada.</OrganicText>
      </View>
    );
  }

  const practice = practiceAction(skill);

  return (
    <View style={styles.wrapper}>
      <View style={styles.titleContainer}>
        <OrganicText size="subtitle">{skill.label}</OrganicText>
        {loadState === 'ready' && (
          <>
            <OrganicProgressBar progress={count / practiceThreshold} />
            <OrganicText size="small" color="textSecondary">
              {Math.min(count, practiceThreshold)} de {practiceThreshold} pra destravar
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
          <OrganicButton label="Tentar novamente" variant="neutral" onPress={reload} />
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

          {phase === 'quiz' ? (
            <>
              <OrganicButton label={quizLabel} onPress={() => navigate(`/quiz/${skill.key}`)} />
              {skill.maneuver && (
                <OrganicButton label="🎙️ Modo Copiloto" variant="neutral" disabled onPress={() => {}} />
              )}
              <OrganicButton label={practice.label} variant="neutral" disabled onPress={() => {}} />
              <OrganicText size="small" color="textSecondary" style={styles.centerText}>
                Conclua o quiz primeiro pra liberar a prática.
              </OrganicText>
            </>
          ) : (
            <>
              {skill.maneuver && (
                <OrganicButton
                  label="🎙️ Modo Copiloto"
                  onPress={() => navigate(`/copiloto/${skill.key}`)}
                />
              )}
              <OrganicButton
                label={practice.label}
                variant={skill.maneuver ? 'neutral' : 'accent'}
                onPress={() => navigate(practice.route)}
              />
              <OrganicButton label={quizLabel} variant="neutral" onPress={() => navigate(`/quiz/${skill.key}`)} />
            </>
          )}

          {bestQuizRatio !== null && (
            <OrganicText size="small" color="textSecondary" style={styles.centerText}>
              Melhor resultado no quiz: {Math.round(bestQuizRatio * 100)}%
            </OrganicText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
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
