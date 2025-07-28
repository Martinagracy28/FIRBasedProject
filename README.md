# Decentralized Identity Verification System

A full-stack web application for decentralized identity verification using blockchain technology, built with React, Express, and Firebase.

## Features

- **Blockchain Integration**: Connect with MetaMask wallet for identity verification
- **Role-Based Access Control**: Admin, Officer, and User roles with different permissions
- **Real-time Database**: Firebase Realtime Database for storing user data
- **File Upload**: IPFS integration for decentralized file storage
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Smart Contract Integration**: Ethereum blockchain integration for user verification

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** components for accessibility
- **TanStack Query** for data fetching
- **Wouter** for routing
- **Ethers.js** for blockchain integration

### Backend
- **Express.js** with TypeScript
- **Firebase** for real-time database and authentication
- **Drizzle ORM** for database operations
- **IPFS HTTP Client** for file storage
- **WebSocket** support for real-time features

## Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **MetaMask** browser extension
- **Firebase project** with Realtime Database enabled
- **IPFS node** (optional, for file uploads)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com/
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for server-side operations)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PROJECT_ID=your_project_id

# Optional: IPFS Configuration
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=http://localhost:8080

# Development
NODE_ENV=development
PORT=5000
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd decentralized-identity-verification
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **   
   Then replace the content of `vite.config.ts` with `vite.config.standalone.ts`:
   ```bash
   cp vite.config.standalone.ts vite.config.ts
   ```

4. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase and other service credentials

5. **Set up Firebase**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Realtime Database
   - Generate service account credentials for admin SDK
   - Add your web app configuration

## Running the Application

### Development Mode
```bash
npm run dev
```
This starts both the Express server and Vite development server on port 5000.

### Production Build
```bash
npm run build
npm start
```

### Database Operations
```bash
# Push database schema changes
npm run db:push

# Type checking
npm run check
```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utility functions
│   │   └── hooks/         # Custom React hooks
│   └── index.html         # HTML template
├── server/                # Backend Express application
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database abstraction layer
│   ├── firebase-*.ts     # Firebase integration
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   ├── schema.ts         # Database schemas
│   └── firebase-schema.ts # Firebase-specific schemas
└── attached_assets/      # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### User Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Verification
- `POST /api/verify-user` - Verify user on blockchain
- `GET /api/pending-users` - Get pending verification users

## Smart Contract Integration

The application integrates with Ethereum smart contracts for identity verification:

1. **Connect MetaMask**: Users connect their MetaMask wallet
2. **Submit Verification**: Users submit identity documents
3. **Officer Review**: Officers review and approve/reject submissions
4. **Blockchain Verification**: Approved users are verified on-chain
5. **Access Granted**: Verified users gain access to protected features

## Firebase Configuration

### Realtime Database Structure
```json
{
  "users": {
    "userId": {
      "walletAddress": "0x...",
      "email": "user@example.com",
      "role": "user|officer|admin",
      "verified": true,
      "documents": ["ipfs_hash_1", "ipfs_hash_2"]
    }
  }
}
```

### Security Rules
Make sure to configure Firebase security rules to protect user data:

```javascript
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'"
      }
    }
  }
}
```

## Deployment

### Using Docker (Recommended)
```bash
# Build the application
npm run build

# Create Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["npm", "start"]
```

### Using PM2
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name "identity-verification"
```

### Using Vercel/Netlify
- Build command: `npm run build`
- Output directory: `dist/public`
- Make sure to configure environment variables in your deployment platform

## Troubleshooting

### Common Issues

1. **MetaMask Connection Issues**
   - Ensure MetaMask is installed and unlocked
   - Check that you're connected to the correct network
   - Clear browser cache and cookies

2. **Firebase Connection Issues**
   - Verify all environment variables are set correctly
   - Check Firebase security rules
   - Ensure Firebase services are enabled

3. **Build Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check Node.js version compatibility
   - Verify all environment variables are set

### Development Tips

- Use browser developer tools to debug frontend issues
- Check server logs for backend errors
- Use Firebase console to monitor database operations
- Test with different MetaMask accounts for role testing

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review Firebase and blockchain integration documentation