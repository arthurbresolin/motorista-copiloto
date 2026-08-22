import { api } from '@/api/client';

export type ChecklistItem = {
  id: number;
  title: string;
  order: number;
};

export type ChecklistSession = {
  id: number;
  executed_at: string;
  items: ChecklistItem[];
};

export const getChecklistItems = () => api.get<ChecklistItem[]>('/checklist');

export const createChecklistSession = (itemIds: number[]) =>
  api.post<ChecklistSession>('/checklist/sessions', { item_ids: itemIds });

export const getChecklistSessions = () => api.get<ChecklistSession[]>('/checklist/sessions');
