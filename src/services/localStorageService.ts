export interface Client {
  id: string;
  code: string;
  name: string;
  address: string;
  document: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

export interface Schedule {
  id: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  serviceType: string;
  date: string;
  time: string;
  duration: string;
  technician: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

// Função para buscar todos os clientes ativos
export const getActiveClients = (): Client[] => {
  try {
    const clientsJson = localStorage.getItem('clients');
    if (!clientsJson) return [];
    
    const allClients = JSON.parse(clientsJson) as Client[];
    return allClients.filter(client => client.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
};

// Função para buscar agendamentos por data (removida - usar Supabase)
// Esta função foi removida pois agora os agendamentos são gerenciados exclusivamente pelo Supabase

// Função para salvar um novo agendamento (removida - usar Supabase)
// Esta função foi removida pois agora os agendamentos são gerenciados exclusivamente pelo Supabase
