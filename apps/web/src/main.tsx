import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { MotionConfig } from "motion/react";
import "@fontsource-variable/geist";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { ForgotPassword } from "./pages/ForgotPassword";
import "./styles.css";

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/privacy", element: <PrivacyPolicy /> },
  {
    path: "/app/*",
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    )
  },
  { path: "*", element: <Navigate to="/" replace /> }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <MotionConfig reducedMotion="user">
          <RouterProvider router={router} />
        </MotionConfig>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
