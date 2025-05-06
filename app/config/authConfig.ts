export const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID, // Replace with your Azure AD application client ID
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_MSAL_TENANT_ID}`, // Replace with your tenant ID
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI, // Default for local development
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

// Add scopes for authentication
export const loginRequest = {
  scopes: ["User.Read", "Chat.ReadWrite", "ChatMessage.Send"],
};

// Microsoft Graph API endpoint
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphChatEndpoint: "https://graph.microsoft.com/v1.0/chats",
};
