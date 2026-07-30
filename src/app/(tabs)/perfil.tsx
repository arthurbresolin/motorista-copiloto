import { useRouter } from 'expo-router';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  MascPlaceholder,
  OrganicButton,
  OrganicPill,
  OrganicSurface,
  OrganicText,
  ScreenBackground,
  SkillNode,
} from '@/components/organic';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useProgress } from '@/hooks/use-progress';
import { formatHoursMinutes } from '@/lib/format';

export default function PerfilScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const { loadState, errorMessage, reload, sessions, stats, streak, xp, achievements } = useProgress();

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
            <OrganicText size="title">Perfil</OrganicText>
            <OrganicText color="textSecondary">aprendiz · {sessions.length} práticas</OrganicText>
          </View>
          <MascPlaceholder size={52} />
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
            <View style={styles.statsRow}>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.statCard}>
                <OrganicText size="title">{streak > 0 ? `🔥 ${streak}` : '👋'}</OrganicText>
                <OrganicText size="small" color="textSecondary">
                  streak
                </OrganicText>
              </OrganicSurface>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.statCard}>
                <OrganicText size="title">{xp}</OrganicText>
                <OrganicText size="small" color="textSecondary">
                  XP
                </OrganicText>
              </OrganicSurface>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.statCard}>
                <OrganicText size="title">{stats ? formatHoursMinutes(stats.total_minutes) : '—'}</OrganicText>
                <OrganicText size="small" color="textSecondary">
                  no volante
                </OrganicText>
              </OrganicSurface>
            </View>

            <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
              <OrganicText size="small">Conquistas</OrganicText>
              <View style={styles.achievementsRow}>
                {achievements.map((achievement) => (
                  <View key={achievement.key} style={styles.achievementItem}>
                    <SkillNode
                      state={achievement.unlocked ? 'done' : 'locked'}
                      label={achievement.label}
                    />
                    <OrganicText size="small" color="textSecondary" style={styles.achievementLabel}>
                      {achievement.label}
                    </OrganicText>
                  </View>
                ))}
              </View>
            </OrganicSurface>

            <OrganicSurface backgroundColor="backgroundElement" shadow={false} style={styles.disabledCard}>
              <OrganicText size="small">Instrutor / acompanhante</OrganicText>
              <OrganicText size="small" color="textSecondary">
                Convide quem te acompanha pra ver seu progresso e avaliar suas manobras.
              </OrganicText>
              <OrganicPill label="em breve" backgroundColor="backgroundSelected" textColor="textSecondary" />
            </OrganicSurface>

            <OrganicButton
              label="🚗 Meus carros"
              variant="neutral"
              onPress={() => router.push('/meu-carro')}
            />
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
  centerContent: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  centerText: {
    textAlign: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    padding: Spacing.three,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  achievementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  achievementItem: {
    alignItems: 'center',
    gap: Spacing.one,
    width: 64,
  },
  achievementLabel: {
    textAlign: 'center',
  },
  disabledCard: {
    gap: Spacing.one,
    padding: Spacing.three,
    opacity: 0.6,
  },
});
