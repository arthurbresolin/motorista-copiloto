import { api } from '@/api/client';

export type RoutePoint = {
  lat: number;
  lng: number;
  harsh: boolean;
};

export type MonitorSession = {
  id: number;
  started_at: string;
  duration_seconds: number;
  event_count: number;
  route: RoutePoint[] | null;
};

export type MonitorSessionInput = {
  started_at: string;
  duration_seconds: number;
  event_count: number;
  route: RoutePoint[] | null;
};

export const createMonitorSession = (input: MonitorSessionInput) =>
  api.post<MonitorSession>('/monitor-sessions', input);

export const getMonitorSessions = () => api.get<MonitorSession[]>('/monitor-sessions');
