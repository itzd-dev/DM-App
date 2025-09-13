import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AppProvider } from "./contexts/AppContext";
// PWA registration (vite-plugin-pwa)
import { registerSW } from "virtual:pwa-register";
import { Analytics } from "@vercel/analytics/next";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProvider>
      <App />
      <Analytics />
    </AppProvider>
  </StrictMode>
);

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  registerSW({ immediate: true });
}
