import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createChecklistSession, getChecklistItems, type ChecklistItem } from '@/api/checklist';
import { ApiError } from '@/api/client';
import {
  MascPlaceholder,
  OrganicButton,
  OrganicCheckbox,
  OrganicText,
  ScreenBackground,
} from '@/components/organic';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type LoadState = 'loading' | 'error' | 'ready';

export default function ChecklistScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + Spacing.three,
  };
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
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentInset={insets}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <View style={styles.container}>
        <View style={styles.titleContainer}>
          <OrganicText size="subtitle">Checklist pré-direção</OrganicText>
          <OrganicText color="textSecondary">Confira os itens antes de sair para dirigir.</OrganicText>
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
            <OrganicButton label="Tentar novamente" variant="neutral" onPress={loadItems} />
          </View>
        )}

        {loadState === 'ready' && (
          <View style={styles.itemsWrapper}>
            <View style={styles.checkboxList}>
              {items.map((item) => (
                <OrganicCheckbox
                  key={item.id}
                  label={item.title}
                  value={checkedIds.has(item.id)}
                  onValueChange={() => toggleItem(item.id)}
                />
              ))}
            </View>

            {errorMessage !== '' && <OrganicText color="textSecondary">{errorMessage}</OrganicText>}
            {savedMessage !== '' && <OrganicText size="small">{savedMessage}</OrganicText>}

            <View style={styles.mascRow}>
              <MascPlaceholder size={40} label="🙌" />
            </View>

            <OrganicButton
              label={isSaving ? 'Salvando…' : 'Concluir checklist'}
              disabled={isSaving}
              onPress={handleFinish}
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
  checkboxList: {
    gap: Spacing.three,
  },
  mascRow: {
    alignSelf: 'flex-end',
  },
});
