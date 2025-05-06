# Teams Messaging App

A Next.js application that allows users to authenticate with Microsoft Teams and send messages to other users in the same tenant using the Microsoft Graph API.

## Features

- Microsoft Teams authentication using MSAL
- User profile display
- Send Teams messages to other users
- Responsive UI using Tailwind CSS

## Prerequisites

- Node.js 18.x or later
- Microsoft Azure account with admin access to register applications
- Microsoft 365 account with Teams

## Setup

### 1. Create an Azure AD application

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations** > **New registration**
3. Enter a name for your application
4. Set the Redirect URI to `http://localhost:3000` (for development)
5. Select **Register**
6. Note the **Application (client) ID** and **Directory (tenant) ID** - you'll need these later

### 2. Configure API permissions

1. In your registered app, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph** > **Delegated permissions**
4. Add the following permissions:
   - User.Read
   - Chat.ReadWrite
   - ChatMessage.Send
5. Click **Add permissions**
6. Click **Grant admin consent** for your tenant

### 3. Configure the application

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file in the root directory with the following content:
   ```
   NEXT_PUBLIC_MSAL_CLIENT_ID=your_client_id
   NEXT_PUBLIC_MSAL_TENANT_ID=your_tenant_id
   ```
4. Update the `app/config/authConfig.ts` file with your Azure AD application details

### 4. Run the application

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click the "Sign In with Microsoft" button
2. Authenticate with your Microsoft account
3. Once signed in, you'll see your profile information
4. Use the message form to send a message:
   - Enter the recipient's user ID or email
   - Type your message
   - Click "Send Message"

## Deployment

This application can be deployed to Vercel, Netlify, or any other Next.js-compatible hosting service. Remember to update the redirect URI in your Azure AD application settings to match your production URL.

## License

MIT
