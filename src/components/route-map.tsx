import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Defs, Pattern, Polyline, Rect, Svg } from 'react-native-svg';

import { OrganicSurface } from '@/components/organic';
import { Ambient } from '@/constants/motion';
import { RadiusMd } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { projectRoute, type RoutePoint } from '@/lib/route-projection';

const MAP_HEIGHT = 100;

/**
 * Traço da rota: 6 unidades desenhadas, 4 de intervalo. O deslocamento tem que
 * andar exatamente um ciclo completo (6+4=10) por repetição — qualquer outro
 * valor faz o tracejado "pular" quando a animação reinicia.
 */
const DASH_PATTERN = '6 4';
const DASH_CYCLE = 10;

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

export function RouteMap({ points }: { points: RoutePoint[] }) {
  const theme = useTheme();
  const projected = projectRoute(points);

  // O deslocamento é negativo pra rota "andar" no sentido do percurso (do
  // início pro fim), não ao contrário.
  const dashOffset = useSharedValue(0);

  useEffect(() => {
    dashOffset.value = withRepeat(
      withTiming(-DASH_CYCLE, { duration: Ambient.march.duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, [dashOffset]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: dashOffset.value }));

  // O early return fica depois dos hooks: sair antes mudaria a quantidade de
  // hooks entre renders e o React quebra.
  if (projected.length === 0) {
    return null;
  }

  const polylinePoints = projected.map((point) => `${point.x},${point.y}`).join(' ');
  const patternId = 'route-map-pattern';

  return (
    <OrganicSurface
      backgroundColor="backgroundSelected"
      style={{ height: MAP_HEIGHT, overflow: 'hidden' }}
      borderRadius={RadiusMd}>
      <Svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <Pattern
            id={patternId}
            width={7}
            height={7}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)">
            <Rect width={7} height={7} fill={theme.mapPatternA} />
            <Rect width={3.5} height={7} fill={theme.mapPatternB} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill={`url(#${patternId})`} />
        {projected.length > 1 && (
          <AnimatedPolyline
            points={polylinePoints}
            fill="none"
            stroke={theme.accent}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={DASH_PATTERN}
            animatedProps={animatedProps}
          />
        )}
        {projected.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={point.harsh ? 3 : 1.5}
            fill={point.harsh ? theme.danger : theme.accent}
          />
        ))}
      </Svg>
    </OrganicSurface>
  );
}
