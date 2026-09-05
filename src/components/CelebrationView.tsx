import React, { useState } from 'react';
import { 
  Sparkles, 
  Heart, 
  Share2, 
  ArrowLeft, 
  Gift, 
  CheckCircle2, 
  Users, 
  MessageSquarePlus, 
  Send 
} from 'lucide-react';
import { GiftGroup, Participant } from '../types';
import { formatINR } from '../utils/format';

interface CelebrationViewProps {
  group: GiftGroup;
  currentParticipant?: Participant | null;
  onBackToDashboard: () => void;
  onOpenShare: () => void;
}

interface CongratulatoryNote {
  name: string;
  message: string;
  createdAt: string;
}

export const CelebrationView: React.FC<CelebrationViewProps> = ({
  group,
  currentParticipant,
  onBackToDashboard,
  onOpenShare,
}) => {
  const [wishes, setWishes] = useState<CongratulatoryNote[]>([
    {
      name: group.creatorName || 'Organizer',
      message: `So thrilled we could make this happen for you both! Wishing you a lifetime of joy and adventures. ❤️`,
      createdAt: 'Just now',
    },
  ]);
  const [authorName, setAuthorName] = useState(
    currentParticipant?.displayName || currentParticipant?.name || ''
  );
  const [wishText, setWishText] = useState('');

  const celebrant = group.coupleNames || group.coupleName || 'our friends';
  const totalFriends = group.participantCount || group.participants.length || 8;
  const totalGift = group.targetGiftAmount || ((group.targetContribution || 2000) * totalFriends);

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishText.trim() || !authorName.trim()) return;
    setWishes([
      ...wishes,
      {
        name: authorName.trim(),
        message: wishText.trim(),
        createdAt: 'Just now',
      },
    ]);
    setWishText('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Back Button */}
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
          <span>Phase 04: Celebrated</span>
        </div>
      </div>

      {/* Hero Celebration Card */}
      <div 
        id="celebration-hero-card"
        className="bg-white rounded-[36px] sm:rounded-[40px] p-8 sm:p-12 shadow-xs border border-[#EEE7E1] text-center space-y-6 relative overflow-hidden"
      >
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-2xl shadow-2xs">
          🎁
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
            Group Gift Complete
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#2D3339] italic">
            For {celebrant}
          </h1>
          <p className="text-xs text-[#6D6862] max-w-md mx-auto">
            Together with {totalFriends} friends, you coordinated the perfect gift with zero financial stress.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#F8F6F3] border border-[#EEE7E1] grid grid-cols-2 gap-4 text-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8881]">Collective Gift Fund</span>
            <div className="text-2xl font-serif text-[#2D3339] mt-1">{formatINR(totalGift)}</div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8881]">Friends United</span>
            <div className="text-2xl font-serif text-[#2D3339] mt-1">{totalFriends}</div>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={onOpenShare}
            className="px-6 py-3 rounded-full bg-[#2D3339] hover:bg-black text-white font-medium text-xs tracking-wide transition-colors flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Completion Link via WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Digital Signature & Congratulatory Card */}
      <div 
        id="digital-card-section"
        className="bg-white rounded-[36px] p-6 sm:p-10 shadow-xs border border-[#EEE7E1] space-y-6"
      >
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
            Digital Group Card
          </span>
          <h3 className="text-2xl font-serif text-[#2D3339] italic">
            Wishes from the Contributors
          </h3>
          <p className="text-xs text-[#6D6862]">
            Leave a congratulatory message for {celebrant} to read.
          </p>
        </div>

        {/* Wishes List */}
        <div className="space-y-3">
          {wishes.map((w, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1] space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <strong className="font-serif text-[#2D3339]">{w.name}</strong>
                <span className="text-[10px] text-[#8E8881]">{w.createdAt}</span>
              </div>
              <p className="text-xs text-[#6D6862] leading-relaxed italic">
                "{w.message}"
              </p>
            </div>
          ))}
        </div>

        {/* Write Wish Form */}
        <form onSubmit={handleAddWish} className="space-y-3 pt-3 border-t border-[#EEE7E1]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              required
              placeholder="Your name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#E5E0DA] text-xs text-[#1A1A1A]"
            />
          </div>
          <textarea
            rows={2}
            required
            placeholder="Write your wishes for the happy celebrants..."
            value={wishText}
            onChange={(e) => setWishText(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#E5E0DA] text-xs text-[#1A1A1A]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#2D3339] hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Sign the Card</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
