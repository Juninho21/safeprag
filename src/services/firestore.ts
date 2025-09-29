import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Interfaces
interface Client {
  id?: string;
  code: string;
  branch: string;
  name: string;
  document: string;
  address: string;
  contact: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface ServiceSchedule {
  clientCode: string;
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

const COLLECTION_NAME = 'clients';
const SCHEDULE_COLLECTION_NAME = 'schedules';
const PAGE_SIZE = 10;

// Error handling
const handleFirestoreError = (error: any): never => {
  console.error('Firestore Error:', error);
  
  // Erros específicos do Firestore
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        throw new Error('Sem permissão para acessar os dados');
      case 'unavailable':
        throw new Error('Serviço temporariamente indisponível');
      case 'not-found':
        throw new Error('Documento não encontrado');
      case 'already-exists':
        throw new Error('Documento já existe');
      default:
        throw new Error(`Erro do Firestore: ${error.message}`);
    }
  }

  // Erros genéricos
  throw new Error(error.message || 'Erro desconhecido ao acessar o banco de dados');
};

// Retry logic
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Não tentar novamente em caso de erros de permissão
      if (error.code === 'permission-denied') {
        throw error;
      }
      
      // Aguardar antes de tentar novamente
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

// Client Operations
export const getNextClientCode = async (): Promise<string> => {
  return withRetry(async () => {
    try {
      const clientsRef = collection(db, COLLECTION_NAME);
      const q = query(clientsRef, orderBy('code', 'desc'), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return 'CLI0001';
      }

      const lastCode = snapshot.docs[0].data().code;
      const numberPart = parseInt(lastCode.replace('CLI', ''));
      return `CLI${String(numberPart + 1).padStart(4, '0')}`;
    } catch (error) {
      throw handleFirestoreError(error);
    }
  });
};

export const addClient = async (client: Client): Promise<string> => {
  return withRetry(async () => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...client,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      throw handleFirestoreError(error);
    }
  });
};

export const updateClient = async (id: string, client: Partial<Client>): Promise<void> => {
  return withRetry(async () => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...client,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw handleFirestoreError(error);
    }
  });
};

export const deleteClient = async (id: string): Promise<void> => {
  return withRetry(async () => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      throw handleFirestoreError(error);
    }
  });
};

export const getClient = async (id: string): Promise<Client | null> => {
  return withRetry(async () => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Client;
      }
      
      return null;
    } catch (error) {
      throw handleFirestoreError(error);
    }
  });
};

interface GetClientsOptions {
  search?: string;
  field?: keyof Client;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  orderByField?: keyof Client;
  orderDirection?: 'asc' | 'desc';
}

export const getClients = async (options: GetClientsOptions = {}): Promise<{ clients: Client[]; lastDoc: QueryDocumentSnapshot | null }> => {
  return withRetry(async () => {
    try {
      const clientsRef = collection(db, COLLECTION_NAME);
      let q = query(clientsRef);

      // Ordenação
      if (options.orderByField) {
        q = query(q, orderBy(options.orderByField, options.orderDirection || 'asc'));
      } else {
        q = query(q, orderBy('createdAt', 'desc'));
      }

      // Busca
      if (options.search && options.field) {
        q = query(q, where(options.field, '>=', options.search));
        q = query(q, where(options.field, '<=', options.search + '\uf8ff'));
      }

      // Paginação
      if (options.lastDoc) {
        q = query(q, startAfter(options.lastDoc));
      }
      
      q = query(q, limit(PAGE_SIZE));

      const snapshot = await getDocs(q);
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];

      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

      return { clients, lastDoc };
    } catch (error) {
      throw handleFirestoreError(error);
    }
  });
};

// Service Schedule Operations
export const addServiceSchedule = async (schedule: ServiceSchedule) => {
  return withRetry(async () => {
    try {
      const scheduleData = {
        ...schedule,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, SCHEDULE_COLLECTION_NAME), scheduleData);
      return docRef.id;
    } catch (error) {
      throw handleFirestoreError(error);
    }
  });
};

export const updateServiceSchedule = async (id: string, schedule: Partial<ServiceSchedule>) => {
  return withRetry(async () => {
    try {
      const scheduleData = {
        ...schedule,
        updatedAt: serverTimestamp()
      };

      const scheduleRef = doc(db, SCHEDULE_COLLECTION_NAME, id);
      await updateDoc(scheduleRef, scheduleData);
    } catch (error) {
      throw handleFirestoreError(error);
    }
  });
};

export const deleteServiceSchedule = async (id: string) => {
  return withRetry(async () => {
    try {
      await deleteDoc(doc(db, SCHEDULE_COLLECTION_NAME, id));
    } catch (error) {
      throw handleFirestoreError(error);
    }
  });
};

export const getServiceSchedules = async () => {
  return withRetry(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, SCHEDULE_COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw handleFirestoreError(error);
    }
  });
};

export const getServiceSchedulesByDate = async (date: string) => {
  return withRetry(async () => {
    try {
      const q = query(
        collection(db, SCHEDULE_COLLECTION_NAME),
        where('date', '==', date),
        orderBy('time')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw handleFirestoreError(error);
    }
  });
};
