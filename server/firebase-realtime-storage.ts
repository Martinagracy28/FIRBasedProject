import { 
  ref, 
  get, 
  set, 
  push, 
  update,
  query,
  orderByChild,
  equalTo,
  serverTimestamp
} from 'firebase/database';
import { db } from './firebase-config';
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
} from '@shared/firebase-schema';
import { IStorage } from './storage';

export class FirebaseRealtimeStorage implements IStorage {
  // Helper function to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    const userRef = ref(db, `users/${id}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return { id, ...snapshot.val() } as User;
    }
    return undefined;
  }

  async getUserByWallet(walletAddress: string): Promise<UserWithRole | undefined> {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) return undefined;
    
    const users = snapshot.val();
    let foundUser: User | undefined;
    let userId: string | undefined;
    
    // Find user by wallet address
    for (const [id, userData] of Object.entries(users)) {
      if ((userData as any).walletAddress?.toLowerCase() === walletAddress.toLowerCase()) {
        foundUser = { id, ...userData } as User;
        userId = id;
        break;
      }
    }
    
    if (!foundUser) return undefined;
    
    // Check if user is an officer
    const officersRef = ref(db, 'officers');
    const officersSnapshot = await get(officersRef);
    let officer: Officer | undefined;
    
    if (officersSnapshot.exists()) {
      const officers = officersSnapshot.val();
      for (const [id, officerData] of Object.entries(officers)) {
        if ((officerData as any).userId === userId) {
          officer = { id, ...officerData } as Officer;
          break;
        }
      }
    }
    
    return {
      ...foundUser,
      officer
    };
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.generateId();
    const userRef = ref(db, `users/${id}`);
    
    const userRecord = {
      walletAddress: userData.walletAddress.toLowerCase(),
      documentHashes: userData.documentHashes || [],
      role: 'none',
      status: 'pending',
      createdAt: serverTimestamp(),
      verifiedAt: null,
      verifiedBy: null
    };
    
    await set(userRef, userRecord);
    return { id, ...userRecord } as User;
  }

  async updateUserStatus(id: string, status: string, verifiedBy?: string): Promise<User | undefined> {
    const userRef = ref(db, `users/${id}`);
    
    const updateData: any = {
      status,
      verifiedBy: verifiedBy || null
    };

    if (status === "verified") {
      updateData.verifiedAt = serverTimestamp();
      
      // Check if this user is an officer
      const officersRef = ref(db, 'officers');
      const officersSnapshot = await get(officersRef);
      let isOfficer = false;
      
      if (officersSnapshot.exists()) {
        const officers = officersSnapshot.val();
        for (const officerData of Object.values(officers)) {
          if ((officerData as any).userId === id) {
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
      return { id, ...snapshot.val() } as User;
    }
    return undefined;
  }

  async getPendingUsers(): Promise<User[]> {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) return [];
    
    const users = snapshot.val();
    const pendingUsers: User[] = [];
    
    for (const [id, userData] of Object.entries(users)) {
      if ((userData as any).status === 'pending') {
        pendingUsers.push({ id, ...userData } as User);
      }
    }
    
    return pendingUsers;
  }

  async getAllUsers(): Promise<User[]> {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) return [];
    
    const users = snapshot.val();
    return Object.entries(users).map(([id, userData]) => ({ id, ...userData } as User));
  }

  // Officer management
  async createOfficer(officerData: any): Promise<Officer> {
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
    return { id, ...officerRecord } as Officer;
  }

  async getOfficerByUserId(userId: string): Promise<Officer | undefined> {
    const officersRef = ref(db, 'officers');
    const snapshot = await get(officersRef);
    
    if (!snapshot.exists()) return undefined;
    
    const officers = snapshot.val();
    for (const [id, officerData] of Object.entries(officers)) {
      if ((officerData as any).userId === userId) {
        return { id, ...officerData } as Officer;
      }
    }
    
    return undefined;
  }

  async getAllOfficers(): Promise<(Officer & { user: User })[]> {
    const officersRef = ref(db, 'officers');
    const snapshot = await get(officersRef);
    
    if (!snapshot.exists()) return [];
    
    const officers = snapshot.val();
    const result: (Officer & { user: User })[] = [];
    
    for (const [id, officerData] of Object.entries(officers)) {
      const officer = { id, ...officerData } as Officer;
      const user = await this.getUser(officer.userId);
      if (user) {
        result.push({ ...officer, user });
      }
    }
    
    return result;
  }

  async getOfficer(id: string): Promise<Officer | undefined> {
    const officerRef = ref(db, `officers/${id}`);
    const snapshot = await get(officerRef);
    
    if (snapshot.exists()) {
      return { id, ...snapshot.val() } as Officer;
    }
    return undefined;
  }

  async updateOfficerStats(officerId: string, activeCases: number, closedCases: number): Promise<void> {
    const officerRef = ref(db, `officers/${officerId}`);
    await update(officerRef, {
      activeCases,
      closedCases
    });
  }

  // FIR management
  async createFir(firData: InsertFir): Promise<Fir> {
    const id = this.generateId();
    const firNumber = `FIR${Date.now()}`;
    const firRef = ref(db, `firs/${id}`);
    
    const firRecord = {
      ...firData,
      firNumber,
      status: 'pending',
      evidenceHashes: firData.evidenceHashes || [],
      assignedOfficerId: null,
      blockchainTxHash: null,
      closingComments: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      closedAt: null
    };
    
    await set(firRef, firRecord);
    return { id, ...firRecord } as Fir;
  }

  async getAllFirs(): Promise<FirWithDetails[]> {
    const firsRef = ref(db, 'firs');
    const snapshot = await get(firsRef);
    
    if (!snapshot.exists()) return [];
    
    const firs = snapshot.val();
    const result: FirWithDetails[] = [];
    
    for (const [id, firData] of Object.entries(firs)) {
      const firWithDetails = await this.getFir(id);
      if (firWithDetails) {
        result.push(firWithDetails);
      }
    }
    
    return result.sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());
  }

  async getFirsByComplainant(complainantId: string): Promise<FirWithDetails[]> {
    const firsRef = ref(db, 'firs');
    const snapshot = await get(firsRef);
    
    if (!snapshot.exists()) return [];
    
    const firs = snapshot.val();
    const result: FirWithDetails[] = [];
    
    for (const [id, firData] of Object.entries(firs)) {
      if ((firData as any).complainantId === complainantId) {
        const firWithDetails = await this.getFir(id);
        if (firWithDetails) {
          result.push(firWithDetails);
        }
      }
    }
    
    return result.sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());
  }

  async getFirsByOfficer(officerId: string): Promise<FirWithDetails[]> {
    const firsRef = ref(db, 'firs');
    const snapshot = await get(firsRef);
    
    if (!snapshot.exists()) return [];
    
    const firs = snapshot.val();
    const result: FirWithDetails[] = [];
    
    for (const [id, firData] of Object.entries(firs)) {
      if ((firData as any).assignedOfficerId === officerId) {
        const firWithDetails = await this.getFir(id);
        if (firWithDetails) {
          result.push(firWithDetails);
        }
      }
    }
    
    return result.sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());
  }

  async getFir(id: string): Promise<FirWithDetails | undefined> {
    const firRef = ref(db, `firs/${id}`);
    const snapshot = await get(firRef);
    
    if (!snapshot.exists()) return undefined;
    
    const firData = { id, ...snapshot.val() } as Fir;
    
    // Get complainant
    const complainant = await this.getUser(firData.complainantId);
    if (!complainant) return undefined;
    
    // Get assigned officer if exists
    let assignedOfficer: (Officer & { user: User }) | undefined;
    if (firData.assignedOfficerId) {
      const officer = await this.getOfficer(firData.assignedOfficerId);
      if (officer) {
        const officerUser = await this.getUser(officer.userId);
        if (officerUser) {
          assignedOfficer = { ...officer, user: officerUser };
        }
      }
    }
    
    // Get updates
    const updates = await this.getFirUpdates(firData.id);
    
    return {
      ...firData,
      complainant,
      assignedOfficer,
      updates
    };
  }

  async getFirByNumber(firNumber: string): Promise<FirWithDetails | undefined> {
    const firsRef = ref(db, 'firs');
    const snapshot = await get(firsRef);
    
    if (!snapshot.exists()) return undefined;
    
    const firs = snapshot.val();
    for (const [id, firData] of Object.entries(firs)) {
      if ((firData as any).firNumber === firNumber) {
        return this.getFir(id);
      }
    }
    
    return undefined;
  }

  async updateFirStatus(firId: string, status: string, assignedOfficerId?: string, closingComments?: string): Promise<Fir | undefined> {
    const firRef = ref(db, `firs/${firId}`);
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (assignedOfficerId) {
      updateData.assignedOfficerId = assignedOfficerId;
    }

    if (closingComments) {
      updateData.closingComments = closingComments;
    }

    if (status === 'closed') {
      updateData.closedAt = serverTimestamp();
    }

    await update(firRef, updateData);
    
    const snapshot = await get(firRef);
    if (snapshot.exists()) {
      return { id: firId, ...snapshot.val() } as Fir;
    }
    return undefined;
  }

  async assignFirToOfficer(firId: string, officerId: string): Promise<Fir | undefined> {
    const firRef = ref(db, `firs/${firId}`);
    
    await update(firRef, {
      assignedOfficerId: officerId,
      status: 'in_progress',
      updatedAt: serverTimestamp()
    });
    
    const snapshot = await get(firRef);
    if (snapshot.exists()) {
      return { id: firId, ...snapshot.val() } as Fir;
    }
    return undefined;
  }

  // FIR Updates
  async addFirUpdate(updateData: InsertFirUpdate): Promise<FirUpdate> {
    const id = this.generateId();
    const updateRef = ref(db, `firUpdates/${id}`);
    
    const updateRecord = {
      ...updateData,
      createdAt: serverTimestamp()
    };
    
    await set(updateRef, updateRecord);
    return { id, ...updateRecord } as FirUpdate;
  }

  async getFirUpdates(firId: string): Promise<FirUpdate[]> {
    const updatesRef = ref(db, 'firUpdates');
    const snapshot = await get(updatesRef);
    
    if (!snapshot.exists()) return [];
    
    const updates = snapshot.val();
    const firUpdates: FirUpdate[] = [];
    
    for (const [id, updateData] of Object.entries(updates)) {
      if ((updateData as any).firId === firId) {
        firUpdates.push({ id, ...updateData } as FirUpdate);
      }
    }
    
    return firUpdates.sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalFirs: number;
    pendingVerification: number;
    activeOfficers: number;
    closedCases: number;
  }> {
    // Get total FIRs
    const firsRef = ref(db, 'firs');
    const firsSnapshot = await get(firsRef);
    const totalFirs = firsSnapshot.exists() ? Object.keys(firsSnapshot.val()).length : 0;

    // Get pending users
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);
    let pendingVerification = 0;
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      for (const userData of Object.values(users)) {
        if ((userData as any).status === 'pending') {
          pendingVerification++;
        }
      }
    }

    // Get active officers
    const officersRef = ref(db, 'officers');
    const officersSnapshot = await get(officersRef);
    const activeOfficers = officersSnapshot.exists() ? Object.keys(officersSnapshot.val()).length : 0;

    // Get closed cases
    let closedCases = 0;
    if (firsSnapshot.exists()) {
      const firs = firsSnapshot.val();
      for (const firData of Object.values(firs)) {
        if ((firData as any).status === 'closed') {
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
}