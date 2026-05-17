import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app/App";
import { BootFallback } from "@/app/BootFallback";
import { ErrorBoundary } from "@/app/ErrorBoundary";
import { Providers } from "./app/providers";
import "./styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.innerHTML =
    '<div style="padding:24px;font-family:system-ui">SuperTerminal could not find the root element.</div>';
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Providers>
          <App />
        </Providers>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
