import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs, 
  Unsubscribe 
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured, getCurrentUserId } from './firebase';
import { GiftGroup, GroupStatus, Participant, GroupPhase, OccasionType, ContributionMode } from '../types';
import { generateRandomGroupId, generateShortJoinCode, generateRecoveryToken } from '../utils/ids';
import { saveParticipantSession } from './participantService';

export interface CreateGroupInput {
  coupleName: string;
  creatorName: string;
  occasion?: OccasionType;
  contributionMode?: ContributionMode;
  weddingDate?: string;
  deadlineDate?: string;
  giftDescription?: string;
  expectedParticipants?: number;
  upiId?: string;
  paymentNotes?: string;
}

export async function createGroup(input: CreateGroupInput): Promise<GiftGroup> {
  if (!db || !isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Please enable Firebase.');
  }

  const creatorId = getCurrentUserId();

  const groupId = generateRandomGroupId();
  const shareCode = generateShortJoinCode();
  const now = new Date().toISOString();
  const expectedParticipants = input.expectedParticipants || 8;

  const groupData: Omit<GiftGroup, 'id' | 'participants'> = {
    slug: groupId,
    coupleName: input.coupleName.trim(),
    coupleNames: input.coupleName.trim(),
    creatorName: input.creatorName.trim(),
    createdBy: creatorId,
    createdAt: now,
    lastActivityAt: now,
    occasion: input.occasion || 'wedding',
    contributionMode: input.contributionMode || 'equal',
    phase: 1, // Start at Phase 1: Decide
    weddingDate: input.weddingDate?.trim() || undefined,
    deadlineDate: input.deadlineDate?.trim() || undefined,
    giftDescription: input.giftDescription?.trim() || undefined,
    expectedParticipants,
    isRevealed: false,
    isBudgetLocked: false,
    status: 'collecting',
    participantCount: 1,
    responseCount: 0,
    recommendationStatus: 'pending',
    createdShareCode: shareCode,
    upiId: input.upiId?.trim() || undefined,
    paymentNotes: input.paymentNotes?.trim() || undefined,
    aggregatePayments: {
      paidCount: 0,
      totalCollected: 0,
      pendingCount: expectedParticipants,
    },
  };

  // 1. Create the Group document
  const groupRef = doc(db, 'groups', groupId);
  await setDoc(groupRef, groupData);

  // 2. Create the Short Share Code mapping document
  try {
    const codeRef = doc(db, 'shareCodes', shareCode);
    await setDoc(codeRef, {
      groupId,
      createdAt: now,
    });
  } catch (err) {
    console.warn('Could not store shareCode lookup index:', err);
  }

  // 3. Add creator as the first participant (safe document, NO payment status)
  const recoveryToken = generateRecoveryToken();
  const creatorParticipantRef = doc(db, 'groups', groupId, 'participants', creatorId);
  const creatorParticipant: Participant = {
    id: creatorId,
    displayName: input.creatorName.trim(),
    name: input.creatorName.trim(),
    joinedAt: now,
    hasSubmitted: false,
    isCreator: true,
  };
  await setDoc(creatorParticipantRef, creatorParticipant);

  // 4. Save recovery token doc
  try {
    const recoveryRef = doc(db, 'groups', groupId, 'recoveryTokens', recoveryToken);
    await setDoc(recoveryRef, {
      participantId: creatorId,
      createdAt: now,
    });
  } catch (e) {
    console.warn('Recovery token error:', e);
  }

  // 5. Save session locally
  saveParticipantSession(groupId, {
    participantId: creatorId,
    displayName: input.creatorName.trim(),
    recoveryToken,
    isCreator: true,
  });

  return {
    ...groupData,
    id: groupId,
    participants: [creatorParticipant],
  };
}

