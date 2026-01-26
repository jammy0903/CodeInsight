import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cosine.codeinsight',
  appName: 'C-OSINE',
  webDir: 'packages/frontend/dist',

  server: {
    androidScheme: 'https',
    cleartext: false,
  },

  android: {
    buildOptions: {
      keystorePath: './my-release-key.keystore',
      keystorePassword: process.env.KEYSTORE_PASSWORD,
      keyAlias: 'my-key-alias',
      keyPassword: process.env.KEY_PASSWORD,
    },
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
