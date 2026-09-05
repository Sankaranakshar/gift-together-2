import {
  doc,
  getDoc,
  getDocs,
  collection,
  runTransaction,
  onSnapshot,
  Unsubscribe,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth, ensureAnonymousAuth, signInWithGoogle } from './firebase';
import { ParticipantBudget, PriorityPreference } from '../types/budget';
import { calculateContributionRecommendation, extractBudgetData } from '../utils/algorithm';
import { Participant } from '../types/participant';

export interface BudgetSubmissionInput {
  displayName?: string;
  couldDo?: number;
  feelsRight?: number;
  wouldStretchTo?: number;
  priorityPreference?: PriorityPreference;
  // Legacy aliases
  minAmount?: number;
  comfortableAmount?: number;
  maxAmount?: number;
}

export function validateBudget(input: BudgetSubmissionInput): string | null {
  const couldDo = input.couldDo ?? input.minAmount ?? 0;
  const feelsRight = input.feelsRight ?? input.comfortableAmount ?? 0;
  const wouldStretchTo = input.wouldStretchTo ?? input.maxAmount ?? 0;

  if (isNaN(couldDo) || isNaN(feelsRight) || isNaN(wouldStretchTo)) {
    return 'Please enter valid numerical amounts.';
  }

  if (couldDo < 0 || feelsRight < 0 || wouldStretchTo < 0) {
    return 'Amounts cannot be negative.';
  }

  if (feelsRight < couldDo) {
    return 'Your "Feels Right" contribution must be at least equal to your "Could Do" amount.';
  }

  if (wouldStretchTo < feelsRight) {
    return 'Your "Would Stretch To" ceiling must be at least equal to your "Feels Right" amount.';
  }

  if (wouldStretchTo > 1000000) {
    return 'Please enter a reasonable gift limit (under ₹10,00,000).';
  }

  return null;
}

