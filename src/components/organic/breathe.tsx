import { useEffect, type ReactNode } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Ambient, EaseInOut } from '@/constants/motion';

/**
 * Faz o que estiver dentro subir e descer 2px sem parar — o "respirar" que
 * marca a ação principal de uma tela.
 *
 * É opt-in em todo lugar de propósito: se cada botão respirasse, nenhum
 * chamaria atenção e a tela viraria um mar de coisas se mexendo.
 */
export function Breathe({ active = true, children }: { active?: boolean; children: ReactNode }) {
  const float = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      float.value = withTiming(0, { duration: Ambient.breathe.duration / 4 });
      return;
    }
    float.value = withRepeat(
      withTiming(1, { duration: Ambient.breathe.duration / 2, easing: EaseInOut }),
      -1,
      true,
    );
  }, [active, float]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value * Ambient.breathe.distance }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
