import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./shared/presentation/App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
