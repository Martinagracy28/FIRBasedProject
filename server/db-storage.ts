import { eq, and, desc, count } from 'drizzle-orm';
import { db } from './db';
import { users, officers, firs, firUpdates } from '@shared/schema';
import type { 
  User, 
  InsertUser, 
  Officer, 
  InsertOfficer,
  Fir, 
  InsertFir,
  FirUpdate,
  InsertFirUpdate,
  FirWithDetails,
  UserWithRole
} from '@shared/schema';
import { IStorage } from './storage';

export class DbStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByWallet(walletAddress: string): Promise<UserWithRole | undefined> {
    const result = await db
      .select({
        user: users,
        officer: officers
      })
      .from(users)
      .leftJoin(officers, eq(officers.userId, users.id))
      .where(eq(users.walletAddress, walletAddress.toLowerCase()))
      .limit(1);

    if (!result[0]?.user) return undefined;

    return {
      ...result[0].user,
      officer: result[0].officer || undefined
    };
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values({
        walletAddress: userData.walletAddress.toLowerCase(),
        documentHashes: userData.documentHashes || []
      })
      .returning();
    
    return result[0];
  }

  async updateUserStatus(id: string, status: string, verifiedBy?: string): Promise<User | undefined> {
    const updateData: any = {
      status,
      verifiedBy: verifiedBy || null
    };

    if (status === "verified") {
      updateData.verifiedAt = new Date();
      updateData.role = "user";
    }

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return result[0];
  }

  async getPendingUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.status, "pending"))
      .orderBy(desc(users.createdAt));
  }

  // Officer management
  async getOfficer(id: string): Promise<Officer | undefined> {
    const result = await db.select().from(officers).where(eq(officers.id, id)).limit(1);
    return result[0];
  }

  async getOfficerByUserId(userId: string): Promise<Officer | undefined> {
    const result = await db.select().from(officers).where(eq(officers.userId, userId)).limit(1);
    return result[0];
  }

  async createOfficer(officerData: InsertOfficer): Promise<Officer> {
    const result = await db.insert(officers).values(officerData).returning();
    return result[0];
  }

  async getAllOfficers(): Promise<(Officer & { user: User })[]> {
    const result = await db
      .select({
        officer: officers,
        user: users
      })
      .from(officers)
      .innerJoin(users, eq(users.id, officers.userId))
      .orderBy(desc(officers.createdAt));

    return result.map(row => ({
      ...row.officer,
      user: row.user
    }));
  }

  async updateOfficerStats(officerId: string, activeCases: number, closedCases: number): Promise<void> {
    await db
      .update(officers)
      .set({ activeCases, closedCases })
      .where(eq(officers.id, officerId));
  }

  // FIR management
  async getFir(id: string): Promise<FirWithDetails | undefined> {
    const result = await db
      .select({
        fir: firs,
        complainant: users,
        officer: officers
      })
      .from(firs)
      .leftJoin(users, eq(users.id, firs.complainantId))
      .leftJoin(officers, eq(officers.id, firs.assignedOfficerId))
      .where(eq(firs.id, id))
      .limit(1);

    if (!result[0] || !result[0].complainant) return undefined;

    const updates = await this.getFirUpdates(result[0].fir.id);
    
    return {
      ...result[0].fir,
      complainant: result[0].complainant,
      assignedOfficer: result[0].officer || undefined,
      updates
    };
  }

  async getFirByNumber(firNumber: string): Promise<FirWithDetails | undefined> {
    const result = await db
      .select({
        fir: firs,
        complainant: users,
        officer: officers
      })
      .from(firs)
      .leftJoin(users, eq(users.id, firs.complainantId))
      .leftJoin(officers, eq(officers.id, firs.assignedOfficerId))
      .where(eq(firs.firNumber, firNumber))
      .limit(1);

    if (!result[0] || !result[0].complainant) return undefined;

    const updates = await this.getFirUpdates(result[0].fir.id);
    
    return {
      ...result[0].fir,
      complainant: result[0].complainant,
      assignedOfficer: result[0].officer || undefined,
      updates
    };
  }

  async createFir(firData: InsertFir): Promise<Fir> {
    // Generate FIR number
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const firNumber = `FIR${year}${randomNum}`;

    const result = await db
      .insert(firs)
      .values({
        firNumber,
        complainantId: firData.complainantId,
        incidentType: firData.incidentType,
        incidentDate: firData.incidentDate,
        incidentLocation: firData.incidentLocation,
        description: firData.description,
        evidenceHashes: firData.evidenceHashes || []
      })
      .returning();

    return result[0];
  }

  async updateFirStatus(id: string, status: string, officerId?: string, comments?: string): Promise<Fir | undefined> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === "closed") {
      updateData.closedAt = new Date();
      updateData.closingComments = comments;
    }

    const result = await db
      .update(firs)
      .set(updateData)
      .where(eq(firs.id, id))
      .returning();

    return result[0];
  }

  async assignFirToOfficer(firId: string, officerId: string): Promise<Fir | undefined> {
    const result = await db
      .update(firs)
      .set({ 
        assignedOfficerId: officerId,
        updatedAt: new Date()
      })
      .where(eq(firs.id, firId))
      .returning();

    return result[0];
  }

  async getFirsByComplainant(complainantId: string): Promise<FirWithDetails[]> {
    const result = await db
      .select({
        fir: firs,
        complainant: users,
        officer: officers
      })
      .from(firs)
      .leftJoin(users, eq(users.id, firs.complainantId))
      .leftJoin(officers, eq(officers.id, firs.assignedOfficerId))
      .where(eq(firs.complainantId, complainantId))
      .orderBy(desc(firs.createdAt));

    const enrichedFirs = [];
    for (const row of result) {
      if (row.complainant) {
        const updates = await this.getFirUpdates(row.fir.id);
        enrichedFirs.push({
          ...row.fir,
          complainant: row.complainant,
          assignedOfficer: row.officer || undefined,
          updates
        });
      }
    }
    return enrichedFirs;
  }

  async getFirsByOfficer(officerId: string): Promise<FirWithDetails[]> {
    const result = await db
      .select({
        fir: firs,
        complainant: users,
        officer: officers
      })
      .from(firs)
      .leftJoin(users, eq(users.id, firs.complainantId))
      .leftJoin(officers, eq(officers.id, firs.assignedOfficerId))
      .where(eq(firs.assignedOfficerId, officerId))
      .orderBy(desc(firs.createdAt));

    const enrichedFirs = [];
    for (const row of result) {
      if (row.complainant) {
        const updates = await this.getFirUpdates(row.fir.id);
        enrichedFirs.push({
          ...row.fir,
          complainant: row.complainant,
          assignedOfficer: row.officer || undefined,
          updates
        });
      }
    }
    return enrichedFirs;
  }

  async getAllFirs(): Promise<FirWithDetails[]> {
    const result = await db
      .select({
        fir: firs,
        complainant: users,
        officer: officers
      })
      .from(firs)
      .leftJoin(users, eq(users.id, firs.complainantId))
      .leftJoin(officers, eq(officers.id, firs.assignedOfficerId))
      .orderBy(desc(firs.createdAt));

    const enrichedFirs = [];
    for (const row of result) {
      if (row.complainant) {
        const updates = await this.getFirUpdates(row.fir.id);
        enrichedFirs.push({
          ...row.fir,
          complainant: row.complainant,
          assignedOfficer: row.officer || undefined,
          updates
        });
      }
    }
    return enrichedFirs;
  }

  // FIR Updates
  async addFirUpdate(updateData: InsertFirUpdate): Promise<FirUpdate> {
    const result = await db.insert(firUpdates).values(updateData).returning();
    return result[0];
  }

  async getFirUpdates(firId: string): Promise<FirUpdate[]> {
    return await db
      .select()
      .from(firUpdates)
      .where(eq(firUpdates.firId, firId))
      .orderBy(desc(firUpdates.createdAt));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalFirs: number;
    pendingVerification: number;
    activeOfficers: number;
    closedCases: number;
  }> {
    const [firCount, pendingCount, officerCount, closedCount] = await Promise.all([
      db.select({ count: count() }).from(firs),
      db.select({ count: count() }).from(users).where(eq(users.status, "pending")),
      db.select({ count: count() }).from(officers),
      db.select({ count: count() }).from(firs).where(eq(firs.status, "closed"))
    ]);

    return {
      totalFirs: firCount[0]?.count || 0,
      pendingVerification: pendingCount[0]?.count || 0,
      activeOfficers: officerCount[0]?.count || 0,
      closedCases: closedCount[0]?.count || 0,
    };
  }
}