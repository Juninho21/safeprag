import { Product } from './serviceOrder';

export interface Schedule {
  id: string;
  clientId: string;
  clientName: string;
  clientAddress?: string;
  clientContact?: string;
  clientPhone?: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  product?: Product;
  updatedAt?: string;
}
