import { CapacitorConfig } from '@capacitor/cli';
import 'dotenv/config';

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
      serverClientId: process.env.VITE_GOOGLE_WEB_CLIENT_ID || 'REPLACEME.apps.googleusercontent.com',
      forceCodeForRefreshToken: false
    }
  }
};

export default config;
