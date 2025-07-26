import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
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

export class FirebaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return undefined;
  }

  async getUserByWallet(walletAddress: string): Promise<UserWithRole | undefined> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('walletAddress', '==', walletAddress.toLowerCase()), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return undefined;
    
    const userDoc = querySnapshot.docs[0];
    const userData = { id: userDoc.id, ...userDoc.data() } as User;
    
    // Check if user is an officer
    const officersRef = collection(db, 'officers');
    const officerQuery = query(officersRef, where('userId', '==', userData.id), limit(1));
    const officerSnapshot = await getDocs(officerQuery);
    
    let officer: Officer | undefined = undefined;
    if (!officerSnapshot.empty) {
      const officerDoc = officerSnapshot.docs[0];
      officer = { id: officerDoc.id, ...officerDoc.data() } as Officer;
    }
    
    return {
      ...userData,
      officer
    };
  }

  async createUser(userData: InsertUser): Promise<User> {
    const docRef = await addDoc(collection(db, 'users'), {
      walletAddress: userData.walletAddress.toLowerCase(),
      documentHashes: userData.documentHashes || [],
      role: 'none',
      status: 'pending',
      createdAt: serverTimestamp(),
      verifiedAt: null,
      verifiedBy: null
    });
    
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as User;
  }

  async updateUserStatus(id: string, status: string, verifiedBy?: string): Promise<User | undefined> {
    const docRef = doc(db, 'users', id);
    
    const updateData: any = {
      status,
      verifiedBy: verifiedBy || null
    };

    if (status === "verified") {
      updateData.verifiedAt = serverTimestamp();
      updateData.role = "user";
    }

    await updateDoc(docRef, updateData);
    
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return undefined;
  }

  async getPendingUsers(): Promise<User[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  async getAllUsers(): Promise<User[]> {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  // Officer management
  async createOfficer(officerData: InsertOfficer): Promise<Officer> {
    const docRef = await addDoc(collection(db, 'officers'), {
      ...officerData,
      activeCases: 0,
      closedCases: 0,
      createdAt: serverTimestamp()
    });
    
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as Officer;
  }

  async getOfficerByUserId(userId: string): Promise<Officer | undefined> {
    const officersRef = collection(db, 'officers');
    const q = query(officersRef, where('userId', '==', userId), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return undefined;
    
    const officerDoc = querySnapshot.docs[0];
    return { id: officerDoc.id, ...officerDoc.data() } as Officer;
  }

  async getAllOfficers(): Promise<(Officer & { user: User })[]> {
    const officersRef = collection(db, 'officers');
    const querySnapshot = await getDocs(officersRef);
    
    const officers = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const officer = { id: doc.id, ...doc.data() } as Officer;
        const user = await this.getUser(officer.userId);
        return { ...officer, user: user! };
      })
    );
    
    return officers;
  }

  async updateOfficerStats(officerId: string, activeCases: number, closedCases: number): Promise<void> {
    const docRef = doc(db, 'officers', officerId);
    await updateDoc(docRef, {
      activeCases,
      closedCases
    });
  }

  async getOfficer(id: string): Promise<Officer | undefined> {
    const docRef = doc(db, 'officers', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Officer;
    }
    return undefined;
  }

  // FIR management
  async createFir(firData: InsertFir): Promise<Fir> {
    // Generate FIR number
    const firNumber = `FIR${Date.now()}`;
    
    const docRef = await addDoc(collection(db, 'firs'), {
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
    });
    
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as Fir;
  }

  async getAllFirs(): Promise<FirWithDetails[]> {
    const firsRef = collection(db, 'firs');
    const q = query(firsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const firs = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        return await this.getFir(doc.id);
      })
    );
    
    return firs.filter(fir => fir !== undefined) as FirWithDetails[];
  }

  async getFirsByComplainant(complainantId: string): Promise<FirWithDetails[]> {
    const firsRef = collection(db, 'firs');
    const q = query(firsRef, where('complainantId', '==', complainantId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const firs = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        return await this.getFir(doc.id);
      })
    );
    
    return firs.filter(fir => fir !== undefined) as FirWithDetails[];
  }

  async getFirsByOfficer(officerId: string): Promise<FirWithDetails[]> {
    const firsRef = collection(db, 'firs');
    const q = query(firsRef, where('assignedOfficerId', '==', officerId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const firs = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        return await this.getFir(doc.id);
      })
    );
    
    return firs.filter(fir => fir !== undefined) as FirWithDetails[];
  }

  async assignFirToOfficer(firId: string, officerId: string): Promise<Fir | undefined> {
    const docRef = doc(db, 'firs', firId);
    
    await updateDoc(docRef, {
      assignedOfficerId: officerId,
      status: 'in_progress',
      updatedAt: serverTimestamp()
    });
    
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Fir;
    }
    return undefined;
  }

  async getFir(id: string): Promise<FirWithDetails | undefined> {
    const docRef = doc(db, 'firs', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return undefined;
    
    const firData = { id: docSnap.id, ...docSnap.data() } as Fir;
    
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
    const firsRef = collection(db, 'firs');
    const q = query(firsRef, where('firNumber', '==', firNumber), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return undefined;
    
    const firDoc = querySnapshot.docs[0];
    return this.getFir(firDoc.id);
  }

  async updateFirStatus(firId: string, status: string, assignedOfficerId?: string, closingComments?: string): Promise<Fir | undefined> {
    const docRef = doc(db, 'firs', firId);
    
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

    await updateDoc(docRef, updateData);
    
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Fir;
    }
    return undefined;
  }

  // FIR Updates
  async addFirUpdate(updateData: InsertFirUpdate): Promise<FirUpdate> {
    const docRef = await addDoc(collection(db, 'firUpdates'), {
      ...updateData,
      createdAt: serverTimestamp()
    });
    
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as FirUpdate;
  }

  async getFirUpdates(firId: string): Promise<FirUpdate[]> {
    const updatesRef = collection(db, 'firUpdates');
    const q = query(updatesRef, where('firId', '==', firId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirUpdate));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalFirs: number;
    pendingVerification: number;
    activeOfficers: number;
    closedCases: number;
  }> {
    // Get total FIRs
    const firsRef = collection(db, 'firs');
    const firsSnapshot = await getDocs(firsRef);
    const totalFirs = firsSnapshot.size;

    // Get pending users
    const usersRef = collection(db, 'users');
    const pendingQuery = query(usersRef, where('status', '==', 'pending'));
    const pendingSnapshot = await getDocs(pendingQuery);
    const pendingVerification = pendingSnapshot.size;

    // Get active officers and closed cases
    const officersRef = collection(db, 'officers');
    const officersSnapshot = await getDocs(officersRef);
    const activeOfficers = officersSnapshot.size;

    const closedQuery = query(firsRef, where('status', '==', 'closed'));
    const closedSnapshot = await getDocs(closedQuery);
    const closedCases = closedSnapshot.size;

    return {
      totalFirs,
      pendingVerification,
      activeOfficers,
      closedCases
    };
  }
}