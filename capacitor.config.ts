import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'no.lilleapp.app',
  appName: 'Lille',
  webDir: 'out',
  server: {
    url: 'https://www.lilleapp.no',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
};
export default config;
