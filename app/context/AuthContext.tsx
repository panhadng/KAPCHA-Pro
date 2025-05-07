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
import * as microsoftTeams from "@microsoft/teams-js";

interface AuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  accessToken: string | null;
  login: () => Promise<void>;
  logout: () => void;
  msalInstance: PublicClientApplication | null;
  isInitializing: boolean;
  clearMsalCache: () => void;
  isInTeams: boolean;
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
  isInTeams: false,
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
  const [isInTeams, setIsInTeams] = useState<boolean>(false);

  // Initialize Teams SSO or MSAL
  useEffect(() => {
    // Skip on server-side
    if (typeof window === "undefined") return;

    const initializeAuth = async () => {
      try {
        setIsInitializing(true);

        // Check if we're in an iframe (Teams)
        const inIframe = window.self !== window.top;
        setIsInTeams(inIframe);

        if (inIframe) {
          // We're likely in Teams
          console.log("In iframe - attempting Teams SSO");

          try {
            // Wait for Teams SDK to be ready
            setTimeout(() => {
              console.log("Attempting Teams getAuthToken");
              // Try to get Teams auth token
              microsoftTeams.authentication.getAuthToken({
                successCallback: (token: string) => {
                  console.log("Teams SSO successful");
                  setAccessToken(token);
                  setIsAuthenticated(true);
                  setIsInitializing(false);
                },
                failureCallback: (error: string) => {
                  console.error("Teams SSO failed:", error);
                  // Fall back to MSAL if Teams SSO fails
                  initializeMsal();
                },
                resources: ["https://graph.microsoft.com/User.Read"],
              });
            }, 500);
          } catch (teamsSsoError) {
            console.error(
              "Error with Teams SSO, falling back to MSAL:",
              teamsSsoError
            );
            // Fall back to MSAL
            initializeMsal();
          }
        } else {
          // Not in Teams, use MSAL
          console.log("Not in Teams - using MSAL");
          initializeMsal();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsInitializing(false);
      }
    };

    const initializeMsal = async () => {
      try {
        console.log("Initializing MSAL...");
        const fixedMsalConfig = {
          ...msalConfig,
          auth: {
            ...msalConfig.auth,
            clientId: msalConfig.auth.clientId as string,
            authority: msalConfig.auth.authority as string,
            redirectUri: msalConfig.auth.redirectUri as string,
          },
        };

        const msalInstanceObj = new PublicClientApplication(fixedMsalConfig);
        await msalInstanceObj.initialize();
        console.log("MSAL initialized");
        setMsalInstance(msalInstanceObj);

        const accounts = msalInstanceObj.getAllAccounts();
        if (accounts.length > 0) {
          console.log("Found existing MSAL account");
          setIsAuthenticated(true);
          setUser(accounts[0]);

          try {
            // Silently acquire token if account exists
            const response = await msalInstanceObj.acquireTokenSilent({
              ...loginRequest,
              account: accounts[0],
            });
            console.log("Token acquired silently");
            setAccessToken(response.accessToken);
          } catch (tokenError) {
            console.error("Error acquiring token silently:", tokenError);
          }
        }
      } catch (msalError) {
        console.error("MSAL initialization error:", msalError);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async () => {
    if (!msalInstance) {
      console.error("MSAL not initialized yet");
      return;
    }

    try {
      console.log("Starting login popup");
      const response = await msalInstance.loginPopup(loginRequest);
      console.log("Login successful");
      setIsAuthenticated(true);
      setUser(response.account);
      setAccessToken(response.accessToken);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Logout function
  const logout = () => {
    if (isInTeams) {
      // In Teams, just clear local state
      console.log("Teams logout - clearing local state");
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
    } else if (msalInstance) {
      // MSAL logout
      try {
        console.log("MSAL logout");
        // Clear session storage
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.includes("msal") || key.includes("interaction"))) {
            sessionStorage.removeItem(key);
          }
        }

        msalInstance.logout();
        setIsAuthenticated(false);
        setUser(null);
        setAccessToken(null);
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
  };

  const clearMsalCache = () => {
    if (msalInstance) {
      msalInstance.clearCache();
    }
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
        isInTeams,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
