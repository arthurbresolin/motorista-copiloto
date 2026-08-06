import { useEffect, type ReactNode } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const FLICKER_DURATION = 700;

// Loop sutil de escala+rotação pra dar vida ao emoji de chama do streak —
// baixa amplitude de propósito, é um detalhe ambiente, não deve chamar
// atenção sozinho.
export function FlameFlicker({ children }: { children: ReactNode }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: FLICKER_DURATION, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: FLICKER_DURATION, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [t]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + t.value * 0.08 }, { rotate: `${(t.value - 0.5) * 6}deg` }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
