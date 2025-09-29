import { CapacitorConfig } from '@capacitor/cli';

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
    }
  }
};

export default config;
