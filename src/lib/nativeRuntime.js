import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { initializeTaraNotificationRouting } from './taraCheckInNotifications';

export async function initializeNativeRuntime() {
  if (!Capacitor.isNativePlatform()) return;

  // Subscribe before other awaited startup work; Capacitor retains cold-start taps.
  initializeTaraNotificationRouting();

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    // A native cosmetic capability must never prevent the wellbeing UI loading.
  }

  App.addListener("appStateChange", ({ isActive }) => {
    document.documentElement.dataset.appState = isActive ? "active" : "background";
    if (isActive) window.dispatchEvent(new CustomEvent('mentation:app-active'));
  });

  try {
    await SplashScreen.hide();
  } catch {
    // The launch screen may already have been hidden by the native runtime.
  }
}
