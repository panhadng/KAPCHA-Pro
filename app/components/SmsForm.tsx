"use client";

import React, { useState } from "react";

const SmsForm: React.FC<{ TeamsName: string; TeamsEmail: string }> = ({
  TeamsName,
  TeamsEmail,
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setStatus({ type: "error", message: "Phone number is required." });
      return;
    }
    if (!message) {
      setStatus({ type: "error", message: "Message is required." });
      return;
    }
    setLoading(true);
    setStatus({ type: "", message: "" });
    let finalMessage = message;
    if (includeSignature) {
      finalMessage += `\n\nSent from MS Teams: ${TeamsName} & ${TeamsEmail}`;
    }
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phoneNumber, body: finalMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", message: "SMS sent successfully!" });
        setMessage("");
        setPhoneNumber("");
        setIncludeSignature(false);
      } else {
        setStatus({
          type: "error",
          message: data.error || "Failed to send SMS.",
        });
      }
    } catch {
      setStatus({ type: "error", message: "Failed to send SMS." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 text-black">
      <h2 className="text-xl font-bold mb-4 text-black">Send SMS</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 text-black items-center text-center"
      >
        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 text-left"
          >
            Phone Number
          </label>
          <input
            type="text"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter phone number (e.g. +61412345678)"
          />
        </div>
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
        <div className="flex items-center justify-start">
          <input
            id="includeSignature"
            type="checkbox"
            checked={includeSignature}
            onChange={() => setIncludeSignature((v) => !v)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="includeSignature"
            className="ml-2 block text-sm text-gray-700"
          >
            Include Teams signature
          </label>
        </div>
        <button
          type="submit"
          disabled={loading || !phoneNumber}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            loading || !phoneNumber
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Sending..." : "Send SMS"}
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

export default SmsForm;
