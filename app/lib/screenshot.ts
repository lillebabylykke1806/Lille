import { registerPlugin, Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface ScreenshotPlugin {
  startWatching(): Promise<void>;
  stopWatching(): Promise<void>;
  addListener(
    eventName: 'screenshot',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle>;
}

const Screenshot = registerPlugin<ScreenshotPlugin>('Screenshot');

export async function watchScreenshots(onScreenshot: () => void): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  try {
    await Screenshot.startWatching();
    const handle = await Screenshot.addListener('screenshot', onScreenshot);
    return () => {
      handle.remove();
      Screenshot.stopWatching().catch(() => {});
    };
  } catch {
    return () => {};
  }
}
