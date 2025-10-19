import { CapacitorConfig } from '@capacitor/cli';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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
      // Utiliza o client ID Web para emitir idToken válido ao Firebase
      serverClientId: (process.env.VITE_GOOGLE_WEB_CLIENT_ID || '').trim() || '759964931590-iiigm5did69ttrjj98unt5pl15ardtb2.apps.googleusercontent.com',
      forceCodeForRefreshToken: false
    }
  }
};

export default config;
