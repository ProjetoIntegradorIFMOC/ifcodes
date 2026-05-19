import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppRouter from "./routes/AppRouter.tsx";
import DataProvider from "./context/DataContext.tsx";
import { UserProvider } from "./context/UserContext.tsx";
import RealtimeNotifications from "./components/RealtimeNotifications.tsx";
import axios from "axios";

// Configure axios defaults for the app: base URL and send credentials (for Sanctum)
const API_URL = import.meta.env?.VITE_API_URL || "";
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProvider>
      <DataProvider>
        <AppRouter />
        <RealtimeNotifications />
      </DataProvider>
    </UserProvider>
  </StrictMode>
);
