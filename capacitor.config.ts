import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mentation.app",
  appName: "Mentication",
  webDir: "dist",
  backgroundColor: "#1E3C42",
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "Mentication",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: true,
      backgroundColor: "#1E3C42",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ECE2D2",
    },
  },
};

export default config;
