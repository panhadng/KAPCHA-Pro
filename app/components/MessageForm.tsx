"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import GraphService from "../services/graphService";
import ChatSelector from "./ChatSelector";

const MessageForm: React.FC = () => {
  const { isAuthenticated, accessToken } = useAuth();
  const [recipientId, setRecipientId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [status, setStatus] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({ type: "", message: "" });
  const [loading, setLoading] = useState<boolean>(false);
  const [showChatSelector, setShowChatSelector] = useState<boolean>(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatInfo, setSelectedChatInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !accessToken) {
      setStatus({
        type: "error",
        message: "You must be logged in to send messages.",
      });
      return;
    }

    if (!recipientId && !selectedChatId) {
      setStatus({
        type: "error",
        message: "Recipient ID or a selected chat is required.",
      });
      return;
    }

    if (!message) {
      setStatus({
        type: "error",
        message: "Message is required.",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const graphService = new GraphService(accessToken);

      if (selectedChatId) {
        await graphService.sendMessageToChat(selectedChatId, message);
      } else {
        await graphService.sendTeamsMessage(recipientId, message);
      }

      setStatus({ type: "success", message: "Message sent successfully!" });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus({
        type: "error",
        message:
          "Failed to send message. Please check permissions or try a different chat.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowChatSelector = () => {
    setShowChatSelector(true);
  };

  const handleCancelChatSelection = () => {
    setShowChatSelector(false);
  };

  const handleSelectChat = (chatId: string, chatName: string) => {
    setSelectedChatId(chatId);
    setSelectedChatInfo(`Selected chat: ${chatName}`);
    setShowChatSelector(false);
  };

  const handleClearSelectedChat = () => {
    setSelectedChatId(null);
    setSelectedChatInfo(null);
  };

  if (!isAuthenticated) {
    return <div>Please sign in to send messages</div>;
  }

  if (showChatSelector) {
    return (
      <ChatSelector
        onSelectChat={handleSelectChat}
        onCancel={handleCancelChatSelection}
      />
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 text-black">
      <h2 className="text-xl font-bold mb-4 text-black">Send Teams Message</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 text-black items-center text-center"
      >
        {!selectedChatId ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="recipientId"
                className="block text-sm font-medium text-gray-700"
              >
                Recipient ID (User ID or email)
              </label>
              <button
                type="button"
                onClick={handleShowChatSelector}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Select from existing chats
              </button>
            </div>
            <input
              type="text"
              id="recipientId"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter recipient's ID or email"
            />
          </div>
        ) : (
          <div className="mt-1 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                Selected Chat
              </div>
              <button
                type="button"
                onClick={handleClearSelectedChat}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear selection
              </button>
            </div>
            <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
              {selectedChatInfo}
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700 text-left"
          >
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type your message here"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || (!recipientId && !selectedChatId)}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            loading || (!recipientId && !selectedChatId)
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>

      {status.message && (
        <div
          className={`mt-4 p-3 rounded ${
            status.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
};

export default MessageForm;
