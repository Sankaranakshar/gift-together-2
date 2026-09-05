import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  HeartHandshake, 
  Gift, 
  Lock, 
  Sliders,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { GiftGroup } from '../types';
import { formatINR } from '../utils/format';

interface LandingPageProps {
  onCreateGroup: () => void;
  onJoinGroup: () => void;
  onOpenDemoGroup: () => void;
  savedGroups: GiftGroup[];
  onSelectGroup: (groupId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onCreateGroup,
  onJoinGroup,
  onOpenDemoGroup,
  savedGroups,
  onSelectGroup,
}) => {
  return (
    <div className="space-y-12 sm:space-y-16 pb-12">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto pt-4 sm:pt-8 space-y-6">
        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5F2ED] border border-[#E5E0DA] text-[#2D3339] text-xs font-medium tracking-wide">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]"></div>
          <span>Find the gift budget everyone feels good about.</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#2D3339] italic leading-[1.15]">
          How much should <span className="font-sans not-italic font-bold text-[#1A1A1A]">everyone</span> chip in?
        </h1>

        {/* Subheading */}
        <p className="text-base sm:text-lg text-[#6D6862] leading-relaxed max-w-xl mx-auto font-normal">
          Everyone enters what they're comfortable spending privately. GiftTogether calculates a socially fair contribution that works for the entire group — without exposing anyone's budget.
        </p>

        {/* Supporting Trust Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-[#8E8881] pt-1">
          <span className="flex items-center gap-1.5 text-[#2D3339] bg-[#F8F6F3] px-3 py-1 rounded-full border border-[#EEE7E1]">
            <Lock className="w-3.5 h-3.5 text-[#8E8881]" />
            100% Private budgets
          </span>
          <span className="text-[#8E8881]">•</span>
          <span className="flex items-center gap-1.5 text-[#2D3339] bg-[#F8F6F3] px-3 py-1 rounded-full border border-[#EEE7E1]">
            <Sparkles className="w-3.5 h-3.5 text-[#8E8881]" />
            Consensus sweet spot
          </span>
          <span className="text-[#8E8881]">•</span>
          <span className="flex items-center gap-1.5 text-[#2D3339] bg-[#F8F6F3] px-3 py-1 rounded-full border border-[#EEE7E1]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF50]" />
            Zero awkwardness
          </span>
        </div>

        {/* Primary and Secondary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            id="hero-create-group-btn"
            onClick={onCreateGroup}
            className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#2D3339] hover:bg-[#1E2328] text-white font-medium text-sm tracking-wide shadow-lg shadow-[#2D3339]/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <span>Create a Gift Group</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="hero-join-group-btn"
            onClick={onJoinGroup}
            className="w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-full bg-white hover:bg-[#F5F2ED] text-[#2D3339] font-medium text-sm border border-[#E5E0DA] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <span>Join a Gift Group</span>
          </button>
        </div>
      </div>

      {/* Interactive Demo Group Banner */}
      <div className="max-w-2xl mx-auto">
        <div 
          id="demo-scenario-card"
          className="bg-[#F8F6F3] rounded-[32px] p-7 sm:p-8 border border-[#EEE7E1] shadow-xs relative overflow-hidden space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8E8881]">
                  Featured Demo Group
                </span>
                <span className="text-xs text-[#8E8881] font-medium">• 8 friends seeded</span>
              </div>
              <h3 className="text-2xl font-serif text-[#2D3339] italic">
                Rithika & Arjun's Wedding Gift
              </h3>
              <p className="text-xs sm:text-sm text-[#6D6862] max-w-md leading-relaxed">
                Test the live consensus algorithm right now with 8 friends. See how it balances budgets to recommend ₹2,000 without pressuring anyone.
              </p>
            </div>

            <button
              id="open-demo-scenario-btn"
              onClick={onOpenDemoGroup}
              className="px-6 py-3 rounded-full bg-[#2D3339] hover:bg-[#1E2328] text-white font-medium text-xs tracking-wide shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Explore Demo Group</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Saved Groups on this device */}
      {savedGroups.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-3">
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8E8881] px-1">
            Your Active Gift Groups
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedGroups.map((g) => (
              <div
                key={g.id}
                onClick={() => onSelectGroup(g.id)}
                className="bg-white rounded-2xl p-5 border border-[#EEE7E1] hover:border-[#E5E0DA] hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-serif text-[#2D3339] text-base italic">{g.coupleNames || g.coupleName}</div>
                  <div className="text-xs text-[#8E8881]">
                    {g.participants.length} friends • {g.isRevealed ? 'Revealed' : 'Gathering budgets'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E8881]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 Steps: How It Works */}
      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        <div className="text-center space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8E8881]">
            How It Works
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#2D3339] italic">
            The respectful way to gift together
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-[24px] p-6 border border-[#EEE7E1] space-y-3">
            <div className="w-8 h-8 rounded-full bg-[#E9E4DE] text-[#2D3339] flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="text-sm font-bold text-[#1A1A1A]">
              Create & Share
            </h4>
            <p className="text-xs text-[#6D6862] leading-relaxed">
              Name the couple and share a simple link in your WhatsApp or group chat. No apps or sign-ups required.
            </p>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#EEE7E1] space-y-3">
            <div className="w-8 h-8 rounded-full bg-[#E9E4DE] text-[#2D3339] flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="text-sm font-bold text-[#1A1A1A]">
              Private Budgets
            </h4>
            <p className="text-xs text-[#6D6862] leading-relaxed">
              Everyone submits their minimum, comfortable, and maximum. Individual numbers remain 100% hidden.
            </p>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#EEE7E1] space-y-3">
            <div className="w-8 h-8 rounded-full bg-[#E9E4DE] text-[#2D3339] flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="text-sm font-bold text-[#1A1A1A]">
              Objective Consensus
            </h4>
            <p className="text-xs text-[#6D6862] leading-relaxed">
              Our algorithm finds the amount that avoids stretching anyone beyond their limits, providing clean tiers.
            </p>
          </div>
        </div>
      </div>

      {/* Social Problem Solved Quote Box */}
      <div className="max-w-2xl mx-auto bg-[#F8F6F3] border border-[#EEE7E1] rounded-[32px] p-8 text-center space-y-3">
        <p className="text-[#2D3339] text-base sm:text-lg font-serif italic leading-relaxed">
          “Nobody wants to be the person who says, ‘I can only contribute ₹1,000.’ And nobody wants to accidentally pressure their friends into spending ₹5,000.”
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8E8881]">
          GiftTogether removes awkwardness and makes group decisions effortless.
        </p>
      </div>
    </div>
  );
};
