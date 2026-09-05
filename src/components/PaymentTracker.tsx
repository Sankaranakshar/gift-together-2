import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Share2, 
  ArrowLeft, 
  Lock, 
  ShieldCheck, 
  Edit2, 
  Sparkles,
  Send,
  MessageSquare,
  QrCode,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { GiftGroup, Participant } from '../types';
import { formatINR } from '../utils/format';
import { 
  submitPaymentClaim, 
  subscribeMyPaymentClaim, 
  subscribeMyPaymentRecord,
  subscribeAllPaymentClaims, 
  subscribeAllPayments, 
  verifyParticipantPayment 
} from '../services/paymentClaimService';
import { PaymentClaim, PaymentRecord } from '../types/participant';

interface PaymentTrackerProps {
  group: GiftGroup;
  currentParticipant?: Participant | null;
  onUpdateGroupPaymentInfo: (info: { targetContribution?: number; upiId?: string; paymentNotes?: string }) => void;
  onBackToDashboard: () => void;
  onAdvanceToPhase4: () => void;
  isCreator: boolean;
}

export const PaymentTracker: React.FC<PaymentTrackerProps> = ({
  group,
  currentParticipant,
  onUpdateGroupPaymentInfo,
  onBackToDashboard,
  onAdvanceToPhase4,
  isCreator,
}) => {
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [customTarget, setCustomTarget] = useState<number>(group.targetContribution || 2000);
  const [upiInput, setUpiInput] = useState(group.upiId || '');
  const [notesInput, setNotesInput] = useState(group.paymentNotes || '');

  // Participant self-claim state
  const [myClaim, setMyClaim] = useState<PaymentClaim | null>(null);
  const [myRecord, setMyRecord] = useState<PaymentRecord | null>(null);
  const [claimUpiRef, setClaimUpiRef] = useState('');
  const [claimNote, setClaimNote] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Organizer private state
  const [allClaims, setAllClaims] = useState<Record<string, PaymentClaim>>({});
  const [allPayments, setAllPayments] = useState<Record<string, PaymentRecord>>({});

  // Subscriptions
  useEffect(() => {
    if (!group.id) return;
    const unsubClaim = subscribeMyPaymentClaim(group.id, setMyClaim);
    const unsubRecord = subscribeMyPaymentRecord(group.id, setMyRecord);
    return () => {
      if (unsubClaim) unsubClaim();
      if (unsubRecord) unsubRecord();
    };
  }, [group.id]);

  useEffect(() => {
    if (!group.id || !isCreator) return;
    const unsubAllClaims = subscribeAllPaymentClaims(group.id, setAllClaims);
    const unsubAllPayments = subscribeAllPayments(group.id, setAllPayments);
    return () => {
      if (unsubAllClaims) unsubAllClaims();
      if (unsubAllPayments) unsubAllPayments();
    };
  }, [group.id, isCreator]);

  const celebrant = group.coupleNames || group.coupleName || 'our friends';
  const perPerson = group.targetContribution || group.agreedAmount || group.recommendedAmount || 2000;
  const totalParticipants = group.participantCount || group.participants.length || 8;
  const totalTargetAmount = group.targetGiftAmount || (perPerson * totalParticipants);

  // Use aggregate payments from group document (public-safe)
  const paidCount = group.aggregatePayments?.paidCount || 0;
  const totalCollected = group.aggregatePayments?.totalCollected || (paidCount * perPerson);
  const progressPercent = totalTargetAmount > 0 
    ? Math.min(100, Math.round((totalCollected / totalTargetAmount) * 100))
    : 0;

  const handleCopyUPI = () => {
    if (!group.upiId) return;
    navigator.clipboard.writeText(group.upiId);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  const handleSavePaymentInfo = () => {
    onUpdateGroupPaymentInfo({
      targetContribution: Number(customTarget),
      upiId: upiInput.trim(),
      paymentNotes: notesInput.trim(),
    });
    setIsEditingInfo(false);
  };

  const handleSubmitMyClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group.id) return;
    setIsSubmittingClaim(true);
    try {
      await submitPaymentClaim(group.id, {
        upiRef: claimUpiRef.trim() || undefined,
        note: claimNote.trim() || undefined,
        amount: perPerson,
      });
      setIsSubmittingClaim(false);
    } catch (err) {
      console.warn('Error submitting claim:', err);
      setIsSubmittingClaim(false);
    }
  };

  const handleToggleVerify = async (participantId: string, currentVerified: boolean) => {
    if (!group.id || !isCreator) return;
    try {
      await verifyParticipantPayment(group.id, participantId, !currentVerified, perPerson);
    } catch (err) {
      console.warn('Error verifying payment:', err);
    }
  };

  const upiPayUrl = group.upiId 
    ? `upi://pay?pa=${encodeURIComponent(group.upiId)}&pn=GiftTogether&am=${perPerson}&cu=INR&tn=${encodeURIComponent(`${celebrant} Group Gift`)}`
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="text-xs font-medium text-[#8E8881] hover:text-[#2D3339] flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F2ED] text-[#2D3339] text-[10px] font-bold uppercase tracking-[0.2em] border border-[#E5E0DA]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]"></div>
          <span>Phase 03: Collect</span>
        </div>
      </div>

      {/* Aggregate Collection Card (Safe & Public) */}
      <div 
        id="payment-summary-card"
        className="bg-white rounded-[36px] sm:rounded-[40px] p-6 sm:p-10 shadow-xs border border-[#EEE7E1] space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
              Group Fund Progress
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#2D3339] italic">
              Collecting for {celebrant}
            </h2>
            <p className="text-xs text-[#6D6862]">
              Agreed contribution: <strong>{formatINR(perPerson)}</strong> per person
            </p>
          </div>

          {isCreator && (
            <button
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className="text-xs font-medium text-[#2D3339] hover:bg-[#F5F2ED] border border-[#E5E0DA] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer self-start"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#8E8881]" />
              <span>{isEditingInfo ? 'Cancel' : 'Edit Payment Details'}</span>
            </button>
          )}
        </div>

        {/* Edit Payment Info Form (Organizer Only) */}
        {isEditingInfo && isCreator && (
          <div className="p-4 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                  Target Per Person (₹)
                </label>
                <input
                  type="number"
                  value={customTarget}
                  onChange={(e) => setCustomTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E0DA] text-sm text-[#1A1A1A]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                  Your UPI ID (GPay, PhonePe, Paytm)
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@okhdfcbank"
                  value={upiInput}
                  onChange={(e) => setUpiInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E0DA] text-sm text-[#1A1A1A]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                Payment Notes / Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Please add your name in the transfer note"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E0DA] text-sm text-[#1A1A1A]"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={handleSavePaymentInfo}
                className="px-4 py-1.5 rounded-full bg-[#2D3339] text-white text-xs font-medium cursor-pointer hover:bg-black transition-colors"
              >
                Save Payment Settings
              </button>
            </div>
          </div>
        )}

        {/* Aggregate Progress Display */}
        <div className="p-5 rounded-[28px] bg-[#F8F6F3] border border-[#EEE7E1] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#2D3339]">
              Collected {formatINR(totalCollected)} of {formatINR(totalTargetAmount)}
            </span>
            <span className="font-mono text-[#8E8881] font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-[#E9E4DE] rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-[#2D3339] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-[#8E8881]">
            {paidCount} of {totalParticipants} contributions verified so far.
          </p>
        </div>

        {/* Organizer UPI Details */}
        {group.upiId ? (
          <div className="p-4 rounded-2xl bg-white border border-[#EEE7E1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-[#8E8881] text-[10px] uppercase font-bold tracking-wider">Pay via UPI</span>
              <div className="font-mono text-sm font-bold text-[#2D3339]">{group.upiId}</div>
              {group.paymentNotes && (
                <p className="text-[11px] text-[#6D6862]">{group.paymentNotes}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyUPI}
                className="px-3.5 py-1.5 rounded-full bg-[#F5F2ED] hover:bg-[#EAE5DE] text-[#2D3339] font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedUPI ? <Check className="w-3.5 h-3.5 text-[#4CAF50]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUPI ? 'Copied' : 'Copy UPI'}</span>
              </button>

              {upiPayUrl && (
                <a
                  href={upiPayUrl}
                  className="px-3.5 py-1.5 rounded-full bg-[#2D3339] hover:bg-black text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Pay Now</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1] text-xs text-[#6D6862]">
            {isCreator ? (
              <div className="flex items-center justify-between gap-2">
                <span>Add your UPI ID above so friends can transfer directly.</span>
                <button
                  onClick={() => setIsEditingInfo(true)}
                  className="underline font-medium text-[#2D3339] cursor-pointer"
                >
                  Add UPI Details
                </button>
              </div>
            ) : (
              <span>The organizer will add UPI payment instructions shortly.</span>
            )}
          </div>
        )}
      </div>

      {/* Participant's Private Self-Claim Status Card */}
      <div 
        id="participant-payment-status-card"
        className="bg-white rounded-[36px] p-6 sm:p-8 shadow-xs border border-[#EEE7E1] space-y-4"
      >
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
            Your Contribution Status
          </div>
          <h3 className="text-xl font-serif text-[#2D3339] italic">
            {myRecord?.isVerified ? 'Payment Verified ✓' : myClaim?.claimed ? 'Confirmation Submitted' : 'Pending Transfer'}
          </h3>
        </div>

        {myRecord?.isVerified ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Your payment of {formatINR(perPerson)} has been verified by the organizer!</span>
            </div>
            <p className="text-emerald-700 text-[11px]">
              Thank you for contributing to {celebrant}'s shared gift.
            </p>
          </div>
        ) : myClaim?.claimed ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>You marked your payment as sent.</span>
            </div>
            <p className="text-amber-700 text-[11px]">
              Awaiting confirmation from the organizer once the transfer reflects in their account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitMyClaim} className="space-y-3">
            <p className="text-xs text-[#6D6862]">
              Once you've sent <strong>{formatINR(perPerson)}</strong> via UPI/GPay, click below to let the organizer know:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="UPI Reference or UTR (Optional)"
                value={claimUpiRef}
                onChange={(e) => setClaimUpiRef(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#E5E0DA] text-xs text-[#1A1A1A]"
              />
              <input
                type="text"
                placeholder="Note (e.g. Sent from HDFC)"
                value={claimNote}
                onChange={(e) => setClaimNote(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#E5E0DA] text-xs text-[#1A1A1A]"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingClaim}
              className="w-full py-3 rounded-full bg-[#2D3339] hover:bg-black text-white text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingClaim ? 'Submitting...' : `I have transferred ${formatINR(perPerson)}`}</span>
            </button>
          </form>
        )}
      </div>

      {/* Organizer-Only Verification Hub */}
      {isCreator && (
        <div 
          id="organizer-verification-card"
          className="bg-white rounded-[36px] p-6 sm:p-8 shadow-xs border border-[#EEE7E1] space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#EEE7E1] pb-3">
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4CAF50]" />
                <span>Organizer Verification Hub</span>
              </div>
              <h3 className="text-lg font-serif text-[#2D3339] italic">
                Participant Payment Claims
              </h3>
            </div>
            <span className="text-xs text-[#8E8881]">
              Private to organizer
            </span>
          </div>

          <p className="text-xs text-[#6D6862]">
            Review claims submitted by friends. When a transfer reflects in your UPI account, tap verify to update the group's aggregate total.
          </p>

          <div className="divide-y divide-[#EEE7E1]">
            {group.participants.map((p) => {
              const claim = allClaims[p.id];
              const payment = allPayments[p.id];
              const isVerified = Boolean(payment?.isVerified);

              return (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#E9E4DE] text-[#2D3339] flex items-center justify-center font-bold">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-[#1A1A1A] flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.isCreator && (
                          <span className="text-[9px] uppercase tracking-wider bg-[#F5F2ED] text-[#8E8881] px-1.5 py-0.5 rounded-full font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8E8881] flex items-center gap-1">
                        {isVerified ? (
                          <span className="text-emerald-700 font-medium">✓ Verified</span>
                        ) : claim?.claimed ? (
                          <span className="text-amber-700">Claimed {claim.upiRef ? `(Ref: ${claim.upiRef})` : ''}</span>
                        ) : (
                          <span>Awaiting transfer</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleVerify(p.id, isVerified)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-[#F8F6F3] text-[#2D3339] hover:bg-[#EAE5DE] border border-[#E5E0DA]'
                    }`}
                  >
                    {isVerified ? 'Verified ✓' : 'Confirm Received'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Finalize Action */}
          <div className="pt-3 border-t border-[#EEE7E1] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#8E8881]">
              Ready to buy the gift and celebrate with the group?
            </p>
            <button
              onClick={onAdvanceToPhase4}
              className="px-6 py-2.5 rounded-full bg-[#2D3339] hover:bg-black text-white text-xs font-medium tracking-wide transition-colors cursor-pointer shadow-sm"
            >
              Complete Collection & View Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
