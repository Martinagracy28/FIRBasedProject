import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOfficerSchema, insertFirSchema, insertFirUpdateSchema } from "@shared/firebase-schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User management routes
  app.get("/api/users/me/:walletAddress", async (req, res) => {
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

  app.post("/api/users/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users/pending", async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.patch("/api/users/:id/status", async (req, res) => {
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

  // Officer management routes
  app.post("/api/officers", async (req, res) => {
    try {
      const officerData = insertOfficerSchema.parse(req.body);
      
      // First create user account for the officer
      const userData = {
        walletAddress: officerData.walletAddress,
        documentHashes: []
      };
      
      const user = await storage.createUser(userData);
      
      // Immediately verify the user and set role to officer
      await storage.updateUserStatus(user.id, 'verified');
      
      // Create officer record with all required fields
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid officer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create officer" });
    }
  });

  app.get("/api/officers", async (req, res) => {
    try {
      const officers = await storage.getAllOfficers();
      res.json(officers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch officers" });
    }
  });

  // FIR management routes
  app.post("/api/firs", async (req, res) => {
    try {
      const firData = insertFirSchema.parse(req.body);
      const fir = await storage.createFir(firData);
      res.status(201).json(fir);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid FIR data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create FIR" });
    }
  });

  app.get("/api/firs", async (req, res) => {
    try {
      const { complainantId, officerId } = req.query;
      
      let firs;
      if (complainantId) {
        firs = await storage.getFirsByComplainant(complainantId as string);
      } else if (officerId) {
        firs = await storage.getFirsByOfficer(officerId as string);
      } else {
        firs = await storage.getAllFirs();
      }
      
      res.json(firs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FIRs" });
    }
  });

  app.get("/api/firs/:id", async (req, res) => {
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

  app.patch("/api/firs/:id/assign", async (req, res) => {
    try {
      const { id } = req.params;
      const { officerId } = req.body;
      
      const fir = await storage.assignFirToOfficer(id, officerId);
      
      if (!fir) {
        return res.status(404).json({ message: "FIR not found" });
      }
      
      res.json(fir);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign FIR" });
    }
  });

  app.patch("/api/firs/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, comments, updatedBy } = req.body;
      
      const validStatuses = ["pending", "in_progress", "closed", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const fir = await storage.updateFirStatus(id, status, undefined, comments);
      
      if (!fir) {
        return res.status(404).json({ message: "FIR not found" });
      }
      
      // Add update record
      const updateData = {
        firId: id,
        updatedBy,
        previousStatus: "pending", // This should be the actual previous status
        newStatus: status,
        comments,
        blockchainTxHash: null,
      };
      
      await storage.addFirUpdate(updateData);
      
      res.json(fir);
    } catch (error) {
      res.status(500).json({ message: "Failed to update FIR status" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // FIR updates
  app.get("/api/firs/:id/updates", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = await storage.getFirUpdates(id);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FIR updates" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
