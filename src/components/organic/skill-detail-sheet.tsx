import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import { SkillDetailContent } from './skill-detail-content';
import type { SkillKey } from '@/constants/skills';
import { RadiusLg, Spacing } from '@/constants/theme';

const DURATION = 220;

// Overlay compacto ao tocar num nó da trilha — substitui a navegação pra
// tela cheia skill/[id] (mantida só como wrapper de deep link, ver esse
// arquivo). Animação manual (não `entering`/Keyframe) pelo mesmo motivo do
// FadeSlideIn: aqui não tem risco de flex/gap quebrado (é overlay absoluto,
// sozinho), mas mantém o mesmo padrão testado em vez de outra API.
export function SkillDetailSheet({
  skillKey,
  onClose,
}: {
  skillKey: SkillKey | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = skillKey
      ? withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) })
      : withTiming(0, { duration: DURATION, easing: Easing.in(Easing.quad) });
  }, [skillKey, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.5,
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 40 }],
    opacity: progress.value,
  }));

  if (!skillKey) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} accessibilityLabel="Fechar" />
      </Animated.View>
      <Animated.View style={[styles.sheetWrapper, sheetStyle]} pointerEvents="box-none">
        <OrganicSurface
          backgroundColor="background"
          borderRadius={RadiusLg}
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.four }]}>
          <View style={styles.header}>
            <View style={styles.headerHandle} />
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Fechar">
              <OrganicText size="small" color="textSecondary">
                ✕ Fechar
              </OrganicText>
            </Pressable>
          </View>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <SkillDetailContent skillKey={skillKey} />
          </ScrollView>
        </OrganicSurface>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // zIndex alto de propósito: a barra de abas (CustomTabList em app-tabs.tsx)
  // é irmã do conteúdo da tela dentro do TabSlot e pinta por cima por ordem
  // de DOM (nenhum dos dois tinha zIndex antes) — sem isso o rodapé do sheet
  // fica escondido atrás da barra de abas.
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
  },
  sheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  headerHandle: {
    position: 'absolute',
    left: '50%',
    top: 0,
    marginLeft: -18,
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  closeButton: {
    padding: Spacing.one,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: Spacing.four,
  },
});
