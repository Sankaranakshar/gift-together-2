import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  MessageSquare, 
  Share2, 
  Lock, 
  Gift, 
  CheckCircle2, 
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { GiftGroup } from '../types';
import { formatINR } from '../utils/format';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GiftGroup;
}

type TemplateType = 'invite' | 'nudge' | 'voting' | 'payment';

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  group,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(
    group.phase === 3 ? 'payment' : group.phase === 2 ? 'voting' : 'invite'
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const celebrant = group.coupleNames || group.coupleName || 'our friends';
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/g/${group.id || group.slug}`;
  const agreedAmt = group.targetContribution || group.agreedAmount || group.recommendedAmount || 2000;

  const templates: Record<TemplateType, { title: string; subtitle: string; icon: string; message: string }> = {
    invite: {
      title: 'Private Budget Invite',
      subtitle: 'Invite friends to share what contribution feels comfortable',
      icon: '🔒',
      message: `Hey guys! We're putting together a group gift for ${celebrant}. 🎁

To make it easy and avoid any financial awkwardness, we're using GiftTogether to find our group sweet spot.

👉 Your numbers are 100% PRIVATE — nobody in the group sees what you enter. It just calculates the fair consensus amount.

Drop your private comfort range here:
${shareUrl}

Join Code: ${group.createdShareCode || group.slug}`,
    },
    nudge: {
      title: 'Friendly Nudge',
      subtitle: 'Gentle reminder for friends who haven\'t responded yet',
      icon: '⏰',
      message: `Hey! Quick reminder for ${celebrant}'s group gift. ⏰

We're almost ready to reveal our group sweet spot! If you haven't yet, take 30 seconds to drop what contribution feels right for you (completely private):

${shareUrl}`,
    },
    voting: {
      title: 'Gift Voting',
      subtitle: 'Announce the sweet spot and invite friends to vote on gifts',
      icon: '🗳️',
      message: `Great news! We found our group sweet spot for ${celebrant} (${formatINR(agreedAmt)}/person). ✨

Now let's pick the gift they'll love most! Cast your vote or suggest a new idea here:
${shareUrl}`,
    },
    payment: {
      title: 'Payment Details & UPI',
      subtitle: 'Share contribution details and payment link',
      icon: '💳',
      message: `Hey everyone! We've chosen the gift for ${celebrant}! 🎁

• Agreed Contribution: ${formatINR(agreedAmt)} per person
${group.upiId ? `• UPI ID: ${group.upiId}` : ''}
${group.paymentNotes ? `• Note: ${group.paymentNotes}` : ''}

Please confirm your payment and track progress here:
${shareUrl}

Thank you for being part of this! 💖`,
    },
  };

  const activeMsg = templates[selectedTemplate].message;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(activeMsg);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(activeMsg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div 
      id="share-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="share-modal-container"
        className="bg-white rounded-[36px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EEE7E1] space-y-5 my-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#25D366]"></div>
              <span>WhatsApp & Social Hub</span>
            </div>
            <h3 className="text-2xl font-serif text-[#2D3339] italic">
              Invite & Coordinate Friends
            </h3>
            <p className="text-xs text-[#6D6862]">
              Share via WhatsApp with pre-crafted, socially polite messages.
            </p>
          </div>

          <button
            id="close-share-modal-btn"
            onClick={onClose}
            className="p-2 text-[#8E8881] hover:text-[#2D3339] hover:bg-[#F5F2ED] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Template Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A]">
            Select Message Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(templates) as TemplateType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedTemplate(type)}
                className={`p-2.5 rounded-2xl text-center border transition-all cursor-pointer ${
                  selectedTemplate === type
                    ? 'bg-[#2D3339] text-white border-[#2D3339] shadow-xs'
                    : 'bg-[#F8F6F3] text-[#2D3339] border-[#EEE7E1] hover:bg-[#EFECE6]'
                }`}
              >
                <div className="text-base">{templates[type].icon}</div>
                <div className="text-[11px] font-medium mt-1 truncate">
                  {templates[type].title}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Preview Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8E8881]">
              Preview Message
            </span>
            <button
              onClick={handleCopyText}
              className="text-[#2D3339] hover:text-black font-medium flex items-center gap-1 cursor-pointer"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-[#4CAF50]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
          <div className="p-4 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1] font-sans text-xs text-[#2D3339] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {activeMsg}
          </div>
        </div>

        {/* Primary Action: Direct to WhatsApp */}
        <div className="space-y-2.5 pt-1">
          <button
            id="share-whatsapp-btn"
            onClick={handleOpenWhatsApp}
            className="w-full py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium text-xs tracking-wide shadow-lg shadow-[#25D366]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-white" />
            <span>Open in WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Quick Copy Link Row */}
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#F8F6F3] border border-[#EEE7E1]">
            <span className="text-[11px] text-[#8E8881] px-2 truncate flex-1 font-mono">
              {shareUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-full bg-white border border-[#E5E0DA] text-xs font-medium text-[#2D3339] hover:bg-[#F5F2ED] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            >
              {copiedLink ? <Check className="w-3 h-3 text-[#4CAF50]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Privacy reminder */}
        <div className="p-3 bg-[#F8F6F3] rounded-2xl border border-[#EEE7E1] flex items-center gap-2 text-[11px] text-[#6D6862]">
          <Lock className="w-3.5 h-3.5 text-[#4CAF50] shrink-0" />
          <span>Friends only see their own private input. Group members will never see individual budgets.</span>
        </div>
      </div>
    </div>
  );
};
