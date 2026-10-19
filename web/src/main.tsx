import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./landing/landing.css";
import "./studio/studio.css";
import "./studio/desk.css";
import "./studio/start.css";
import "./studio/signin.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
