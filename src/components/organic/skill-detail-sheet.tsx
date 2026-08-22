import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { OrganicButton } from './button';
import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import type { SkillKey } from '@/constants/skills';
import { RadiusLg, Spacing } from '@/constants/theme';
import { practiceAction, useSkillDetail } from '@/hooks/use-skill-detail';

const DURATION = 180;
const CARD_WIDTH = 280;
const TOP_MARGIN = 90;
const BOTTOM_MARGIN = 220;

// Callout compacto ancorado perto do nó tocado — não é uma tela cheia nem
// um bottom-sheet: só o essencial (título + a ação da fase atual) mais um
// link "Ver mais" pra tela cheia (skill/[id]) com descrição/dicas.
export function SkillDetailSheet({
  skillKey,
  anchorY,
  onClose,
}: {
  skillKey: SkillKey | null;
  anchorY: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const { skill, loadState, phase, quizLabel } = useSkillDetail(skillKey);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(skillKey ? 1 : 0, {
      duration: DURATION,
      easing: skillKey ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
    });
  }, [skillKey, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.35 }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));

  if (!skillKey) {
    return null;
  }

  const screenHeight = Dimensions.get('window').height;
  const top = Math.min(Math.max(anchorY - 40, TOP_MARGIN), screenHeight - BOTTOM_MARGIN);

  function handleNavigate(route: string) {
    onClose();
    router.push(route as never);
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} accessibilityLabel="Fechar" />
      </Animated.View>

      <Animated.View style={[styles.cardWrapper, { top }, cardStyle]} pointerEvents="box-none">
        <OrganicSurface backgroundColor="background" borderRadius={RadiusLg} style={styles.card}>
          {loadState === 'loading' || !skill ? (
            <ActivityIndicator />
          ) : (
            <>
              <OrganicText size="subtitle">{skill.label}</OrganicText>
              {phase === 'quiz' ? (
                <OrganicButton label={quizLabel} onPress={() => handleNavigate(`/quiz/${skill.key}`)} />
              ) : (
                <OrganicButton
                  label={practiceAction(skill).label}
                  onPress={() => handleNavigate(practiceAction(skill).route)}
                />
              )}
              <Pressable onPress={() => handleNavigate(`/skill/${skill.key}`)}>
                <OrganicText size="small" color="textSecondary" style={styles.moreLink}>
                  Ver mais →
                </OrganicText>
              </Pressable>
            </>
          )}
        </OrganicSurface>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // zIndex alto de propósito: a barra de abas (CustomTabList em app-tabs.tsx)
  // é irmã do conteúdo da tela dentro do TabSlot e pinta por cima por ordem
  // de DOM — sem isso o popup ficaria escondido atrás da barra de abas.
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  cardWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    gap: Spacing.three,
    padding: Spacing.four,
    alignItems: 'stretch',
  },
  moreLink: {
    textAlign: 'center',
  },
});
