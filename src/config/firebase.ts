import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Configuração a partir de variáveis do Vite (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket
});

// Validação amigável de configuração antes de inicializar
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
const missingKeys = requiredKeys.filter((k) => !firebaseConfig[k]);
if (missingKeys.length > 0) {
  console.error(
    `Configuração Firebase incompleta. Faltam: ${missingKeys.join(', ')}. ` +
    'Verifique seu arquivo .env/.env.local com variáveis VITE_FIREBASE_* e reinicie o servidor do Vite.'
  );
  throw new Error('Firebase não configurado corretamente (apiKey/keys ausentes).');
}

// Inicialização mínima no estilo do snippet
export const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export const storage = getStorage(app);
export const auth = getAuth(app);


// Persistência de Auth no navegador
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Falha ao configurar persistência de Auth:', error);
});

// Analytics apenas no navegador e quando measurementId/appId forem válidos (sem placeholders)
export let analytics: Analytics | undefined;
const isValidMeasurement = firebaseConfig.measurementId && firebaseConfig.measurementId !== 'G-DEVPLACEHOLDER';
const isValidAppId = firebaseConfig.appId && !String(firebaseConfig.appId).toLowerCase().includes('devplaceholder');
if (typeof window !== 'undefined' && isValidMeasurement && isValidAppId) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Falha ao inicializar Analytics:', error);
  }
}