export type PriorityPreference = 'easy' | 'balanced' | 'big';

export type GiftAmbition = 'keep_it_simple' | 'make_it_special' | 'go_all_out';

export interface ParticipantBudget {
  couldDo: number;          // "Could do" (baseline)
  feelsRight: number;       // "Feels right" (primary comfort)
  wouldStretchTo: number;   // "Would stretch to" (ceiling)
  priorityPreference?: PriorityPreference; // "Keep it easy" | "Balanced" | "Go big"
  giftAmbition?: GiftAmbition; // "Keep it simple" | "Make it special" | "Go all out"
  submittedAt: string;
  updatedAt?: string;
  
  // Legacy aliases
  minAmount?: number;
  comfortableAmount?: number;
  maxAmount?: number;
}

