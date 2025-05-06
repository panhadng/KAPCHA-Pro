"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const LoginButton: React.FC = () => {
  const {
    isAuthenticated,
    login,
    logout,
    msalInstance,
    isInitializing,
    clearMsalCache,
  } = useAuth();
  const [isBrowser, setIsBrowser] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // Set browser state on client side
  useEffect(() => {
    setIsBrowser(typeof window !== "undefined");
  }, []);

  const handleAuthAction = async () => {
    if (isInitializing) {
      console.log("MSAL is still initializing. Please wait.");
      return;
    }

    if (!msalInstance) {
      console.error("MSAL instance is not initialized yet");
      return;
    }

    if (isAuthenticated) {
      logout();
    } else {
      try {
        await login();
      } catch (error) {
        console.error("Login failed:", error);
        setShowTroubleshooting(true);
      }
    }
  };

  const handleResetAuth = () => {
    clearMsalCache();
    window.location.reload();
  };

  // Don't render the button during server-side rendering
  if (!isBrowser) {
    return null;
  }

  return (
    <div>
      <button
        onClick={handleAuthAction}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={!msalInstance || isInitializing}
      >
        {isInitializing
          ? "Initializing..."
          : !msalInstance
          ? "Loading..."
          : isAuthenticated
          ? "Sign Out"
          : "Sign In with Microsoft"}
      </button>

      {showTroubleshooting && !isAuthenticated && (
        <div className="mt-2">
          <button
            onClick={handleResetAuth}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-sm"
          >
            Reset Authentication
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Use this if you&apos;re having login issues
          </p>
        </div>
      )}
    </div>
  );
};

export default LoginButton;
