import { useEffect, useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { OrganicText, type OrganicTextProps } from './text';
import { Celebration, EaseInOut } from '@/constants/motion';

const AnimatedText = Animated.createAnimatedComponent(OrganicText);

/**
 * Número que "vira" como um contador mecânico quando muda de valor: sobe e
 * some, reaparece por baixo e assenta. Usado no streak e no XP, pra que ganhar
 * pontos seja algo que a tela mostra acontecendo em vez de um número que já
 * estava diferente quando você olhou.
 */
export function FlipNumber({ value, ...textProps }: { value: number } & OrganicTextProps) {
  const offset = useSharedValue(0);
  const opacity = useSharedValue(1);
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;

    const { duration, distance } = Celebration.numFlip;
    // 40% do tempo subindo e sumindo, o resto voltando de baixo — o corte no
    // meio (opacidade zerada) é o que dá a ilusão de o dígito girar.
    offset.value = withSequence(
      withTiming(-distance, { duration: duration * 0.4, easing: EaseInOut }),
      withTiming(distance, { duration: 0 }),
      withTiming(0, { duration: duration * 0.6, easing: EaseInOut }),
    );
    opacity.value = withSequence(
      withTiming(0, { duration: duration * 0.4 }),
      withTiming(1, { duration: duration * 0.6 }),
    );
  }, [value, offset, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedText {...textProps} style={[textProps.style, style]}>
      {value}
    </AnimatedText>
  );
}
