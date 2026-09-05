import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  updateDoc,
  Unsubscribe,
  runTransaction,
} from 'firebase/firestore';
import { db, auth, ensureAnonymousAuth } from './firebase';
import { PaymentClaim, PaymentRecord } from '../types/participant';
import { AggregatePaymentSummary } from '../types/group';

export interface SubmitPaymentClaimInput {
  upiRef?: string;
  note?: string;
  amount?: number;
}

/**
 * Participant self-reports that they have transferred their contribution.
 * Saved in groups/{groupId}/paymentClaims/{participantId}.
 * Only the participant and the creator can read this document per firestore.rules.
 */
export async function submitPaymentClaim(
  groupId: string,
  input: SubmitPaymentClaimInput
): Promise<void> {
  if (!db) throw new Error('Database not initialized.');
  const user = auth?.currentUser || (await ensureAnonymousAuth());
  if (!user) throw new Error('You must be signed in to submit a payment confirmation.');

  const claimRef = doc(db, 'groups', groupId, 'paymentClaims', user.uid);
  const now = new Date().toISOString();

  await setDoc(claimRef, {
    participantId: user.uid,
    claimed: true,
    claimedAt: now,
    upiRef: input.upiRef?.trim() || null,
    note: input.note?.trim() || null,
    status: 'pending_verification',
  });
}

/**
 * Subscribes to the current user's payment claim.
 */
export function subscribeMyPaymentClaim(
  groupId: string,
  callback: (claim: PaymentClaim | null) => void
): Unsubscribe | null {
  if (!db) return null;
  const user = auth?.currentUser;
  if (!user) {
    callback(null);
    return null;
  }

  const claimRef = doc(db, 'groups', groupId, 'paymentClaims', user.uid);
  return onSnapshot(
    claimRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as PaymentClaim);
      } else {
        callback(null);
      }
    },
    () => callback(null)
  );
}

/**
 * Subscribes to the current user's verified payment record.
 */
export function subscribeMyPaymentRecord(
  groupId: string,
  callback: (record: PaymentRecord | null) => void
): Unsubscribe | null {
  if (!db) return null;
  const user = auth?.currentUser;
  if (!user) {
    callback(null);
    return null;
  }

  const paymentRef = doc(db, 'groups', groupId, 'payments', user.uid);
  return onSnapshot(
    paymentRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as PaymentRecord);
      } else {
        callback(null);
      }
    },
    () => callback(null)
  );
}

/**
 * Creator-only: Subscribes to all payment claims submitted by group participants.
 */
export function subscribeAllPaymentClaims(
  groupId: string,
  callback: (claims: Record<string, PaymentClaim>) => void
): Unsubscribe | null {
  if (!db) return null;
  const claimsRef = collection(db, 'groups', groupId, 'paymentClaims');

  return onSnapshot(
    claimsRef,
    (snap) => {
      const claimsMap: Record<string, PaymentClaim> = {};
      snap.forEach((docSnap) => {
        claimsMap[docSnap.id] = docSnap.data() as PaymentClaim;
      });
      callback(claimsMap);
    },
    (err) => {
      console.warn('Could not subscribe to payment claims:', err);
      callback({});
    }
  );
}

/**
 * Creator-only: Subscribes to all verified payment records.
 */
export function subscribeAllPayments(
  groupId: string,
  callback: (payments: Record<string, PaymentRecord>) => void
): Unsubscribe | null {
  if (!db) return null;
  const paymentsRef = collection(db, 'groups', groupId, 'payments');

  return onSnapshot(
    paymentsRef,
    (snap) => {
      const paymentsMap: Record<string, PaymentRecord> = {};
      snap.forEach((docSnap) => {
        paymentsMap[docSnap.id] = docSnap.data() as PaymentRecord;
      });
      callback(paymentsMap);
    },
    (err) => {
      console.warn('Could not subscribe to verified payments:', err);
      callback({});
    }
  );
}

/**
 * Creator-only: Verifies or un-verifies a participant's payment.
 * Writes to groups/{groupId}/payments/{participantId}.
 * Also updates the public aggregate on the group document (without exposing individual records).
 */
export async function verifyParticipantPayment(
  groupId: string,
  participantId: string,
  isVerified: boolean,
  amount: number
): Promise<void> {
  if (!db) throw new Error('Database not initialized.');
  const user = auth?.currentUser;
  if (!user) throw new Error('Unauthorized.');

  const paymentRef = doc(db, 'groups', groupId, 'payments', participantId);
  const now = new Date().toISOString();

  if (isVerified) {
    await setDoc(paymentRef, {
      participantId,
      isVerified: true,
      amount: Number(amount) || 0,
      verifiedAt: now,
      verifiedBy: user.uid,
    });
  } else {
    await setDoc(paymentRef, {
      participantId,
      isVerified: false,
      amount: 0,
      verifiedAt: now,
      verifiedBy: user.uid,
    });
  }

  // Recalculate public aggregate payments on group document
  await refreshGroupAggregatePayments(groupId);
}

/**
 * Recalculates and updates the public aggregate payments count on the group doc.
 */
export async function refreshGroupAggregatePayments(groupId: string): Promise<void> {
  if (!db) return;
  try {
    const paymentsRef = collection(db, 'groups', groupId, 'payments');
    const paymentSnaps = await getDocs(paymentsRef);
    
    let paidCount = 0;
    let totalCollected = 0;

    paymentSnaps.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.isVerified === true) {
        paidCount++;
        totalCollected += Number(data.amount) || 0;
      }
    });

    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) return;

    const groupData = groupSnap.data();
    const totalParticipants = groupData.participantCount || 1;
    const pendingCount = Math.max(0, totalParticipants - paidCount);

    const aggregate: AggregatePaymentSummary = {
      paidCount,
      totalCollected,
      pendingCount,
    };

    await updateDoc(groupRef, {
      aggregatePayments: aggregate,
      lastActivityAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to refresh aggregate payments:', err);
  }
}
