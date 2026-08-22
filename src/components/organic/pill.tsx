import { StyleSheet } from 'react-native';

import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import { RadiusPill, Spacing, type ThemeColor } from '@/constants/theme';

export type OrganicPillProps = {
  label: string;
  backgroundColor?: ThemeColor;
  textColor?: ThemeColor;
};

export function OrganicPill({ label, backgroundColor = 'background', textColor = 'text' }: OrganicPillProps) {
  return (
    <OrganicSurface backgroundColor={backgroundColor} shadow={false} borderRadius={RadiusPill} style={styles.pill}>
      <OrganicText size="small" color={textColor}>
        {label}
      </OrganicText>
    </OrganicSurface>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
  },
});
