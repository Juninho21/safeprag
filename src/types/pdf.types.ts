export interface ServiceItem {
  type: string;
  target: string;
  location: string;
  product?: {
    name: string;
    activeIngredient: string;
    chemicalGroup: string;
    registration: string;
    batch: string;
    validity: string;
    quantity: string;
    dilution: string;
  };
}

export interface ServiceOrderPDFData {
  // Informações da empresa
  companyName?: string;
  companyAddress?: string;
  companyCNPJ?: string;
  companyPhone?: string;
  companyLogo?: string;

  // Informações da ordem de serviço
  orderNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  client: {
    code: string;
    branch: string;
    name: string;
    document: string;
    city?: string;
    address: string;
    contact: string;
    phone: string;
    email: string;
  };
  // Suporte para múltiplos serviços
  services: ServiceItem[];
  // Mantido para compatibilidade com código existente
  service?: ServiceItem;
  // Contagem de pragas por dispositivo
  pestCounts?: {
    deviceType: string;
    deviceNumber: number;
    pests: {
      name: string;
      count: number;
    }[];
  }[];
  product?: {
    name: string;
    activeIngredient: string;
    chemicalGroup: string;
    registration: string;
    batch: string;
    validity: string;
    quantity: string;
    dilution: string;
  };
  devices: {
    type: string;
    quantity: number;
    status: {
      name: string;
      count: number;
      devices: number[];
    }[];
    list: string[];
  }[];
  observations: string;
  signatures: {
    serviceResponsible: string;
    technicalResponsible: string;
    clientRepresentative: string;
  };
}
