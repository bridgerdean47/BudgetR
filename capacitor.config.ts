import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.budgetr.app',
  appName: 'BudgetR',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      backgroundColor: '#050507',
      launchAutoHide: true,
    },
  },
};

export default config;
