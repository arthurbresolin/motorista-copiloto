import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, type ViewProps } from 'react-native';

import { useGradients } from '@/hooks/use-theme';

export function ScreenBackground({ children, style, ...rest }: ViewProps) {
  const gradients = useGradients();

  return (
    <LinearGradient
      colors={gradients.background}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.fill, style]}
      {...rest}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
