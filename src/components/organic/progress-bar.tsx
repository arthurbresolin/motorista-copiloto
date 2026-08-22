import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { RadiusPill } from '@/constants/theme';
import { useGradients, useTheme } from '@/hooks/use-theme';

export function OrganicProgressBar({ progress }: { progress: number }) {
  const theme = useTheme();
  const gradients = useGradients();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <LinearGradient
        colors={gradients.accent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { width: `${clamped * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: RadiusPill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RadiusPill,
  },
});
