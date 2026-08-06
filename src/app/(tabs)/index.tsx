import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/api/client';
import {
  FadeSlideIn,
  FlameFlicker,
  MascPlaceholder,
  OrganicButton,
  OrganicSurface,
  OrganicText,
  ScreenBackground,
} from '@/components/organic';
import { BottomTabInset, MaxContentWidth, RadiusSm, Spacing } from '@/constants/theme';
import { useLearnerSession } from '@/hooks/use-learner-session';
import { useProgress } from '@/hooks/use-progress';

const WEEK_CHART_HEIGHT = 44;

export default function HomeScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const { loadState, errorMessage, reload, streak, weekDays } = useProgress();
  const { learner } = useLearnerSession();
  const maxWeekMinutes = Math.max(1, ...weekDays.map((day) => day.minutes));
  const firstName = learner?.display_name || learner?.name?.split(' ')[0];
  const avatarUri = learner?.avatar_url ? `${API_BASE_URL}${learner.avatar_url}` : null;

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
        <View style={[styles.titleContainer, styles.titleRow]}>
          <View>
            <OrganicText size="title">Oi{firstName ? `, ${firstName}` : ''} 👋</OrganicText>
            <OrganicText color="textSecondary">pronto pra dirigir hoje?</OrganicText>
          </View>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <MascPlaceholder size={48} />
          )}
        </View>

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
          <View style={styles.sectionsWrapper}>
            <FadeSlideIn>
              <OrganicSurface backgroundColor="accent" style={styles.streakCard}>
                <FlameFlicker>
                  <OrganicText style={styles.streakEmoji}>🔥</OrganicText>
                </FlameFlicker>
                <View style={styles.streakTextWrapper}>
                  <OrganicText size="subtitle" color="onAccent">
                    {streak > 0 ? `${streak} dias` : 'Comece hoje'}
                  </OrganicText>
                  <OrganicText size="small" color="onAccent">
                    {streak > 0
                      ? 'seguidos — não quebre a corrente!'
                      : 'inicie uma prática pra começar sua sequência'}
                  </OrganicText>
                </View>
              </OrganicSurface>
            </FadeSlideIn>

            <FadeSlideIn delay={80} style={styles.quickLinksRow}>
              <Pressable
                onPress={() => router.push('/checklist')}
                style={({ pressed }) => [styles.quickLink, pressed && styles.pressed]}>
                <OrganicSurface backgroundColor="backgroundElement" style={styles.quickLinkCard}>
                  <OrganicText style={styles.quickLinkEmoji}>✅</OrganicText>
                  <OrganicText size="small">Checklist</OrganicText>
                  <OrganicText size="small" color="textSecondary">
                    antes de sair
                  </OrganicText>
                </OrganicSurface>
              </Pressable>
              <Pressable
                onPress={() => router.push('/trilha')}
                style={({ pressed }) => [styles.quickLink, pressed && styles.pressed]}>
                <OrganicSurface backgroundColor="backgroundElement" style={styles.quickLinkCard}>
                  <OrganicText style={styles.quickLinkEmoji}>🛣️</OrganicText>
                  <OrganicText size="small">Trilha</OrganicText>
                  <OrganicText size="small" color="textSecondary">
                    manobras
                  </OrganicText>
                </OrganicSurface>
              </Pressable>
            </FadeSlideIn>

            <FadeSlideIn delay={160}>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.weekCard}>
                <View style={styles.weekHeaderRow}>
                  <OrganicText size="small">Sua semana</OrganicText>
                  <OrganicText size="small" color="textSecondary">
                    min/dia
                  </OrganicText>
                </View>
                <View style={styles.weekChart}>
                  {weekDays.map((day, index) => (
                    <View key={index} style={styles.weekBarColumn}>
                      <View
                        style={[
                          styles.weekBarTrack,
                          { height: WEEK_CHART_HEIGHT },
                        ]}>
                        <OrganicSurface
                          backgroundColor={day.minutes > 0 ? 'accent' : 'backgroundSelected'}
                          inset={day.minutes === 0}
                          shadow={false}
                          borderRadius={RadiusSm * 0.5}
                          style={{
                            width: '100%',
                            height: Math.max(4, (day.minutes / maxWeekMinutes) * WEEK_CHART_HEIGHT),
                          }}
                        />
                      </View>
                      <OrganicText size="small" color="textSecondary">
                        {day.label}
                      </OrganicText>
                    </View>
                  ))}
                </View>
              </OrganicSurface>
            </FadeSlideIn>

            <FadeSlideIn delay={240}>
              <Pressable onPress={() => router.push('/monitor')}>
                <OrganicSurface backgroundColor="accent" style={styles.ctaCard}>
                  <OrganicText size="subtitle" color="onAccent" style={styles.ctaLabel}>
                    🚗 Sair pra dirigir
                  </OrganicText>
                </OrganicSurface>
              </Pressable>
            </FadeSlideIn>
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
  },
  titleContainer: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  pressed: {
    opacity: 0.7,
  },
  sectionsWrapper: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  streakEmoji: {
    fontSize: 34,
    lineHeight: 40,
  },
  streakTextWrapper: {
    flex: 1,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  quickLink: {
    flex: 1,
  },
  quickLinkCard: {
    gap: Spacing.half,
    padding: Spacing.three,
  },
  quickLinkEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  weekCard: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  weekChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  weekBarColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  weekBarTrack: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  ctaCard: {
    padding: Spacing.four,
  },
  ctaLabel: {
    textAlign: 'center',
    fontFamily: 'Archivo_900Black',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
