export type PaymentStatus = 'pending' | 'paid';

export interface Participant {
  id: string;
  displayName: string;
  name: string; // convenient alias
  joinedAt: string;
  hasSubmitted: boolean;
  isCreator?: boolean;
  role?: 'creator' | 'member';

  // Legacy/transient fields for backward compatibility
  hasPaid?: boolean;
  paidAt?: string;
  paymentStatus?: PaymentStatus;

  // Demo/Transient local display values if simulating
  minAmount?: number;
  comfortableAmount?: number;
  maxAmount?: number;
  couldDo?: number;
  feelsRight?: number;
  wouldStretchTo?: number;
  submittedAt?: string;
}

export interface PaymentRecord {
  participantId: string;
  isVerified: boolean;
  amount: number;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface PaymentClaim {
  participantId: string;
  claimed: boolean;
  claimedAt: string;
  upiRef?: string;
  note?: string;
  status: 'pending_verification' | 'verified';
}
