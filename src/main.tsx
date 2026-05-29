import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { NovelProvider } from "./contexts/NovelContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ToastProvider } from "./components/common/Toast";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <NovelProvider>
          <App />
        </NovelProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
