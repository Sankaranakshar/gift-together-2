import React from 'react';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Share2, 
  RotateCcw, 
  ChevronRight, 
  Plus, 
  Home,
  CheckCircle2,
  Sparkles,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { GiftGroup, AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  activeGroup: GiftGroup | null;
  currentUser?: any;
  onNavigate: (view: AppView) => void;
  onOpenCreate: () => void;
  onOpenPrivacyModal: () => void;
  onResetDemo: () => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  activeGroup,
  currentUser,
  onNavigate,
  onOpenCreate,
  onOpenPrivacyModal,
  onResetDemo,
  onSignIn,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-md border-b border-[#EEE7E1]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 h-18 flex items-center justify-between gap-4">
        {/* Logo & Brand matching Editorial Theme */}
        <div 
          id="header-brand-logo"
          className="flex items-center gap-3 cursor-pointer group select-none" 
          onClick={() => onNavigate('landing')}
        >
          <div className="w-8 h-8 bg-[#2D3339] rounded-full flex items-center justify-center text-white font-serif font-bold text-base shadow-xs transition-transform group-hover:scale-105">
            G
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-medium tracking-tight text-[#1A1A1A]">
              GiftTogether
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-[0.2em] font-bold text-[#8E8881]">
              Editorial
            </span>
          </div>
        </div>

        {/* Center Breadcrumb / Active Group Link Pill */}
        {activeGroup && currentView !== 'landing' && (
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-[#F5F2ED] rounded-full border border-[#E5E0DA]">
            {activeGroup.id === 'demo-rithika-arjun' ? (
              <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                Demo
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8881]">
                Live Group
              </span>
            )}
            <span 
              className="text-xs sm:text-sm font-medium text-[#2D3339] max-w-[160px] truncate cursor-pointer hover:underline"
              onClick={() => onNavigate('group')}
            >
              {activeGroup.coupleNames || activeGroup.coupleName}
            </span>
            <span className="text-[#8E8881] text-xs">/</span>
            <span className="text-xs text-[#6D6862] capitalize">
              {currentView === 'group' && 'Dashboard'}
              {currentView === 'budget-form' && 'My Budget'}
              {currentView === 'results' && 'Recommendation'}
              {currentView === 'payments' && 'Payments'}
            </span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Privacy info button pill */}
          <button
            id="privacy-guarantee-header-btn"
            onClick={onOpenPrivacyModal}
            className="px-3.5 py-1.5 rounded-full border border-[#E5E0DA] bg-white hover:bg-[#F5F2ED] text-[#2D3339] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            title="Privacy Guarantee: 100% Private Budgets"
          >
            <div className="w-2 h-2 bg-[#4CAF50] rounded-full"></div>
            <span className="text-[11px] font-medium tracking-wide">100% Private</span>
          </button>

          {/* User Authentication state */}
          {currentUser ? (
            <div 
              id="header-user-badge"
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-[#E5E0DA] bg-white shadow-2xs"
            >
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="" 
                  className="w-5 h-5 rounded-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#2D3339] text-white flex items-center justify-center text-[10px] font-bold">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline max-w-[90px] truncate text-[#2D3339] font-medium text-[11px]">
                {currentUser.displayName?.split(' ')[0] || 'Signed in'}
              </span>
              {onSignOut && (
                <button
                  id="header-sign-out-btn"
                  onClick={onSignOut}
                  title="Sign out"
                  className="text-[#8E8881] hover:text-[#2D3339] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : onSignIn ? (
            <button
              id="header-sign-in-btn"
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide rounded-full border border-[#E5E0DA] bg-white hover:bg-[#F5F2ED] text-[#2D3339] transition-all cursor-pointer shadow-2xs"
              title="Sign in with Google"
            >
              <LogIn className="w-3.5 h-3.5 text-[#2D3339]" />
              <span className="hidden sm:inline">Sign in</span>
            </button>
          ) : null}

          {/* Create new group */}
          <button
            id="header-create-group-btn"
            onClick={onOpenCreate}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-medium tracking-wide rounded-full bg-[#2D3339] hover:bg-[#1E2328] text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Group</span>
          </button>

          {/* Reset demo data */}
          <button
            id="reset-demo-btn"
            onClick={onResetDemo}
            className="w-9 h-9 rounded-full border border-[#E5E0DA] flex items-center justify-center text-[#8E8881] hover:text-[#2D3339] hover:bg-[#F5F2ED] transition-colors cursor-pointer"
            title="Reset to 8-friend Seed Demo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
