import { Stack, useLocalSearchParams } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenBackground, SkillDetailContent } from '@/components/organic';
import { SKILLS, type SkillKey } from '@/constants/skills';
import { MaxContentWidth, Spacing } from '@/constants/theme';

// Fluxo principal agora é o SkillDetailSheet (popup) aberto direto da
// Trilha — essa rota só existe pra deep links diretos (`/skill/baliza`)
// continuarem funcionando, renderizando o mesmo conteúdo em tela cheia.
export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const skill = SKILLS.find((candidate) => candidate.key === id);

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom + Spacing.four,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <Stack.Screen options={{ title: skill?.label ?? 'Habilidade' }} />
        <View style={styles.container}>
          <SkillDetailContent skillKey={id as SkillKey} />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
  },
});
