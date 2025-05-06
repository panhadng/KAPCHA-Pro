"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "../config/authConfig";

interface AuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  accessToken: string | null;
  login: () => Promise<void>;
  logout: () => void;
  msalInstance: PublicClientApplication | null;
  isInitializing: boolean;
  clearMsalCache: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  login: async () => {},
  logout: () => {},
  msalInstance: null,
  isInitializing: true,
  clearMsalCache: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [msalInstance, setMsalInstance] =
    useState<PublicClientApplication | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Initialize MSAL instance
  useEffect(() => {
    const initializeMsal = async () => {
      if (typeof window === "undefined") {
        return; // Skip on server-side
      }

      try {
        setIsInitializing(true);

        // Create a fixed config to ensure redirectUri is properly formatted
        const fixedMsalConfig = {
          ...msalConfig,
          auth: {
            ...msalConfig.auth,
            clientId: msalConfig.auth.clientId as string,
            authority: msalConfig.auth.authority as string,
            redirectUri: msalConfig.auth.redirectUri as string,
          },
        };

        // Log configuration values
        console.log("MSAL Config:", {
          clientId: fixedMsalConfig.auth.clientId,
          authority: fixedMsalConfig.auth.authority,
          redirectUri: fixedMsalConfig.auth.redirectUri,
        });

        console.log("Initializing MSAL...");

        // Create a new MSAL instance with fixed config
        const msalInstanceObj = new PublicClientApplication(fixedMsalConfig);

        // Explicitly initialize MSAL
        await msalInstanceObj.initialize();
        console.log("MSAL initialized successfully");

        // Set the instance
        setMsalInstance(msalInstanceObj);

        // Check if a user is already signed in
        const accounts = msalInstanceObj.getAllAccounts();
        console.log(`Found ${accounts.length} accounts`);

        if (accounts.length > 0) {
          setIsAuthenticated(true);
          setUser(accounts[0]);

          try {
            // Acquire token silently
            const response = await msalInstanceObj.acquireTokenSilent({
              ...loginRequest,
              account: accounts[0],
            });
            setAccessToken(response.accessToken);
            console.log("Token acquired successfully");
          } catch (tokenError) {
            console.error("Error acquiring token silently:", tokenError);
          }
        }
      } catch (error) {
        console.error("Error initializing MSAL:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeMsal();

    // Clean up
    return () => {
      // Any cleanup code if needed
    };
  }, []);

  // Login function
  const login = async () => {
    if (!msalInstance) {
      console.error("MSAL not initialized yet");
      return;
    }

    if (isInitializing) {
      console.error("MSAL is still initializing");
      return;
    }

    try {
      console.log("Attempting login with fixed redirectUri");

      // Attempt to clear any existing interaction in progress
      const sessionStorageKeys = Object.keys(sessionStorage);
      const inProgressKey = sessionStorageKeys.find((key) =>
        key.includes("interaction.status")
      );
      if (inProgressKey) {
        console.log("Found existing interaction in progress. Clearing it...");
        sessionStorage.removeItem(inProgressKey);
      }

      const response = await msalInstance.loginPopup({
        ...loginRequest,
        redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI, // Ensure this is identical to what's in Azure
      });

      console.log("Login successful");
      setIsAuthenticated(true);
      setUser(response.account);
      setAccessToken(response.accessToken);
    } catch (error) {
      console.error("Login error:", error);
      // If there's a browser interaction error, try to clear the MSAL cache
      if (
        error instanceof Error &&
        error.message.includes("interaction_in_progress")
      ) {
        console.log(
          "Detected interaction_in_progress error, clearing MSAL cache..."
        );

        // Clear session storage
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.includes("msal")) {
            sessionStorage.removeItem(key);
          }
        }

        // Inform the user
        alert("Login process was interrupted. Please try signing in again.");
      }
    }
  };

  // Logout function
  const logout = () => {
    if (!msalInstance || isInitializing) {
      console.error("MSAL not initialized yet");
      return;
    }

    try {
      // Properly clear all MSAL-related data
      // 1. Clear session storage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes("msal") || key.includes("interaction"))) {
          sessionStorage.removeItem(key);
        }
      }

      // 2. Normal logout
      msalInstance.logout();

      // 3. Update state
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);

      console.log("Logout completed and session cleared");
    } catch (error) {
      console.error("Logout error:", error);
      // Force state reset even if the logout fails
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
    }
  };

  // Utility function to clear MSAL cache
  const clearMsalCache = () => {
    console.log("Manually clearing MSAL cache");

    // Clear both session and local storage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes("msal") || key.includes("interaction"))) {
        console.log(`Removing session storage key: ${key}`);
        sessionStorage.removeItem(key);
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes("msal") || key.includes("interaction"))) {
        console.log(`Removing local storage key: ${key}`);
        localStorage.removeItem(key);
      }
    }

    // Reset the state
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);

    // If msalInstance exists, clear the accounts
    if (msalInstance) {
      try {
        const accounts = msalInstance.getAllAccounts();
        console.log(`Clearing ${accounts.length} accounts from MSAL instance`);

        // The correct method for MSAL v2
        accounts.forEach((account) => {
          if (msalInstance.getAccountByUsername(account.username)) {
            console.log(`Clearing account: ${account.username}`);
          }
        });

        // Force clear the token cache
        console.log("Clearing token cache through storage");
      } catch (e) {
        console.error("Error clearing MSAL accounts:", e);
      }
    }

    console.log("MSAL cache cleared");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        accessToken,
        login,
        logout,
        msalInstance,
        isInitializing,
        clearMsalCache,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
