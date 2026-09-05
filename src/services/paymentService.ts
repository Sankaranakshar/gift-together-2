import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Participant, PaymentStatus } from '../types/participant';
import { updateParticipantPayment } from './participantService';

export interface PaymentSummary {
  agreedAmount: number;
  totalTarget: number;
  totalCollected: number;
  paidCount: number;
  pendingCount: number;
  totalParticipants: number;
  percentageCollected: number;
}

export function calculatePaymentSummary(
  participants: Participant[],
  agreedAmount: number
): PaymentSummary {
  const totalParticipants = participants.length;
  const paidCount = participants.filter(
    (p) => p.paymentStatus === 'paid' || p.hasPaid === true
  ).length;
  const pendingCount = Math.max(0, totalParticipants - paidCount);

  const totalTarget = agreedAmount * totalParticipants;
  const totalCollected = agreedAmount * paidCount;
  const percentageCollected =
    totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : 0;

  return {
    agreedAmount,
    totalTarget,
    totalCollected,
    paidCount,
    pendingCount,
    totalParticipants,
    percentageCollected,
  };
}

export async function setParticipantPaid(
  groupId: string,
  participantId: string,
  isPaid: boolean
): Promise<void> {
  await updateParticipantPayment(groupId, participantId, isPaid);
}

export interface GroupPaymentConfig {
  targetContribution?: number;
  upiId?: string;
  paymentNotes?: string;
}

export async function updateGroupPaymentConfig(
  groupId: string,
  config: GroupPaymentConfig
): Promise<void> {
  if (!db) return;
  const groupRef = doc(db, 'groups', groupId);
  const updateData: any = {
    lastActivityAt: new Date().toISOString(),
  };
  if (config.targetContribution !== undefined) {
    updateData.agreedAmount = config.targetContribution;
    updateData.targetContribution = config.targetContribution;
  }
  if (config.upiId !== undefined) {
    updateData.upiId = config.upiId;
  }
  if (config.paymentNotes !== undefined) {
    updateData.paymentNotes = config.paymentNotes;
  }
  await updateDoc(groupRef, updateData);
}
