import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { createCar, getCars, type Car } from '@/api/cars';
import { OrganicButton, OrganicSurface, OrganicText, ScreenBackground } from '@/components/organic';
import { BodyFontFamily, BorderWidth, MaxContentWidth, RadiusMd, Spacing } from '@/constants/theme';
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
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <View style={styles.container}>
        <View style={styles.titleContainer}>
          <OrganicText size="subtitle">Meus carros</OrganicText>
          <OrganicText color="textSecondary">Cadastre o(s) carro(s) usados nas suas práticas.</OrganicText>
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
            <OrganicButton label="Tentar novamente" variant="neutral" onPress={loadCars} />
          </View>
        )}

        {loadState === 'ready' && cars.length === 0 && (
          <OrganicText color="textSecondary" style={styles.centerText}>
            Nenhum carro cadastrado ainda.
          </OrganicText>
        )}

        {loadState === 'ready' && cars.length > 0 && (
          <View style={styles.carsWrapper}>
            {cars.map((car) => (
              <OrganicSurface key={car.id} backgroundColor="backgroundElement" style={styles.carCard}>
                <OrganicText size="small">{car.brand_model}</OrganicText>
                <OrganicText size="small" color="textSecondary">
                  {[car.plate, car.transmission].filter(Boolean).join(' · ') || 'sem detalhes'}
                </OrganicText>
              </OrganicSurface>
            ))}
          </View>
        )}

        <View style={styles.formWrapper}>
          <OrganicText size="small">Adicionar carro</OrganicText>

          <View style={styles.field}>
            <TextInput
              value={brandModel}
              onChangeText={setBrandModel}
              placeholder="Marca/modelo (ex: Fiat Argo 2022)"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  fontFamily: BodyFontFamily,
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.borderColor,
                },
              ]}
            />
            {fieldError !== '' && (
              <OrganicText size="small" color="textSecondary">
                {fieldError}
              </OrganicText>
            )}
          </View>

          <View style={styles.field}>
            <TextInput
              value={plate}
              onChangeText={setPlate}
              placeholder="Placa (opcional)"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  fontFamily: BodyFontFamily,
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.borderColor,
                },
              ]}
            />
          </View>

          <View style={styles.field}>
            <TextInput
              value={transmission}
              onChangeText={setTransmission}
              placeholder="Câmbio (opcional, ex: manual)"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  fontFamily: BodyFontFamily,
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.borderColor,
                },
              ]}
            />
          </View>

          {submitError !== '' && (
            <OrganicText color="textSecondary" style={styles.centerText}>
              {submitError}
            </OrganicText>
          )}

          <OrganicButton
            label={isSaving ? 'Salvando…' : '+ Adicionar carro'}
            disabled={isSaving}
            onPress={handleAddCar}
          />
        </View>
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
  carsWrapper: {
    gap: Spacing.two,
  },
  carCard: {
    gap: Spacing.one,
    padding: Spacing.three,
  },
  formWrapper: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: RadiusMd,
    borderWidth: BorderWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
});
