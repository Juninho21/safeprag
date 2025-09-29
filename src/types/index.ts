export interface Device {
  id: number;
  type: string;
  status: string;
  number: number;
}

export interface ServiceOrder {
  id: number;
  createdAt: Date;
  deviceCount: number;
  status: string;
  devices: Device[];
  pdfUrl: string;
  client: {
    code: string;
    branch: string;
    name: string;
    document: string;
    address: string;
    contact: string;
    phone: string;
  };
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
  date?: string;
  clientId?: string;
  clientName?: string;
  clientAddress?: string;
  serviceType?: string;
}