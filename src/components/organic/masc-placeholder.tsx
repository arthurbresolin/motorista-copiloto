import { StyleSheet, View } from 'react-native';
import { Circle, Defs, Pattern, Rect, Svg } from 'react-native-svg';

import { OrganicText } from './text';
import { useTheme } from '@/hooks/use-theme';

export function MascPlaceholder({ size = 40, label = 'masc' }: { size?: number; label?: string }) {
  const theme = useTheme();
  const patternId = `masc-stripes-${size}`;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id={patternId}
            width={14}
            height={14}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)">
            <Rect width={14} height={14} fill={theme.mapPatternA} />
            <Rect width={7} height={14} fill={theme.mapPatternB} />
          </Pattern>
        </Defs>
        <Circle
          cx={50}
          cy={50}
          r={47}
          fill={`url(#${patternId})`}
          stroke={theme.textSecondary}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
      </Svg>
      <OrganicText size="small" color="textSecondary">
        {label}
      </OrganicText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
