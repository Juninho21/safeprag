export interface AdminClient {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  phone: string;
  email: string;
  cnpj: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Função para buscar clientes da página admin
export const getAdminClients = (): AdminClient[] => {
  try {
    const clientsJson = localStorage.getItem('admin_clients');
    if (!clientsJson) return [];
    
    const allClients = JSON.parse(clientsJson) as AdminClient[];
    return allClients
      .filter(client => client.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
};
