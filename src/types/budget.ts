export type PriorityPreference = 'easy' | 'balanced' | 'big';

export interface ParticipantBudget {
  couldDo: number;          // "Could do" (baseline)
  feelsRight: number;       // "Feels right" (primary comfort)
  wouldStretchTo: number;   // "Would stretch to" (ceiling)
  priorityPreference?: PriorityPreference; // "Keep it easy" | "Balanced" | "Go big"
  submittedAt: string;
  updatedAt?: string;
  
  // Legacy aliases
  minAmount?: number;
  comfortableAmount?: number;
  maxAmount?: number;
}

