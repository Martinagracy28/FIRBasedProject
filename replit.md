# SecureFIR - Blockchain-Based Police FIR Management System

## Overview

SecureFIR is a modern web application that digitizes and secures the First Information Report (FIR) process for police departments using blockchain technology. The system provides role-based access for citizens, police officers, and administrators to file, manage, and track FIRs with complete transparency and immutability.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 28, 2025
- **Blockchain FIR Assignment Fix**: Fixed critical "FIR does not exist" error by implementing proper blockchain FIR ID extraction and storage
- **FIR Creation Enhancement**: Added blockchain FIR ID extraction from transaction receipts and database storage (blockchainFirId field)
- **Officer Assignment Integration**: Updated officer assignment to use stored blockchain FIR ID instead of parsed FIR numbers
- **Null Safety Fixes**: Fixed undefined error when displaying assigned officer names - added proper fallback handling
- **Data Structure Optimization**: Enhanced FIR data structure to support blockchain integration with transaction hash storage
- **UI Error Resolution**: Fixed runtime error "Cannot read properties of undefined (reading 'split')" in FIR tracking page
- **Database Schema Update**: Added blockchainFirId field to FIR schema for proper blockchain-database mapping
- **API Enhancement**: Added PATCH /api/firs/:id endpoint for updating FIR data with blockchain information

### January 27, 2025
- **Replit Agent Migration**: Successfully migrated project from Replit Agent to standard Replit environment
- **User Verification Fix**: Fixed critical user verification blockchain integration issue - officers can now properly approve users
- **Blockchain Integration**: Added proper `verifyUserOnBlockchain` function that calls the smart contract's `verifyUser(address)` method
- **Error Resolution**: Fixed "Officers cannot self-register as users" error by using correct wallet address parameter
- **Component Updates**: Updated both user verification modal and verify-users page to use proper blockchain function
- **TypeScript Fixes**: Resolved all TypeScript type errors in blockchain hook functions
- **Transaction Flow Fix**: Restructured user verification to keep users visible until MetaMask transaction completes
- **UI State Management**: Fixed premature user removal from pending list - now waits for blockchain confirmation
- **User Role Correction**: Fixed user roles in database - admin (0x14e39d2c321970A68D239307aDdBD5249B9fa80d) and officer (0x5388da14B5d292c2150Ec17C7769dD142F02517D) now have correct roles
- **Enhanced User Registration UX**: Updated dashboard and navigation to clearly show registration options for unregistered users (role 'none')
- **Registration Status Pages**: Improved user experience with detailed status tracking and clear call-to-action buttons for registration
- **Navigation Fix**: Users with role 'none' now see Register and Approval Status pages in sidebar navigation

### January 26, 2025
- **IPFS File Upload Integration**: Added full IPFS support with drag-and-drop file upload component
- **Simplified User Registration**: Removed name, email, and phone fields - now only requires wallet address and document uploads  
- **Enhanced File Management**: Real file uploading to IPFS with progress indicators and hash generation
- **Windows Compatibility**: Fixed server binding and environment variable issues for Windows development
- **Firebase Migration**: Successfully migrated from PostgreSQL to Firebase Realtime Database for better Vercel deployment compatibility
- **Data Transfer Complete**: Migrated 2 existing users from PostgreSQL to Firebase with all pending verification statuses intact
- **Officer Management**: Added addOfficer functionality - only admins can add officers with name and phone number
- **Admin Setup**: Created admin user system for officer management access control
- **TransactionModal Fixes**: Fixed all runtime errors with TransactionModal components across user registration, FIR filing, and officer management
- **UI Testing Complete**: Verified officer management system works perfectly with 2 active officers in Firebase database
- **Enhanced User Verification**: Added comprehensive user verification modal with detailed document viewing and IPFS integration
- **API Enhancement**: Added `/api/users/details/:walletAddress` endpoint for detailed user information retrieval
- **Officer Verification Module**: Created comprehensive verifyUser functionality with detailed modal showing user documents, wallet info, and verification controls
- **Role Assignment Fix**: Fixed officer role assignment issue - officers now properly recognized with 'officer' role instead of 'user' role
- **Access Control Working**: Officers can now access /verify-users page and view detailed user information for verification

## System Architecture

### Technology Stack
- **Frontend**: React with TypeScript, using shadcn/ui components and Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Database**: Firebase Realtime Database
- **Blockchain**: Web3 integration (Ethereum Sepolia testnet)
- **Bundler**: Vite for development and build
- **State Management**: TanStack Query for server state

### Architecture Pattern
The application follows a full-stack architecture with:
- Clear separation between client and server code
- Shared schema definitions for type safety
- RESTful API design
- Blockchain integration for data integrity

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui provides a comprehensive set of UI components
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom purple/violet theme
- **Web3**: Custom wallet connection and blockchain interaction hooks

### Backend Architecture
- **API Layer**: Express.js with TypeScript providing RESTful endpoints
- **Database Layer**: Firebase Realtime Database for data persistence
- **Storage Interface**: Abstract storage layer for data operations with Firebase integration
- **Middleware**: Request logging, JSON parsing, and error handling

### Database Schema
The system uses four main entities:
- **Users**: Stores user information with role-based permissions (none, user, officer, admin)
- **Officers**: Extended user data for police officers with case statistics
- **FIRs**: Core FIR data with status tracking and evidence hashes
- **FIR Updates**: Activity log for FIR status changes and comments

### Role-Based Access Control
- **Admin**: Manage officers, view all FIRs, system oversight
- **Officer**: Verify users, manage assigned FIRs, update case status
- **User**: File FIRs, track personal reports
- **None/Guest**: Registration and basic information access

## Data Flow

### User Registration Flow
1. User connects wallet (MetaMask)
2. User submits registration form with identity documents
3. System stores user data and document hashes
4. Officer verifies user identity
5. Blockchain transaction records verification status

### FIR Filing Flow
1. Verified user submits FIR with incident details
2. System generates unique FIR number
3. Evidence files are hashed and stored
4. Blockchain transaction creates immutable record
5. FIR enters pending status for officer assignment

### Case Management Flow
1. Admin assigns FIR to available officer
2. Officer investigates and updates case status
3. Status changes are logged with timestamps
4. Blockchain transactions ensure audit trail
5. Case closure requires officer comments

## External Dependencies

### Blockchain Integration
- **MetaMask**: Browser wallet for user authentication
- **Ethereum Sepolia**: Testnet for blockchain transactions
- **Web3 Provider**: Direct interaction with Ethereum network

### Database
- **Firebase Realtime Database**: Real-time NoSQL database
- **Direct REST API**: Firebase handles all database operations and scaling

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first styling

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Fast JavaScript bundling for production
- **TypeScript**: Type safety across the entire stack

## Deployment Strategy

### Development Environment
- Vite dev server for hot module replacement
- Express server with middleware for API requests
- Environment variables for database and blockchain configuration

### Production Build
- Vite builds optimized client bundle
- ESBuild bundles server code for Node.js deployment
- Static assets served from dist/public directory

### Database Management
- Drizzle Kit handles schema migrations
- Environment-based connection strings
- Automatic UUID generation for primary keys

### Security Considerations
- Wallet-based authentication eliminates password management
- Document hashes prevent tampering while maintaining privacy
- Blockchain immutability ensures audit trail integrity
- Role-based access controls restrict sensitive operations