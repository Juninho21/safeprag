import { CapacitorConfig } from '@capacitor/cli';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const CACHE_BUST = (process.env.CAP_CACHE_BUST || '').trim() || String(Math.floor(Date.now() / 1000));

const config: CapacitorConfig = {
  appId: 'com.safeprag.app',
  appName: 'Sulpest',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Filesystem: {
      iosDocumentPath: 'DOCUMENTS',
      androidExternalStoragePublicDirectory: 'DOWNLOADS'
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Usa o Client ID Web para emitir idToken válido (Android)
      clientId: (process.env.VITE_GOOGLE_WEB_CLIENT_ID || '').trim() || '759964931590-iiigm5did69ttrjj98unt5pl15ardtb2.apps.googleusercontent.com',
      forceCodeForRefreshToken: false
    }
  }
};

export default config;
