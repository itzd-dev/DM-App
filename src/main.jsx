import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AppProviders } from "./contexts/AppProviders";
import { LegacyAppProvider } from "./contexts/AppContext";
import { BrowserRouter } from "react-router-dom";
// PWA registration (vite-plugin-pwa)
import { registerSW } from "virtual:pwa-register";
import { Analytics } from "@vercel/analytics/react";
import ToastStack from "./components/ui/ToastStack";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <LegacyAppProvider>
          <App />
          <Analytics />
          <ToastStack />
        </LegacyAppProvider>
      </AppProviders>
    </BrowserRouter>
  </StrictMode>
);

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  registerSW({ immediate: true });
}
