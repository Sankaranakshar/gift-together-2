import React, { useState } from 'react';
import { 
  Users, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ArrowRight, 
  Share2, 
  ShieldCheck, 
  Sparkles,
  CreditCard,
  HeartHandshake,
  Lock,
  SlidersHorizontal,
  ArrowLeft,
  Check
} from 'lucide-react';
import { GiftGroup, AlgorithmResult, GroupFitEvaluation } from '../types';
import { formatINR } from '../utils/format';
import { evaluateCustomAmount } from '../utils/algorithm';

interface ResultsViewProps {
  group: GiftGroup;
  result: AlgorithmResult;
  selectedOption: GroupFitEvaluation;
  onSelectOption: (option: GroupFitEvaluation) => void;
  onGoToPayments: () => void;
  onGoToChooseGift: () => void;
  onOpenShare: () => void;
  onEditMyBudget: () => void;
  onLockAmount?: (amount: number) => void;
  isCreator: boolean;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  group,
  result,
  selectedOption,
  onSelectOption,
  onGoToPayments,
  onGoToChooseGift,
  onOpenShare,
  onEditMyBudget,
  onLockAmount,
  isCreator,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [simAmount, setSimAmount] = useState<number>(result.recommended.amount || 2000);
  const [showSimulator, setShowSimulator] = useState(false);

  const total = result.totalResponded;
  const activeOpt = selectedOption || result.recommended;
  const celebrant = group.coupleNames || group.coupleName || 'our friends';

  // Evaluate the simulation amount
  const simEvaluation = evaluateCustomAmount(simAmount, group.participants);

