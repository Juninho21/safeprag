import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
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

// Inicialização mínima no estilo do snippet
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Persistência offline do Firestore
enableIndexedDbPersistence(db).catch((err: any) => {
  if (err?.code === 'failed-precondition') {
    console.warn('Persistência offline indisponível: múltiplas abas abertas.');
  } else if (err?.code === 'unimplemented') {
    console.warn('Persistência offline não suportada pelo navegador atual.');
  } else {
    console.warn('Falha ao habilitar persistência offline:', err);
  }
});

// Persistência de Auth no navegador
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Falha ao configurar persistência de Auth:', error);
});

// Analytics apenas no navegador e quando measurementId estiver definido
export let analytics: Analytics | undefined;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Falha ao inicializar Analytics:', error);
  }
}