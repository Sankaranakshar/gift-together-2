import React, { useState } from 'react';
import { X, ArrowRight, Search, KeyRound, Loader2 } from 'lucide-react';
import { GiftGroup } from '../types';
import { getGroupIdByShareCode } from '../services/groupService';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (identifier: string) => void | Promise<void>;
  availableGroups: GiftGroup[];
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onJoin,
  availableGroups,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim();
    if (!clean) return;

    setIsSearching(true);
    setError(null);

    // Extract identifier if user pasted full URL e.g. https://.../g/7xKp92LmQ
    let identifier = clean;
    if (clean.includes('/g/')) {
      identifier = clean.split('/g/')[1].split('?')[0].split('#')[0].split('/')[0];
    } else if (clean.includes('?group=')) {
      identifier = clean.split('?group=')[1].split('&')[0];
    }

    try {
      // If 6 characters uppercase or mixed, check share code index
      const resolvedGroupId = await getGroupIdByShareCode(identifier);
      if (resolvedGroupId) {
        setIsSearching(false);
        onJoin(resolvedGroupId);
        onClose();
        return;
      }

      // Otherwise try directly with identifier
      setIsSearching(false);
      onJoin(identifier);
      onClose();
    } catch (err: any) {
      setIsSearching(false);
      setError(err.message || 'Could not find group with this code.');
    }
  };

  return (
    <div 
      id="join-group-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        id="join-group-modal-container"
        className="bg-white rounded-[36px] max-w-md w-full p-8 shadow-2xl border border-[#EEE7E1] space-y-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
              Group Access
            </span>
            <h3 className="text-2xl font-serif text-[#2D3339] italic">
              Join a Gift Group
            </h3>
            <p className="text-xs text-[#6D6862]">
              Enter the 6-letter join code or shared link from your friend.
            </p>
          </div>

          <button
            id="close-join-modal-btn"
            onClick={onClose}
            className="p-2 text-[#8E8881] hover:text-[#2D3339] hover:bg-[#F5F2ED] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A]">
              Join Code or Link
            </label>
            <div className="relative">
              <input
                id="join-group-code-input"
                type="text"
                required
                disabled={isSearching}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. 7XKP92 or full invite link"
                className="w-full px-4 py-3 rounded-2xl bg-[#F8F6F3] border border-[#E5E0DA] text-[#1A1A1A] text-sm focus:outline-none focus:border-[#2D3339] transition-all uppercase placeholder:normal-case font-mono tracking-wider"
              />
            </div>
            {error && <p className="text-xs text-red-600 pt-1">{error}</p>}
          </div>

          <button
            id="submit-join-group-btn"
            type="submit"
            disabled={isSearching}
            className="w-full py-3.5 px-6 rounded-full bg-[#2D3339] hover:bg-[#1E2328] text-white font-medium text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Finding Group...</span>
              </>
            ) : (
              <>
                <span>Enter Group</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {availableGroups.length > 0 && (
          <div className="pt-3 border-t border-[#EEE7E1] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E8881]">
              Recent groups on this device
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {availableGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    onJoin(g.id);
                    onClose();
                  }}
                  className="w-full p-3 rounded-2xl bg-[#F8F6F3] hover:bg-[#F5F2ED] border border-[#EEE7E1] text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <span className="font-serif text-[#2D3339] italic text-sm">{g.coupleNames || g.coupleName}</span>
                  <span className="font-mono text-[11px] text-[#8E8881]">{g.createdShareCode || g.slug || g.id}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

