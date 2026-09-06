import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, ensureAnonymousAuth } from './firebase';
import { GiftOption, GiftBrief } from '../types/group';

export interface CreateGiftOptionInput {
  title: string;
  category: string;
  estimatedPrice: number;
  description?: string;
  link?: string;
}

export async function createGiftOption(
  groupId: string,
  input: CreateGiftOptionInput
): Promise<GiftOption> {
  if (!db) throw new Error('Database is not initialized.');
  const user = auth?.currentUser || (await ensureAnonymousAuth());
  if (!user) throw new Error('You must be signed in to suggest a gift.');

  const giftOptionsRef = collection(db, 'groups', groupId, 'giftOptions');
  const newDocRef = doc(giftOptionsRef);
  const now = new Date().toISOString();

  const newOption: GiftOption = {
    id: newDocRef.id,
    title: input.title.trim(),
    category: input.category.trim() || 'General',
    estimatedPrice: Number(input.estimatedPrice) || 0,
    description: input.description?.trim() || '',
    link: input.link?.trim() || undefined,
    voteCount: 0,
    createdBy: user.uid,
    createdAt: now,
  };

  await setDoc(newDocRef, newOption);
  return newOption;
}

export function subscribeGiftOptions(
  groupId: string,
  callback: (options: GiftOption[]) => void
): Unsubscribe | null {
  if (!db) return null;
  const giftOptionsRef = collection(db, 'groups', groupId, 'giftOptions');

  return onSnapshot(
    giftOptionsRef,
    (snap) => {
      const list: GiftOption[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as GiftOption);
      });
      callback(list);
    },
    (err) => {
      console.warn('Error subscribing to gift options:', err);
      callback([]);
    }
  );
}

export async function castGiftVote(
  groupId: string,
  giftOptionId: string
): Promise<void> {
  if (!db) throw new Error('Database not initialized.');
  const user = auth?.currentUser || (await ensureAnonymousAuth());
  if (!user) throw new Error('Sign in to vote.');

  const voteRef = doc(db, 'groups', groupId, 'votes', user.uid);
  await setDoc(voteRef, {
    giftOptionId,
    votedAt: new Date().toISOString(),
  });
}

export function subscribeUserVote(
  groupId: string,
  callback: (giftOptionId: string | null) => void
): Unsubscribe | null {
  if (!db) return null;
  const user = auth?.currentUser;
  if (!user) {
    callback(null);
    return null;
  }

  const voteRef = doc(db, 'groups', groupId, 'votes', user.uid);
  return onSnapshot(
    voteRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data()?.giftOptionId || null);
      } else {
        callback(null);
      }
    },
    () => callback(null)
  );
}

export function subscribeAllVotes(
  groupId: string,
  callback: (voteCounts: Record<string, number>) => void
): Unsubscribe | null {
  if (!db) return null;
  const votesRef = collection(db, 'groups', groupId, 'votes');

  return onSnapshot(
    votesRef,
    (snap) => {
      const counts: Record<string, number> = {};
      snap.forEach((docSnap) => {
        const optionId = docSnap.data()?.giftOptionId;
        if (optionId) {
          counts[optionId] = (counts[optionId] || 0) + 1;
        }
      });
      callback(counts);
    },
    (err) => {
      console.warn('Error subscribing to votes:', err);
      callback({});
    }
  );
}

export async function selectWinningGift(
  groupId: string,
  giftOptionId: string
): Promise<void> {
  if (!db) return;
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    selectedGiftId: giftOptionId,
    phase: 3, // Advance to Collect phase
    lastActivityAt: new Date().toISOString(),
  });
}

export async function updateGiftBrief(
  groupId: string,
  brief: GiftBrief
): Promise<void> {
  if (!db) return;
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    giftBrief: brief,
    lastActivityAt: new Date().toISOString(),
  });
}

export async function fetchAIGiftSuggestions(params: {
  occasion: string;
  recipientNames: string;
  targetBudget: number;
  style?: string;
  notes?: string;
  giftAmbition?: string;
}): Promise<{ brief: GiftBrief; ideas: Omit<GiftOption, 'id' | 'voteCount' | 'createdBy'>[] }> {
  const response = await fetch('/api/gift-brief/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to generate gift recommendations.');
  }

  const data = await response.json();
  const rawIdeas = data.ideas || [];
  // Ensure strict curation: 3 to 5 options max, no overwhelming 20 options
  const ideas = rawIdeas.slice(0, 4);

  return {
    brief: data.brief,
    ideas,
  };
}
