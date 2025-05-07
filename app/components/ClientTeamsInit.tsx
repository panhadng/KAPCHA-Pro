"use client";

import { useEffect } from "react";
import * as microsoftTeams from "@microsoft/teams-js";

export default function ClientTeamsInit() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    // Flag to track if we've attempted initialization
    let initialized = false;

    const initTeams = async () => {
      // Simplest check: are we in an iframe?
      const isInIframe = window.self !== window.top;

      if (!isInIframe) {
        console.log("Not running in iframe, skipping Teams SDK initialization");
        return;
      }

      try {
        if (!initialized) {
          initialized = true;
          // Initialize with a timeout to avoid blocking the app
          setTimeout(async () => {
            try {
              // Version-safe initialize
              if (microsoftTeams.app) {
                await microsoftTeams.app.initialize();
              } else {
                await microsoftTeams.app.initialize();
              }
              console.log("Teams SDK initialized successfully");
            } catch {
              console.log(
                "Teams SDK initialization error (safe to ignore in browser)"
              );
            }
          }, 100);
        }
      } catch {
        // Suppress the error to avoid console errors
        console.log("Not in Teams context, continuing as web app");
      }
    };

    initTeams();

    // Cleanup
    return () => {
      initialized = false;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
