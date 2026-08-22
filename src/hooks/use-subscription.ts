import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getSubscription, type Subscription } from '@/api/subscription';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setSubscription(await getSubscription());
    } catch {
      // Falha ao carregar assinatura não trava a tela — trata como "sem
      // assinatura carregada ainda" e deixa o usuário tentar de novo depois.
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { subscription, loading, reload };
}
