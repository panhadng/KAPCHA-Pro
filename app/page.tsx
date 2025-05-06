"use client";

import React from "react";
import LoginButton from "./components/LoginButton";
import MessageContainer from "./components/MessageContainer";
import { useAuth } from "./context/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Teams Messaging App
          </h1>
          <LoginButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-grow flex flex-row items-center justify-center">
        <div className="px-4 py-6 sm:px-0 flex-grow">
          {isAuthenticated ? (
            <MessageContainer />
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center text-black">
              <h2 className="text-2xl font-bold mb-4">
                Welcome to Teams Messaging
              </h2>
              <p className="mb-6">
                Sign in with your Microsoft account to send Teams messages.
              </p>
              <div className="flex justify-center">
                <LoginButton />
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>
            Copyright © {new Date().getFullYear()} Teams Messaging App by
            FLYONIT
          </p>
        </div>
      </footer>
    </div>
  );
}
