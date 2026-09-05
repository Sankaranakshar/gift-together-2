import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

interface PrivacyBannerProps {
  compact?: boolean;
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div 
        id="privacy-banner-compact"
        className="inline-flex items-center justify-center gap-2 text-xs text-[#2D3339] bg-[#F8F6F3] px-4 py-1.5 rounded-full border border-[#EEE7E1]"
      >
        <Lock className="w-3.5 h-3.5 text-[#8E8881]" />
        <span className="font-medium">100% Private Budgets:</span>
        <span className="text-[#6D6862]">Never visible to other friends or the organizer.</span>
      </div>
    );
  }

  return (
    <div 
      id="privacy-banner"
      className="bg-[#F8F6F3] border border-[#EEE7E1] rounded-[24px] p-5 flex items-start gap-4 text-[#2D3339]"
    >
      <div className="w-9 h-9 rounded-full bg-[#E9E4DE] text-[#2D3339] flex items-center justify-center shrink-0 mt-0.5">
        <ShieldCheck className="w-4 h-4" />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs uppercase tracking-[0.15em] font-bold text-[#2D3339] flex items-center gap-2">
          Strict Privacy Guarantee
        </h4>
        <p className="text-xs text-[#6D6862] leading-relaxed">
          Individual budgets are strictly confidential. No one in the group will ever see the numbers you entered. Only the collective anonymous recommendation is calculated to ensure zero social awkwardness.
        </p>
      </div>
    </div>
  );
};
