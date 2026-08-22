import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { OrganicText } from './text';
import { Ambient, EaseInOut } from '@/constants/motion';
import { RadiusSm, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ARROW_SIZE = 6;
const BALLOON_BG = '#FFFFFF';

/**
 * Balão que aponta pro nó ativo da trilha, flutuando de leve. É o que diz "é
 * aqui que você continua" sem precisar de texto explicando.
 *
 * O texto vem do pai em vez de ser um "COMEÇAR" fixo como no protótipo, porque
 * aqui a habilidade atual pode estar em duas fases diferentes (quiz ou prática)
 * e dizer qual das duas é mais útil do que o rótulo genérico.
 */
export function StartBalloon({ label }: { label: string }) {
  const theme = useTheme();
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: Ambient.tip.duration / 2, easing: EaseInOut }),
      -1,
      true,
    );
  }, [float]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value * Ambient.tip.distance }],
  }));

  return (
    <Animated.View style={[styles.wrapper, style]}>
      {/* Fundo branco fixo, não `backgroundElement`: o balão precisa saltar do
          fundo creme do app, e a cor de superfície do tema é quase idêntica a
          ele (foi assim que a primeira versão ficou invisível na tela). */}
      <View style={[styles.bubble, { backgroundColor: BALLOON_BG }]}>
        <OrganicText size="small" style={{ color: theme.accentShadow }}>
          {label.toUpperCase()}
        </OrganicText>
      </View>
      {/* Bico do balão: triângulo feito com bordas, o jeito de desenhar uma
          forma não-retangular em RN sem cair pra SVG por causa de 8 pixels. */}
      <View style={[styles.arrow, { borderTopColor: BALLOON_BG }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  bubble: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: RadiusSm,
    // Sombra dura e curta (sem desfoque), como no handoff: reforça a leitura
    // de "adesivo colado por cima" em vez de superfície do próprio fundo.
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 4,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
