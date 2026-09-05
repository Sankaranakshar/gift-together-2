import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Sparkles, 
  ThumbsUp, 
  Plus, 
  ExternalLink, 
  ArrowRight, 
  ArrowLeft, 
  Share2, 
  Loader2, 
  CheckCircle2, 
  Tag, 
  Check,
  Heart
} from 'lucide-react';
import { GiftGroup, Participant } from '../types';
import { GiftOption, GiftBrief } from '../types/group';
import { formatINR } from '../utils/format';
import { 
  subscribeGiftOptions, 
  createGiftOption, 
  castGiftVote, 
  subscribeUserVote, 
  subscribeAllVotes, 
  selectWinningGift,
  fetchAIGiftSuggestions 
} from '../services/giftService';

interface ChooseGiftViewProps {
  group: GiftGroup;
  currentParticipant?: Participant | null;
  onBackToDashboard: () => void;
  onGoToPayments: () => void;
  onOpenShare: () => void;
  isCreator: boolean;
}

export const ChooseGiftView: React.FC<ChooseGiftViewProps> = ({
  group,
  currentParticipant,
  onBackToDashboard,
  onGoToPayments,
  onOpenShare,
  isCreator,
}) => {
  const [giftOptions, setGiftOptions] = useState<GiftOption[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New gift form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Home & Kitchen');
  const [newPrice, setNewPrice] = useState<number>(group.targetGiftAmount || 16000);
  const [newDesc, setNewDesc] = useState('');
  const [newLink, setNewLink] = useState('');
  const [isSubmittingGift, setIsSubmittingGift] = useState(false);

  const celebrant = group.coupleNames || group.coupleName || 'our friends';
  const targetBudget = group.targetGiftAmount || ((group.targetContribution || 2000) * (group.participantCount || 8));

  // Subscriptions
  useEffect(() => {
    if (!group.id) return;
    const unsubOptions = subscribeGiftOptions(group.id, setGiftOptions);
    const unsubMyVote = subscribeUserVote(group.id, setMyVote);
    const unsubAllVotes = subscribeAllVotes(group.id, setVoteCounts);

    return () => {
      if (unsubOptions) unsubOptions();
      if (unsubMyVote) unsubMyVote();
      if (unsubAllVotes) unsubAllVotes();
    };
  }, [group.id]);

  // Initial curated options if collection is empty
  useEffect(() => {
    if (giftOptions.length === 0 && group.id && isCreator) {
      // Auto-suggest initial options
      handleGenerateAIIdeas();
    }
  }, [giftOptions.length, group.id, isCreator]);

  const handleGenerateAIIdeas = async () => {
    if (!group.id || isGeneratingAI) return;
    setIsGeneratingAI(true);
    try {
      const result = await fetchAIGiftSuggestions({
        occasion: group.occasion || 'wedding',
        recipientNames: celebrant,
        targetBudget,
        style: 'Thoughtful & High Utility',
        notes: group.giftDescription,
      });

      // Add generated ideas to the group
      for (const idea of result.ideas) {
        await createGiftOption(group.id, {
          title: idea.title,
          category: idea.category,
          estimatedPrice: idea.estimatedPrice,
          description: idea.description,
        });
      }
      setIsGeneratingAI(false);
    } catch (err) {
      console.warn('AI suggestions error:', err);
      setIsGeneratingAI(false);
    }
  };

  const handleVote = async (giftId: string) => {
    if (!group.id) return;
    try {
      await castGiftVote(group.id, giftId);
    } catch (err) {
      console.warn('Vote error:', err);
    }
  };

  const handleSelectWinningGift = async (giftId: string) => {
    if (!group.id || !isCreator) return;
    try {
      await selectWinningGift(group.id, giftId);
      onGoToPayments();
    } catch (err) {
      console.warn('Select winning gift error:', err);
    }
  };

  const handleAddCustomGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group.id || !newTitle.trim()) return;
    setIsSubmittingGift(true);
    try {
      await createGiftOption(group.id, {
        title: newTitle.trim(),
        category: newCategory.trim(),
        estimatedPrice: Number(newPrice) || targetBudget,
        description: newDesc.trim() || undefined,
        link: newLink.trim() || undefined,
      });
      setIsSubmittingGift(false);
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewLink('');
    } catch (err) {
      console.warn('Error adding gift option:', err);
      setIsSubmittingGift(false);
    }
  };

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
          <span>Phase 02: Choose Gift</span>
        </div>
      </div>

      {/* Gift Brief Card */}
      <div 
        id="gift-brief-card"
        className="bg-white rounded-[36px] sm:rounded-[40px] p-6 sm:p-10 shadow-xs border border-[#EEE7E1] space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
              Gift Brief & Target Budget
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#2D3339] italic">
              Choosing for {celebrant}
            </h2>
            <p className="text-xs text-[#6D6862]">
              Group Target Budget: <strong>{formatINR(targetBudget)}</strong> ({formatINR(group.targetContribution || 2000)} × {group.participantCount || 8} friends)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAIIdeas}
              disabled={isGeneratingAI}
              className="px-4 py-2 rounded-full bg-[#F8F6F3] hover:bg-[#EAE5DE] text-[#2D3339] text-xs font-medium border border-[#E5E0DA] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8E8881]" />
                  <span>Curating Ideas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Gift Assistant</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-full bg-[#2D3339] hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Suggest Gift</span>
            </button>
          </div>
        </div>

        {/* Gift Brief Tags */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <span className="px-3 py-1 rounded-full bg-[#F8F6F3] border border-[#EEE7E1] text-[#6D6862]">
            Occasion: <strong className="text-[#2D3339] capitalize">{group.occasion || 'Wedding'}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-[#F8F6F3] border border-[#EEE7E1] text-[#6D6862]">
            Target: <strong className="text-[#2D3339]">{formatINR(targetBudget)}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-[#F8F6F3] border border-[#EEE7E1] text-[#6D6862]">
            Philosophy: <strong className="text-[#2D3339]">{group.contributionMode === 'flexible' ? 'Give What Feels Right' : 'Equal Split'}</strong>
          </span>
        </div>
      </div>

      {/* Gift Options Grid & Voting */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8E8881]">
              Proposed Gifts ({giftOptions.length})
            </h3>
            <p className="text-xs text-[#6D6862]">
              Vote for the gift you think {celebrant} will love most.
            </p>
          </div>

          <button
            onClick={onOpenShare}
            className="text-xs font-medium text-[#2D3339] hover:bg-[#F5F2ED] border border-[#E5E0DA] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#8E8881]" />
            <span>Invite Votes</span>
          </button>
        </div>

        {giftOptions.length === 0 ? (
          <div className="p-10 rounded-[36px] bg-white border border-[#EEE7E1] text-center space-y-3">
            <Gift className="w-8 h-8 text-[#8E8881] mx-auto opacity-50" />
            <h4 className="text-base font-serif text-[#2D3339]">No gift options proposed yet</h4>
            <p className="text-xs text-[#8E8881] max-w-sm mx-auto">
              Click the AI Gift Assistant button or suggest your own idea to start group voting.
            </p>
            <button
              onClick={handleGenerateAIIdeas}
              disabled={isGeneratingAI}
              className="px-5 py-2.5 rounded-full bg-[#2D3339] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Generate Ideas with AI</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {giftOptions.map((opt) => {
              const votes = voteCounts[opt.id] || 0;
              const hasVotedForThis = myVote === opt.id;
              const isSelected = group.selectedGiftId === opt.id;

              return (
                <div 
                  key={opt.id}
                  className={`p-5 rounded-[28px] border transition-all ${
                    isSelected 
                      ? 'bg-amber-50/50 border-amber-200' 
                      : 'bg-white border-[#EEE7E1] hover:border-[#D5CECE]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-[#F8F6F3] text-[#8E8881] px-2.5 py-0.5 rounded-full border border-[#EEE7E1]">
                          {opt.category}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Chosen Gift</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-serif text-[#2D3339] font-medium">
                        {opt.title}
                      </h4>

                      {opt.description && (
                        <p className="text-xs text-[#6D6862] leading-relaxed">
                          {opt.description}
                        </p>
                      )}

                      <div className="text-xs font-serif text-[#2D3339] pt-1">
                        Est. Price: <strong>{formatINR(opt.estimatedPrice)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EEE7E1]">
                      {/* Vote Button */}
                      <button
                        onClick={() => handleVote(opt.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                          hasVotedForThis
                            ? 'bg-[#2D3339] text-white'
                            : 'bg-[#F8F6F3] text-[#2D3339] hover:bg-[#EAE5DE] border border-[#E5E0DA]'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${hasVotedForThis ? 'fill-white text-white' : 'text-[#8E8881]'}`} />
                        <span>{votes} {votes === 1 ? 'Vote' : 'Votes'}</span>
                      </button>

                      {/* Organizer Selection CTA */}
                      {isCreator && (
                        <button
                          onClick={() => handleSelectWinningGift(opt.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600 text-white'
                              : 'bg-white border border-[#E5E0DA] text-[#2D3339] hover:bg-[#F8F6F3]'
                          }`}
                        >
                          {isSelected ? 'Gift Selected ✓' : 'Select This Gift'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Advance to Collect phase call-to-action */}
      <div className="p-6 rounded-[28px] bg-[#2D3339] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-[#2D3339]/15">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5F2ED]/80">
            Next: Payment Collection
          </div>
          <h4 className="text-lg font-serif italic">
            Ready to collect contributions?
          </h4>
          <p className="text-xs text-stone-300">
            Track payments with zero public shaming and simple UPI verification.
          </p>
        </div>

        <button
          onClick={onGoToPayments}
          className="px-6 py-3 rounded-full bg-white text-[#2D3339] hover:bg-[#F5F2ED] font-medium text-xs tracking-wide transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span>Open Payment Tracker</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Suggest Custom Gift Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-[36px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EEE7E1] space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-serif text-[#2D3339] italic">
              Suggest a Gift Idea
            </h3>

            <form onSubmit={handleAddCustomGift} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-[#1A1A1A]">Gift Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dyson Airwrap, Smeg Toaster, Resort Voucher"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#E5E0DA] text-sm text-[#1A1A1A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[#1A1A1A]">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8F6F3] border border-[#E5E0DA] text-xs text-[#1A1A1A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[#1A1A1A]">Estimated Price (₹)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8F6F3] border border-[#E5E0DA] text-xs text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-[#1A1A1A]">Description / Why they'll love it</label>
                <textarea
                  rows={2}
                  placeholder="A few words about why this makes a great gift..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F6F3] border border-[#E5E0DA] text-xs text-[#1A1A1A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E0DA] text-[#2D3339] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGift}
                  className="px-5 py-2 rounded-full bg-[#2D3339] text-white font-medium hover:bg-black"
                >
                  {isSubmittingGift ? 'Adding...' : 'Add Gift Idea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
