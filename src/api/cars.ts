import { api } from '@/api/client';

export type Car = {
  id: number;
  brand_model: string;
  plate: string | null;
  transmission: string | null;
  created_at: string;
};

export type CarInput = {
  brand_model: string;
  plate: string | null;
  transmission: string | null;
};

export const createCar = (input: CarInput) => api.post<Car>('/cars', input);

export const getCars = () => api.get<Car[]>('/cars');
