import { StyleSheet, View, type ViewProps } from 'react-native';

import { BorderWidth, ShadowOffset, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type OrganicSurfaceProps = ViewProps & {
  backgroundColor?: ThemeColor;
  borderRadius?: number;
  shadow?: boolean;
  circle?: boolean;
};

export function OrganicSurface({
  children,
  style,
  backgroundColor = 'background',
  borderRadius = Spacing.two,
  shadow = true,
  circle = false,
  ...rest
}: OrganicSurfaceProps) {
  const theme = useTheme();
  const radius = circle ? 9999 : borderRadius;

  return (
    <View style={styles.wrapper}>
      {shadow && (
        <View
          pointerEvents="none"
          style={[
            styles.shadowLayer,
            {
              backgroundColor: theme.borderColor,
              borderRadius: radius,
              transform: [{ translateX: ShadowOffset.x }, { translateY: ShadowOffset.y }],
            },
          ]}
        />
      )}
      <View
        style={[
          styles.foreground,
          {
            backgroundColor: theme[backgroundColor],
            borderColor: theme.borderColor,
            borderRadius: radius,
            borderWidth: BorderWidth,
          },
          style,
        ]}
        {...rest}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  shadowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  foreground: {
    zIndex: 1,
  },
});
