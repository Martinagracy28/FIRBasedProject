#!/bin/bash
# Build script for Vercel deployment

echo "Building client..."
npm run build

echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

echo "Build complete!"