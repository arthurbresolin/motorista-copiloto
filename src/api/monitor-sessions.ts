import { api } from '@/api/client';

export type MonitorSession = {
  id: number;
  started_at: string;
  duration_seconds: number;
  event_count: number;
};

export type MonitorSessionInput = {
  started_at: string;
  duration_seconds: number;
  event_count: number;
};

export const createMonitorSession = (input: MonitorSessionInput) =>
  api.post<MonitorSession>('/monitor-sessions', input);
