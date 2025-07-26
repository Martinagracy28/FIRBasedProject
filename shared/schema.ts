import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("none"), // none, user, officer, admin
  status: text("status").notNull().default("pending"), // pending, verified, rejected
  documentHashes: jsonb("document_hashes").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"),
});

export const officers = pgTable("officers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id),
  badgeNumber: text("badge_number").notNull().unique(),
  department: text("department").notNull(),
  activeCases: integer("active_cases").default(0),
  closedCases: integer("closed_cases").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const firs = pgTable("firs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firNumber: text("fir_number").notNull().unique(),
  complainantId: text("complainant_id").notNull().references(() => users.id),
  incidentType: text("incident_type").notNull(),
  incidentDate: timestamp("incident_date").notNull(),
  incidentLocation: text("incident_location").notNull(),
  description: text("description").notNull(),
  evidenceHashes: jsonb("evidence_hashes").$type<string[]>().default([]),
  status: text("status").notNull().default("pending"), // pending, in_progress, closed, rejected
  assignedOfficerId: text("assigned_officer_id").references(() => officers.id),
  blockchainTxHash: text("blockchain_tx_hash"),
  closingComments: text("closing_comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const firUpdates = pgTable("fir_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firId: text("fir_id").notNull().references(() => firs.id),
  updatedBy: text("updated_by").notNull().references(() => users.id),
  previousStatus: text("previous_status").notNull(),
  newStatus: text("new_status").notNull(),
  comments: text("comments"),
  blockchainTxHash: text("blockchain_tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  walletAddress: true,
  name: true,
  email: true,
  phone: true,
  documentHashes: true,
});

export const insertOfficerSchema = createInsertSchema(officers).pick({
  userId: true,
  badgeNumber: true,
  department: true,
});

export const insertFirSchema = createInsertSchema(firs).pick({
  complainantId: true,
  incidentType: true,
  incidentDate: true,
  incidentLocation: true,
  description: true,
  evidenceHashes: true,
});

export const insertFirUpdateSchema = createInsertSchema(firUpdates).pick({
  firId: true,
  updatedBy: true,
  previousStatus: true,
  newStatus: true,
  comments: true,
  blockchainTxHash: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Officer = typeof officers.$inferSelect;
export type InsertOfficer = z.infer<typeof insertOfficerSchema>;
export type Fir = typeof firs.$inferSelect;
export type InsertFir = z.infer<typeof insertFirSchema>;
export type FirUpdate = typeof firUpdates.$inferSelect;
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
