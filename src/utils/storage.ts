import { GiftGroup, Participant } from '../types';

const STORAGE_KEY_GROUPS = 'gifttogether_groups_v1';
const STORAGE_KEY_CURRENT_USER = 'gifttogether_user_id';
const STORAGE_KEY_ACTIVE_GROUP = 'gifttogether_active_group_id';

export const INITIAL_DEMO_GROUP: GiftGroup = {
  id: 'demo-rithika-arjun',
  slug: 'rithika-arjun',
  coupleName: 'Rithika & Arjun',
  coupleNames: 'Rithika & Arjun',
  occasion: 'wedding',
  weddingDate: '2026-11-28',
  deadlineDate: '2026-11-20',
  contributionMode: 'equal',
  creatorName: 'Hari (You)',
  createdBy: 'demo-creator-uid',
  createdShareCode: 'RITHIK',
  status: 'collecting',
  phase: 1,
  participantCount: 8,
  responseCount: 8,
  recommendationStatus: 'ready',
  giftDescription: 'Smeg Espresso Machine & honeymoon experience fund',
  expectedParticipants: 8,
  createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  isRevealed: false,
  targetContribution: 2000,
  targetGiftAmount: 16000,
  upiId: 'hari.sharma@okhdfcbank',
  paymentNotes: 'Google Pay or PhonePe to Hari by Nov 15th',
  aggregatePayments: {
    paidCount: 6,
    totalCollected: 12000,
    pendingCount: 2,
  },
  participants: [
    {
      id: 'p-1',
      name: 'Aarav',
      displayName: 'Aarav',
      joinedAt: new Date(Date.now() - 2.9 * 86400000).toISOString(),
      hasSubmitted: true,
      couldDo: 1000,
      feelsRight: 1500,
      wouldStretchTo: 2000,
      minAmount: 1000,
      comfortableAmount: 1500,
      maxAmount: 2000,
      submittedAt: new Date(Date.now() - 2.5 * 86400000).toISOString(),
      hasPaid: true,
      paidAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'p-2',
      name: 'Bhavna',
      displayName: 'Bhavna',
      joinedAt: new Date(Date.now() - 2.7 * 86400000).toISOString(),
      hasSubmitted: true,
      couldDo: 1500,
      feelsRight: 2000,
      wouldStretchTo: 2500,
      minAmount: 1500,
      comfortableAmount: 2000,
      maxAmount: 2500,
      submittedAt: new Date(Date.now() - 2.2 * 86400000).toISOString(),
      hasPaid: true,
      paidAt: new Date(Date.now() - 0.8 * 86400000).toISOString(),
    },
    {
      id: 'p-3',
      name: 'Chetan',
      displayName: 'Chetan',
      joinedAt: new Date(Date.now() - 2.5 * 86400000).toISOString(),
      hasSubmitted: true,
      couldDo: 2000,
      feelsRight: 2500,
      wouldStretchTo: 3000,
      minAmount: 2000,
      comfortableAmount: 2500,
      maxAmount: 3000,
      submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      hasPaid: false,
    },
    {
      id: 'p-4',
      name: 'Divya',
      displayName: 'Divya',
      joinedAt: new Date(Date.now() - 2.3 * 86400000).toISOString(),
      hasSubmitted: true,
      couldDo: 1000,
      feelsRight: 2000,
      wouldStretchTo: 3000,
      minAmount: 1000,
      comfortableAmount: 2000,
      maxAmount: 3000,
      submittedAt: new Date(Date.now() - 1.8 * 86400000).toISOString(),
      hasPaid: true,
      paidAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
    },
    {
      id: 'p-5',
      name: 'Eshaan',
      displayName: 'Eshaan',
      joinedAt: new Date(Date.now() - 2.0 * 86400000).toISOString(),
      hasSubmitted: true,
      couldDo: 2000,
      feelsRight: 2500,
      wouldStretchTo: 3500,
      minAmount: 2000,
      comfortableAmount: 2500,
      maxAmount: 3500,
      submittedAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
      hasPaid: false,
    },
    {
      id: 'p-6',
      name: 'Farhan',
      displayName: 'Farhan',
      joinedAt: new Date(Date.now() - 1.8 * 86400000).toISOString(),
      hasSubmitted: true,
      couldDo: 1500,
      feelsRight: 2000,
      wouldStretchTo: 2500,
      minAmount: 1500,
      comfortableAmount: 2000,
      maxAmount: 2500,
      submittedAt: new Date(Date.now() - 1.2 * 86400000).toISOString(),
      hasPaid: true,
      paidAt: new Date(Date.now() - 0.2 * 86400000).toISOString(),
    },
    {
      id: 'p-7',
      name: 'Gauri',
      displayName: 'Gauri',
      joinedAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
      hasSubmitted: true,
      couldDo: 1500,
      feelsRight: 2000,
      wouldStretchTo: 2500,
      minAmount: 1500,
      comfortableAmount: 2000,
      maxAmount: 2500,
      submittedAt: new Date(Date.now() - 0.9 * 86400000).toISOString(),
      hasPaid: true,
      paidAt: new Date(Date.now() - 0.1 * 86400000).toISOString(),
    },
    {
      id: 'p-8',
      name: 'Hari (You)',
      displayName: 'Hari (You)',
      isCreator: true,
      joinedAt: new Date(Date.now() - 3.0 * 86400000).toISOString(),
      hasSubmitted: true,
      couldDo: 1500,
      feelsRight: 2000,
      wouldStretchTo: 3000,
      minAmount: 1500,
      comfortableAmount: 2000,
      maxAmount: 3000,
      submittedAt: new Date(Date.now() - 2.8 * 86400000).toISOString(),
      hasPaid: true,
      paidAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
    },
  ],
};

export function getStoredGroups(): GiftGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GROUPS);
    if (!raw) {
      const initial = [INITIAL_DEMO_GROUP];
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const initial = [INITIAL_DEMO_GROUP];
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(initial));
    return initial;
  } catch (e) {
    console.error('Error reading stored groups:', e);
    return [INITIAL_DEMO_GROUP];
  }
}

export function saveGroups(groups: GiftGroup[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
  } catch (e) {
    console.error('Error saving groups:', e);
  }
}

export function saveGroup(group: GiftGroup): void {
  const groups = getStoredGroups();
  const index = groups.findIndex((g) => g.id === group.id);
  if (index >= 0) {
    groups[index] = group;
  } else {
    groups.unshift(group);
  }
  saveGroups(groups);
}

export function getStoredGroup(id: string): GiftGroup | null {
  const groups = getStoredGroups();
  return groups.find((g) => g.id === id) || null;
}

export function resetToDemoData(): GiftGroup {
  localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify([INITIAL_DEMO_GROUP]));
  localStorage.setItem(STORAGE_KEY_ACTIVE_GROUP, INITIAL_DEMO_GROUP.id);
  return INITIAL_DEMO_GROUP;
}

export function getActiveGroupId(): string | null {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_GROUP);
}

export function setActiveGroupId(id: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE_GROUP, id);
}
