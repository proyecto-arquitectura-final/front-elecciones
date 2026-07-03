import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.edu.elecciones.app',
  appName: 'Sistema Electoral',
  webDir: 'dist/srs-front/browser',
  bundledWebRuntime: false,
  server: { androidScheme: 'https' },
  android: { backgroundColor: '#08111f' },
  plugins: {
    CapacitorHttp: { enabled: true },
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#08111fff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#08111f',
    },
  },
};

export default config;
