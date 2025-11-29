export interface Device {
  id: number;
  type: string;
  number: number;
  status?: string;
}

export interface Client {
  id: string;
  code: string;
  branch: string;
  name: string;
  document: string;
  address: string;
  contact: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  message: string;
  attachment?: string;
}

export interface ServiceOrder {
  id: number;
  createdAt: Date;
  deviceCount: number;
  status: string;
  devices: Device[];
  pdfUrl: string;
  client: Client;
  service: {
    type: string;
    target: string;
    location: string;
  };
  product: {
    name: string;
    activeIngredient: string;
    chemicalGroup: string;
    registration: string;
    batch: string;
    validity: string;
    quantity: string;
    dilution: string;
  };
  observations: string;
  startTime: string;
  endTime: string;
  signatures: {
    serviceResponsible: string;
    technicalResponsible: string;
    clientRepresentative: string;
  };
}