import { Checkbox, Column, Host } from '@expo/ui';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createChecklistSession, getChecklistItems, type ChecklistItem } from '@/api/checklist';
import { ApiError } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LoadState = 'loading' | 'error' | 'ready';

export default function ChecklistScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const loadItems = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await getChecklistItems();
      setItems(data);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível carregar a checklist.',
      );
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function toggleItem(id: number) {
    setSavedMessage('');
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleFinish() {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await createChecklistSession(Array.from(checkedIds));
      setSavedMessage('Checklist salva com sucesso!');
      setCheckedIds(new Set());
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível salvar a checklist.',
      );
    } finally {
      setIsSaving(false);
    }
  }

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
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Checklist pré-direção</ThemedText>
          <ThemedText themeColor="textSecondary">
            Confira os itens antes de sair para dirigir.
          </ThemedText>
        </ThemedView>

        {loadState === 'loading' && (
          <ThemedView style={styles.centerContent}>
            <ActivityIndicator />
          </ThemedView>
        )}

        {loadState === 'error' && (
          <ThemedView style={styles.centerContent}>
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              {errorMessage}
            </ThemedText>
            <Pressable onPress={loadItems} style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.actionButton}>
                <ThemedText type="link">Tentar novamente</ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        )}

        {loadState === 'ready' && (
          <ThemedView style={styles.itemsWrapper}>
            <Host matchContents>
              <Column spacing={Spacing.three}>
                {items.map((item) => (
                  <Checkbox
                    key={item.id}
                    label={item.title}
                    value={checkedIds.has(item.id)}
                    onValueChange={() => toggleItem(item.id)}
                  />
                ))}
              </Column>
            </Host>

            {errorMessage !== '' && <ThemedText themeColor="textSecondary">{errorMessage}</ThemedText>}
            {savedMessage !== '' && <ThemedText type="smallBold">{savedMessage}</ThemedText>}

            <Pressable
              disabled={isSaving}
              onPress={handleFinish}
              style={({ pressed }) => [styles.finishButton, pressed && styles.pressed]}>
              <ThemedView type="accent" style={styles.actionButton}>
                <ThemedText type="link" themeColor="onAccent">
                  {isSaving ? 'Salvando…' : 'Concluir checklist'}
                </ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
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
  centerContent: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  centerText: {
    textAlign: 'center',
  },
  itemsWrapper: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'flex-start',
  },
  pressed: {
    opacity: 0.7,
  },
  finishButton: {
    alignSelf: 'flex-start',
  },
  actionButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
});
