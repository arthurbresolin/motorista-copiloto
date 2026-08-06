import { useEffect, type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const DURATION = 300;
const OFFSET_Y = 12;

// Animação manual (useSharedValue + useEffect), não a API `entering` do
// Reanimated — `entering`/Keyframe aciona o modo de "layout animation" da
// lib, que na web quebra containers flex com `gap` (os irmãos ficam
// sobrepostos porque o item some do fluxo normal enquanto anima). Um
// useAnimatedStyle comum não tem esse problema: o elemento nunca sai do
// fluxo, só a opacidade/transform mudam.
export function FadeSlideIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) }));
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * OFFSET_Y }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
