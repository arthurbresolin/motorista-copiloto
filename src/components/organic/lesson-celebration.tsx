import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { LessonStar } from './lesson-star';
import { OrganicText } from './text';
import { Celebration, EaseOut, OvershootEasing } from '@/constants/motion';
import { useTheme } from '@/hooks/use-theme';

/**
 * Explosão de recompensa sobre o nó recém-concluído: estrelas saindo do centro,
 * "+25 XP" subindo e uma estrela dourada aparecendo por cima do nó.
 *
 * Fica numa camada absoluta e `pointerEvents="none"` porque é puro enfeite — o
 * nó embaixo continua clicável durante a animação inteira.
 */

/** Destinos das estrelas, em pixels a partir do centro. Assimétricos de propósito. */
const STARS = [
  { dx: -46, dy: -40, size: 15, gold: true },
  { dx: 44, dy: -34, size: 13, gold: false },
  { dx: -38, dy: 26, size: 12, gold: true },
  { dx: 40, dy: 30, size: 14, gold: false },
  { dx: 0, dy: -52, size: 11, gold: true },
] as const;

function FlyingStar({
  progress,
  star,
}: {
  progress: SharedValue<number>;
  star: (typeof STARS)[number];
}) {
  const theme = useTheme();

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * star.dx },
      { translateY: progress.value * star.dy },
      { scale: interpolate(progress.value, [0, 1], [0.2, 1]) },
    ],
    // Aparece rápido e some devagar no fim do trajeto — se aparecesse já opaca,
    // as cinco estrelas "piscariam" todas juntas no centro antes de sair.
    opacity: interpolate(progress.value, [0, 0.18, 1], [0, 1, 0]),
  }));

  return (
    <Animated.View style={[styles.centered, style]}>
      <LessonStar size={star.size} color={star.gold ? theme.gold : '#FFFFFF'} />
    </Animated.View>
  );
}

export function LessonCelebration({ nodeSize }: { nodeSize: number }) {
  const theme = useTheme();
  const stars = useSharedValue(0);
  const xp = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    const run = (value: typeof stars, { delay, duration }: { delay: number; duration: number }) => {
      value.value = 0;
      value.value = withDelay(delay, withTiming(1, { duration, easing: EaseOut }));
    };
    run(stars, Celebration.flyStar);
    run(xp, Celebration.xpUp);
    pop.value = 0;
    pop.value = withDelay(
      Celebration.pop.delay,
      withTiming(1, { duration: Celebration.pop.duration, easing: OvershootEasing }),
    );
  }, [stars, xp, pop]);

  const xpStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(xp.value, [0, 1], [10, -Celebration.xpUp.distance]) }],
    opacity: interpolate(xp.value, [0, 0.15, 0.8, 1], [0, 1, 1, 0]),
  }));

  const popStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pop.value },
      { rotate: `${interpolate(pop.value, [0, 1], [-30, 0])}deg` },
    ],
    opacity: pop.value > 0 ? 1 : 0,
  }));

  return (
    <View style={styles.wrapper} pointerEvents="none">
      {STARS.map((star, index) => (
        <FlyingStar key={index} progress={stars} star={star} />
      ))}

      <Animated.View style={[styles.centered, popStyle]}>
        <LessonStar size={nodeSize * 0.5} color={theme.gold} rounded />
      </Animated.View>

      <Animated.View style={[styles.xp, xpStyle]}>
        <OrganicText size="small" style={{ color: theme.gold }}>
          +{Celebration.xpAmount} XP
        </OrganicText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    position: 'absolute',
  },
  xp: {
    position: 'absolute',
    top: 0,
  },
});
