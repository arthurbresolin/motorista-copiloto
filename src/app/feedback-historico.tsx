import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { API_BASE_URL, ApiError } from '@/api/client';
import { getFeedbackHistory, type PracticeSessionFeedbackEntry } from '@/api/coach';
import { OrganicButton, OrganicPill, OrganicSurface, OrganicText, ScreenBackground } from '@/components/organic';
import { MaxContentWidth, RadiusSm, Spacing } from '@/constants/theme';

type LoadState = 'loading' | 'error' | 'ready';

function formatDateTime(isoDateTime: string) {
  const date = new Date(isoDateTime.endsWith('Z') ? isoDateTime : `${isoDateTime}Z`);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FeedbackHistoricoScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<PracticeSessionFeedbackEntry[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadHistory = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await getFeedbackHistory();
      setEntries(data);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível carregar o histórico.',
      );
      setLoadState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

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
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <OrganicText size="subtitle">Feedback da IA</OrganicText>
            <OrganicText color="textSecondary">
              Comentários e fotos das suas sessões, mais recentes primeiro.
            </OrganicText>
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
              <OrganicButton label="Tentar novamente" variant="neutral" onPress={loadHistory} />
            </View>
          )}

          {loadState === 'ready' && entries.length === 0 && (
            <View style={styles.centerContent}>
              <OrganicText color="textSecondary" style={styles.centerText}>
                Ainda não há feedback registrado. Termine uma sessão de prática guiada ou tire uma
                foto de uma manobra pra ver o comentário da IA aqui.
              </OrganicText>
            </View>
          )}

          {loadState === 'ready' && entries.length > 0 && (
            <View style={styles.entriesWrapper}>
              {entries.map((entry) => (
                <OrganicSurface key={entry.id} backgroundColor="backgroundElement" style={styles.entryCard}>
                  <View style={styles.entryHeaderRow}>
                    <OrganicPill
                      label={entry.kind === 'photo' ? '📷 foto' : '💬 texto'}
                      backgroundColor="backgroundSelected"
                    />
                    <OrganicText size="small" color="textSecondary">
                      {formatDateTime(entry.created_at)}
                    </OrganicText>
                  </View>

                  {entry.photo_url && (
                    <Image source={{ uri: `${API_BASE_URL}${entry.photo_url}` }} style={styles.entryPhoto} />
                  )}

                  <OrganicText size="small">{entry.message}</OrganicText>
                </OrganicSurface>
              ))}
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
    paddingHorizontal: Spacing.four,
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
    gap: Spacing.five,
  },
  titleContainer: {
    gap: Spacing.two,
  },
  centerContent: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  entriesWrapper: {
    gap: Spacing.three,
  },
  entryCard: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryPhoto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: RadiusSm,
  },
});
