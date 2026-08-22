import { StyleSheet } from 'react-native';
import { Circle, Defs, Pattern, Rect, Svg } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

const DOT_SPACING = 22;
const DOT_RADIUS = 1;

// Camada de textura sutil atrás do conteúdo de toda tela — pontinhos
// repetidos via <Pattern>, não uma imagem/asset novo. Baixa opacidade de
// propósito: é textura, não um reskin escuro tipo Duolingo.
export function TextureOverlay() {
  const theme = useTheme();

  return (
    <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none" opacity={0.08}>
      <Defs>
        <Pattern
          id="texture-dots"
          patternUnits="userSpaceOnUse"
          width={DOT_SPACING}
          height={DOT_SPACING}>
          <Circle cx={DOT_SPACING / 2} cy={DOT_SPACING / 2} r={DOT_RADIUS} fill={theme.patternDot} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#texture-dots)" />
    </Svg>
  );
}