  const getStrengthBadge = (strength: string) => {
    switch (strength?.toLowerCase()) {
      case 'strong':
        return { label: 'Strong Consensus', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' };
      case 'good':
        return { label: 'Good Consensus', color: 'bg-teal-50 text-teal-800 border-teal-200', dot: 'bg-teal-500' };
      case 'mixed':
        return { label: 'Mixed Consensus', color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
      default:
        return { label: 'Difficult Fit', color: 'bg-orange-50 text-orange-800 border-orange-200', dot: 'bg-orange-500' };
    }
  };

  const strengthInfo = getStrengthBadge(result.consensusStrength || 'Good');

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Top Banner Context */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F5F2ED] text-[#2D3339] text-[10px] font-bold tracking-[0.2em] uppercase border border-[#E5E0DA]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]"></div>
          <span>Group Decision Consensus</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-[#2D3339] italic">
          {celebrant}
        </h1>
        <p className="text-[#8E8881] text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5">
          <Users className="w-4 h-4 text-[#8E8881]" />
          <span><strong>{total} friends</strong> contributed to this consensus</span>
        </p>
      </div>

      {/* Primary Recommended Contribution Hero Card */}
      <div 
        id="recommended-contribution-card"
        className="bg-white rounded-[36px] sm:rounded-[40px] p-8 sm:p-12 shadow-xs border border-[#EEE7E1] text-center relative overflow-hidden space-y-6"
      >
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] uppercase tracking-wider font-bold shadow-2xs"
            style={{ borderColor: 'inherit' }}
          >
            <span className={`w-2 h-2 rounded-full ${strengthInfo.dot}`}></span>
            <span className="font-bold text-[#2D3339]">{strengthInfo.label}</span>
          </div>

          <p className="text-xs text-[#6D6862]">
            {result.consensusSummary || 'The group reaches optimal consensus around this amount.'}
          </p>

          <div className="py-2">
            <div className="text-5xl sm:text-6xl font-serif text-[#2D3339] tracking-tight">
              {formatINR(activeOpt.amount)}
            </div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8E8881] mt-2">
              per person
            </div>
          </div>

          <div className="inline-block px-4 py-1.5 rounded-full bg-[#F8F6F3] border border-[#EEE7E1] text-xs font-medium text-[#2D3339]">
            Resulting Group Gift: <strong>{formatINR(activeOpt.totalBudget)}</strong>
          </div>
        </div>

        {/* Social Harmony Stats */}
        <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-[#EEE7E1] text-left">
          <div className="p-3.5 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1]">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#8E8881]">Comfortable</div>
            <div className="text-lg font-serif text-[#2D3339] mt-0.5">
              {activeOpt.comfortableCount} of {total}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1]">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#8E8881]">Slight Stretch</div>
            <div className="text-lg font-serif text-[#2D3339] mt-0.5">
              {activeOpt.stretchingCount} of {total}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1]">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#8E8881]">Over Limit</div>
            <div className="text-lg font-serif text-[#2D3339] mt-0.5">
              {activeOpt.overMaxCount} of {total}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            id="choose-gift-cta-btn"
            onClick={onGoToChooseGift}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-full bg-[#2D3339] hover:bg-black text-white text-xs font-medium tracking-wide shadow-lg shadow-[#2D3339]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Choose Gift (Phase 02)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="results-share-btn"
            onClick={onOpenShare}
            className="w-full sm:w-auto py-3.5 px-5 rounded-full border border-[#E5E0DA] hover:bg-[#F5F2ED] text-[#2D3339] text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#8E8881]" />
            <span>Share via WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Tier Comparison Cards: Easy / Sweet Spot / Big Gift */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8E8881]">
            Alternative Scenarios
          </h3>
          <span className="text-xs text-[#8E8881]">Tap to preview</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {result.conservative && (
            <div 
              onClick={() => onSelectOption(result.conservative!)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeOpt.amount === result.conservative.amount
                  ? 'bg-[#2D3339] text-white border-[#2D3339] shadow-xs'
                  : 'bg-white text-[#2D3339] border-[#EEE7E1] hover:bg-[#FAF8F5]'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                100% Ease Tier
              </div>
              <div className="text-xl font-serif mt-1">
                {formatINR(result.conservative.amount)}
              </div>
              <div className="text-[11px] mt-2 opacity-80">
                Total Gift: {formatINR(result.conservative.totalBudget)}
              </div>
              <div className="text-[10px] mt-1 opacity-70">
                {result.conservative.comfortableCount} of {total} fully relaxed
              </div>
            </div>
          )}

          <div 
            onClick={() => onSelectOption(result.recommended)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeOpt.amount === result.recommended.amount
                ? 'bg-[#2D3339] text-white border-[#2D3339] shadow-xs'
                : 'bg-white text-[#2D3339] border-[#EEE7E1] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Sweet Spot</span>
            </div>
            <div className="text-xl font-serif mt-1">
              {formatINR(result.recommended.amount)}
            </div>
            <div className="text-[11px] mt-2 opacity-80">
              Total Gift: {formatINR(result.recommended.totalBudget)}
            </div>
            <div className="text-[10px] mt-1 opacity-70">
              {result.recommended.comfortableCount} of {total} comfortable
            </div>
          </div>

          {result.generous && (
            <div 
              onClick={() => onSelectOption(result.generous!)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeOpt.amount === result.generous.amount
                  ? 'bg-[#2D3339] text-white border-[#2D3339] shadow-xs'
                  : 'bg-white text-[#2D3339] border-[#EEE7E1] hover:bg-[#FAF8F5]'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Elevated Gift Tier
              </div>
              <div className="text-xl font-serif mt-1">
                {formatINR(result.generous.amount)}
              </div>
              <div className="text-[11px] mt-2 opacity-80">
                Total Gift: {formatINR(result.generous.totalBudget)}
              </div>
              <div className="text-[10px] mt-1 opacity-70">
                {result.generous.comfortableCount} comfortable, {result.generous.stretchingCount} stretching
              </div>
            </div>
          )}
        </div>
      </div>

      {/* "What If?" Simulation Tool for Organizer */}
      <div 
        id="what-if-simulation-card"
        className="bg-white rounded-[36px] p-6 sm:p-8 shadow-xs border border-[#EEE7E1] space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#2D3339]" />
              <span>Interactive Decision Simulator</span>
            </div>
            <h3 className="text-lg font-serif text-[#2D3339] italic">
              "What If?" Simulation
            </h3>
          </div>

          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="text-xs font-medium text-[#2D3339] underline cursor-pointer"
          >
            {showSimulator ? 'Hide Simulator' : 'Test Other Amounts'}
          </button>
        </div>

        <p className="text-xs text-[#6D6862]">
          Slide to see how comfortable friends would be at different contribution levels before locking in.
        </p>

        {showSimulator && (
          <div className="p-5 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1A1A1A]">Tested Contribution:</span>
              <span className="text-xl font-serif text-[#2D3339] font-bold">{formatINR(simAmount)}</span>
            </div>

            <input
              type="range"
              min="500"
              max="10000"
              step="250"
              value={simAmount}
              onChange={(e) => setSimAmount(Number(e.target.value))}
              className="w-full accent-[#2D3339] cursor-pointer"
            />

            {/* Live Evaluation */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-[#E5E0DA]">
                <div className="text-[10px] text-[#8E8881] uppercase font-bold">Comfortable</div>
                <div className="font-serif text-sm font-bold text-emerald-700 mt-0.5">
                  {simEvaluation.comfortableCount}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E5E0DA]">
                <div className="text-[10px] text-[#8E8881] uppercase font-bold">Stretching</div>
                <div className="font-serif text-sm font-bold text-amber-700 mt-0.5">
                  {simEvaluation.stretchingCount}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E5E0DA]">
                <div className="text-[10px] text-[#8E8881] uppercase font-bold">Total Gift</div>
                <div className="font-serif text-sm font-bold text-[#2D3339] mt-0.5">
                  {formatINR(simEvaluation.totalGroupGift)}
                </div>
              </div>
            </div>

            {onLockAmount && isCreator && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onLockAmount(simAmount)}
                  className="px-5 py-2 rounded-full bg-[#2D3339] hover:bg-black text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Lock In {formatINR(simAmount)} & Choose Gift
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Adjust My Budget Footer */}
      <div className="bg-[#F8F6F3] rounded-[28px] p-5 border border-[#EEE7E1] flex items-center justify-between text-xs">
        <span className="text-[#6D6862]">Want to adjust your own comfort range?</span>
        <button
          onClick={onEditMyBudget}
          className="text-[#2D3339] font-medium underline cursor-pointer hover:text-black"
        >
          Update My Budget
        </button>
      </div>
    </div>
  );
};
