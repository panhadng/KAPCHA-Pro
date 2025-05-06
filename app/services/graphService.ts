import { Client } from "@microsoft/microsoft-graph-client";
import { AuthProviderCallback } from "@microsoft/microsoft-graph-client";

// Method 1: Simple function-based auth provider
const getAuthProvider = (accessToken: string) => {
  return (callback: AuthProviderCallback) => {
    callback(null, accessToken);
  };
};

// Interface for chat member
interface ChatMember {
  id: string;
  userId: string;
  email?: string;
  displayName?: string;
  roles?: string[];
}

// Interface for chat info
export interface ChatInfo {
  id: string;
  topic: string | null;
  type: string;
  participants: { userId: string; displayName: string; email?: string }[];
  lastMessagePreview?: string;
  lastMessageTime?: string;
}

export default class GraphService {
  private client: Client;
  private myUserId: string | null = null;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error("Access token is required to initialize GraphService");
    }
    
    console.log("Initializing Graph client with token:", accessToken.substring(0, 10) + "...");
    
    // Initialize the Graph client with the function-based auth provider
    this.client = Client.init({
      authProvider: getAuthProvider(accessToken),
      debugLogging: true
    });
  }

  /**
   * Get the current user's profile information
   * @returns {Promise<any>} - User profile data
   */
  public async getUserProfile() {
    try {
      console.log("Fetching user profile from Graph API...");
      const profile = await this.client.api("/me").get();
      console.log("User profile fetched successfully");
      
      // Store the current user's ID for later use in chat creation
      this.myUserId = profile.id;
      
      return profile;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  }

  /**
   * Get all available chats with detailed info
   * @returns {Promise<ChatInfo[]>} - List of available chats with details
   */
  public async getAllChats(): Promise<ChatInfo[]> {
    try {
      console.log("Fetching all available chats...");
      
      // Get all chats with a simpler approach to avoid permission issues
      const response = await this.client.api("/chats")
        .select("id,topic,chatType")
        .get();
      
      const chats: ChatInfo[] = [];
      
      if (response && response.value && response.value.length > 0) {
        console.log(`Found ${response.value.length} chats`);
        
        // Process each chat to get basic information
        for (const chat of response.value) {
          try {
            // Create a basic chat info object
            const chatInfo: ChatInfo = {
              id: chat.id,
              topic: chat.topic || `Chat ${chat.id.substring(0, 8)}...`,
              type: chat.chatType,
              participants: []
            };
            
            // Fetch chat members to get participant details
            try {
              const members = await this.client.api(`/chats/${chat.id}/members`).get();
              
              if (members && members.value) {
                chatInfo.participants = members.value.map((member: ChatMember) => ({
                  userId: member.userId,
                  displayName: member.displayName || 'Unknown',
                  email: member.email
                }));
                
                console.log(`Retrieved ${chatInfo.participants.length} participants for chat ${chat.id}`);
              }
            } catch (membersError) {
              console.error(`Error getting members for chat ${chat.id}:`, membersError);
              // Continue with empty participants array
            }
            
            // Add to list
            chats.push(chatInfo);
          } catch (chatError) {
            console.error(`Error processing chat ${chat.id}:`, chatError);
          }
        }
      }
      
      console.log(`Processed ${chats.length} chats`);
      return chats;
    } catch (error) {
      console.error("Error getting chats:", error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Find an existing chat with a user
   * @param {string} targetUserId - ID or email of the user to find chat with
   * @returns {Promise<string|null>} - Chat ID if found, null otherwise
   */
  private async findExistingChatWithUser(targetUserId: string): Promise<string | null> {
    try {
      console.log("Searching for existing chat with user:", targetUserId);
      
      // Get all chats
      const chats = await this.client.api("/chats").get();
      
      if (chats && chats.value && chats.value.length > 0) {
        console.log(`Found ${chats.value.length} chats, checking for target user...`);
        
        // Loop through chats to find one with this user
        for (const chat of chats.value) {
          try {
            // Get members of each chat
            const members = await this.client.api(`/chats/${chat.id}/members`).get();
            
            // Check if the target user is a member
            const hasTargetUser = members.value.some((member: ChatMember) => 
              member.userId === targetUserId || 
              (member.email && member.email.toLowerCase() === targetUserId.toLowerCase())
            );
            
            if (hasTargetUser) {
              console.log(`Found existing chat with user: ${chat.id}`);
              return chat.id;
            }
          } catch (memberError) {
            console.error(`Error checking members for chat ${chat.id}:`, memberError);
            // Continue to next chat
          }
        }
      }
      
      console.log("No existing chat found with this user");
      return null;
    } catch (error) {
      console.error("Error finding existing chats:", error);
      return null;
    }
  }

  /**
   * Send a message to a specific chat
   * @param {string} chatId - ID of the chat to send message to
   * @param {string} message - Message content
   * @returns {Promise<any>} - The sent message data
   */
  public async sendMessageToChat(chatId: string, message: string) {
    try {
      console.log(`Sending message to chat: ${chatId}`);
      const response = await this.client.api(`/chats/${chatId}/messages`).post({
        body: {
          content: message
        }
      });
      
      console.log("Message sent successfully");
      return response;
    } catch (error) {
      console.error(`Error sending message to chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Send a message to a Teams user
   * @param {string} userId - ID or email of the user to message
   * @param {string} message - Message content
   * @param {string|null} specificChatId - Optional specific chat ID to use
   * @returns {Promise<any>} - The created message data
   */
  public async sendTeamsMessage(userId: string, message: string, specificChatId: string | null = null) {
    if (!this.myUserId) {
      // Fetch user profile if we don't have the current user's ID
      await this.getUserProfile();
    }
    
    try {
      // If a specific chat ID is provided, use that
      if (specificChatId) {
        return await this.sendMessageToChat(specificChatId, message);
      }
      
      // First attempt: Try to find an existing chat with the user
      const existingChatId = await this.findExistingChatWithUser(userId);
      
      if (existingChatId) {
        console.log(`Sending message to existing chat: ${existingChatId}`);
        
        // Send message to existing chat
        const response = await this.client.api(`/chats/${existingChatId}/messages`).post({
          body: {
            content: message
          }
        });
        
        console.log("Message sent to existing chat successfully");
        return response;
      }
      
      // If no existing chat, create a new one
      console.log(`No existing chat found. Creating new chat with user: ${userId}`);
      
      // Create a chat using the simpler format that works with email addresses
      const chatPayload = {
        chatType: "oneOnOne",
        members: [
          {
            "@odata.type": "#microsoft.graph.aadUserConversationMember",
            roles: ["owner"],
            userId: this.myUserId
          },
          {
            "@odata.type": "#microsoft.graph.aadUserConversationMember",
            roles: ["owner"],
            userId: userId
          }
        ]
      };
      
      console.log("Chat payload:", JSON.stringify(chatPayload, null, 2));
      
      // Create a chat
      const chat = await this.client.api("/chats").post(chatPayload);
      
      console.log(`Chat created with ID: ${chat.id}`);

      // Send a message to the chat
      console.log(`Sending message to new chat: ${chat.id}`);
      const response = await this.client.api(`/chats/${chat.id}/messages`).post({
        body: {
          content: message
        }
      });
      
      console.log("Message sent successfully to new chat");
      return response;
    } catch (error) {
      console.error("Error in main send flow:", error);
      
      if (error instanceof Error) {
        // Try to extract error details
        const errorMessage = error.toString();
        console.log("Error details:", errorMessage);
        
        // Try alternative method if we have userId issues
        if (errorMessage.includes("'user@odata.bind'") || 
            errorMessage.includes("'userId' field is missing")) {
          try {
            console.log("Trying alternative chat creation approach...");
            
            // Alternative approach: create chat directly with specific users
            const chatPayload = {
              chatType: "oneOnOne",
              members: [
                {
                  "@odata.type": "#microsoft.graph.aadUserConversationMember",
                  roles: ["owner"],
                  userId: this.myUserId
                },
                {
                  "@odata.type": "#microsoft.graph.aadUserConversationMember",
                  roles: ["owner"],
                  userId: userId.includes('@') ? userId : `${userId}`
                }
              ]
            };
            
            console.log("Alternative payload:", JSON.stringify(chatPayload, null, 2));
            
            const chat = await this.client.api("/chats").post(chatPayload);
            console.log(`Chat created with alternative approach, ID: ${chat.id}`);
            
            // Send message to newly created chat
            const response = await this.client.api(`/chats/${chat.id}/messages`).post({
              body: {
                content: message
              }
            });
            
            console.log("Message sent successfully with alternative approach");
            return response;
          } catch (alternativeError) {
            console.error("Error with alternative approach:", alternativeError);
            throw error; // Throw the original error
          }
        }
      }
      
      throw error;
    }
  }
} 