import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { TDBillDetails } from './types';

// See standard error handler from skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'anonymous'
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function saveBillToFirestore(bill: TDBillDetails) {
  const now = Date.now();
  const entriesData = JSON.stringify(bill.entries);
  
  try {
    if (bill.id) {
       const updateData = {
         bo: bill.bo,
         so: bill.so,
         ho: bill.ho,
         month: bill.month,
         year: bill.year,
         dateString: bill.dateString,
         entriesData: entriesData,
         updatedAt: now,
       };
       await updateDoc(doc(db, 'bills', bill.id), updateData);
    } else {
       const data = {
         userId: 'anonymous',
         bo: bill.bo,
         so: bill.so,
         ho: bill.ho,
         month: bill.month,
         year: bill.year,
         dateString: bill.dateString,
         entriesData: entriesData,
         status: bill.status || 'Pending',
         createdAt: bill.createdAt || now,
         updatedAt: now,
       };
       const billId = Math.random().toString(36).substring(2, 15);
       await setDoc(doc(db, 'bills', billId), data);
    }
  } catch (error) {
    handleFirestoreError(error, bill.id ? OperationType.UPDATE : OperationType.CREATE, 'bills');
  }
}

export async function updateBillStatus(billId: string, status: 'Pending' | 'Approved' | 'Rejected') {
  try {
    await updateDoc(doc(db, 'bills', billId), {
      status,
      updatedAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'bills');
  }
}

export async function getBillsFromFirestore(month?: string, year?: string): Promise<TDBillDetails[]> {
  try {
    const q = query(collection(db, 'bills'));
    const snap = await getDocs(q);
    const bills = snap.docs.map(doc => {
      const data = doc.data();
      const entries = JSON.parse(data.entriesData || '[]');
      return {
        id: doc.id,
        userId: data.userId,
        bo: data.bo,
        so: data.so,
        ho: data.ho,
        month: data.month,
        year: data.year,
        dateString: data.dateString,
        entries: entries,
        createdAt: data.createdAt,
        status: data.status || 'Pending'
      } as TDBillDetails;
    });
    
    // Filter locally if needed
    let filtered = bills;
    if (month && month !== '') {
      filtered = filtered.filter(b => b.month === month);
    }
    if (year && year !== '') {
      filtered = filtered.filter(b => b.year === year);
    }
    
    return filtered.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'bills');
    return [];
  }
}

export function subscribeToBillsFromFirestore(
  month: string | undefined, 
  year: string | undefined, 
  bo: string | undefined,
  onSnapshotCallback: (bills: TDBillDetails[]) => void, 
  onErrorCallback: (error: Error) => void
) {
  
  let q = query(collection(db, 'bills'));
  if (bo && bo.trim() !== '') {
    // If bo filter is provided, we can either filter in firestore or locally. Let's do it locally so it matches exact text ignoring case if we want, or exact match.
    // Let's do local filter for simplicity and less indexing problems.
  }
  
  const unsubscribe = onSnapshot(q, (snap) => {
    const bills = snap.docs.map(doc => {
      const data = doc.data();
      const entries = JSON.parse(data.entriesData || '[]');
      return {
        id: doc.id,
        userId: data.userId,
        bo: data.bo,
        so: data.so,
        ho: data.ho,
        month: data.month,
        year: data.year,
        dateString: data.dateString,
        entries: entries,
        createdAt: data.createdAt,
        status: data.status || 'Pending'
      } as TDBillDetails;
    });
    
    let filtered = bills;
    if (month && month !== '') {
      filtered = filtered.filter(b => b.month === month);
    }
    if (year && year !== '') {
      filtered = filtered.filter(b => b.year === year);
    }
    if (bo && bo.trim() !== '') {
      filtered = filtered.filter(b => b.bo?.toLowerCase().includes(bo.toLowerCase()));
    }
    
    onSnapshotCallback(filtered.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)));
  }, (error) => {
    try {
      handleFirestoreError(error, OperationType.LIST, 'bills');
    } catch(e: any) {
      onErrorCallback(e);
    }
  });

  return unsubscribe;
}

export async function getUserSettings() {
  return null;
}

export async function saveUserSettings(spreadsheetId: string) {
}

export async function deleteBill(billId: string) {
  try {
    await deleteDoc(doc(db, 'bills', billId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'bills');
  }
}
