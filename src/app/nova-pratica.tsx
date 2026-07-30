import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { getCars, type Car } from '@/api/cars';
import { createPracticeSession } from '@/api/practice-sessions';
import {
  OrganicButton,
  OrganicCheckbox,
  OrganicSurface,
  OrganicText,
  ScreenBackground,
} from '@/components/organic';
import { MANEUVER_OPTIONS } from '@/constants/skills';
import { BodyFontFamily, BorderWidth, MaxContentWidth, RadiusMd, RadiusPill, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayIsoDate } from '@/lib/format';

type CarsLoadState = 'loading' | 'error' | 'ready';

function parseDecimal(value: string) {
  return Number(value.trim().replace(',', '.'));
}

export default function NovaPraticaScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();

  const [durationMinutes, setDurationMinutes] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [selectedManeuvers, setSelectedManeuvers] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  const [cars, setCars] = useState<Car[]>([]);
  const [carsLoadState, setCarsLoadState] = useState<CarsLoadState>('loading');
  const [carsError, setCarsError] = useState('');
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{ duration?: string; distance?: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function loadCars() {
    setCarsLoadState('loading');
    try {
      const data = await getCars();
      setCars(data);
      setCarsLoadState('ready');
    } catch (error) {
      setCarsError(
        error instanceof ApiError ? error.message : 'Não foi possível carregar os carros.',
      );
      setCarsLoadState('error');
    }
  }

  useEffect(() => {
    loadCars();
  }, []);

  function toggleManeuver(maneuver: string) {
    setSelectedManeuvers((current) => {
      const next = new Set(current);
      if (next.has(maneuver)) {
        next.delete(maneuver);
      } else {
        next.add(maneuver);
      }
      return next;
    });
  }

  function validate() {
    const duration = parseDecimal(durationMinutes);
    const distance = parseDecimal(distanceKm);
    const errors: { duration?: string; distance?: string } = {};

    if (durationMinutes.trim() === '' || !Number.isFinite(duration) || duration <= 0) {
      errors.duration = 'Informe uma duração válida, em minutos.';
    }
    if (distanceKm.trim() === '' || !Number.isFinite(distance) || distance <= 0) {
      errors.distance = 'Informe uma distância válida, em km.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    setSubmitError('');
    try {
      await createPracticeSession({
        practiced_at: todayIsoDate(),
        duration_minutes: Math.round(parseDecimal(durationMinutes)),
        distance_km: parseDecimal(distanceKm),
        maneuvers: Array.from(selectedManeuvers),
        notes: notes.trim() === '' ? null : notes.trim(),
        car_id: selectedCarId,
      });
      router.replace('/explore');
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'Não foi possível salvar a sessão de prática.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const inputStyle = [
    styles.input,
    {
      fontFamily: BodyFontFamily,
      color: theme.text,
      backgroundColor: theme.backgroundElement,
      borderColor: theme.borderColor,
    },
  ];

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four },
        ]}>
      <View style={styles.container}>
        <View style={styles.field}>
          <OrganicText size="small">Com qual carro?</OrganicText>

          {carsLoadState === 'loading' && (
            <View style={styles.centerContent}>
              <ActivityIndicator />
            </View>
          )}

          {carsLoadState === 'error' && (
            <View style={styles.centerContent}>
              <OrganicText size="small" color="textSecondary" style={styles.centerText}>
                {carsError}
              </OrganicText>
              <OrganicButton label="Tentar novamente" variant="neutral" onPress={loadCars} />
            </View>
          )}

          {carsLoadState === 'ready' && cars.length === 0 && (
            <View style={styles.centerContent}>
              <OrganicText size="small" color="textSecondary" style={styles.centerText}>
                Nenhum carro cadastrado ainda.
              </OrganicText>
              <OrganicButton
                label="Cadastrar um carro"
                variant="neutral"
                onPress={() => router.push('/meu-carro')}
              />
            </View>
          )}

          {carsLoadState === 'ready' && cars.length > 0 && (
            <View style={styles.carsWrapper}>
              {cars.map((car) => (
                <Pressable
                  key={car.id}
                  onPress={() => setSelectedCarId((current) => (current === car.id ? null : car.id))}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <OrganicSurface
                    backgroundColor={selectedCarId === car.id ? 'accent' : 'backgroundElement'}
                    shadow={false}
                    borderRadius={RadiusPill}
                    style={styles.carOption}>
                    <OrganicText size="small" color={selectedCarId === car.id ? 'onAccent' : 'text'}>
                      {car.brand_model}
                    </OrganicText>
                  </OrganicSurface>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.field}>
          <OrganicText size="small">Duração (minutos)</OrganicText>
          <TextInput
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            keyboardType="numeric"
            placeholder="ex: 45"
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
          />
          {fieldErrors.duration && (
            <OrganicText size="small" color="textSecondary">
              {fieldErrors.duration}
            </OrganicText>
          )}
        </View>

        <View style={styles.field}>
          <OrganicText size="small">Distância (km)</OrganicText>
          <TextInput
            value={distanceKm}
            onChangeText={setDistanceKm}
            keyboardType="numeric"
            placeholder="ex: 12.5"
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
          />
          {fieldErrors.distance && (
            <OrganicText size="small" color="textSecondary">
              {fieldErrors.distance}
            </OrganicText>
          )}
        </View>

        <View style={styles.field}>
          <OrganicText size="small">Manobras praticadas</OrganicText>
          <View style={styles.checkboxList}>
            {MANEUVER_OPTIONS.map((maneuver) => (
              <OrganicCheckbox
                key={maneuver}
                label={maneuver}
                value={selectedManeuvers.has(maneuver)}
                onValueChange={() => toggleManeuver(maneuver)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <OrganicText size="small">Observações</OrganicText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="opcional"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            style={[...inputStyle, styles.notesInput]}
          />
        </View>

        {submitError !== '' && (
          <OrganicText color="textSecondary" style={styles.centerText}>
            {submitError}
          </OrganicText>
        )}

        <OrganicButton
          label={isSaving ? 'Salvando…' : 'Salvar sessão'}
          disabled={isSaving}
          onPress={handleSave}
        />
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
    gap: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  checkboxList: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: RadiusMd,
    borderWidth: BorderWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  notesInput: {
    minHeight: Platform.select({ web: 96, default: 80 }),
    textAlignVertical: 'top',
  },
  centerContent: {
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  carsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  carOption: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
