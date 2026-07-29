import { StyleSheet } from 'react-native';

import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import type { ThemeColor } from '@/constants/theme';

export type SkillNodeState = 'done' | 'current' | 'locked';

const NODE_SIZE = 44;

export function SkillNode({
  state,
  label,
  size = NODE_SIZE,
}: {
  state: SkillNodeState;
  label: string;
  size?: number;
}) {
  const backgroundColor: ThemeColor =
    state === 'done' ? 'accent' : state === 'locked' ? 'backgroundSelected' : 'backgroundElement';
  const textColor: ThemeColor =
    state === 'locked' ? 'textSecondary' : state === 'done' ? 'onAccent' : 'text';
  const icon = state === 'done' ? '✓' : state === 'locked' ? '🔒' : '★';

  return (
    <OrganicSurface
      circle
      backgroundColor={backgroundColor}
      shadow={state !== 'locked'}
      inset={state === 'locked'}
      style={[styles.node, { width: size, height: size }]}
      accessibilityLabel={label}>
      <OrganicText size="small" color={textColor} style={{ fontSize: size * 0.32 }}>
        {icon}
      </OrganicText>
    </OrganicSurface>
  );
}

const styles = StyleSheet.create({
  node: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
