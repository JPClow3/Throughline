import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import "@fontsource-variable/geist";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Landing } from "./pages/Landing";
import "./styles.css";

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/app/*", element: <App /> },
  { path: "*", element: <Navigate to="/" replace /> }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>
);
