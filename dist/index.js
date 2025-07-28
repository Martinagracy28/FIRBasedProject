// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/firebase-realtime-storage.ts
import {
  ref,
  get,
  set,
  update,
  serverTimestamp
} from "firebase/database";

// server/firebase-config.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
var firebaseConfig = {
  apiKey: "AIzaSyCay3BXq3iq4iHR6V2whRXBlMzagSk2Akc",
  authDomain: "hackthon-5b62a.firebaseapp.com",
  databaseURL: "https://hackthon-5b62a-default-rtdb.firebaseio.com",
  projectId: "hackthon-5b62a",
  storageBucket: "hackthon-5b62a.firebasestorage.app",
  messagingSenderId: "137987828166",
  appId: "1:137987828166:web:cf7ce4c9898dea53dceac7",
  measurementId: "G-97ZB6Q612E"
};
var app = initializeApp(firebaseConfig);
var db = getDatabase(app);
var analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// server/firebase-realtime-storage.ts
var FirebaseRealtimeStorage = class {
  // Helper function to generate unique IDs
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  // User management
  async getUser(id) {
    const userRef = ref(db, `users/${id}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return { id, ...snapshot.val() };
    }
    return void 0;
  }
  async getUserByWallet(walletAddress) {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return void 0;
    const users = snapshot.val();
    let foundUser;
    let userId;
    for (const [id, userData] of Object.entries(users)) {
      if (userData.walletAddress?.toLowerCase() === walletAddress.toLowerCase()) {
        foundUser = { id, ...userData };
        userId = id;
        break;
      }
    }
    if (!foundUser) return void 0;
    const officersRef = ref(db, "officers");
    const officersSnapshot = await get(officersRef);
    let officer;
    if (officersSnapshot.exists()) {
      const officers = officersSnapshot.val();
      for (const [id, officerData] of Object.entries(officers)) {
        if (officerData.userId === userId) {
          officer = { id, ...officerData };
          break;
        }
      }
    }
    return {
      ...foundUser,
      officer
    };
  }
  async createUser(userData) {
    const id = this.generateId();
    const userRef = ref(db, `users/${id}`);
    const userRecord = {
      walletAddress: userData.walletAddress.toLowerCase(),
      documentHashes: userData.documentHashes || [],
      role: "none",
      status: "pending",
      createdAt: serverTimestamp(),
      verifiedAt: null,
      verifiedBy: null
    };
    await set(userRef, userRecord);
    return { id, ...userRecord };
  }
  async updateUserStatus(id, status, verifiedBy) {
    const userRef = ref(db, `users/${id}`);
    const updateData = {
      status,
      verifiedBy: verifiedBy || null
    };
    if (status === "verified") {
      updateData.verifiedAt = serverTimestamp();
      const officersRef = ref(db, "officers");
      const officersSnapshot = await get(officersRef);
      let isOfficer = false;
      if (officersSnapshot.exists()) {
        const officers = officersSnapshot.val();
        for (const officerData of Object.values(officers)) {
          if (officerData.userId === id) {
            isOfficer = true;
            break;
          }
        }
      }
      updateData.role = isOfficer ? "officer" : "user";
    }
    await update(userRef, updateData);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return { id, ...snapshot.val() };
    }
    return void 0;
  }
  async getPendingUsers() {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return [];
    const users = snapshot.val();
    const pendingUsers = [];
    for (const [id, userData] of Object.entries(users)) {
      if (userData.status === "pending") {
        pendingUsers.push({ id, ...userData });
      }
    }
    return pendingUsers;
  }
  async getAllUsers() {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return [];
    const users = snapshot.val();
    return Object.entries(users).map(([id, userData]) => ({ id, ...userData }));
  }
  async updateUserDocumentHashes(userId, documentHashes) {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, {
      documentHashes,
      updatedAt: serverTimestamp()
    });
  }
  async updateUserRole(userId, role) {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, {
      role,
      updatedAt: serverTimestamp()
    });
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return { id: userId, ...snapshot.val() };
    }
    return void 0;
  }
  // Officer management
  async createOfficer(officerData) {
    const id = this.generateId();
    const officerRef = ref(db, `officers/${id}`);
    const officerRecord = {
      userId: officerData.userId,
      name: officerData.name,
      phone: officerData.phone,
      walletAddress: officerData.walletAddress.toLowerCase(),
      badgeNumber: officerData.badgeNumber,
      department: officerData.department,
      activeCases: 0,
      closedCases: 0,
      createdAt: serverTimestamp()
    };
    await set(officerRef, officerRecord);
    return { id, ...officerRecord };
  }
  async getOfficerByUserId(userId) {
    const officersRef = ref(db, "officers");
    const snapshot = await get(officersRef);
    if (!snapshot.exists()) return void 0;
    const officers = snapshot.val();
    for (const [id, officerData] of Object.entries(officers)) {
      if (officerData.userId === userId) {
        return { id, ...officerData };
      }
    }
    return void 0;
  }
  async getAllOfficers() {
    const officersRef = ref(db, "officers");
    const snapshot = await get(officersRef);
    if (!snapshot.exists()) return [];
    const officers = snapshot.val();
    const result = [];
    for (const [id, officerData] of Object.entries(officers)) {
      const officer = { id, ...officerData };
      const user = await this.getUser(officer.userId);
      if (user) {
        result.push({ ...officer, user });
      }
    }
    return result;
  }
  async getOfficer(id) {
    const officerRef = ref(db, `officers/${id}`);
    const snapshot = await get(officerRef);
    if (snapshot.exists()) {
      return { id, ...snapshot.val() };
    }
    return void 0;
  }
  async updateOfficerStats(officerId, activeCases, closedCases) {
    const officerRef = ref(db, `officers/${officerId}`);
    await update(officerRef, {
      activeCases,
      closedCases
    });
  }
  // FIR management
  async createFir(firData) {
    const id = this.generateId();
    const firNumber = `FIR${Date.now()}`;
    const firRef = ref(db, `firs/${id}`);
    const firRecord = {
      ...firData,
      firNumber,
      status: "pending",
      evidenceHashes: firData.evidenceHashes || [],
      assignedOfficerId: null,
      blockchainTxHash: null,
      closingComments: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      closedAt: null
    };
    await set(firRef, firRecord);
    return { id, ...firRecord };
  }
  async getAllFirs() {
    const firsRef = ref(db, "firs");
    const snapshot = await get(firsRef);
    if (!snapshot.exists()) return [];
    const firs = snapshot.val();
    const result = [];
    for (const [id, firData] of Object.entries(firs)) {
      const firWithDetails = await this.getFir(id);
      if (firWithDetails) {
        result.push(firWithDetails);
      }
    }
    return result.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt;
      return bTime - aTime;
    });
  }
  async getFirsByComplainant(complainantId) {
    const firsRef = ref(db, "firs");
    const snapshot = await get(firsRef);
    if (!snapshot.exists()) return [];
    const firs = snapshot.val();
    const result = [];
    for (const [id, firData] of Object.entries(firs)) {
      if (firData.complainantId === complainantId) {
        const firWithDetails = await this.getFir(id);
        if (firWithDetails) {
          result.push(firWithDetails);
        }
      }
    }
    return result.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt;
      return bTime - aTime;
    });
  }
  async getFirsByOfficer(officerId) {
    const firsRef = ref(db, "firs");
    const snapshot = await get(firsRef);
    if (!snapshot.exists()) return [];
    const firs = snapshot.val();
    const result = [];
    for (const [id, firData] of Object.entries(firs)) {
      if (firData.assignedOfficerId === officerId) {
        const firWithDetails = await this.getFir(id);
        if (firWithDetails) {
          result.push(firWithDetails);
        }
      }
    }
    return result.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt;
      return bTime - aTime;
    });
  }
  async getFir(id) {
    const firRef = ref(db, `firs/${id}`);
    const snapshot = await get(firRef);
    if (!snapshot.exists()) return void 0;
    const firData = { id, ...snapshot.val() };
    const complainant = await this.getUser(firData.complainantId);
    if (!complainant) return void 0;
    let assignedOfficer;
    if (firData.assignedOfficerId) {
      const officer = await this.getOfficer(firData.assignedOfficerId);
      if (officer) {
        const officerUser = await this.getUser(officer.userId);
        if (officerUser) {
          assignedOfficer = { ...officer, user: officerUser };
        }
      }
    }
    const updates = await this.getFirUpdates(firData.id);
    return {
      ...firData,
      complainant,
      assignedOfficer,
      updates
    };
  }
  async getFirByNumber(firNumber) {
    const firsRef = ref(db, "firs");
    const snapshot = await get(firsRef);
    if (!snapshot.exists()) return void 0;
    const firs = snapshot.val();
    for (const [id, firData] of Object.entries(firs)) {
      if (firData.firNumber === firNumber) {
        return this.getFir(id);
      }
    }
    return void 0;
  }
  async updateFirStatus(firId, status, assignedOfficerId, closingComments) {
    const firRef = ref(db, `firs/${firId}`);
    const updateData = {
      status,
      updatedAt: serverTimestamp()
    };
    if (assignedOfficerId) {
      updateData.assignedOfficerId = assignedOfficerId;
    }
    if (closingComments) {
      updateData.closingComments = closingComments;
    }
    if (status === "closed") {
      updateData.closedAt = serverTimestamp();
    }
    await update(firRef, updateData);
    const snapshot = await get(firRef);
    if (snapshot.exists()) {
      return { id: firId, ...snapshot.val() };
    }
    return void 0;
  }
  async updateFir(firId, updateData) {
    const firRef = ref(db, `firs/${firId}`);
    await update(firRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return this.getFir(firId);
  }
  async assignFirToOfficer(firId, officerId, blockchainTxHash) {
    const firRef = ref(db, `firs/${firId}`);
    const updateData = {
      assignedOfficerId: officerId,
      status: "in_progress",
      updatedAt: serverTimestamp()
    };
    if (blockchainTxHash) {
      updateData.assignmentTxHash = blockchainTxHash;
    }
    await update(firRef, updateData);
    const snapshot = await get(firRef);
    if (snapshot.exists()) {
      return { id: firId, ...snapshot.val() };
    }
    return void 0;
  }
  async updateFirEvidenceHashes(firId, evidenceHashes) {
    const firRef = ref(db, `firs/${firId}`);
    await update(firRef, {
      evidenceHashes,
      updatedAt: serverTimestamp()
    });
  }
  // FIR Updates
  async addFirUpdate(updateData) {
    const id = this.generateId();
    const updateRef = ref(db, `firUpdates/${id}`);
    const updateRecord = {
      ...updateData,
      createdAt: serverTimestamp()
    };
    await set(updateRef, updateRecord);
    return { id, ...updateRecord };
  }
  async getFirUpdates(firId) {
    const updatesRef = ref(db, "firUpdates");
    const snapshot = await get(updatesRef);
    if (!snapshot.exists()) return [];
    const updates = snapshot.val();
    const firUpdates = [];
    for (const [id, updateData] of Object.entries(updates)) {
      if (updateData.firId === firId) {
        firUpdates.push({ id, ...updateData });
      }
    }
    return firUpdates.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt;
      return bTime - aTime;
    });
  }
  // Dashboard stats
  async getDashboardStats() {
    const firsRef = ref(db, "firs");
    const firsSnapshot = await get(firsRef);
    const totalFirs = firsSnapshot.exists() ? Object.keys(firsSnapshot.val()).length : 0;
    const usersRef = ref(db, "users");
    const usersSnapshot = await get(usersRef);
    let pendingVerification = 0;
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      for (const userData of Object.values(users)) {
        if (userData.status === "pending") {
          pendingVerification++;
        }
      }
    }
    const officersRef = ref(db, "officers");
    const officersSnapshot = await get(officersRef);
    const activeOfficers = officersSnapshot.exists() ? Object.keys(officersSnapshot.val()).length : 0;
    let closedCases = 0;
    if (firsSnapshot.exists()) {
      const firs = firsSnapshot.val();
      for (const firData of Object.values(firs)) {
        if (firData.status === "closed") {
          closedCases++;
        }
      }
    }
    return {
      totalFirs,
      pendingVerification,
      activeOfficers,
      closedCases
    };
  }
};

// server/storage.ts
var storage = new FirebaseRealtimeStorage();

// shared/firebase-schema.ts
import { z } from "zod";
var insertUserSchema = z.object({
  walletAddress: z.string().min(1),
  documentHashes: z.array(z.string()).optional().default([])
});
var insertOfficerSchema = z.object({
  name: z.string().min(1, "Officer name is required"),
  phone: z.string().min(1, "Phone number is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
  badgeNumber: z.string().min(1, "Badge number is required"),
  department: z.string().min(1, "Department is required")
});
var insertFirSchema = z.object({
  complainantId: z.string().min(1),
  incidentType: z.string().min(1),
  incidentDate: z.string().transform((str) => new Date(str)),
  incidentLocation: z.string().min(1),
  description: z.string().min(1),
  evidenceHashes: z.array(z.string()).optional().default([])
});
var insertFirUpdateSchema = z.object({
  firId: z.string().min(1),
  updatedBy: z.string().min(1),
  previousStatus: z.string().min(1),
  newStatus: z.string().min(1),
  comments: z.string().optional(),
  blockchainTxHash: z.string().optional()
});

// server/routes.ts
import { z as z2 } from "zod";
async function registerRoutes(app3) {
  app3.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime()
    });
  });
  app3.get("/api/users/me/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app3.post("/api/users/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app3.get("/api/users/pending", async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });
  app3.get("/api/users/details/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });
  app3.patch("/api/users/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verifiedBy } = req.body;
      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const user = await storage.updateUserStatus(id, status, verifiedBy);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user status" });
    }
  });
  app3.post("/api/officers", async (req, res) => {
    try {
      const officerData = insertOfficerSchema.parse(req.body);
      const userData = {
        walletAddress: officerData.walletAddress,
        documentHashes: []
      };
      const user = await storage.createUser(userData);
      await storage.updateUserStatus(user.id, "verified");
      const officerRecord = {
        userId: user.id,
        name: officerData.name,
        phone: officerData.phone,
        walletAddress: officerData.walletAddress,
        badgeNumber: officerData.badgeNumber,
        department: officerData.department
      };
      const officer = await storage.createOfficer(officerRecord);
      res.status(201).json(officer);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid officer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create officer" });
    }
  });
  app3.get("/api/officers", async (req, res) => {
    try {
      const officers = await storage.getAllOfficers();
      res.json(officers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch officers" });
    }
  });
  app3.post("/api/firs", async (req, res) => {
    try {
      const firData = insertFirSchema.parse(req.body);
      const fir = await storage.createFir(firData);
      res.status(201).json(fir);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid FIR data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create FIR" });
    }
  });
  app3.get("/api/firs", async (req, res) => {
    try {
      const { complainantId, officerId } = req.query;
      let firs;
      if (complainantId) {
        console.log("Fetching FIRs for complainant:", complainantId);
        firs = await storage.getFirsByComplainant(complainantId);
      } else if (officerId) {
        console.log("Fetching FIRs for officer:", officerId);
        firs = await storage.getFirsByOfficer(officerId);
      } else {
        console.log("Fetching all FIRs");
        firs = await storage.getAllFirs();
      }
      console.log("Retrieved FIRs:", firs?.length || 0);
      res.json(firs);
    } catch (error) {
      console.error("Error fetching FIRs:", error);
      res.status(500).json({ message: "Failed to fetch FIRs", error: error.message });
    }
  });
  app3.get("/api/firs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const fir = await storage.getFir(id);
      if (!fir) {
        return res.status(404).json({ message: "FIR not found" });
      }
      res.json(fir);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FIR" });
    }
  });
  app3.patch("/api/firs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const fir = await storage.updateFir(id, updateData);
      if (!fir) {
        return res.status(404).json({ message: "FIR not found" });
      }
      res.json(fir);
    } catch (error) {
      res.status(500).json({ message: "Failed to update FIR" });
    }
  });
  app3.patch("/api/firs/:id/assign", async (req, res) => {
    try {
      const { id } = req.params;
      const { officerId, blockchainTxHash } = req.body;
      const fir = await storage.assignFirToOfficer(id, officerId, blockchainTxHash);
      if (!fir) {
        return res.status(404).json({ message: "FIR not found" });
      }
      res.json(fir);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign FIR" });
    }
  });
  app3.patch("/api/firs/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, comments, updatedBy } = req.body;
      const validStatuses = ["pending", "in_progress", "closed", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const fir = await storage.updateFirStatus(id, status, void 0, comments);
      if (!fir) {
        return res.status(404).json({ message: "FIR not found" });
      }
      const updateData = {
        firId: id,
        updatedBy,
        previousStatus: "pending",
        // This should be the actual previous status
        newStatus: status,
        comments,
        blockchainTxHash: void 0
      };
      await storage.addFirUpdate(updateData);
      res.json(fir);
    } catch (error) {
      res.status(500).json({ message: "Failed to update FIR status" });
    }
  });
  app3.patch("/api/users/:id/fix-officer-role", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const officers = await storage.getAllOfficers();
      const isOfficer = officers.some((officer) => officer.userId === id);
      if (isOfficer) {
        const updatedUser = await storage.updateUserStatus(id, user.status, user.verifiedBy || void 0);
        res.json(updatedUser);
      } else {
        res.status(400).json({ message: "User is not an officer" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fix officer role" });
    }
  });
  app3.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  app3.get("/api/firs/:id/updates", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = await storage.getFirUpdates(id);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FIR updates" });
    }
  });
  const httpServer = createServer(app3);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app3, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app3.use(vite.middlewares);
  app3.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app3) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app3.use(express.static(distPath));
  app3.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app2 = express2();
app2.use(express2.json());
app2.use(express2.urlencoded({ extended: false }));
app2.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app2);
  app2.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  const isDevelopment = process.env.NODE_ENV === "development" || app2.get("env") === "development" || !process.env.NODE_ENV;
  if (isDevelopment) {
    await setupVite(app2, server);
  } else {
    serveStatic(app2);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";
  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
  });
})();
