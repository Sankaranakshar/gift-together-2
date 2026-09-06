import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  Lock, 
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { ProposalVoteOption, ProposalSummary } from '../types/group';
import { submitProposalVote, subscribeProposalVotes } from '../services/budgetService';
import { formatINR } from '../utils/format';

interface ProposalVoteCardProps {
  groupId: string;
  proposedAmount: number;
  totalParticipants: number;
  isCreator: boolean;
  onProceedToGifts: () => void;
  currentParticipantName?: string;
}

export const ProposalVoteCard: React.FC<ProposalVoteCardProps> = ({
  groupId,
  proposedAmount,
  totalParticipants,
  isCreator,
  onProceedToGifts,
  currentParticipantName,
}) => {
  const [summary, setSummary] = useState<ProposalSummary>({
    totalVotes: 0,
    agreeCount: 0,
    preferLowerCount: 0,
    preferHigherCount: 0,
    agreementRate: 0,
  });
  const [myVote, setMyVote] = useState<ProposalVoteOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    const unsub = subscribeProposalVotes(groupId, (newSummary, currentVote) => {
      setSummary(newSummary);
      if (currentVote) setMyVote(currentVote);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [groupId]);

  const handleVote = async (option: ProposalVoteOption) => {
    if (!groupId || isSubmitting) return;
    setIsSubmitting(true);
    setMyVote(option);
    try {
      await submitProposalVote(groupId, option, currentParticipantName);
    } catch (err) {
      console.warn('Error submitting proposal vote:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasHighAgreement = summary.totalVotes >= 2 && summary.agreementRate >= 70;

  return (
    <div 
      id="proposal-consensus-vote-card"
      className="bg-white rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 shadow-xs border border-[#EEE7E1] space-y-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
            <Users className="w-3.5 h-3.5 text-[#2D3339]" />
            <span>Group Consensus Check</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif text-[#2D3339] italic">
            Do you agree with {formatINR(proposedAmount)}?
          </h3>
          <p className="text-xs text-[#6D6862]">
            Cast your quick private vote to confirm this contribution feels right for everyone.
          </p>
        </div>

        {summary.totalVotes > 0 && (
          <div className="text-right shrink-0">
            <div className="text-2xl font-serif text-[#2D3339] font-bold">
              {summary.agreementRate}%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8881]">
              Agreement Rate
            </div>
          </div>
        )}
      </div>

      {/* Interactive Vote Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleVote('agree')}
          disabled={isSubmitting}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            myVote === 'agree'
              ? 'bg-[#2D3339] text-white border-[#2D3339] shadow-xs'
              : 'bg-[#F8F6F3] text-[#2D3339] border-[#EEE7E1] hover:bg-[#EFECE6]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-xs">
              <ThumbsUp className={`w-4 h-4 ${myVote === 'agree' ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span>Looks great</span>
            </div>
            {summary.agreeCount > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                myVote === 'agree' ? 'bg-white/20 text-white' : 'bg-[#E5E0DA] text-[#2D3339]'
              }`}>
                {summary.agreeCount}
              </span>
            )}
          </div>
          <p className={`text-[10px] mt-1.5 leading-snug ${
            myVote === 'agree' ? 'text-stone-300' : 'text-[#8E8881]'
          }`}>
            Comfortable with this amount. Ready to pick gifts!
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleVote('prefer_lower')}
          disabled={isSubmitting}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            myVote === 'prefer_lower'
              ? 'bg-[#2D3339] text-white border-[#2D3339] shadow-xs'
              : 'bg-[#F8F6F3] text-[#2D3339] border-[#EEE7E1] hover:bg-[#EFECE6]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-xs">
              <TrendingDown className={`w-4 h-4 ${myVote === 'prefer_lower' ? 'text-amber-400' : 'text-amber-600'}`} />
              <span>Prefer lower</span>
            </div>
            {summary.preferLowerCount > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                myVote === 'prefer_lower' ? 'bg-white/20 text-white' : 'bg-[#E5E0DA] text-[#2D3339]'
              }`}>
                {summary.preferLowerCount}
              </span>
            )}
          </div>
          <p className={`text-[10px] mt-1.5 leading-snug ${
            myVote === 'prefer_lower' ? 'text-stone-300' : 'text-[#8E8881]'
          }`}>
            Would feel more relaxed with a slightly smaller tier.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleVote('prefer_higher')}
          disabled={isSubmitting}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            myVote === 'prefer_higher'
              ? 'bg-[#2D3339] text-white border-[#2D3339] shadow-xs'
              : 'bg-[#F8F6F3] text-[#2D3339] border-[#EEE7E1] hover:bg-[#EFECE6]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-xs">
              <TrendingUp className={`w-4 h-4 ${myVote === 'prefer_higher' ? 'text-blue-400' : 'text-blue-600'}`} />
              <span>Can go higher</span>
            </div>
            {summary.preferHigherCount > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                myVote === 'prefer_higher' ? 'bg-white/20 text-white' : 'bg-[#E5E0DA] text-[#2D3339]'
              }`}>
                {summary.preferHigherCount}
              </span>
            )}
          </div>
          <p className={`text-[10px] mt-1.5 leading-snug ${
            myVote === 'prefer_higher' ? 'text-stone-300' : 'text-[#8E8881]'
          }`}>
            Excited to contribute a bit more for an elevated gift.
          </p>
        </button>
      </div>

      {/* Live Consensus Feedback & Next Phase Action */}
      <div className="p-4 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-[#6D6862]">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {summary.totalVotes === 0 ? (
              'Be the first to cast your vote on this contribution proposal.'
            ) : (
              <>
                <strong>{summary.agreeCount} of {summary.totalVotes} friends</strong> confirmed this amount fits their budget.
              </>
            )}
          </span>
        </div>

        {isCreator && (
          <button
            onClick={onProceedToGifts}
            className="w-full sm:w-auto py-2.5 px-6 rounded-full bg-[#2D3339] hover:bg-black text-white text-xs font-medium tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Proceed to Choose Gift</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
