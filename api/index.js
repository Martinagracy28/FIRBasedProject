// Vercel serverless function entry point
import { createServer } from '../server/index.js';

let server;

export default async function handler(req, res) {
  if (!server) {
    server = await createServer();
  }
  
  return server(req, res);
}