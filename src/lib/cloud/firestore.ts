// Firestore access for live groups. Loaded on demand so the Firebase SDK only
// downloads for people who use live sharing.
//
// Layout: groups/{cloudId}            -> GroupMeta
//         groups/{cloudId}/expenses/{id} -> Expense

import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  memoryLocalCache,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import type { Expense, Group } from '../types';
import { metaOf, newCloudId, type GroupMeta, type SyncOp } from './model';

export interface RemoteState {
  meta: GroupMeta | null;
  expenses: Expense[];
  /** True while this device has writes the server hasn't confirmed yet. */
  pending: boolean;
  fromCache: boolean;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function connect(config: FirebaseOptions, emulator?: string): Firestore {
  if (db) return db;
  app = initializeApp(config, 'easysplit');
  const canPersist = typeof indexedDB !== 'undefined';
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    // Keep queued writes across reloads so offline edits aren't lost.
    localCache: canPersist ? persistentLocalCache({ tabManager: persistentMultipleTabManager() }) : memoryLocalCache(),
  });
  if (emulator) {
    const [host, port] = emulator.split(':');
    connectFirestoreEmulator(db, host, Number(port));
  }
  return db;
}

function need(): Firestore {
  if (!db) throw new Error('Firestore not connected');
  return db;
}

const groupRef = (id: string) => doc(need(), 'groups', id);
const expensesRef = (id: string) => collection(need(), 'groups', id, 'expenses');

// Firestore allows at most 500 writes per batch.
async function commitInChunks(cloudId: string, ops: SyncOp[]) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(need());
    for (const op of ops.slice(i, i + 450)) {
      if (op.type === 'meta') batch.set(groupRef(cloudId), op.meta);
      else if (op.type === 'set') batch.set(doc(expensesRef(cloudId), op.expense.id), op.expense);
      else batch.delete(doc(expensesRef(cloudId), op.id));
    }
    await batch.commit();
  }
}

/** Put a local group online. Returns its new cloud id. */
export async function publish(group: Group): Promise<string> {
  const cloudId = newCloudId();
  await commitInChunks(cloudId, [{ type: 'meta', meta: metaOf(group) }, ...group.expenses.map((e) => ({ type: 'set' as const, expense: e }))]);
  return cloudId;
}

/** Apply local changes to the online copy. Resolves when the server confirms. */
export function push(cloudId: string, ops: SyncOp[]): Promise<void> {
  return commitInChunks(cloudId, ops);
}

/** One-off read, used before joining. Null when the group doesn't exist. */
export async function fetchRemote(cloudId: string): Promise<{ meta: GroupMeta; expenses: Expense[] } | null> {
  const snap = await getDoc(groupRef(cloudId));
  if (!snap.exists()) return null;
  const list = await getDocs(expensesRef(cloudId));
  return { meta: snap.data() as GroupMeta, expenses: list.docs.map((d) => d.data() as Expense) };
}

/** Live updates for one group. Returns an unsubscribe function. */
export function watch(cloudId: string, onChange: (s: RemoteState) => void, onError: (e: Error) => void): () => void {
  let meta: GroupMeta | null | undefined;
  let expenses: Expense[] | undefined;
  let metaPending = false;
  let expPending = false;
  let fromCache = true;
  const emit = () => {
    if (meta === undefined || expenses === undefined) return;
    onChange({ meta, expenses, pending: metaPending || expPending, fromCache });
  };
  const offMeta = onSnapshot(
    groupRef(cloudId),
    { includeMetadataChanges: true },
    (snap) => {
      meta = snap.exists() ? (snap.data() as GroupMeta) : null;
      metaPending = snap.metadata.hasPendingWrites;
      fromCache = snap.metadata.fromCache;
      emit();
    },
    onError,
  );
  const offExp = onSnapshot(
    expensesRef(cloudId),
    { includeMetadataChanges: true },
    (snap) => {
      expenses = snap.docs.map((d) => d.data() as Expense);
      expPending = snap.metadata.hasPendingWrites;
      emit();
    },
    onError,
  );
  return () => {
    offMeta();
    offExp();
  };
}
