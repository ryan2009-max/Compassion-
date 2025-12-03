import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    } else {
      if (navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => regs.forEach((r) => r.unregister()))
          .catch(() => {});
      } else if (navigator.serviceWorker.getRegistration) {
        navigator.serviceWorker
          .getRegistration()
          .then((reg) => reg && reg.unregister())
          .catch(() => {});
      }
    }
  });
}
