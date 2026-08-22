import { LinearGradient } from 'expo-linear-gradient';
import { View, type ViewProps } from 'react-native';

import { RadiusSm, SoftShadow, type GradientRole, type ThemeColor } from '@/constants/theme';
import { useGradients, useTheme } from '@/hooks/use-theme';

export type OrganicSurfaceProps = ViewProps & {
  backgroundColor?: ThemeColor;
  borderRadius?: number;
  shadow?: boolean;
  circle?: boolean;
  /** Superfície "pressionada"/travada: preenchimento chapado, sem gradiente nem sombra. */
  inset?: boolean;
};

const GRADIENT_ROLE_BY_COLOR: Partial<Record<ThemeColor, GradientRole>> = {
  background: 'background',
  backgroundElement: 'surface',
  accent: 'accent',
  accent2: 'accent2',
};

export function OrganicSurface({
  children,
  style,
  backgroundColor = 'background',
  borderRadius = RadiusSm,
  shadow = true,
  circle = false,
  inset = false,
  ...rest
}: OrganicSurfaceProps) {
  const theme = useTheme();
  const gradients = useGradients();
  const radius = circle ? 9999 : borderRadius;
  const gradientRole = !inset ? GRADIENT_ROLE_BY_COLOR[backgroundColor] : undefined;
  const showShadow = shadow && !inset;

  const combinedStyle = [
    { borderRadius: radius },
    !gradientRole && { backgroundColor: theme[backgroundColor] },
    showShadow && SoftShadow,
    style,
  ];

  if (gradientRole) {
    return (
      <LinearGradient
        colors={gradients[gradientRole]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={combinedStyle}
        {...rest}>
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={combinedStyle} {...rest}>
      {children}
    </View>
  );
}
