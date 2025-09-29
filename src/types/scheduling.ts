import { Schedule } from './schedule';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  startTime: string | null;
  endTime: string | null;
  duration: string;
  technician: string;
  service: string;
  observations: string;
  status: 'scheduled' | 'inProgress' | 'completed';
  createdAt: string;
  updatedAt: string;
  contact: string;
  cnpj?: string;
  city?: string;
  state?: string;
  code?: string;
}

export interface SchedulingFilters {
  startDate?: string;
  endDate?: string;
  status?: Schedule['status'];
  technician?: string;
}
