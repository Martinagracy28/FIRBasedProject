# SecureFIR - Blockchain-Based Police FIR Management System

## Overview

SecureFIR is a modern web application that digitizes and secures the First Information Report (FIR) process for police departments using blockchain technology. The system provides role-based access for citizens, police officers, and administrators to file, manage, and track FIRs with complete transparency and immutability.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 26, 2025
- **IPFS File Upload Integration**: Added full IPFS support with drag-and-drop file upload component
- **Simplified User Registration**: Removed name, email, and phone fields - now only requires wallet address and document uploads  
- **Enhanced File Management**: Real file uploading to IPFS with progress indicators and hash generation
- **Windows Compatibility**: Fixed server binding and environment variable issues for Windows development
- **Firebase Migration**: Successfully migrated from PostgreSQL to Firebase Realtime Database for better Vercel deployment compatibility
- **Data Transfer Complete**: Migrated 2 existing users from PostgreSQL to Firebase with all pending verification statuses intact
- **Officer Management**: Added addOfficer functionality - only admins can add officers with name and phone number
- **Admin Setup**: Created admin user system for officer management access control

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