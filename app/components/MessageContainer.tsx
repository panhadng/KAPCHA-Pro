import React, { useState, useEffect } from "react";
import UserProfile from "./UserProfile";
import MessageForm from "./MessageForm";
import SmsForm from "./SmsForm";
import { useAuth } from "../context/AuthContext";
import GraphService from "../services/graphService";

interface UserData {
  displayName: string;
  mail: string;
  userPrincipalName: string;
  id: string;
}

const MessageContainer = () => {
  const [selectedForm, setSelectedForm] = useState<"teams" | "sms" | null>(
    "teams"
  );
  const { isAuthenticated, accessToken } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated && accessToken) {
        setLoading(true);
        try {
          const graphService = new GraphService(accessToken);
          const profile = await graphService.getUserProfile();
          setUserData(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserProfile();
  }, [isAuthenticated, accessToken]);

  const teamsName = userData?.displayName || "";
  const teamsEmail = userData?.mail || userData?.userPrincipalName || "";

  return (
    <div className="space-y-6">
      <UserProfile
        userData={userData}
        loading={loading}
        isAuthenticated={isAuthenticated}
      />
      <div className="flex justify-center gap-8 my-6">
        <button
          className={`text-white text-2xl font-bold py-6 px-12 rounded-lg shadow-lg transition-all duration-200 ${
            selectedForm === "teams"
              ? "bg-purple-700"
              : "bg-purple-400 hover:bg-purple-600"
          }`}
          onClick={() => setSelectedForm("teams")}
        >
          Teams
        </button>
        <button
          className={`text-white text-2xl font-bold py-6 px-12 rounded-lg shadow-lg transition-all duration-200 ${
            selectedForm === "sms"
              ? "bg-blue-700"
              : "bg-blue-400 hover:bg-blue-600"
          }`}
          onClick={() => setSelectedForm("sms")}
        >
          SMS
        </button>
      </div>
      {selectedForm === "teams" && <MessageForm />}
      {selectedForm === "sms" && (
        <SmsForm TeamsName={teamsName} TeamsEmail={teamsEmail} />
      )}
    </div>
  );
};

export default MessageContainer;
