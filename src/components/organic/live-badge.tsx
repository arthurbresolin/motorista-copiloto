import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { OrganicText } from './text';
import { Ambient } from '@/constants/motion';
import { RadiusPill, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const DOT_SIZE = 8;

/**
 * Selo de "isto está acontecendo agora", com o pontinho vermelho piscando.
 *
 * O pisca usa `Easing.steps(1)`: o ponto liga e desliga seco, sem passar por
 * valores intermediários. Um fade suave leria como "carregando"; o corte seco é
 * o que dá a leitura de luz de gravação.
 */
export function LiveBadge({ label }: { label: string }) {
  const theme = useTheme();
  const blink = useSharedValue(1);

  useEffect(() => {
    blink.value = withRepeat(
      withTiming(Ambient.blink.minOpacity, {
        duration: Ambient.blink.duration / 2,
        easing: Easing.steps(1, true),
      }),
      -1,
      true,
    );
  }, [blink]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  return (
    <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
      <Animated.View style={[styles.dot, dotStyle, { backgroundColor: theme.danger }]} />
      <OrganicText size="small">{label}</OrganicText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: RadiusPill,
    alignSelf: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
