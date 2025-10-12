import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  connectFirestoreEmulator, 
  Firestore,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getAnalytics, Analytics, logEvent } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

// Carregando configurações do Firebase de variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Variáveis para armazenar as instâncias
let app: FirebaseApp;
let db: Firestore;
let analytics: Analytics;
let storage: ReturnType<typeof getStorage>;

// Função para inicializar o Firebase com retry
const initializeFirebase = async (retryCount = 3, delay = 1000): Promise<void> => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase App initialized successfully');
    }

    if (!db) {
      db = getFirestore(app);
      
      // Habilita persistência offline
      try {
        await enableIndexedDbPersistence(db);
        console.log('✅ Offline persistence enabled');
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('⚠️ The current browser does not support offline persistence');
        }
      }

      console.log('✅ Firestore initialized successfully');
    }

    if (!storage) {
      storage = getStorage(app);
      console.log('✅ Firebase Storage initialized successfully');
    }

    if (typeof window !== 'undefined' && !analytics) {
      try {
        analytics = getAnalytics(app);
        logEvent(analytics, 'app_initialized');
        console.log('✅ Analytics initialized successfully');
      } catch (error) {
        console.warn('⚠️ Analytics initialization failed:', error);
      }
    }

    // Descomentar para usar o emulador local
    // if (process.env.NODE_ENV === 'development') {
    //   connectFirestoreEmulator(db, 'localhost', 8080);
    //   console.log('🔧 Connected to Firestore emulator');
    // }

  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);

    if (retryCount > 0) {
      console.log(`🔄 Retrying initialization... (${retryCount} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return initializeFirebase(retryCount - 1, delay * 2);
    }

    throw new Error('Failed to initialize Firebase after multiple attempts');
  }
};

// Inicializa o Firebase imediatamente
initializeFirebase().catch(error => {
  console.error('❌ Fatal: Could not initialize Firebase:', error);
});

// Exporta as instâncias inicializadas
export { app, db, analytics, storage };

// Função para testar a conexão
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Garante que o Firebase está inicializado
    if (!db) {
      await initializeFirebase();
    }

    const testCollection = collection(db, 'test_connection');
    await getDocs(testCollection);
    console.log('✅ Firebase connection test successful');
    
    // Log do evento de teste bem-sucedido
    if (analytics) {
      logEvent(analytics, 'connection_test_success');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    
    // Log do evento de falha
    if (analytics) {
      logEvent(analytics, 'connection_test_failure', {
        error_code: error.code || 'unknown',
        error_message: error.message
      });
    }
    
    throw error;
  }
};

// Função para reconectar em caso de perda de conexão
export const reconnectFirebase = async (): Promise<void> => {
  console.log('🔄 Attempting to reconnect to Firebase...');
  return initializeFirebase();
};
