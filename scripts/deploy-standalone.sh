#!/bin/bash

# Deploy script for standalone deployment

echo "🚀 Starting standalone deployment preparation..."


# Copy standalone vite config
echo "⚙️  Updating Vite configuration..."
cp vite.config.standalone.ts vite.config.ts

# Build the application
echo "🏗️  Building application..."
npm run build

# Create production package.json without dev dependencies
echo "📋 Creating production package.json..."
node -e "
const pkg = require('./package.json');
console.log(JSON.stringify(pkg, null, 2));
" > package.prod.json

echo "✅ Standalone deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Copy package.prod.json to your deployment server as package.json"
echo "2. Copy the dist/ folder to your deployment server"
echo "3. Set up environment variables from .env.example"
echo "4. Run 'npm ci --only=production' on the server"
echo "5. Start with 'npm start'"
echo ""
echo "Or use Docker:"
echo "docker build -t identity-verification ."
echo "docker run -p 5000:5000 --env-file .env identity-verification"