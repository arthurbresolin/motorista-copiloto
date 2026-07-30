import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import type { RoutePoint } from '@/api/monitor-sessions';
import { isHarshEvent, type AccelerometerReading } from '@/lib/harsh-event-detector';

const LOCATION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 5000,
  distanceInterval: 15,
};

const ALERT_VISIBLE_DURATION_MS = 2500;
const UPDATE_INTERVAL_MS = 200;

export type DrivingMonitorState = 'idle' | 'checking' | 'unavailable' | 'monitoring';

export type DrivingMonitorSummary = {
  startedAt: Date;
  durationSeconds: number;
  eventCount: number;
  route: RoutePoint[];
};

// Sensor de acelerômetro + GPS, extraído de monitor.tsx pra ser reaproveitado
// tanto pela tela de Monitor isolada quanto pelo Modo Copiloto (que liga o
// sensor junto com a voz guiando o exercício).
export function useDrivingMonitor(onHarshEvent?: () => void) {
  const [state, setState] = useState<DrivingMonitorState>('idle');
  const [eventCount, setEventCount] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);

  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const previousReadingRef = useRef<AccelerometerReading | null>(null);
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const routeRef = useRef<RoutePoint[]>([]);
  const onHarshEventRef = useRef(onHarshEvent);
  onHarshEventRef.current = onHarshEvent;

  function showAlert() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setAlertVisible(true);
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    alertTimeoutRef.current = setTimeout(() => setAlertVisible(false), ALERT_VISIBLE_DURATION_MS);
  }

  function markLastRoutePointHarsh() {
    const route = routeRef.current;
    if (route.length === 0) {
      return;
    }
    const last = route[route.length - 1];
    if (last.harsh) {
      return;
    }
    routeRef.current = [...route.slice(0, -1), { ...last, harsh: true }];
  }

  // GPS é uma melhoria aditiva: qualquer falha aqui (permissão negada,
  // sensor indisponível) não pode interromper o monitoramento por
  // acelerômetro, que é o núcleo já validado da funcionalidade.
  async function startLocationTracking() {
    routeRef.current = [];
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        LOCATION_OPTIONS,
        (location) => {
          routeRef.current = [
            ...routeRef.current,
            { lat: location.coords.latitude, lng: location.coords.longitude, harsh: false },
          ];
        },
      );
    } catch {
      locationSubscriptionRef.current = null;
    }
  }

  const start = useCallback(async () => {
    setState('checking');

    const isAvailable = await Accelerometer.isAvailableAsync();
    if (!isAvailable) {
      setState('unavailable');
      return;
    }

    if (Platform.OS === 'web') {
      const { granted } = await Accelerometer.requestPermissionsAsync();
      if (!granted) {
        setState('unavailable');
        return;
      }
    }

    previousReadingRef.current = null;
    startedAtRef.current = new Date();
    setEventCount(0);

    try {
      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
      subscriptionRef.current = Accelerometer.addListener((reading) => {
        const previous = previousReadingRef.current;
        if (previous && isHarshEvent(previous, reading)) {
          setEventCount((count) => count + 1);
          markLastRoutePointHarsh();
          showAlert();
          onHarshEventRef.current?.();
        }
        previousReadingRef.current = reading;
      });
    } catch {
      // expo-sensors@57.0.1 relata o acelerômetro como disponível no navegador,
      // mas o shim web não implementa addListener de verdade — bug do pacote,
      // não do app. Sem isso não tem como monitorar, então cai pro estado
      // "unavailable" em vez de deixar a tela travar com erro não tratado.
      startedAtRef.current = null;
      setState('unavailable');
      return;
    }

    startLocationTracking();
    setState('monitoring');
  }, []);

  const stop = useCallback((): DrivingMonitorSummary | null => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    previousReadingRef.current = null;
    locationSubscriptionRef.current?.remove();
    locationSubscriptionRef.current = null;
    setState('idle');

    const startedAt = startedAtRef.current;
    startedAtRef.current = null;
    const route = routeRef.current;
    routeRef.current = [];

    if (!startedAt) {
      return null;
    }

    const durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);
    return { startedAt, durationSeconds, eventCount, route };
  }, [eventCount]);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      locationSubscriptionRef.current?.remove();
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  return { state, eventCount, alertVisible, start, stop };
}
