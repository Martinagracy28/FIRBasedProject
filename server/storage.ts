import { 
  type User, 
  type InsertUser, 
  type Officer, 
  type InsertOfficer,
  type Fir, 
  type InsertFir,
  type FirUpdate,
  type InsertFirUpdate,
  type FirWithDetails,
  type UserWithRole
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<UserWithRole | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: string, status: string, verifiedBy?: string): Promise<User | undefined>;
  getPendingUsers(): Promise<User[]>;
  
  // Officer management
  getOfficer(id: string): Promise<Officer | undefined>;
  getOfficerByUserId(userId: string): Promise<Officer | undefined>;
  createOfficer(officer: InsertOfficer): Promise<Officer>;
  getAllOfficers(): Promise<(Officer & { user: User })[]>;
  updateOfficerStats(officerId: string, activeCases: number, closedCases: number): Promise<void>;
  
  // FIR management
  getFir(id: string): Promise<FirWithDetails | undefined>;
  getFirByNumber(firNumber: string): Promise<FirWithDetails | undefined>;
  createFir(fir: InsertFir): Promise<Fir>;
  updateFirStatus(id: string, status: string, officerId?: string, comments?: string): Promise<Fir | undefined>;
  assignFirToOfficer(firId: string, officerId: string): Promise<Fir | undefined>;
  getFirsByComplainant(complainantId: string): Promise<FirWithDetails[]>;
  getFirsByOfficer(officerId: string): Promise<FirWithDetails[]>;
  getAllFirs(): Promise<FirWithDetails[]>;
  
  // FIR Updates
  addFirUpdate(update: InsertFirUpdate): Promise<FirUpdate>;
  getFirUpdates(firId: string): Promise<FirUpdate[]>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    totalFirs: number;
    pendingVerification: number;
    activeOfficers: number;
    closedCases: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private officers: Map<string, Officer>;
  private firs: Map<string, Fir>;
  private firUpdates: Map<string, FirUpdate>;

  constructor() {
    this.users = new Map();
    this.officers = new Map();
    this.firs = new Map();
    this.firUpdates = new Map();
    
    // Initialize with admin user
    this.initializeAdmin();
  }

  private initializeAdmin() {
    const adminId = randomUUID();
    const admin: User = {
      id: adminId,
      walletAddress: "0x0000000000000000000000000000000000000000",
      role: "admin",
      status: "verified",
      documentHashes: [],
      createdAt: new Date(),
      verifiedAt: new Date(),
      verifiedBy: "system",
    };
    this.users.set(adminId, admin);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWallet(walletAddress: string): Promise<UserWithRole | undefined> {
    const user = Array.from(this.users.values()).find(u => u.walletAddress.toLowerCase() === walletAddress.toLowerCase());
    if (!user) return undefined;
    
    const officer = Array.from(this.officers.values()).find(o => o.userId === user.id);
    return { ...user, officer };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: "none",
      status: "pending",
      documentHashes: insertUser.documentHashes || [],
      createdAt: new Date(),
      verifiedAt: null,
      verifiedBy: null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStatus(id: string, status: string, verifiedBy?: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      status,
      verifiedAt: status === "verified" ? new Date() : user.verifiedAt,
      verifiedBy: verifiedBy || user.verifiedBy,
      role: status === "verified" ? "user" : user.role,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getPendingUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.status === "pending");
  }

  async getOfficer(id: string): Promise<Officer | undefined> {
    return this.officers.get(id);
  }

  async getOfficerByUserId(userId: string): Promise<Officer | undefined> {
    return Array.from(this.officers.values()).find(o => o.userId === userId);
  }

  async createOfficer(insertOfficer: InsertOfficer): Promise<Officer> {
    const id = randomUUID();
    const officer: Officer = {
      ...insertOfficer,
      id,
      activeCases: 0,
      closedCases: 0,
      createdAt: new Date(),
    };
    this.officers.set(id, officer);
    
    // Update user role to officer
    const user = await this.getUser(insertOfficer.userId);
    if (user) {
      const updatedUser: User = { ...user, role: "officer" };
      this.users.set(user.id, updatedUser);
    }
    
    return officer;
  }

  async getAllOfficers(): Promise<(Officer & { user: User })[]> {
    const officers = Array.from(this.officers.values());
    const result = [];
    
    for (const officer of officers) {
      const user = await this.getUser(officer.userId);
      if (user) {
        result.push({ ...officer, user });
      }
    }
    
    return result;
  }

  async updateOfficerStats(officerId: string, activeCases: number, closedCases: number): Promise<void> {
    const officer = this.officers.get(officerId);
    if (officer) {
      const updatedOfficer = { ...officer, activeCases, closedCases };
      this.officers.set(officerId, updatedOfficer);
    }
  }

  async getFir(id: string): Promise<FirWithDetails | undefined> {
    const fir = this.firs.get(id);
    if (!fir) return undefined;
    
    return this.enrichFirWithDetails(fir);
  }

  async getFirByNumber(firNumber: string): Promise<FirWithDetails | undefined> {
    const fir = Array.from(this.firs.values()).find(f => f.firNumber === firNumber);
    if (!fir) return undefined;
    
    return this.enrichFirWithDetails(fir);
  }

  private async enrichFirWithDetails(fir: Fir): Promise<FirWithDetails> {
    const complainant = await this.getUser(fir.complainantId);
    let assignedOfficer = undefined;
    
    if (fir.assignedOfficerId) {
      const officer = await this.getOfficer(fir.assignedOfficerId);
      if (officer) {
        const user = await this.getUser(officer.userId);
        if (user) {
          assignedOfficer = { ...officer, user };
        }
      }
    }
    
    const updates = await this.getFirUpdates(fir.id);
    
    return {
      ...fir,
      complainant: complainant!,
      assignedOfficer,
      updates,
    };
  }

  async createFir(insertFir: InsertFir): Promise<Fir> {
    const id = randomUUID();
    const firNumber = `FIR-${new Date().getFullYear()}-${String(this.firs.size + 1).padStart(6, '0')}`;
    
    const fir: Fir = {
      ...insertFir,
      id,
      firNumber,
      status: "pending",
      evidenceHashes: insertFir.evidenceHashes || [],
      assignedOfficerId: null,
      blockchainTxHash: null,
      closingComments: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      closedAt: null,
    };
    
    this.firs.set(id, fir);
    return fir;
  }

  async updateFirStatus(id: string, status: string, officerId?: string, comments?: string): Promise<Fir | undefined> {
    const fir = this.firs.get(id);
    if (!fir) return undefined;
    
    const updatedFir: Fir = {
      ...fir,
      status,
      updatedAt: new Date(),
      closedAt: status === "closed" ? new Date() : fir.closedAt,
      closingComments: status === "closed" ? comments || fir.closingComments : fir.closingComments,
    };
    
    this.firs.set(id, updatedFir);
    return updatedFir;
  }

  async assignFirToOfficer(firId: string, officerId: string): Promise<Fir | undefined> {
    const fir = this.firs.get(firId);
    if (!fir) return undefined;
    
    const updatedFir: Fir = {
      ...fir,
      assignedOfficerId: officerId,
      updatedAt: new Date(),
    };
    
    this.firs.set(firId, updatedFir);
    return updatedFir;
  }

  async getFirsByComplainant(complainantId: string): Promise<FirWithDetails[]> {
    const userFirs = Array.from(this.firs.values()).filter(f => f.complainantId === complainantId);
    const enrichedFirs = [];
    
    for (const fir of userFirs) {
      enrichedFirs.push(await this.enrichFirWithDetails(fir));
    }
    
    return enrichedFirs;
  }

  async getFirsByOfficer(officerId: string): Promise<FirWithDetails[]> {
    const officerFirs = Array.from(this.firs.values()).filter(f => f.assignedOfficerId === officerId);
    const enrichedFirs = [];
    
    for (const fir of officerFirs) {
      enrichedFirs.push(await this.enrichFirWithDetails(fir));
    }
    
    return enrichedFirs;
  }

  async getAllFirs(): Promise<FirWithDetails[]> {
    const allFirs = Array.from(this.firs.values());
    const enrichedFirs = [];
    
    for (const fir of allFirs) {
      enrichedFirs.push(await this.enrichFirWithDetails(fir));
    }
    
    return enrichedFirs.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async addFirUpdate(insertUpdate: InsertFirUpdate): Promise<FirUpdate> {
    const id = randomUUID();
    const update: FirUpdate = {
      ...insertUpdate,
      id,
      blockchainTxHash: insertUpdate.blockchainTxHash || null,
      comments: insertUpdate.comments || null,
      createdAt: new Date(),
    };
    
    this.firUpdates.set(id, update);
    return update;
  }

  async getFirUpdates(firId: string): Promise<FirUpdate[]> {
    return Array.from(this.firUpdates.values())
      .filter(u => u.firId === firId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async getDashboardStats(): Promise<{
    totalFirs: number;
    pendingVerification: number;
    activeOfficers: number;
    closedCases: number;
  }> {
    const totalFirs = this.firs.size;
    const pendingVerification = Array.from(this.users.values()).filter(u => u.status === "pending").length;
    const activeOfficers = this.officers.size;
    const closedCases = Array.from(this.firs.values()).filter(f => f.status === "closed").length;
    
    return {
      totalFirs,
      pendingVerification,
      activeOfficers,
      closedCases,
    };
  }
}

import { DbStorage } from './db-storage';

// Use database storage instead of memory storage
export const storage = new DbStorage();
