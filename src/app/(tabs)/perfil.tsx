import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE_URL, ApiError } from '@/api/client';
import { createInstructorInvite } from '@/api/instructors';
import {
  FadeSlideIn,
  FlameFlicker,
  ListRow,
  MascPlaceholder,
  OrganicButton,
  OrganicSurface,
  OrganicText,
  ScreenBackground,
  SkillNode,
} from '@/components/organic';
import { BottomTabInset, MaxContentWidth, RadiusSm, Spacing } from '@/constants/theme';
import { useLearnerSession } from '@/hooks/use-learner-session';
import { useProgress } from '@/hooks/use-progress';
import { formatHoursMinutes } from '@/lib/format';
import { clearLearnerToken } from '@/lib/learner-auth-storage';

const TREND_CHART_HEIGHT = 44;

type InviteState = 'idle' | 'loading' | 'ready' | 'error';

export default function PerfilScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const { learner, refresh: refreshLearnerSession } = useLearnerSession();
  const avatarUri = learner?.avatar_url ? `${API_BASE_URL}${learner.avatar_url}` : null;
  const displayName = learner?.display_name || learner?.name;
  const [inviteState, setInviteState] = useState<InviteState>('idle');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');

  async function handleLogout() {
    await clearLearnerToken();
    await refreshLearnerSession();
    router.replace('/entrar');
  }

  async function handleInviteInstructor() {
    setInviteState('loading');
    try {
      const invite = await createInstructorInvite();
      setInviteToken(invite.token);
      setInviteState('ready');
      const webUrl = process.env.EXPO_PUBLIC_WEB_URL;
      const message = webUrl
        ? `Acompanha meu progresso no Motorista Copiloto! Abre este link: ${webUrl}/instrutor/aceitar?codigo=${invite.token}`
        : `Acompanha meu progresso no Motorista Copiloto! Abre o app, vai em "Área do instrutor" > "Tenho um código de convite" e usa este código: ${invite.token}`;
      Share.share({ message }).catch(() => {});
    } catch (error) {
      setInviteError(
        error instanceof ApiError ? error.message : 'Não foi possível gerar o convite.',
      );
      setInviteState('error');
    }
  }

  const {
    loadState,
    errorMessage,
    reload,
    sessions,
    stats,
    streak,
    xp,
    level,
    weekDays,
    eventTrend,
    achievements,
  } = useProgress();
  const maxWeekKm = Math.max(1, ...weekDays.map((day) => day.km));
  const maxTrendEvents = Math.max(1, ...eventTrend.map((session) => session.eventCount));

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
            <OrganicText size="title">{displayName || 'Perfil'}</OrganicText>
            <OrganicText color="textSecondary">aprendiz · {sessions.length} práticas</OrganicText>
          </View>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <MascPlaceholder size={52} />
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
            <FadeSlideIn style={styles.statsRow}>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.statCard}>
                {streak > 0 ? (
                  <View style={styles.streakStatRow}>
                    <FlameFlicker>
                      <OrganicText size="title">🔥</OrganicText>
                    </FlameFlicker>
                    <OrganicText size="title">{streak}</OrganicText>
                  </View>
                ) : (
                  <OrganicText size="title">👋</OrganicText>
                )}
                <OrganicText size="small" color="textSecondary">
                  streak
                </OrganicText>
              </OrganicSurface>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.statCard}>
                <OrganicText size="title">{`nível ${level}`}</OrganicText>
                <OrganicText size="small" color="textSecondary">
                  {xp} XP
                </OrganicText>
              </OrganicSurface>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.statCard}>
                <OrganicText size="title">{stats ? formatHoursMinutes(stats.total_minutes) : '—'}</OrganicText>
                <OrganicText size="small" color="textSecondary">
                  no volante
                </OrganicText>
              </OrganicSurface>
            </FadeSlideIn>

            <FadeSlideIn delay={80}>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
                <OrganicText size="small">Km rodados (7 dias)</OrganicText>
                <View style={styles.trendChart}>
                  {weekDays.map((day, index) => (
                    <View key={index} style={styles.trendBarColumn}>
                      <View style={[styles.trendBarTrack, { height: TREND_CHART_HEIGHT }]}>
                        <OrganicSurface
                          backgroundColor={day.km > 0 ? 'accent' : 'backgroundSelected'}
                          inset={day.km === 0}
                          shadow={false}
                          borderRadius={RadiusSm * 0.5}
                          style={{
                            width: '100%',
                            height: Math.max(4, (day.km / maxWeekKm) * TREND_CHART_HEIGHT),
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

            <FadeSlideIn delay={160}>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
                <OrganicText size="small">Eventos bruscos por sessão monitorada</OrganicText>
                {eventTrend.length === 0 ? (
                  <OrganicText size="small" color="textSecondary">
                    Nenhuma sessão de monitoramento registrada ainda.
                  </OrganicText>
                ) : (
                  <View style={styles.trendChart}>
                    {eventTrend.map((session, index) => (
                      <View key={index} style={styles.trendBarColumn}>
                        <View style={[styles.trendBarTrack, { height: TREND_CHART_HEIGHT }]}>
                          <OrganicSurface
                            backgroundColor={
                              session.severeEventCount > 0
                                ? 'warning'
                                : session.eventCount > 0
                                  ? 'accent'
                                  : 'backgroundSelected'
                            }
                            inset={session.eventCount === 0}
                            shadow={false}
                            borderRadius={RadiusSm * 0.5}
                            style={{
                              width: '100%',
                              height: Math.max(4, (session.eventCount / maxTrendEvents) * TREND_CHART_HEIGHT),
                            }}
                          />
                        </View>
                        <OrganicText size="small" color="textSecondary">
                          {session.label}
                        </OrganicText>
                      </View>
                    ))}
                  </View>
                )}
              </OrganicSurface>
            </FadeSlideIn>

            <FadeSlideIn delay={240}>
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
            </FadeSlideIn>

            <FadeSlideIn delay={320}>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
                <OrganicText size="small">Instrutor / acompanhante</OrganicText>
                <OrganicText size="small" color="textSecondary">
                  Convide quem te acompanha pra ver seu progresso — ele cria uma conta própria
                  pra acessar um painel só de leitura.
                </OrganicText>

                {inviteState === 'idle' && (
                  <OrganicButton
                    label="🔗 Convidar instrutor"
                    variant="neutral"
                    onPress={handleInviteInstructor}
                  />
                )}

                {inviteState === 'loading' && (
                  <View style={styles.centerContent}>
                    <ActivityIndicator />
                  </View>
                )}

                {inviteState === 'error' && (
                  <>
                    <OrganicText size="small" color="textSecondary">
                      {inviteError}
                    </OrganicText>
                    <OrganicButton
                      label="Tentar novamente"
                      variant="neutral"
                      onPress={handleInviteInstructor}
                    />
                  </>
                )}

                {inviteState === 'ready' && inviteToken && (
                  <>
                    <OrganicSurface backgroundColor="backgroundSelected" inset shadow={false} style={styles.inviteCodeBox}>
                      <OrganicText size="small" style={styles.inviteCode}>
                        {inviteToken}
                      </OrganicText>
                    </OrganicSurface>
                    <OrganicText size="small" color="textSecondary">
                      Compartilhe este código — ele vale só uma vez. A pessoa usa em "Área do
                      instrutor" dentro do app.
                    </OrganicText>
                    <OrganicButton
                      label="Gerar outro código"
                      variant="neutral"
                      onPress={handleInviteInstructor}
                    />
                  </>
                )}
              </OrganicSurface>
            </FadeSlideIn>

            <FadeSlideIn delay={400}>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.actionsCard}>
                <ListRow icon="🚗" label="Meus carros" onPress={() => router.push('/meu-carro')} />
                <ListRow icon="🎓" label="Área do instrutor" onPress={() => router.push('/instrutor')} />
                <ListRow icon="📸" label="Feedback da IA" onPress={() => router.push('/feedback-historico')} />
                <ListRow
                  icon="⚙️"
                  label="Configurações"
                  onPress={() => router.push('/configuracoes')}
                  showDivider={false}
                />
              </OrganicSurface>
            </FadeSlideIn>

            <OrganicButton label="Sair" variant="neutral" onPress={handleLogout} />
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
    width: 52,
    height: 52,
    borderRadius: 26,
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
  streakStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  trendBarColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  trendBarTrack: {
    width: '100%',
    justifyContent: 'flex-end',
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
  inviteCodeBox: {
    padding: Spacing.three,
    alignItems: 'center',
  },
  inviteCode: {
    fontFamily: 'monospace',
  },
  actionsCard: {
    paddingHorizontal: Spacing.three,
  },
});
