import React, { useState } from 'react';
import { 
  Users, 
  Share2, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  CreditCard, 
  PlusCircle, 
  Eye, 
  Lock, 
  Calendar, 
  Gift, 
  HeartHandshake,
  UserPlus,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Scale,
  Smile,
  AlertCircle
} from 'lucide-react';
import { GiftGroup, Participant, AlgorithmResult, GroupPhase } from '../types';
import { formatINR, formatDate } from '../utils/format';
import { PrivacyBanner } from './PrivacyBanner';
import { evaluateCustomAmount } from '../utils/algorithm';

interface GroupDashboardProps {
  group: GiftGroup;
  result: AlgorithmResult;
  onRevealRecommendation: () => void;
  onOpenBudgetForm: () => void;
  onOpenShare: () => void;
  onGoToPayments: () => void;
  onGoToResults: () => void;
  onGoToChooseGift: () => void;
  onGoToCelebration: () => void;
  onLockConsensusAmount: (amount: number) => void;
  onSetPhase: (phase: GroupPhase) => void;
  onAddSimulatedParticipant: (participant: {
    name: string;
    couldDo?: number;
    feelsRight?: number;
    wouldStretchTo?: number;
    minAmount: number;
    comfortableAmount: number;
    maxAmount: number;
  }) => void;
  onRemoveParticipant: (participantId: string) => void;
  isCreator: boolean;
}

