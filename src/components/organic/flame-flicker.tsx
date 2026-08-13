import { useEffect, type ReactNode } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Ambient, EaseInOut } from '@/constants/motion';

// Loop de escala+rotação pra dar vida à chama do streak. Amplitude e ritmo vêm
// do handoff de design (`flame`), que pede um tremular mais perceptível do que
// a versão anterior — a chama é o elemento que mais aparece no app, é ela que
// dá o recado de "esta tela está viva".
export function FlameFlicker({ children }: { children: ReactNode }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: Ambient.flame.duration / 2, easing: EaseInOut }),
      -1,
      true,
    );
  }, [t]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + t.value * (Ambient.flame.scale - 1) },
      // Vai de -3° a +4°: o balanço é assimétrico de propósito, chama de
      // verdade não oscila igual pros dois lados.
      { rotate: `${-3 + t.value * (Ambient.flame.rotateDeg + 3)}deg` },
    ],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
