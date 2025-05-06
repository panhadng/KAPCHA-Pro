"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import GraphService, { ChatInfo } from "../services/graphService";

interface ChatSelectorProps {
  onSelectChat: (chatId: string, chatName: string) => void;
  onCancel: () => void;
}

const ChatSelector: React.FC<ChatSelectorProps> = ({
  onSelectChat,
  onCancel,
}) => {
  const { accessToken } = useAuth();
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      if (!accessToken) return;

      setLoading(true);
      setError(null);

      try {
        const graphService = new GraphService(accessToken);
        const userProfile = await graphService.getUserProfile();
        setCurrentUserId(userProfile.id);

        const availableChats = await graphService.getAllChats();
        setChats(availableChats);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setError("Failed to load chats. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [accessToken]);

  const handleSelectChat = () => {
    if (selectedChatId) {
      const selectedChat = chats.find((chat) => chat.id === selectedChatId);
      let chatName = selectedChat?.topic || "Selected Chat";

      if (
        selectedChat?.type === "oneOnOne" &&
        selectedChat?.participants.length > 0 &&
        currentUserId
      ) {
        const otherParticipant = selectedChat.participants.find(
          (p) => p.userId !== currentUserId
        );
        if (otherParticipant?.displayName) {
          chatName = otherParticipant.displayName;
        }
      }

      onSelectChat(selectedChatId, chatName);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-4 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Select Chat</h2>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-4 max-w-2xl mx-auto text-black">
        <h2 className="text-xl font-bold mb-4">Select Chat</h2>
        <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 max-w-2xl mx-auto text-black">
      <h2 className="text-xl font-bold mb-4">Select a Chat</h2>

      {chats.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500">No existing chats found</p>
        </div>
      ) : (
        <div className="mb-4">
          <div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="divide-y divide-gray-200 overflow-y-auto max-h-[300px]">
              {chats
                .filter((chat) =>
                  chat.topic?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedChatId === chat.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedChatId(chat.id)}
                  >
                    <div className="font-medium">
                      {chat.type === "oneOnOne" && chat.participants.length > 0
                        ? chat.participants.find(
                            (p: {
                              userId: string;
                              displayName: string;
                              email?: string;
                            }) => currentUserId && p.userId !== currentUserId
                          )?.displayName || chat.topic
                        : chat.topic}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {chat.type === "oneOnOne"
                        ? "Direct Message"
                        : chat.type === "group"
                        ? "Group Chat"
                        : "Meeting Chat"}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
        >
          Cancel
        </button>
        <button
          onClick={handleSelectChat}
          disabled={!selectedChatId}
          className={`font-bold py-2 px-4 rounded ${
            selectedChatId
              ? "bg-blue-500 hover:bg-blue-700 text-white"
              : "bg-blue-200 text-white cursor-not-allowed"
          }`}
        >
          Select Chat
        </button>
      </div>
    </div>
  );
};

export default ChatSelector;