export async function submitBudget(
  groupId: string,
  input: BudgetSubmissionInput
): Promise<void> {
  if (!db) {
    throw new Error('Database is not initialized.');
  }

  const error = validateBudget(input);
  if (error) {
    throw new Error(error);
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
    throw new Error('Please sign in with Google to submit your budget securely.');
  }

  const couldDo = Math.round(input.couldDo ?? input.minAmount ?? 1500);
  const feelsRight = Math.round(input.feelsRight ?? input.comfortableAmount ?? 2000);
  const wouldStretchTo = Math.round(input.wouldStretchTo ?? input.maxAmount ?? 3000);
  const priorityPreference = input.priorityPreference || 'balanced';
  const now = new Date().toISOString();

  const groupRef = doc(db, 'groups', groupId);
  const budgetRef = doc(db, 'groups', groupId, 'budgets', user.uid);
  const participantRef = doc(db, 'groups', groupId, 'participants', user.uid);

  // 1. Save participant's private budget in isolated subcollection
  const existingBudgetSnap = await getDoc(budgetRef);
  const hasPreviousBudget = existingBudgetSnap.exists();
  const prevBudget = hasPreviousBudget ? (existingBudgetSnap.data() as ParticipantBudget) : null;

  const budgetDocData: ParticipantBudget = {
    couldDo,
    feelsRight,
    wouldStretchTo,
    priorityPreference,
    submittedAt: prevBudget?.submittedAt || now,
    updatedAt: now,
    // Legacy support
    minAmount: couldDo,
    comfortableAmount: feelsRight,
    maxAmount: wouldStretchTo,
  };
  await setDoc(budgetRef, budgetDocData);

  // 2. Update participant's public-safe document (name + response flag ONLY, NO payment status)
  await setDoc(participantRef, {
    id: user.uid,
    displayName: input.displayName?.trim() || 'Friend',
    hasSubmitted: true,
    joinedAt: now,
  }, { merge: true });

  // 3. Compute sanitized aggregate recommendation
  // Read all submitted budgets in the subcollection
  try {
    const budgetsCollectionRef = collection(db, 'groups', groupId, 'budgets');
    const budgetsSnap = await getDocs(budgetsCollectionRef);
    
    const budgetList: Participant[] = [];
    budgetsSnap.forEach((bDoc) => {
      const bData = bDoc.data() as ParticipantBudget;
      budgetList.push({
        id: bDoc.id,
        displayName: 'Friend',
        name: 'Friend',
        joinedAt: bData.submittedAt,
        hasSubmitted: true,
        couldDo: bData.couldDo,
        feelsRight: bData.feelsRight,
        wouldStretchTo: bData.wouldStretchTo,
        // Legacy
        comfortableAmount: bData.feelsRight,
        minAmount: bData.couldDo,
        maxAmount: bData.wouldStretchTo,
      });
    });

    // Make sure the current user's newly written budget is in the list
    if (!budgetList.some(b => b.id === user.uid)) {
      budgetList.push({
        id: user.uid,
        displayName: input.displayName?.trim() || 'Friend',
        name: input.displayName?.trim() || 'Friend',
        joinedAt: now,
        hasSubmitted: true,
        couldDo,
        feelsRight,
        wouldStretchTo,
        comfortableAmount: feelsRight,
        minAmount: couldDo,
        maxAmount: wouldStretchTo,
      });
    }

    const algoResult = calculateContributionRecommendation(budgetList);
    const responseCount = budgetList.length;

    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) {
      const groupData = groupSnap.data();
      const participantCount = groupData.participantCount || 1;
      const isAllSubmitted = responseCount >= participantCount;

      let recommendationStatus = groupData.recommendationStatus || 'pending';
      let groupStatus = groupData.status || 'collecting';
      if (isAllSubmitted) {
        if (recommendationStatus === 'pending') recommendationStatus = 'ready';
        if (groupStatus === 'collecting') groupStatus = 'ready';
      }

      // 4. Update the group document with SANITIZED aggregate stats only (Zero private values)
      await updateDoc(groupRef, {
        responseCount,
        recommendedAmount: algoResult.recommended.amount,
        recommendation: {
          amount: algoResult.recommended.amount,
          totalGroupGift: algoResult.recommended.totalBudget,
          comfortableCount: algoResult.recommended.comfortableCount,
          stretchingCount: algoResult.recommended.stretchingCount,
          overMaxCount: algoResult.recommended.overMaxCount,
          totalResponded: algoResult.totalResponded,
          consensusStrength: algoResult.consensusStrength || 'Good',
          consensusSummary: algoResult.consensusSummary || '',
          explanation: algoResult.explanation,
          tiers: algoResult.sweetSpotTiers,
        },
        totalBudget: algoResult.recommended.totalBudget,
        comfortableCount: algoResult.recommended.comfortableCount,
        stretchingCount: algoResult.recommended.stretchingCount,
        conservativeAmount: algoResult.conservative?.amount || null,
        generousAmount: algoResult.generous?.amount || null,
        consensusStrength: algoResult.consensusStrength || 'Good',
        explanation: algoResult.explanation,
        recommendationStatus,
        status: groupStatus,
        lastActivityAt: now,
      });
    }
  } catch (err) {
    console.warn('Error updating aggregate recommendation:', err);
  }

  // Local storage draft backup
  try {
    localStorage.setItem(
      `gifttogether_budget_draft_${groupId}`,
      JSON.stringify({ couldDo, feelsRight, wouldStretchTo, priorityPreference })
    );
  } catch {
    // ignore
  }
}

export async function getPrivateBudget(groupId: string): Promise<ParticipantBudget | null> {
  if (!db) return null;
  const user = auth?.currentUser || (await ensureAnonymousAuth());
  if (!user) return null;

  try {
    const budgetRef = doc(db, 'groups', groupId, 'budgets', user.uid);
    const snap = await getDoc(budgetRef);
    if (!snap.exists()) return null;
    return snap.data() as ParticipantBudget;
  } catch (err) {
    console.warn('Could not read private budget:', err);
    return null;
  }
}

export function subscribePrivateBudget(
  groupId: string,
  callback: (budget: ParticipantBudget | null) => void
): Unsubscribe | null {
  if (!db) return null;

  let unsubscribeSnap: Unsubscribe | null = null;

  const handleUser = (user: any) => {
    if (!user || !db) {
      callback(null);
      return;
    }
    const budgetRef = doc(db, 'groups', groupId, 'budgets', user.uid);
    unsubscribeSnap = onSnapshot(
      budgetRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as ParticipantBudget);
        } else {
          callback(null);
        }
      },
      () => {
        callback(null);
      }
    );
  };

  if (auth?.currentUser) {
    handleUser(auth.currentUser);
  } else {
    ensureAnonymousAuth().then(handleUser);
  }

  return () => {
    if (unsubscribeSnap) unsubscribeSnap();
  };
}
