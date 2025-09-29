interface Client {
  id?: string;
  code: string;
  branch: string;
  name: string;
  document: string;
  address: string;
  contact: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CLIENTS_STORAGE_KEY = 'safeprag_clients';
const CLIENT_CODE_COUNTER_KEY = 'safeprag_client_code_counter';

// Função para gerar o próximo código de cliente
export const getNextClientCode = (): string => {
  const currentCounter = localStorage.getItem(CLIENT_CODE_COUNTER_KEY) || '0';
  const nextNumber = parseInt(currentCounter) + 1;
  localStorage.setItem(CLIENT_CODE_COUNTER_KEY, nextNumber.toString());
  return `C${nextNumber.toString().padStart(5, '0')}`;
};

// Função para salvar um novo cliente
export const addClient = async (client: Omit<Client, 'id' | 'code'>): Promise<Client> => {
  const clients = getClients();
  const code = getNextClientCode();
  
  const newClient: Client = {
    ...client,
    id: Date.now().toString(),
    code,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Cliente adicionado com sucesso
  
  clients.push(newClient);
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  return newClient;
};

// Função para obter todos os clientes
export const getClients = (): Client[] => {
  const clientsStr = localStorage.getItem(CLIENTS_STORAGE_KEY);
  const clients = clientsStr ? JSON.parse(clientsStr) : [];
  // Clientes carregados do localStorage
  return clients;
};

// Função para buscar clientes com filtro
export const searchClients = (searchTerm: string): Client[] => {
  const clients = getClients();
  if (!searchTerm) return clients;
  
  const term = searchTerm.toLowerCase();
  return clients.filter(client => 
    client.code.toLowerCase().includes(term) ||
    client.name.toLowerCase().includes(term) ||
    client.document.toLowerCase().includes(term)
  );
};

// Função para atualizar um cliente
export const updateClient = async (updatedClient: Client): Promise<Client> => {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === updatedClient.id);
  
  if (index === -1) {
    throw new Error('Cliente não encontrado');
  }
  
  // Mantém o código original e atualiza a data de modificação
  const clientToUpdate = {
    ...updatedClient,
    code: clients[index].code,
    updatedAt: new Date()
  };
  
  clients[index] = clientToUpdate;
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  
  return clientToUpdate;
};

// Função para deletar um cliente
export const deleteClient = async (clientId: string): Promise<boolean> => {
  const clients = getClients();
  const filteredClients = clients.filter(c => c.id !== clientId);
  
  if (filteredClients.length === clients.length) return false;
  
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(filteredClients));
  return true;
};
