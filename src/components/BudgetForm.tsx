import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  HeartHandshake, 
  LogIn, 
  Lock, 
  Sparkles,
  Smile,
  Scale,
  Rocket
} from 'lucide-react';
import { GiftGroup, Participant } from '../types';
import { PriorityPreference, GiftAmbition } from '../types/budget';
import { formatINR } from '../utils/format';
import { PrivacyBanner } from './PrivacyBanner';

interface BudgetFormProps {
  group: GiftGroup;
  currentParticipant?: Participant | null;
  currentUser?: any;
  onSignIn?: () => Promise<any>;
  onSave: (participantData: {
    name: string;
    couldDo: number;
    feelsRight: number;
    wouldStretchTo: number;
    priorityPreference: PriorityPreference;
    giftAmbition?: GiftAmbition;
    // Legacy support
    minAmount?: number;
    comfortableAmount?: number;
    maxAmount?: number;
  }) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  group,
  currentParticipant,
  currentUser,
  onSignIn,
  onSave,
  onCancel,
  isSubmitting = false,
}) => {
  const [name, setName] = useState(
    currentParticipant?.displayName || currentParticipant?.name || currentUser?.displayName || ''
  );
  const [couldDo, setCouldDo] = useState<number>(
    currentParticipant?.couldDo ?? currentParticipant?.minAmount ?? 1500
  );
  const [feelsRight, setFeelsRight] = useState<number>(
    currentParticipant?.feelsRight ?? currentParticipant?.comfortableAmount ?? 2000
  );
  const [wouldStretchTo, setWouldStretchTo] = useState<number>(
    currentParticipant?.wouldStretchTo ?? currentParticipant?.maxAmount ?? 3000
  );
  const [priorityPreference, setPriorityPreference] = useState<PriorityPreference>('balanced');
  const [giftAmbition, setGiftAmbition] = useState<GiftAmbition>(
    (currentParticipant as any)?.giftAmbition || (group.giftAmbition as GiftAmbition) || 'make_it_special'
  );
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  useEffect(() => {
    if (!name && currentUser?.displayName) {
      setName(currentUser.displayName);
    }
  }, [currentUser]);

  const validate = (): boolean => {
    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return false;
    }
    if (couldDo < 0 || feelsRight < 0 || wouldStretchTo < 0) {
      setErrorMsg('Amounts cannot be negative.');
      return false;
    }
    if (couldDo > feelsRight) {
      setErrorMsg('"Could Do" baseline cannot exceed your "Feels Right" amount.');
      return false;
    }
    if (feelsRight > wouldStretchTo) {
      setErrorMsg('"Feels Right" amount cannot exceed your "Would Stretch To" ceiling.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLocalSubmitting(true);
    setErrorMsg(null);
    try {
      await onSave({
        name: name.trim(),
        couldDo: Number(couldDo),
        feelsRight: Number(feelsRight),
        wouldStretchTo: Number(wouldStretchTo),
        priorityPreference,
        giftAmbition,
        minAmount: Number(couldDo),
        comfortableAmount: Number(feelsRight),
        maxAmount: Number(wouldStretchTo),
      });
      setLocalSubmitting(false);
    } catch (err: any) {
      setLocalSubmitting(false);
      setErrorMsg(err.message || 'Failed to submit budget. Please try again.');
    }
  };

  const isBusy = isSubmitting || localSubmitting;
  const celebrantName = group.coupleNames || group.coupleName || 'the group gift';

  // Preset adjustments
  const adjustFeelsRight = (delta: number) => {
    const next = Math.max(0, feelsRight + delta);
    setFeelsRight(next);
    if (couldDo > next) setCouldDo(next);
    if (wouldStretchTo < next) setWouldStretchTo(next + Math.round(delta * 0.5));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F5F2ED] text-[#2D3339] text-[10px] font-bold tracking-[0.2em] uppercase border border-[#E5E0DA]">
          <Lock className="w-3 h-3 text-[#4CAF50]" />
          <span>Strictly Confidential</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-[#2D3339] italic">
          What feels right for you?
        </h1>
        <p className="text-xs sm:text-sm text-[#6D6862] max-w-md mx-auto">
          For <strong>{celebrantName}</strong>. Nobody in the group sees your numbers — we calculate the group sweet spot where everyone feels comfortable.
        </p>
      </div>

      <div 
        id="budget-form-card"
        className="bg-white rounded-[36px] sm:rounded-[40px] p-6 sm:p-10 shadow-xs border border-[#EEE7E1] space-y-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Participant Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A] flex items-center justify-between">
              <span>Your Name</span>
              <span className="text-[10px] font-normal text-[#8E8881]">Visible to friends</span>
            </label>
            <input
              id="budget-participant-name-input"
              type="text"
              required
              disabled={isBusy}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya, Arjun, Sneha"
              className="w-full px-4 py-3 rounded-2xl bg-[#F8F6F3] border border-[#E5E0DA] text-[#1A1A1A] text-sm focus:outline-none focus:border-[#2D3339] transition-all disabled:opacity-60"
            />
          </div>

          {/* Core Psychological Framing: 3 Numbers */}
          <div className="space-y-4 pt-2 border-t border-[#EEE7E1]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#1A1A1A]">
                Your Contribution Range
              </h3>
              <p className="text-xs text-[#8E8881] mt-0.5">
                Set a range that respects your financial comfort while giving the group flexibility.
              </p>
            </div>

            {/* 1. Baseline: Could Do */}
            <div className="p-4 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#2D3339] flex items-center gap-1.5">
                    <span>Could do</span>
                    <span className="text-[10px] font-normal text-[#8E8881]">(Baseline)</span>
                  </span>
                  <p className="text-[11px] text-[#8E8881]">An easy amount you wouldn't think twice about.</p>
                </div>
                <div className="text-base font-serif text-[#2D3339] font-bold">
                  {formatINR(couldDo)}
                </div>
              </div>
              <input
                id="budget-could-do-input"
                type="range"
                min="500"
                max="10000"
                step="250"
                disabled={isBusy}
                value={couldDo}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCouldDo(val);
                  if (val > feelsRight) setFeelsRight(val);
                  if (val > wouldStretchTo) setWouldStretchTo(val);
                }}
                className="w-full accent-[#2D3339] cursor-pointer"
              />
            </div>

            {/* 2. Primary: Feels Right */}
            <div className="p-4 rounded-2xl bg-[#2D3339] text-white border border-[#2D3339] space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Feels right</span>
                    <span className="text-[10px] font-normal text-stone-300">(Sweet Spot)</span>
                  </span>
                  <p className="text-[11px] text-stone-300">Your ideal, comfortable gift contribution.</p>
                </div>
                <div className="text-xl font-serif text-white font-bold">
                  {formatINR(feelsRight)}
                </div>
              </div>
              <input
                id="budget-feels-right-input"
                type="range"
                min="500"
                max="15000"
                step="250"
                disabled={isBusy}
                value={feelsRight}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFeelsRight(val);
                  if (val < couldDo) setCouldDo(val);
                  if (val > wouldStretchTo) setWouldStretchTo(val);
                }}
                className="w-full accent-white cursor-pointer"
              />

              {/* Quick Stepper Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => adjustFeelsRight(-500)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] text-white transition-colors cursor-pointer"
                >
                  -₹500
                </button>
                <button
                  type="button"
                  onClick={() => adjustFeelsRight(500)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] text-white transition-colors cursor-pointer"
                >
                  +₹500
                </button>
                <button
                  type="button"
                  onClick={() => adjustFeelsRight(1000)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] text-white transition-colors cursor-pointer"
                >
                  +₹1,000
                </button>
              </div>
            </div>

            {/* 3. Ceiling: Would Stretch To */}
            <div className="p-4 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#2D3339] flex items-center gap-1.5">
                    <span>Would stretch to</span>
                    <span className="text-[10px] font-normal text-[#8E8881]">(Ceiling)</span>
                  </span>
                  <p className="text-[11px] text-[#8E8881]">The maximum you'd feel good contributing if the group picks something special.</p>
                </div>
                <div className="text-base font-serif text-[#2D3339] font-bold">
                  {formatINR(wouldStretchTo)}
                </div>
              </div>
              <input
                id="budget-would-stretch-input"
                type="range"
                min="500"
                max="25000"
                step="500"
                disabled={isBusy}
                value={wouldStretchTo}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setWouldStretchTo(val);
                  if (val < feelsRight) setFeelsRight(val);
                  if (val < couldDo) setCouldDo(val);
                }}
                className="w-full accent-[#2D3339] cursor-pointer"
              />
            </div>
          </div>

          {/* Gift Ambition Selector */}
          <div className="space-y-2 pt-2 border-t border-[#EEE7E1]">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A]">
                Gift Ambition
              </label>
              <span className="text-[10px] text-[#8E8881]">Guides AI suggestions & consensus</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setGiftAmbition('keep_it_simple')}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  giftAmbition === 'keep_it_simple'
                    ? 'bg-[#2D3339] text-white border-[#2D3339] shadow-xs ring-1 ring-[#2D3339]'
                    : 'bg-[#F8F6F3] text-[#2D3339] border-[#EEE7E1] hover:bg-[#EFECE6]'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs">
                  <Smile className="w-4 h-4 text-emerald-400" />
                  <span>Keep it simple</span>
                </div>
                <p className={`text-[10px] mt-1.5 leading-snug ${
                  giftAmbition === 'keep_it_simple' ? 'text-stone-300' : 'text-[#8E8881]'
                }`}>
                  A thoughtful, practical gesture that everyone can easily pitch into without pressure.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setGiftAmbition('make_it_special')}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  giftAmbition === 'make_it_special'
                    ? 'bg-[#2D3339] text-white border-[#2D3339] shadow-xs ring-1 ring-[#2D3339]'
                    : 'bg-[#F8F6F3] text-[#2D3339] border-[#EEE7E1] hover:bg-[#EFECE6]'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Make it special</span>
                </div>
                <p className={`text-[10px] mt-1.5 leading-snug ${
                  giftAmbition === 'make_it_special' ? 'text-stone-300' : 'text-[#8E8881]'
                }`}>
                  A meaningful, memorable keepsake that the couple will cherish for years.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setGiftAmbition('go_all_out')}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  giftAmbition === 'go_all_out'
                    ? 'bg-[#2D3339] text-white border-[#2D3339] shadow-xs ring-1 ring-[#2D3339]'
                    : 'bg-[#F8F6F3] text-[#2D3339] border-[#EEE7E1] hover:bg-[#EFECE6]'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs">
                  <Rocket className="w-4 h-4 text-rose-400" />
                  <span>Go all out</span>
                </div>
                <p className={`text-[10px] mt-1.5 leading-snug ${
                  giftAmbition === 'go_all_out' ? 'text-stone-300' : 'text-[#8E8881]'
                }`}>
                  An extraordinary dream gift, luxury dining, or unforgettable boutique getaway.
                </p>
              </button>
            </div>
          </div>

          {/* Privacy Guarantee Reassurance Banner */}
          <div className="p-3.5 bg-[#F8F6F3] rounded-2xl border border-[#EEE7E1] flex items-center gap-2.5 text-xs text-[#6D6862]">
            <Lock className="w-4 h-4 text-[#4CAF50] shrink-0" />
            <span>
              <strong>Zero Peer Pressure:</strong> Your exact contribution range is strictly private. Only the anonymous sweet spot is revealed to the group.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isBusy}
                className="flex-1 py-3 px-6 rounded-full border border-[#E5E0DA] hover:bg-[#F8F6F3] text-[#2D3339] font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            <button
              id="submit-budget-btn"
              type="submit"
              disabled={isBusy}
              className="flex-2 py-3.5 px-8 rounded-full bg-[#2D3339] hover:bg-[#1E2328] text-white font-medium text-xs tracking-wide shadow-lg shadow-[#2D3339]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isBusy ? 'Saving Privately...' : 'Submit Private Budget'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
