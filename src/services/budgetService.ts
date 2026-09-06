import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  Unsubscribe,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth, getCurrentUserId } from './firebase';
import { ParticipantBudget, PriorityPreference, GiftAmbition } from '../types/budget';
import { ProposalVoteOption, ProposalSummary } from '../types/group';
import { getParticipantSession } from './participantService';

export interface BudgetSubmissionInput {
  displayName?: string;
  couldDo?: number;
  feelsRight?: number;
  wouldStretchTo?: number;
  priorityPreference?: PriorityPreference;
  giftAmbition?: GiftAmbition;
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
): Promise<any> {
  if (!db) {
    throw new Error('Database is not initialized.');
  }

  const error = validateBudget(input);
  if (error) {
    throw new Error(error);
  }

  const currentSession = getParticipantSession(groupId);
  const userId = auth?.currentUser?.uid || currentSession?.participantId || getCurrentUserId();

  const couldDo = Math.round(input.couldDo ?? input.minAmount ?? 1500);
  const feelsRight = Math.round(input.feelsRight ?? input.comfortableAmount ?? 2000);
  const wouldStretchTo = Math.round(input.wouldStretchTo ?? input.maxAmount ?? 3000);
  const priorityPreference = input.priorityPreference || 'balanced';
  const giftAmbition = input.giftAmbition || 'make_it_special';
  const now = new Date().toISOString();

  const groupRef = doc(db, 'groups', groupId);
  const budgetRef = doc(db, 'groups', groupId, 'budgets', userId);
  const participantRef = doc(db, 'groups', groupId, 'participants', userId);

  // 1. Save participant's private budget in isolated subcollection
  const existingBudgetSnap = await getDoc(budgetRef);
  const hasPreviousBudget = existingBudgetSnap.exists();
  const prevBudget = hasPreviousBudget ? (existingBudgetSnap.data() as ParticipantBudget) : null;

  const budgetDocData: ParticipantBudget = {
    couldDo,
    feelsRight,
    wouldStretchTo,
    priorityPreference,
    giftAmbition,
    submittedAt: prevBudget?.submittedAt || now,
    updatedAt: now,
    minAmount: couldDo,
    comfortableAmount: feelsRight,
    maxAmount: wouldStretchTo,
  };
  await setDoc(budgetRef, budgetDocData);

  // 2. Update participant's public-safe document (name + response flag ONLY, NO financial numbers)
  await setDoc(participantRef, {
    id: userId,
    displayName: input.displayName?.trim() || 'Friend',
    hasSubmitted: true,
    joinedAt: now,
  }, { merge: true });

  // 3. Delegate calculation to Server-Side recommendation engine
  let serverResult: any = null;
  try {
    const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/submit-budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: userId,
        displayName: input.displayName?.trim() || 'Friend',
        couldDo,
        feelsRight,
        wouldStretchTo,
        priorityPreference,
        giftAmbition,
        recoveryToken: currentSession?.recoveryToken,
      }),
    });

    if (res.ok) {
      serverResult = await res.json();
    }
  } catch (err) {
    console.warn('Server budget submission failed, continuing with client fallback:', err);
  }

  // 4. If caller is creator or group allows, sync authoritative aggregate to group document
  try {
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists() && serverResult?.recommendation) {
      const groupData = groupSnap.data();
      const isCreator = groupData.createdBy === userId;

      if (isCreator) {
        const responseCount = serverResult.responseCount || (groupData.responseCount || 0) + 1;
        const participantCount = groupData.participantCount || 1;
        const isAllSubmitted = responseCount >= participantCount;

        let recommendationStatus = groupData.recommendationStatus || 'pending';
        let groupStatus = groupData.status || 'collecting';
        if (isAllSubmitted) {
          if (recommendationStatus === 'pending') recommendationStatus = 'ready';
          if (groupStatus === 'collecting') groupStatus = 'ready';
        }

        await updateDoc(groupRef, {
          responseCount,
          recommendedAmount: serverResult.recommendation.amount,
          recommendation: serverResult.recommendation,
          totalBudget: serverResult.recommendation.totalGroupGift,
          comfortableCount: serverResult.recommendation.comfortableCount,
          stretchingCount: serverResult.recommendation.stretchingCount,
          conservativeAmount: serverResult.conservative?.amount || null,
          generousAmount: serverResult.generous?.amount || null,
          consensusStrength: serverResult.recommendation.consensusStrength || 'Good',
          explanation: serverResult.recommendation.explanation,
          giftAmbition,
          recommendationStatus,
          status: groupStatus,
          lastActivityAt: now,
        });
      }
    }
  } catch (err) {
    console.warn('Could not sync group aggregates from creator:', err);
  }

  // Local storage draft backup
  try {
    localStorage.setItem(
      `gifttogether_budget_draft_${groupId}`,
      JSON.stringify({ couldDo, feelsRight, wouldStretchTo, priorityPreference, giftAmbition })
    );
  } catch {
    // ignore
  }

  return serverResult;
}

