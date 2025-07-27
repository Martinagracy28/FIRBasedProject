#!/bin/bash

# Setup script for new installations

echo "🚀 Setting up Decentralized Identity Verification System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "🔧 Please edit .env file with your configuration values"
else
    echo "✅ .env file already exists"
fi

# Make scripts executable
chmod +x scripts/*.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Firebase and other service credentials"
echo "2. Set up Firebase project and enable Realtime Database"
echo "3. Run 'npm run dev' to start development server"
echo "4. Visit http://localhost:5000 to view the application"
echo ""
echo "For production deployment:"
echo "- Run './scripts/deploy-standalone.sh' to prepare for deployment"
echo "- Use Docker with the provided Dockerfile"
echo "- Or deploy to your preferred hosting platform"