export const GroupDashboard: React.FC<GroupDashboardProps> = ({
  group,
  result,
  onRevealRecommendation,
  onOpenBudgetForm,
  onOpenShare,
  onGoToPayments,
  onGoToResults,
  onGoToChooseGift,
  onGoToCelebration,
  onLockConsensusAmount,
  onSetPhase,
  onAddSimulatedParticipant,
  onRemoveParticipant,
  isCreator,
}) => {
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simName, setSimName] = useState('');
  const [simCouldDo, setSimCouldDo] = useState(1500);
  const [simFeelsRight, setSimFeelsRight] = useState(2000);
  const [simWouldStretch, setSimWouldStretch] = useState(3000);

  // What-if simulator in dashboard
  const [showSimulator, setShowSimulator] = useState(false);
  const [testAmount, setTestAmount] = useState(result.recommended.amount || 2000);

  const totalParticipants = group.participants.length;
  const targetExpected = group.expectedParticipants || Math.max(totalParticipants, 8);
  const responsesCount = group.responseCount ?? group.participants.filter(p => p.hasSubmitted).length;
  const progressPercent = Math.min(100, Math.round((responsesCount / targetExpected) * 100));
  const isComplete = responsesCount >= targetExpected && responsesCount > 0;

  const currentPhase: GroupPhase = group.phase || (group.status === 'completed' ? 4 : group.targetContribution ? 3 : group.isRevealed ? 2 : 1);

  const testSimEvaluation = evaluateCustomAmount(testAmount, group.participants);

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim()) return;
    onAddSimulatedParticipant({
      name: simName.trim(),
      couldDo: Number(simCouldDo),
      feelsRight: Number(simFeelsRight),
      wouldStretchTo: Number(simWouldStretch),
      minAmount: Number(simCouldDo),
      comfortableAmount: Number(simFeelsRight),
      maxAmount: Number(simWouldStretch),
    });
    setSimName('');
    setShowSimulateModal(false);
  };

  const getStrengthBadge = (strength: string) => {
    switch (strength?.toLowerCase()) {
      case 'strong':
        return { label: 'Strong Consensus', dot: 'bg-emerald-500', text: 'text-emerald-800' };
      case 'good':
        return { label: 'Good Consensus', dot: 'bg-teal-500', text: 'text-teal-800' };
      case 'mixed':
        return { label: 'Mixed Consensus', dot: 'bg-amber-500', text: 'text-amber-800' };
      default:
        return { label: 'Difficult Fit', dot: 'bg-orange-500', text: 'text-orange-800' };
    }
  };

  const strengthBadge = getStrengthBadge(result.consensusStrength || 'Good');

  // Format couple names with editorial serif
  const renderEditorialNames = (names: string) => {
    if (names.includes('&')) {
      const parts = names.split('&');
      return (
        <>
          {parts[0].trim()}
          <span className="font-sans not-italic text-2xl sm:text-3xl opacity-30 mx-1.5 font-normal">&</span>
          {parts.slice(1).join('&').trim()}
        </>
      );
    }
    return names;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* 4-Phase Organizer Progress Stepper */}
      <div 
        id="phase-stepper-container"
        className="bg-white rounded-full p-1.5 border border-[#EEE7E1] shadow-2xs flex items-center justify-between overflow-x-auto scrollbar-none"
      >
        <button
          onClick={() => onSetPhase(1)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            currentPhase === 1 
              ? 'bg-[#2D3339] text-white shadow-xs' 
              : 'text-[#8E8881] hover:text-[#2D3339]'
          }`}
        >
          <span className="font-mono text-[10px] opacity-70">01</span>
          <span>Decide</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-[#D5CECE] shrink-0" />

        <button
          onClick={() => {
            onSetPhase(2);
            onGoToChooseGift();
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            currentPhase === 2 
              ? 'bg-[#2D3339] text-white shadow-xs' 
              : 'text-[#8E8881] hover:text-[#2D3339]'
          }`}
        >
          <span className="font-mono text-[10px] opacity-70">02</span>
          <span>Choose Gift</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-[#D5CECE] shrink-0" />

        <button
          onClick={() => {
            onSetPhase(3);
            onGoToPayments();
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            currentPhase === 3 
              ? 'bg-[#2D3339] text-white shadow-xs' 
              : 'text-[#8E8881] hover:text-[#2D3339]'
          }`}
        >
          <span className="font-mono text-[10px] opacity-70">03</span>
          <span>Collect</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-[#D5CECE] shrink-0" />

        <button
          onClick={() => {
            onSetPhase(4);
            onGoToCelebration();
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            currentPhase === 4 
              ? 'bg-[#2D3339] text-white shadow-xs' 
              : 'text-[#8E8881] hover:text-[#2D3339]'
          }`}
        >
          <span className="font-mono text-[10px] opacity-70">04</span>
          <span>Done</span>
        </button>
      </div>

      {/* Group Header Card */}
      <div 
        id="group-header-card"
        className="bg-white rounded-[36px] sm:rounded-[40px] p-8 sm:p-10 shadow-xs border border-[#EEE7E1] space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8E8881] capitalize">
                {group.occasion || 'Wedding'} Gift Group
              </span>
              {(group.createdShareCode || group.slug) && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#F5F2ED] border border-[#E5E0DA] font-mono text-[10px] font-bold text-[#2D3339]">
                  Code: {group.createdShareCode || group.slug}
                </span>
              )}
              {group.contributionMode === 'flexible' && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium">
                  Give What Feels Right
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif leading-tight text-[#2D3339] italic">
              {renderEditorialNames(group.coupleNames || group.coupleName || '')}
            </h1>

            {group.giftDescription ? (
              <p className="text-[#6D6862] text-xs sm:text-sm leading-relaxed max-w-lg">
                {group.giftDescription}
              </p>
            ) : (
              <p className="text-[#6D6862] text-xs sm:text-sm leading-relaxed">
                A private group decision engine for choosing and buying the perfect gift together.
              </p>
            )}

            {group.deadlineDate && (
              <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full w-fit mt-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Responses close: {formatDate(group.deadlineDate)}</span>
              </div>
            )}
          </div>

          <button
            id="dashboard-share-btn"
            onClick={onOpenShare}
            className="self-start px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-medium tracking-wide flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-white" />
            <span>Invite via WhatsApp</span>
          </button>
        </div>

        {/* Phase 1: Decide - Progress & Responses Block */}
        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#E9E4DE] text-[#2D3339] flex items-center justify-center text-sm font-bold shrink-0 font-serif">
              {responsesCount}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#1A1A1A]">Private Comfort Responses</p>
                <span className="text-xs font-semibold text-[#8E8881]">{progressPercent}%</span>
              </div>
              <p className="text-xs text-[#8E8881] mt-0.5">
                {responsesCount} of {targetExpected} recorded. Individual amounts remain 100% confidential.
              </p>
            </div>
          </div>

          <div className="w-full bg-[#E9E4DE] h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#2D3339] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Sweet Spot Recommendation & Decision Card */}
        {group.isRevealed ? (
          <div className="p-6 rounded-[28px] bg-[#2D3339] text-white space-y-5 shadow-lg shadow-[#2D3339]/15">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5F2ED]/80">
                    Consensus Sweet Spot
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-stone-200">
                    <span className={`w-1.5 h-1.5 rounded-full ${strengthBadge.dot}`}></span>
                    <span>{strengthBadge.label}</span>
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-serif italic">
                  {formatINR(group.targetContribution || result.recommended.amount)}
                  <span className="font-sans not-italic text-xs font-normal text-stone-300 ml-1.5">/ person</span>
                </div>

                <p className="text-xs text-stone-300">
                  Total Group Gift: <strong>{formatINR((group.targetContribution || result.recommended.amount) * (group.participantCount || 8))}</strong> ({result.recommended.comfortableCount} of {responsesCount} fully comfortable)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onGoToResults}
                  className="px-4 py-2 rounded-full bg-white text-[#2D3339] hover:bg-[#F5F2ED] text-xs font-medium transition-colors cursor-pointer"
                >
                  View Details
                </button>

                <button
                  onClick={onGoToChooseGift}
                  className="px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Choose Gift →</span>
                </button>
              </div>
            </div>

            {/* Quick Simulation Slider */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3 h-3 text-stone-400" />
                  <span>"What If?" test: <strong>{formatINR(testAmount)}</strong></span>
                </span>
                <span className="text-stone-300 font-serif">
                  {testSimEvaluation.comfortableCount} comfortable, {testSimEvaluation.stretchingCount} stretching
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="250"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                className="w-full accent-white cursor-pointer"
              />
              {isCreator && testAmount !== (group.targetContribution || result.recommended.amount) && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => onLockConsensusAmount(testAmount)}
                    className="text-[11px] font-medium text-amber-300 hover:underline cursor-pointer"
                  >
                    Lock in {formatINR(testAmount)} as target & proceed
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-[28px] bg-[#F8F6F3] border border-[#EEE7E1] text-center space-y-4">
            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 bg-white border border-[#E5E0DA] rounded-full text-[10px] uppercase tracking-widest font-bold text-[#2D3339]">
                Sweet Spot Engine
              </span>
              <h3 className="text-xl font-medium text-[#2D3339]">
                Find the consensus contribution
              </h3>
              <p className="text-xs text-[#6D6862] max-w-md mx-auto leading-relaxed">
                GiftTogether computes the amount where the maximum number of friends are comfortable without stretching past their limits.
              </p>
            </div>

            <button
              id="reveal-recommendation-btn"
              onClick={onRevealRecommendation}
              className="bg-[#2D3339] hover:bg-[#1E2328] text-white px-8 py-3.5 rounded-full font-medium text-sm tracking-wide shadow-lg shadow-[#2D3339]/20 transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Reveal Group Sweet Spot</span>
            </button>
          </div>
        )}
      </div>

      {/* Participants List with Strict Privacy (NO public payment badges!) */}
      <div 
        id="participants-list-card"
        className="bg-white rounded-[36px] sm:rounded-[40px] p-6 sm:p-8 shadow-xs border border-[#EEE7E1] space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8E8881]">
              Friends in Group ({totalParticipants})
            </h3>
            <p className="text-xs text-[#6D6862]">
              Names and response status only. Financial numbers are 100% private.
            </p>
          </div>

          <button
            id="simulate-friend-btn"
            onClick={() => setShowSimulateModal(true)}
            className="text-xs font-medium text-[#2D3339] hover:bg-[#F5F2ED] border border-[#E5E0DA] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Simulate a friend to test budget consensus"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#8E8881]" />
            <span>+ Add Friend</span>
          </button>
        </div>

        {/* Privacy Banner */}
        <div className="p-3 bg-[#F8F6F3] rounded-2xl border border-[#EEE7E1] flex items-center gap-2.5 text-xs text-[#6D6862]">
          <Lock className="w-4 h-4 text-[#4CAF50] shrink-0" />
          <span>
            <strong>Zero Peer Pressure:</strong> Individual numbers are never visible to anyone in this list.
          </span>
        </div>

        {/* Participant List Items */}
        <div className="divide-y divide-[#EEE7E1]">
          {group.participants.map((p, index) => {
            const hasSubmitted = p.hasSubmitted || p.comfortableAmount !== undefined;
            return (
              <div 
                key={p.id || index} 
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E9E4DE] text-[#2D3339] flex items-center justify-center font-bold">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-[#1A1A1A] flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {p.isCreator && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-[#F5F2ED] text-[#8E8881] px-1.5 py-0.5 rounded-full">
                          Organizer
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8E8881] mt-0.5">
                      {hasSubmitted ? (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Response submitted privately</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-700">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Awaiting response</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {group.participants.length > 2 && !p.isCreator && (
                  <button
                    onClick={() => onRemoveParticipant(p.id)}
                    className="text-[#8E8881] hover:text-red-600 text-xs p-1.5 transition-colors cursor-pointer"
                    title="Remove participant"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Access: Submit or Update My Budget */}
      <div className="bg-[#F8F6F3] rounded-[28px] p-5 border border-[#EEE7E1] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
            Want to submit or adjust your budget?
          </h4>
          <p className="text-xs text-[#6D6862]">
            You can modify your range anytime to update the group's sweet spot.
          </p>
        </div>

        <button
          id="dashboard-open-budget-btn"
          onClick={onOpenBudgetForm}
          className="px-6 py-2.5 rounded-full bg-[#2D3339] hover:bg-black text-white text-xs font-medium tracking-wide transition-all shrink-0 cursor-pointer shadow-2xs"
        >
          Open Budget Form
        </button>
      </div>

      {/* Add Simulated Participant Modal (For Organizer Testing) */}
      {showSimulateModal && (
        <div 
          id="simulate-modal-backdrop"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowSimulateModal(false)}
        >
          <div 
            id="simulate-modal-container"
            className="bg-white rounded-[36px] max-w-sm w-full p-6 shadow-2xl border border-[#EEE7E1] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-serif text-[#2D3339] italic">
              Add Friend (Simulate Response)
            </h3>
            <form onSubmit={handleSimulateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1A1A1A]">Friend's Name</label>
                <input 
                  type="text" 
                  required 
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#E5E0DA] mt-1 text-sm text-[#1A1A1A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-[#8E8881]">Could Do</label>
                  <input 
                    type="number"
                    value={simCouldDo}
                    onChange={(e) => setSimCouldDo(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#F8F6F3] border border-[#E5E0DA] text-xs text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8E8881]">Feels Right</label>
                  <input 
                    type="number"
                    value={simFeelsRight}
                    onChange={(e) => setSimFeelsRight(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#F8F6F3] border border-[#E5E0DA] text-xs text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8E8881]">Stretch To</label>
                  <input 
                    type="number"
                    value={simWouldStretch}
                    onChange={(e) => setSimWouldStretch(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#F8F6F3] border border-[#E5E0DA] text-xs text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E0DA] text-[#2D3339]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#2D3339] text-white hover:bg-black"
                >
                  Add Friend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
