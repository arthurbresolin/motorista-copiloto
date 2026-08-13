import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { OrganicSurface } from './surface';
import { Ambient, EaseOut, ENTRANCE_STAGGER_MS } from '@/constants/motion';
import { RadiusSm, type ThemeColor } from '@/constants/theme';

/**
 * Barra do gráfico que cresce de baixo pra cima ao abrir a tela.
 *
 * `transformOrigin: 'bottom'` é o detalhe que importa: sem ele a barra cresce
 * a partir do centro e parece que está inflando, não subindo. O atraso por
 * índice faz as sete barras subirem em cascata em vez de todas juntas.
 */
export function GrowBar({
  height,
  index,
  filled,
}: {
  height: number;
  index: number;
  filled: boolean;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * ENTRANCE_STAGGER_MS,
      withTiming(1, { duration: Ambient.grow.duration, easing: EaseOut }),
    );
  }, [scale, index]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  const backgroundColor: ThemeColor = filled ? 'accent' : 'backgroundSelected';

  return (
    <Animated.View style={[{ width: '100%', height, transformOrigin: 'bottom' }, style]}>
      <OrganicSurface
        backgroundColor={backgroundColor}
        inset={!filled}
        shadow={false}
        borderRadius={RadiusSm * 0.5}
        style={{ width: '100%', height: '100%' }}
      />
    </Animated.View>
  );
}
