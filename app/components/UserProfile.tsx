"use client";

import React from "react";

interface UserData {
  displayName: string;
  mail: string;
  userPrincipalName: string;
  id: string;
}

const UserProfile: React.FC<{
  userData: UserData | null;
  loading: boolean;
  isAuthenticated: boolean;
}> = ({ userData, loading, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <div>Please sign in to view your profile</div>;
  }

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 text-black">
      <h2 className="text-xl font-bold mb-2">User Profile</h2>
      {userData && (
        <div>
          <p>
            <strong>Name:</strong> {userData.displayName}
          </p>
          <p>
            <strong>Email:</strong>{" "}
            {userData.mail || userData.userPrincipalName}
          </p>
          <p>
            <strong>User ID:</strong> {userData.id}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
