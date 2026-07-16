import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { createCar, getCars, type Car } from '@/api/cars';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LoadState = 'loading' | 'error' | 'ready';

export default function MeuCarroScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [cars, setCars] = useState<Car[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [brandModel, setBrandModel] = useState('');
  const [plate, setPlate] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadCars = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await getCars();
      setCars(data);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível carregar os carros.',
      );
      setLoadState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCars();
    }, [loadCars]),
  );

  async function handleAddCar() {
    if (brandModel.trim() === '') {
      setFieldError('Informe a marca/modelo do carro.');
      return;
    }

    setFieldError('');
    setSubmitError('');
    setIsSaving(true);
    try {
      await createCar({
        brand_model: brandModel.trim(),
        plate: plate.trim() === '' ? null : plate.trim(),
        transmission: transmission.trim() === '' ? null : transmission.trim(),
      });
      setBrandModel('');
      setPlate('');
      setTransmission('');
      await loadCars();
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'Não foi possível salvar o carro.',
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
      paddingBottom: insets.bottom + Spacing.four,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Meus carros</ThemedText>
          <ThemedText themeColor="textSecondary">
            Cadastre o(s) carro(s) usados nas suas práticas.
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
            <Pressable onPress={loadCars} style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.secondaryButton}>
                <ThemedText type="link">Tentar novamente</ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        )}

        {loadState === 'ready' && cars.length === 0 && (
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            Nenhum carro cadastrado ainda.
          </ThemedText>
        )}

        {loadState === 'ready' && cars.length > 0 && (
          <ThemedView style={styles.carsWrapper}>
            {cars.map((car) => (
              <ThemedView key={car.id} type="backgroundElement" style={styles.carCard}>
                <ThemedText type="smallBold">{car.brand_model}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {[car.plate, car.transmission].filter(Boolean).join(' · ') || 'sem detalhes'}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        <ThemedView style={styles.formWrapper}>
          <ThemedText type="smallBold">Adicionar carro</ThemedText>

          <ThemedView style={styles.field}>
            <TextInput
              value={brandModel}
              onChangeText={setBrandModel}
              placeholder="Marca/modelo (ex: Fiat Argo 2022)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            {fieldError !== '' && (
              <ThemedText type="small" themeColor="textSecondary">
                {fieldError}
              </ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.field}>
            <TextInput
              value={plate}
              onChangeText={setPlate}
              placeholder="Placa (opcional)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <TextInput
              value={transmission}
              onChangeText={setTransmission}
              placeholder="Câmbio (opcional, ex: manual)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </ThemedView>

          {submitError !== '' && (
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              {submitError}
            </ThemedText>
          )}

          <Pressable
            disabled={isSaving}
            onPress={handleAddCar}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <ThemedView type="accent" style={styles.addButtonInner}>
              <ThemedText type="link" themeColor="onAccent">
                {isSaving ? 'Salvando…' : '+ Adicionar carro'}
              </ThemedText>
            </ThemedView>
          </Pressable>
        </ThemedView>
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
  pressed: {
    opacity: 0.7,
  },
  secondaryButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  carsWrapper: {
    gap: Spacing.two,
  },
  carCard: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  formWrapper: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
  addButtonInner: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
});
