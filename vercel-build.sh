#!/bin/bash
# Vercel build script - called automatically by Vercel

echo "Starting Vercel build process..."

# Build the React frontend
echo "Building React frontend..."
npm run build

echo "Vercel build complete!"
echo "Frontend built to: dist/public"
echo "Server will be handled by Vercel serverless functions"