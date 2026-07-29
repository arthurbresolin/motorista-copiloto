import { Circle, Defs, Pattern, Polyline, Rect, Svg } from 'react-native-svg';

import { OrganicSurface } from '@/components/organic';
import { RadiusMd } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { projectRoute, type RoutePoint } from '@/lib/route-projection';

const MAP_HEIGHT = 100;

export function RouteMap({ points }: { points: RoutePoint[] }) {
  const theme = useTheme();
  const projected = projectRoute(points);

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
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={theme.accent}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
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