export async function getPrivateBudget(groupId: string): Promise<ParticipantBudget | null> {
  if (!db) return null;
  const currentSession = getParticipantSession(groupId);
  const userId = auth?.currentUser?.uid || currentSession?.participantId || getCurrentUserId();
  if (!userId) return null;

  try {
    const budgetRef = doc(db, 'groups', groupId, 'budgets', userId);
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

  const currentSession = getParticipantSession(groupId);
  const userId = auth?.currentUser?.uid || currentSession?.participantId || getCurrentUserId();
  if (!userId) {
    callback(null);
    return null;
  }

  const budgetRef = doc(db, 'groups', groupId, 'budgets', userId);
  return onSnapshot(
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
}

// -------------------------------------------------------------
// Proposal Voting Services (Decide Phase Consensus Confirmation)
// -------------------------------------------------------------

export async function submitProposalVote(
  groupId: string,
  vote: ProposalVoteOption,
  participantName?: string
): Promise<void> {
  const currentSession = getParticipantSession(groupId);
  const userId = auth?.currentUser?.uid || currentSession?.participantId || getCurrentUserId();
  if (!userId) return;

  const now = new Date().toISOString();

  // 1. Submit to server API
  try {
    await fetch(`/api/groups/${encodeURIComponent(groupId)}/vote-proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: userId,
        vote,
        participantName: participantName || currentSession?.displayName || 'Friend',
      }),
    });
  } catch {
    // Continue to Firestore
  }

  // 2. Save in Firestore subcollection for real-time listener
  if (db) {
    try {
      const voteRef = doc(db, 'groups', groupId, 'proposalVotes', userId);
      await setDoc(voteRef, {
        vote,
        votedAt: now,
        participantName: participantName || currentSession?.displayName || 'Friend',
      });
    } catch (err) {
      console.warn('Error saving proposal vote in Firestore:', err);
    }
  }
}

export function subscribeProposalVotes(
  groupId: string,
  callback: (summary: ProposalSummary, myVote: ProposalVoteOption | null) => void
): Unsubscribe | null {
  if (!db) return null;

  const currentSession = getParticipantSession(groupId);
  const currentUid = auth?.currentUser?.uid || currentSession?.participantId || getCurrentUserId();

  const votesCol = collection(db, 'groups', groupId, 'proposalVotes');
  return onSnapshot(
    votesCol,
    (snap) => {
      let myVote: ProposalVoteOption | null = null;
      let agreeCount = 0;
      let preferLowerCount = 0;
      let preferHigherCount = 0;

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const vote = data.vote as ProposalVoteOption;
        if (docSnap.id === currentUid) {
          myVote = vote;
        }
        if (vote === 'agree') agreeCount++;
        else if (vote === 'prefer_lower') preferLowerCount++;
        else if (vote === 'prefer_higher') preferHigherCount++;
      });

      const totalVotes = snap.size;
      const agreementRate = totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 100) : 0;

      callback(
        {
          totalVotes,
          agreeCount,
          preferLowerCount,
          preferHigherCount,
          agreementRate,
        },
        myVote
      );
    },
    (err) => {
      console.warn('Proposal votes snapshot error:', err);
    }
  );
}
