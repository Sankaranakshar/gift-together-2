import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  Calendar, 
  User, 
  Gift, 
  Users, 
  Loader2, 
  LogIn, 
  Clock, 
  Sparkles,
  Scale,
  HeartHandshake
} from 'lucide-react';
import { CreateGroupInput } from '../services/groupService';
import { OccasionType, ContributionMode } from '../types/group';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (input: CreateGroupInput) => Promise<void> | void;
  currentUser?: any;
  onSignIn?: () => Promise<any>;
  isSubmitting?: boolean;
}

const OCCASIONS: { id: OccasionType; label: string; icon: string }[] = [
  { id: 'wedding', label: 'Wedding', icon: '💍' },
  { id: 'birthday', label: 'Birthday', icon: '🎂' },
  { id: 'baby_shower', label: 'Baby Shower', icon: '👶' },
  { id: 'housewarming', label: 'Housewarming', icon: '🏡' },
  { id: 'farewell', label: 'Farewell', icon: '✈️' },
  { id: 'anniversary', label: 'Anniversary', icon: '🥂' },
  { id: 'custom', label: 'Celebration', icon: '🎉' },
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  currentUser,
  onSignIn,
  isSubmitting = false,
}) => {
  const [occasion, setOccasion] = useState<OccasionType>('wedding');
  const [coupleNames, setCoupleNames] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [contributionMode, setContributionMode] = useState<ContributionMode>('equal');
  const [weddingDate, setWeddingDate] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [giftDescription, setGiftDescription] = useState('');
  const [expectedParticipants, setExpectedParticipants] = useState(8);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.displayName && !creatorName) {
      setCreatorName(currentUser.displayName);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleNames.trim() || !creatorName.trim()) return;

    setLocalSubmitting(true);
    setErrorMessage(null);

    try {
      await onCreateGroup({
        coupleName: coupleNames.trim(),
        creatorName: creatorName.trim(),
        occasion,
        contributionMode,
        weddingDate: weddingDate || undefined,
        deadlineDate: deadlineDate || undefined,
        giftDescription: giftDescription.trim() || undefined,
        expectedParticipants: Number(expectedParticipants) || 8,
      });
      setLocalSubmitting(false);
      onClose();
    } catch (err: any) {
      setLocalSubmitting(false);
      setErrorMessage(err.message || 'Failed to create group. Please try again.');
    }
  };

  const isBusy = isSubmitting || localSubmitting;

  const getRecipientPlaceholder = () => {
    switch (occasion) {
      case 'wedding':
        return 'e.g. Rahul & Priya';
      case 'birthday':
        return 'e.g. Vikram';
      case 'baby_shower':
        return 'e.g. Ananya & Rohit';
      case 'housewarming':
        return 'e.g. The Sharma Family';
      case 'farewell':
        return 'e.g. Siddharth';
      default:
        return 'e.g. Priya & Arjun';
    }
  };

  return (
    <div 
      id="create-group-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="create-group-modal-container"
        className="bg-white rounded-[36px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EEE7E1] space-y-5 my-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]"></div>
              <span>Social Gift Planner</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif text-[#2D3339] italic">
              Start a Group Gift
            </h3>
            <p className="text-xs text-[#6D6862]">
              Coordinate private budgets, pick the ideal gift, and collect stress-free.
            </p>
          </div>

          <button
            id="close-create-modal-btn"
            onClick={onClose}
            disabled={isBusy}
            className="p-2 text-[#8E8881] hover:text-[#2D3339] hover:bg-[#F5F2ED] rounded-full transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Occasion Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A]">
              Occasion
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {OCCASIONS.map((occ) => (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => setOccasion(occ.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                    occasion === occ.id
                      ? 'bg-[#2D3339] text-white shadow-xs'
                      : 'bg-[#F8F6F3] text-[#6D6862] hover:bg-[#EFECE6] border border-[#EEE7E1]'
                  }`}
                >
                  <span>{occ.icon}</span>
                  <span>{occ.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient / Celebrant Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A] flex items-center gap-1.5">
              <span>Who is this gift for?</span>
              <span className="text-[#8E8881]">*</span>
            </label>
            <input
              id="create-couple-names-input"
              type="text"
              required
              disabled={isBusy}
              value={coupleNames}
              onChange={(e) => setCoupleNames(e.target.value)}
              placeholder={getRecipientPlaceholder()}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F6F3] border border-[#E5E0DA] text-[#1A1A1A] text-sm focus:outline-none focus:border-[#2D3339] transition-all disabled:opacity-60"
            />
          </div>

          {/* Organizer Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A] flex items-center gap-1.5">
              <span>Your Name (Organizer)</span>
              <span className="text-[#8E8881]">*</span>
            </label>
            <input
              id="create-creator-name-input"
              type="text"
              required
              disabled={isBusy}
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="e.g. Hari, Sneha, Rohan"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F6F3] border border-[#E5E0DA] text-[#1A1A1A] text-sm focus:outline-none focus:border-[#2D3339] transition-all disabled:opacity-60"
            />
          </div>

          {/* Contribution Philosophy Selector: Equal vs Flexible */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A] flex items-center gap-1.5">
              <span>Contribution Philosophy</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setContributionMode('equal')}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  contributionMode === 'equal'
                    ? 'bg-[#2D3339] text-white border-[#2D3339] shadow-xs'
                    : 'bg-[#F8F6F3] text-[#2D3339] border-[#EEE7E1] hover:bg-[#EFECE6]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Equal Split</span>
                </div>
                <p className={`text-[10px] mt-1 leading-snug ${
                  contributionMode === 'equal' ? 'text-stone-300' : 'text-[#8E8881]'
                }`}>
                  Everyone pays the group sweet spot amount equally.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setContributionMode('flexible')}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  contributionMode === 'flexible'
                    ? 'bg-[#2D3339] text-white border-[#2D3339] shadow-xs'
                    : 'bg-[#F8F6F3] text-[#2D3339] border-[#EEE7E1] hover:bg-[#EFECE6]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Give What Feels Right</span>
                </div>
                <p className={`text-[10px] mt-1 leading-snug ${
                  contributionMode === 'flexible' ? 'text-stone-300' : 'text-[#8E8881]'
                }`}>
                  Friends contribute according to individual comfort.
                </p>
              </button>
            </div>
          </div>

          {/* Details Grid: Expected Friends & Response Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A] flex items-center gap-1">
                <Users className="w-3 h-3 text-[#8E8881]" />
                <span>Expected Friends</span>
              </label>
              <input
                id="create-expected-friends-input"
                type="number"
                min="2"
                max="50"
                disabled={isBusy}
                value={expectedParticipants}
                onChange={(e) => setExpectedParticipants(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-2xl bg-[#F8F6F3] border border-[#E5E0DA] text-[#1A1A1A] text-sm focus:outline-none focus:border-[#2D3339] disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#8E8881]" />
                <span>Response Deadline</span>
                <span className="text-[#8E8881] font-normal">(Optional)</span>
              </label>
              <input
                id="create-deadline-input"
                type="date"
                disabled={isBusy}
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-[#F8F6F3] border border-[#E5E0DA] text-[#1A1A1A] text-sm focus:outline-none focus:border-[#2D3339] disabled:opacity-60"
              />
            </div>
          </div>

          {/* Gift Vision or Category */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A] flex items-center gap-1">
              <Gift className="w-3 h-3 text-[#8E8881]" />
              <span>Initial Gift Ideas or Preferences</span>
              <span className="text-[#8E8881] font-normal">(Optional)</span>
            </label>
            <input
              id="create-gift-desc-input"
              type="text"
              disabled={isBusy}
              value={giftDescription}
              onChange={(e) => setGiftDescription(e.target.value)}
              placeholder="e.g. Espresso machine, luxury resort stay, robot vacuum"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F6F3] border border-[#E5E0DA] text-[#1A1A1A] text-sm focus:outline-none focus:border-[#2D3339] transition-all disabled:opacity-60"
            />
          </div>

          <div className="pt-2">
            <button
              id="submit-create-group-btn"
              type="submit"
              disabled={isBusy}
              className="w-full py-3.5 px-6 rounded-full bg-[#2D3339] hover:bg-[#1E2328] text-white font-medium text-sm tracking-wide shadow-lg shadow-[#2D3339]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Group...</span>
                </>
              ) : (
                <>
                  <span>Create Group & Start Coordination</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
