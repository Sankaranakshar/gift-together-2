import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, CheckCircle2, HeartHandshake } from 'lucide-react';

interface PrivacyGuaranteeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyGuaranteeModal: React.FC<PrivacyGuaranteeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      id="privacy-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        id="privacy-modal-container"
        className="bg-white rounded-[36px] max-w-md w-full p-8 shadow-2xl border border-[#EEE7E1] space-y-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E9E4DE] text-[#2D3339] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
                Security Promise
              </span>
              <h3 className="text-xl font-serif text-[#2D3339] italic">
                Privacy Guarantee
              </h3>
            </div>
          </div>

          <button
            id="close-privacy-modal-btn"
            onClick={onClose}
            className="p-2 text-[#8E8881] hover:text-[#2D3339] hover:bg-[#F5F2ED] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-[#6D6862] leading-relaxed">
          <div className="p-4 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1] text-[#1A1A1A] space-y-1.5">
            <div className="font-bold flex items-center gap-2 text-[#2D3339] text-xs uppercase tracking-wider">
              <EyeOff className="w-4 h-4 text-[#8E8881]" />
              <span>What We NEVER Reveal:</span>
            </div>
            <p className="text-xs text-[#6D6862] pl-6">
              “Rahul entered ₹1,000” or “Priya entered ₹3,000”. No individual numbers are ever revealed to other friends, group members, or the organizer.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1] text-[#1A1A1A] space-y-1.5">
            <div className="font-bold flex items-center gap-2 text-[#2D3339] text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#4CAF50]" />
              <span>What is Calculated:</span>
            </div>
            <ul className="text-xs text-[#6D6862] pl-6 space-y-1 list-disc">
              <li>Aggregate participant count (e.g. 8 friends)</li>
              <li>Consensus recommended contribution (e.g. ₹2,000)</li>
              <li>Total collective gift budget (e.g. ₹16,000)</li>
              <li>Comfort summary (e.g. 7 of 8 comfortable, 1 stretching slightly)</li>
            </ul>
          </div>

          <p className="text-[#2D3339] font-serif italic text-xs leading-relaxed text-center pt-1">
            “This guarantees everyone can contribute with dignity, without feeling judged or pressured to spend beyond their personal comfort.”
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-full bg-[#2D3339] hover:bg-[#1E2328] text-white font-medium text-xs tracking-wide shadow-sm transition-colors cursor-pointer"
        >
          Got it, thank you
        </button>
      </div>
    </div>
  );
};
