import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  getDocs,
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, ensureAnonymousAuth, signInWithGoogle } from './firebase';
import { Participant } from '../types/participant';
import { generateRecoveryToken } from '../utils/ids';
import { verifyParticipantPayment } from './paymentClaimService';

export interface ParticipantSession {
  participantId: string;
  displayName: string;
  recoveryToken: string;
  isCreator: boolean;
}

const SESSION_STORAGE_PREFIX = 'gifttogether_part_session_';

export function saveParticipantSession(groupId: string, session: ParticipantSession): void {
  try {
    localStorage.setItem(`${SESSION_STORAGE_PREFIX}${groupId}`, JSON.stringify(session));
  } catch (err) {
    console.warn('Could not save participant session:', err);
  }
}

export function getParticipantSession(groupId: string): ParticipantSession | null {
  try {
    const raw = localStorage.getItem(`${SESSION_STORAGE_PREFIX}${groupId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearParticipantSession(groupId: string): void {
  try {
    localStorage.removeItem(`${SESSION_STORAGE_PREFIX}${groupId}`);
  } catch {
    // ignore
  }
}

export async function joinGroup(groupId: string, displayName: string): Promise<Participant> {
  if (!db) {
    throw new Error('Database is not available.');
  }

  let user = auth?.currentUser || (await ensureAnonymousAuth());
  if (!user) {
    try {
      user = await signInWithGoogle();
    } catch {
      // user closed popup
    }
  }
  if (!user) {
    throw new Error('Please sign in with Google to join this group.');
  }

  const cleanName = displayName.trim();
  const participantRef = doc(db, 'groups', groupId, 'participants', user.uid);
  const groupRef = doc(db, 'groups', groupId);

  // Check if participant already exists for this user
  const existingSnap = await getDoc(participantRef);
  if (existingSnap.exists()) {
    const existing = existingSnap.data() as Participant;
    const session = getParticipantSession(groupId);
    saveParticipantSession(groupId, {
      participantId: user.uid,
      displayName: existing.displayName || existing.name || cleanName,
      recoveryToken: session?.recoveryToken || generateRecoveryToken(),
      isCreator: Boolean(existing.isCreator),
    });
    return { ...existing, id: user.uid };
  }

  const recoveryToken = generateRecoveryToken();
  const now = new Date().toISOString();

  // Run transaction to increment participantCount and create participant
  await runTransaction(db, async (transaction) => {
    const groupSnap = await transaction.get(groupRef);
    if (!groupSnap.exists()) {
      throw new Error('Group does not exist.');
    }

    const currentCount = groupSnap.data().participantCount || 0;
    transaction.update(groupRef, {
      participantCount: currentCount + 1,
      lastActivityAt: now,
    });

    const newParticipant: Participant = {
      id: user.uid,
      displayName: cleanName,
      name: cleanName,
      joinedAt: now,
      hasSubmitted: false,
      isCreator: false,
    };

    transaction.set(participantRef, newParticipant);
  });

  // Save recovery token
  try {
    const recoveryRef = doc(db, 'groups', groupId, 'recoveryTokens', recoveryToken);
    await setDoc(recoveryRef, {
      participantId: user.uid,
      createdAt: now,
    });
  } catch (err) {
    console.warn('Could not store recovery token:', err);
  }

  // Save session in local storage
  saveParticipantSession(groupId, {
    participantId: user.uid,
    displayName: cleanName,
    recoveryToken,
    isCreator: false,
  });

  return {
    id: user.uid,
    displayName: cleanName,
    name: cleanName,
    joinedAt: now,
    hasSubmitted: false,
    isCreator: false,
  };
}

export function subscribeParticipants(
  groupId: string,
  callback: (participants: Participant[]) => void
): Unsubscribe | null {
  if (!db) return null;

  const participantsRef = collection(db, 'groups', groupId, 'participants');
  return onSnapshot(
    participantsRef,
    (snap) => {
      const list: Participant[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        list.push({
          ...data,
          id: docSnap.id,
          name: data.displayName || data.name || 'Friend',
          displayName: data.displayName || data.name || 'Friend',
          hasSubmitted: Boolean(data.hasSubmitted),
          isCreator: Boolean(data.isCreator),
          joinedAt: data.joinedAt || new Date().toISOString(),
        });
      });
      callback(list);
    },
    (err) => {
      console.error('Participants subscription error:', err);
      callback([]);
    }
  );
}

export async function getParticipants(groupId: string): Promise<Participant[]> {
  if (!db) return [];
  try {
    const participantsRef = collection(db, 'groups', groupId, 'participants');
    const snap = await getDocs(participantsRef);
    const list: Participant[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      list.push({
        ...data,
        id: docSnap.id,
        name: data.displayName || data.name || 'Friend',
        displayName: data.displayName || data.name || 'Friend',
        hasSubmitted: Boolean(data.hasSubmitted),
        isCreator: Boolean(data.isCreator),
        joinedAt: data.joinedAt || new Date().toISOString(),
      });
    });
    return list;
  } catch (err) {
    console.error('Error fetching participants:', err);
    return [];
  }
}

export async function updateParticipantPayment(
  groupId: string,
  participantId: string,
  isPaid: boolean,
  amount: number = 2000
): Promise<void> {
  // Delegate to private payments subcollection and aggregate refresh
  await verifyParticipantPayment(groupId, participantId, isPaid, amount);
}

export async function recoverParticipantByToken(
  groupId: string,
  token: string
): Promise<Participant | null> {
  if (!db) return null;
  try {
    const recoveryRef = doc(db, 'groups', groupId, 'recoveryTokens', token.trim());
    const tokenSnap = await getDoc(recoveryRef);
    if (!tokenSnap.exists()) {
      return null;
    }

    const { participantId } = tokenSnap.data();
    const partRef = doc(db, 'groups', groupId, 'participants', participantId);
    const partSnap = await getDoc(partRef);
    if (!partSnap.exists()) return null;

    const participant = { ...(partSnap.data() as Participant), id: participantId };
    saveParticipantSession(groupId, {
      participantId,
      displayName: participant.displayName || participant.name || 'Friend',
      recoveryToken: token.trim(),
      isCreator: Boolean(participant.isCreator),
    });

    return participant;
  } catch (err) {
    console.error('Failed to recover participant by token:', err);
    return null;
  }
}
