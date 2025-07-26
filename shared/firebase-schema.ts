import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// Firebase schema types (without PostgreSQL-specific fields)
export interface User {
  id: string;
  walletAddress: string;
  role: "none" | "user" | "officer" | "admin";
  status: "pending" | "verified" | "rejected";
  documentHashes: string[];
  createdAt: Timestamp | Date;
  verifiedAt?: Timestamp | Date | null;
  verifiedBy?: string | null;
}

export interface Officer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  walletAddress: string;
  badgeNumber: string;
  department: string;
  activeCases: number;
  closedCases: number;
  createdAt: Timestamp | Date;
}

export interface Fir {
  id: string;
  firNumber: string;
  complainantId: string;
  incidentType: string;
  incidentDate: Timestamp | Date;
  incidentLocation: string;
  description: string;
  evidenceHashes: string[];
  status: "pending" | "in_progress" | "closed" | "rejected";
  assignedOfficerId?: string | null;
  blockchainTxHash?: string | null;
  closingComments?: string | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  closedAt?: Timestamp | Date | null;
}

export interface FirUpdate {
  id: string;
  firId: string;
  updatedBy: string;
  previousStatus: string;
  newStatus: string;
  comments?: string | null;
  blockchainTxHash?: string | null;
  createdAt: Timestamp | Date;
}

// Insert schemas for validation
export const insertUserSchema = z.object({
  walletAddress: z.string().min(1),
  documentHashes: z.array(z.string()).optional().default([]),
});

export const insertOfficerSchema = z.object({
  name: z.string().min(1, "Officer name is required"),
  phone: z.string().min(1, "Phone number is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
  badgeNumber: z.string().min(1, "Badge number is required"),
  department: z.string().min(1, "Department is required"),
});

export const insertFirSchema = z.object({
  complainantId: z.string().min(1),
  incidentType: z.string().min(1),
  incidentDate: z.date(),
  incidentLocation: z.string().min(1),
  description: z.string().min(1),
  evidenceHashes: z.array(z.string()).optional().default([]),
});

export const insertFirUpdateSchema = z.object({
  firId: z.string().min(1),
  updatedBy: z.string().min(1),
  previousStatus: z.string().min(1),
  newStatus: z.string().min(1),
  comments: z.string().optional(),
  blockchainTxHash: z.string().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOfficer = z.infer<typeof insertOfficerSchema>;
export type InsertFir = z.infer<typeof insertFirSchema>;
export type InsertFirUpdate = z.infer<typeof insertFirUpdateSchema>;

// Combined types for UI
export type FirWithDetails = Fir & {
  complainant: User;
  assignedOfficer?: Officer & { user: User };
  updates: FirUpdate[];
};

export type UserWithRole = User & {
  officer?: Officer;
};