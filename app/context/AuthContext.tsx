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

  // Initialize Teams SDK and MSAL
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        setIsInitializing(true);

        // Initialize Teams SDK
        await microsoftTeams.initialize();

        // Check if we're running in Teams
        const context = await microsoftTeams.app.getContext();
        const isInTeams = context !== null;

        if (isInTeams) {
          // We're in Teams, use Teams SSO
          try {
            const authTokenRequest = {
              successCallback: (token: string) => {
                setAccessToken(token);
                setIsAuthenticated(true);
                // You might want to decode the token to get user info
                // or make a Graph API call to get user details
              },
              failureCallback: (error: string) => {
                console.error("Failed to get auth token:", error);
                setIsAuthenticated(false);
              },
              resources: ["https://graph.microsoft.com/User.Read"],
            };

            microsoftTeams.authentication.getAuthToken(authTokenRequest);
          } catch (error) {
            console.error("Error getting Teams auth token:", error);
          }
        } else {
          // We're not in Teams, fall back to regular MSAL
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
          setMsalInstance(msalInstanceObj);

          const accounts = msalInstanceObj.getAllAccounts();
          if (accounts.length > 0) {
            setIsAuthenticated(true);
            setUser(accounts[0]);
            try {
              const response = await msalInstanceObj.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
              });
              setAccessToken(response.accessToken);
            } catch (tokenError) {
              console.error("Error acquiring token silently:", tokenError);
            }
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
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
      const response = await msalInstance.loginPopup(loginRequest);
      setIsAuthenticated(true);
      setUser(response.account);
      setAccessToken(response.accessToken);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Logout function
  const logout = () => {
    if (!msalInstance) {
      console.error("MSAL not initialized yet");
      return;
    }

    try {
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
