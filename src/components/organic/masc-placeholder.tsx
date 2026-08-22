import { StyleSheet } from 'react-native';

import { OrganicSurface } from './surface';
import { OrganicText } from './text';

export function MascPlaceholder({ size = 40, label = '🐨' }: { size?: number; label?: string }) {
  return (
    <OrganicSurface
      circle
      backgroundColor="accent"
      style={[styles.wrapper, { width: size, height: size }]}>
      <OrganicText style={{ fontSize: size * 0.5, lineHeight: size * 0.58 }}>{label}</OrganicText>
    </OrganicSurface>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
