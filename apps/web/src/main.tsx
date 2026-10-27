import './sentry'
import { reportError } from "./sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "@fontsource-variable/geist";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { PrivacyPolicy, TermsOfService } from "./pages/LegalPages";
import { ForgotPassword } from "./pages/ForgotPassword";
import { VerifyEmail } from "./pages/VerifyEmail";
import "./styles.css";

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/verify-email", element: <VerifyEmail /> },
  { path: "/privacy", element: <PrivacyPolicy /> },
  { path: "/terms", element: <TermsOfService /> },
  {
    path: "/app/*",
    element: (
      <RequireAuth>
        <ErrorBoundary scope="workspace">
          <App />
        </ErrorBoundary>
      </RequireAuth>
    )
  },
  { path: "*", element: <Navigate to="/" replace /> }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary scope="app">
      <AuthProvider>
        <MotionConfig reducedMotion="user">
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""}>
            <RouterProvider router={router} />
          </GoogleOAuthProvider>
        </MotionConfig>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Safety net: every background `void`-fire must still be observable.
window.addEventListener("unhandledrejection", (event) => {
  reportError(event.reason, { source: "unhandledrejection" });
});
window.addEventListener("error", (event) => {
  if (event.error) reportError(event.error, { source: "window-error" });
});

// Register advanced PWA sync features if supported
import { registerBackgroundSync, registerPeriodicSync } from "./lib/syncRegistration";
registerBackgroundSync("sync-tasks");
registerPeriodicSync("update-tasks");
