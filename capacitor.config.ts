import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cosine.codeinsight',
  appName: 'CodeInsight',
  webDir: 'packages/frontend/dist',

  server: {
    androidScheme: 'https',
    cleartext: false,
  },

  android: {
    buildOptions: {
      keystorePath: './android/app/codeinsight-release-new.keystore',
      keystorePassword: 'codeinsight2026',
      keyAlias: 'codeinsight',
      keyPassword: 'codeinsight2026',
    },
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com', 'github.com'],
    },
  },
};

export default config;
