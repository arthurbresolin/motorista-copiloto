import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FadeSlideIn,
  OrganicButton,
  OrganicPill,
  OrganicSurface,
  OrganicText,
  ScreenBackground,
  SkillTrail,
} from '@/components/organic';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useProgress } from '@/hooks/use-progress';
import { useSkillDetailSheet } from '@/hooks/use-skill-detail-sheet';

export default function TrilhaScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const { loadState, errorMessage, reload, streak, xp, skillProgress } = useProgress();
  const doneCount = skillProgress.filter((item) => item.state === 'done').length;
  const { open: openSkillDetail } = useSkillDetailSheet();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
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
        contentInset={insets}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <View style={styles.container}>
        <View style={styles.pillRow}>
          <OrganicPill label={`🔥 ${streak}`} backgroundColor="backgroundElement" />
          <OrganicPill label={`⭐ ${xp}`} backgroundColor="backgroundElement" />
        </View>

        {loadState === 'ready' && (
          <FadeSlideIn>
            <OrganicSurface backgroundColor="accent" style={styles.unitBanner}>
              <OrganicText size="small" color="onAccent">
                SUA TRILHA
              </OrganicText>
              <OrganicText size="subtitle" color="onAccent">
                {doneCount} de {skillProgress.length} habilidades
              </OrganicText>
            </OrganicSurface>
          </FadeSlideIn>
        )}

        {loadState === 'loading' && (
          <View style={styles.centerContent}>
            <ActivityIndicator />
          </View>
        )}

        {loadState === 'error' && (
          <View style={styles.centerContent}>
            <OrganicText color="textSecondary" style={styles.centerText}>
              {errorMessage}
            </OrganicText>
            <OrganicButton label="Tentar novamente" variant="neutral" onPress={reload} />
          </View>
        )}

        {loadState === 'ready' && (
          <View style={styles.trailWrapper}>
            <SkillTrail items={skillProgress} onPressSkill={openSkillDetail} />
          </View>
        )}
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
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
    gap: Spacing.three,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
  },
  unitBanner: {
    marginHorizontal: Spacing.four,
    gap: Spacing.half,
    padding: Spacing.three,
  },
  centerContent: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  centerText: {
    textAlign: 'center',
  },
  trailWrapper: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
});
