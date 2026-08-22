import { api } from '@/api/client';

export type Subscription = {
  active: boolean;
  product_id: string | null;
  expires_at: string | null;
};

export const getSubscription = () => api.get<Subscription>('/learners/me/subscription');
