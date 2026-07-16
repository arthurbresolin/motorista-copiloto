import { Circle, Polyline, Svg } from 'react-native-svg';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { projectRoute, type RoutePoint } from '@/lib/route-projection';

const HARSH_EVENT_COLOR = '#CC0000';
const MAP_HEIGHT = 100;

export function RouteMap({ points }: { points: RoutePoint[] }) {
  const theme = useTheme();
  const projected = projectRoute(points);

  if (projected.length === 0) {
    return null;
  }

  const polylinePoints = projected.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <ThemedView type="backgroundSelected" style={{ height: MAP_HEIGHT, borderRadius: Spacing.two, overflow: 'hidden' }}>
      <Svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
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
            fill={point.harsh ? HARSH_EVENT_COLOR : theme.accent}
          />
        ))}
      </Svg>
    </ThemedView>
  );
}
