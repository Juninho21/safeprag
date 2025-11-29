import { 
  collection,
  query,
  where,
  getDocs,
  getFirestore,
  orderBy,
  limit
} from 'firebase/firestore';

export interface Client {
  id?: string;
  code: string;
  name: string;
  address: string;
  branch: string;
  document: string;
  contact: string;
  phone: string;
}

const db = getFirestore();
const clientsCollection = collection(db, 'clients');
const CLIENT_CODE_COUNTER_KEY = 'safeprag_client_code_counter';

// Função para gerar o próximo código de cliente
const generateNextClientCode = (): string => {
  // Buscar o último código usado
  const lastCounter = localStorage.getItem(CLIENT_CODE_COUNTER_KEY) || '0';
  const nextCounter = parseInt(lastCounter, 10) + 1;
  
  // Salvar o novo contador
  localStorage.setItem(CLIENT_CODE_COUNTER_KEY, nextCounter.toString());
  
  // Formatar o código (C + 5 dígitos com zeros à esquerda)
  const code = `C${nextCounter.toString().padStart(5, '0')}`;
  // Código gerado automaticamente
  return code;
};

// Função para buscar todos os clientes
export const getClients = (): Client[] => {
  const clientsData = localStorage.getItem('clients');
  const clients = clientsData ? JSON.parse(clientsData) : [];
  // Clientes carregados do localStorage
  return clients;
};

// Função para salvar um cliente
export const saveClient = (clientData: Omit<Client, 'code'>): Client => {
  const clients = getClients();
  const existingClientIndex = clients.findIndex(c => c.id === clientData.id);

  let savedClient: Client;

  if (existingClientIndex >= 0) {
    // Atualizar cliente existente
    savedClient = {
      ...clientData,
      code: clients[existingClientIndex].code // Mantém o código original
    } as Client;
    clients[existingClientIndex] = savedClient;
  } else {
    // Adicionar novo cliente com código gerado
    const code = generateNextClientCode();
    savedClient = {
      ...clientData,
      id: Date.now().toString(),
      code
    };
    // Cliente salvo com sucesso
    clients.push(savedClient);
  }

  localStorage.setItem('clients', JSON.stringify(clients));
  return savedClient;
};

// Função para deletar um cliente
export const deleteClient = (id: string): void => {
  const clients = getClients();
  const updatedClients = clients.filter(client => client.id !== id);
  localStorage.setItem('clients', JSON.stringify(updatedClients));
};

export const searchClients = async (searchTerm: string): Promise<Client[]> => {
  try {
    if (!searchTerm) return [];

    // Busca por nome ou código do cliente
    const nameQuery = query(
      clientsCollection,
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      orderBy('name'),
      limit(5)
    );

    const codeQuery = query(
      clientsCollection,
      where('code', '>=', searchTerm),
      where('code', '<=', searchTerm + '\uf8ff'),
      orderBy('code'),
      limit(5)
    );

    const [nameResults, codeResults] = await Promise.all([
      getDocs(nameQuery),
      getDocs(codeQuery)
    ]);

    const clients = new Map<string, Client>();

    // Adiciona resultados da busca por nome
    nameResults.forEach((doc) => {
      clients.set(doc.id, doc.data() as Client);
    });

    // Adiciona resultados da busca por código
    codeResults.forEach((doc) => {
      clients.set(doc.id, doc.data() as Client);
    });

    return Array.from(clients.values());
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
};