export async function getGroup(groupId: string): Promise<GiftGroup | null> {
  if (!db) return null;

  try {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);
    if (!snap.exists()) {
      return null;
    }

    const data = snap.data() as any;

    // Fetch participants
    const participantsRef = collection(db, 'groups', groupId, 'participants');
    const partSnap = await getDocs(participantsRef);
    const participants: Participant[] = [];
    partSnap.forEach((docSnap) => {
      const pData = docSnap.data() as any;
      participants.push({
        ...pData,
        id: docSnap.id,
        name: pData.displayName || pData.name || 'Friend',
        displayName: pData.displayName || pData.name || 'Friend',
      });
    });

    return {
      ...data,
      id: snap.id,
      coupleNames: data.coupleNames || data.coupleName || '',
      coupleName: data.coupleNames || data.coupleName || '',
      phase: data.phase || 1,
      contributionMode: data.contributionMode || 'equal',
      occasion: data.occasion || 'wedding',
      participants,
    };
  } catch (err) {
    console.error('Error fetching group:', err);
    return null;
  }
}

export function subscribeGroup(
  groupId: string,
  callback: (group: GiftGroup | null) => void
): Unsubscribe | null {
  if (!db) return null;

  const groupRef = doc(db, 'groups', groupId);
  return onSnapshot(
    groupRef,
    async (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const data = snap.data() as any;

      callback({
        ...data,
        id: snap.id,
        slug: data.slug || snap.id,
        coupleName: data.coupleName || data.coupleNames || '',
        coupleNames: data.coupleNames || data.coupleName || '',
        isRevealed: Boolean(data.isRevealed || data.status === 'revealed'),
        phase: data.phase || (data.status === 'completed' ? 4 : data.targetContribution ? 3 : data.isRevealed ? 2 : 1),
        contributionMode: data.contributionMode || 'equal',
        occasion: data.occasion || 'wedding',
        participants: [],
      });
    },
    (err) => {
      console.error('Group subscription error:', err);
      callback(null);
    }
  );
}

export async function getGroupIdByShareCode(code: string): Promise<string | null> {
  if (!db) return null;
  const cleanCode = code.trim().toUpperCase();

  try {
    const codeRef = doc(db, 'shareCodes', cleanCode);
    const snap = await getDoc(codeRef);
    if (snap.exists() && snap.data()?.groupId) {
      return snap.data().groupId;
    }

    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('createdShareCode', '==', cleanCode));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return querySnap.docs[0].id;
    }

    return null;
  } catch (err) {
    console.error('Error resolving share code:', err);
    return null;
  }
}

export async function revealRecommendation(groupId: string): Promise<void> {
  if (!db) return;
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    isRevealed: true,
    recommendationStatus: 'revealed',
    status: 'revealed',
    lastActivityAt: new Date().toISOString(),
  });
}

export async function setGroupPhase(groupId: string, phase: GroupPhase): Promise<void> {
  if (!db) return;
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    phase,
    lastActivityAt: new Date().toISOString(),
  });
}

export async function lockConsensusAmount(
  groupId: string, 
  amount: number, 
  totalParticipants: number
): Promise<void> {
  if (!db) return;
  const groupRef = doc(db, 'groups', groupId);
  const roundedAmount = Math.round(amount);
  const totalGift = roundedAmount * totalParticipants;

  await updateDoc(groupRef, {
    targetContribution: roundedAmount,
    agreedAmount: roundedAmount,
    targetGiftAmount: totalGift,
    isBudgetLocked: true,
    isRevealed: true,
    phase: 2, // Advance to Choose Gift
    status: 'agreed',
    lastActivityAt: new Date().toISOString(),
  });
}

export async function setAgreedContribution(groupId: string, amount: number): Promise<void> {
  if (!db) return;
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    agreedAmount: Math.round(amount),
    targetContribution: Math.round(amount),
    status: 'agreed',
    lastActivityAt: new Date().toISOString(),
  });
}

export async function updateGroupStatus(groupId: string, status: GroupStatus): Promise<void> {
  if (!db) return;
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    status,
    lastActivityAt: new Date().toISOString(),
  });
}

export async function updatePaymentDetails(
  groupId: string,
  upiId?: string,
  paymentNotes?: string,
  targetContribution?: number
): Promise<void> {
  if (!db) return;
  const groupRef = doc(db, 'groups', groupId);
  const updatePayload: any = {
    lastActivityAt: new Date().toISOString(),
  };
  if (upiId !== undefined) updatePayload.upiId = upiId?.trim() || null;
  if (paymentNotes !== undefined) updatePayload.paymentNotes = paymentNotes?.trim() || null;
  if (targetContribution !== undefined) updatePayload.targetContribution = Math.round(targetContribution);

  await updateDoc(groupRef, updatePayload);
}
