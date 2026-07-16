import { StyleSheet } from 'react-native';

import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import type { ThemeColor } from '@/constants/theme';

export type SkillNodeState = 'done' | 'current' | 'locked';

const NODE_SIZE = 44;

export function SkillNode({ state, label }: { state: SkillNodeState; label: string }) {
  const backgroundColor: ThemeColor =
    state === 'done' ? 'accent' : state === 'locked' ? 'backgroundSelected' : 'background';
  const textColor: ThemeColor =
    state === 'locked' ? 'textSecondary' : state === 'done' ? 'onAccent' : 'text';
  const icon = state === 'done' ? '✓' : state === 'locked' ? '🔒' : '★';

  return (
    <OrganicSurface
      circle
      backgroundColor={backgroundColor}
      shadow={state !== 'locked'}
      style={styles.node}
      accessibilityLabel={label}>
      <OrganicText size="small" color={textColor}>
        {icon}
      </OrganicText>
    </OrganicSurface>
  );
}

const styles = StyleSheet.create({
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
