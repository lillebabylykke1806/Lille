import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'no.lilleapp.app',
  appName: 'Lille',
  webDir: 'out',
  server: {
    url: 'https://www.lilleapp.no',
    cleartext: true,
  },
};
export default config;
