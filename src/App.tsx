import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  GiftGroup, 
  Participant, 
  AppView, 
  GroupFitEvaluation, 
  AlgorithmResult,
  GroupPhase 
} from './types';
import { PriorityPreference } from './types/budget';
import { 
  getStoredGroups, 
  saveGroup, 
  saveGroups, 
  resetToDemoData, 
  getActiveGroupId, 
  setActiveGroupId,
  INITIAL_DEMO_GROUP
} from './utils/storage';
import { calculateContributionRecommendation } from './utils/algorithm';
import { 
  parseCurrentRoute, 
  navigateTo, 
  ParsedRoute 
} from './utils/routing';

import { 
  createGroup, 
  getGroup, 
  getGroupIdByShareCode, 
  subscribeGroup, 
  revealRecommendation, 
  setAgreedContribution,
  setGroupPhase,
  CreateGroupInput 
} from './services/groupService';
import { 
  subscribeParticipants, 
  updateParticipantPayment, 
  getParticipantSession, 
  recoverParticipantByToken,
  joinGroup 
} from './services/participantService';
import { submitBudget } from './services/budgetService';
import { updateGroupPaymentConfig } from './services/paymentService';
import { onAuthStateChanged } from 'firebase/auth';
import { ensureAnonymousAuth, isFirebaseConfigured, auth, signInWithGoogle, logOut } from './services/firebase';

import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { GroupDashboard } from './components/GroupDashboard';
import { BudgetForm } from './components/BudgetForm';
import { ResultsView } from './components/ResultsView';
import { ChooseGiftView } from './components/ChooseGiftView';
import { PaymentTracker } from './components/PaymentTracker';
import { CelebrationView } from './components/CelebrationView';
import { CreateGroupModal } from './components/CreateGroupModal';
import { JoinGroupModal } from './components/JoinGroupModal';
import { ShareModal } from './components/ShareModal';
import { PrivacyGuaranteeModal } from './components/PrivacyGuaranteeModal';

import { AlertCircle, Plus, Search, Loader2 } from 'lucide-react';

export default function App() {
  // 1. URL Route State
  const [route, setRoute] = useState<ParsedRoute>(() => parseCurrentRoute());
  
  // 2. Local/cached groups collection
  const [savedGroups, setSavedGroups] = useState<GiftGroup[]>(() => getStoredGroups());

  // 3. Active Group & Real-time State
  const [activeGroup, setActiveGroup] = useState<GiftGroup | null>(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState<boolean>(false);
  const [groupLoadError, setGroupLoadError] = useState<string | null>(null);

  // 4. Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSubmittingBudget, setIsSubmittingBudget] = useState(false);

  // 5. Sync Route on popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseCurrentRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 6. Navigation Helper
  const navigateToView = useCallback((view: AppView, targetGroupId?: string) => {
    const gid = targetGroupId || route.groupId || activeGroup?.id;
    if (view === 'landing' || !gid) {
      navigateTo('/');
      setRoute({ view: 'landing', groupId: null, recoveryToken: null });
      return;
    }

    let path = `/g/${gid}`;
    if (view === 'budget-form') path = `/g/${gid}/budget`;
    else if (view === 'results') path = `/g/${gid}/results`;
    else if (view === 'choose-gift') path = `/g/${gid}/choose`;
    else if (view === 'payments') path = `/g/${gid}/payments`;
    else if (view === 'celebration') path = `/g/${gid}/celebration`;

    navigateTo(path);
    setRoute({ view: view as any, groupId: gid, recoveryToken: null });
  }, [route.groupId, activeGroup?.id]);

  // 7. Firebase Auth State & anonymous auth in background
  const [currentUser, setCurrentUser] = useState<any>(() => auth?.currentUser || null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    if (isFirebaseConfigured && !auth.currentUser) {
      ensureAnonymousAuth().catch(console.warn);
    }
    return () => unsubscribe();
  }, []);

  // 8. Load Group when route.groupId changes
  useEffect(() => {
    const currentGroupId = route.groupId;

    if (!currentGroupId) {
      setActiveGroup(null);
      setIsLoadingGroup(false);
      setGroupLoadError(null);
      return;
    }

    // A. Demo Group
    if (currentGroupId === 'demo-rithika-arjun' || currentGroupId === INITIAL_DEMO_GROUP.id) {
      const demo = savedGroups.find(g => g.id === INITIAL_DEMO_GROUP.id) || INITIAL_DEMO_GROUP;
      setActiveGroup(demo as GiftGroup);
      setActiveGroupId(demo.id);
      setIsLoadingGroup(false);
      setGroupLoadError(null);
      return;
    }

    // B. Check if it exists in local storage cache first for instant feedback
    const localCached = savedGroups.find(g => g.id === currentGroupId || g.slug === currentGroupId);
    if (localCached) {
      setActiveGroup(localCached);
    }

    // C. Fetch from Firestore / Resolve Share Code
    setIsLoadingGroup(true);
    setGroupLoadError(null);

    let isSubscribed = true;
    let unsubGroup: (() => void) | null = null;
    let unsubParticipants: (() => void) | null = null;

    const loadRemoteGroup = async () => {
      try {
        let resolvedId = currentGroupId;

        // Try direct fetch
        let fetched = await getGroup(resolvedId);

        // If not found, try resolving as a 6-character short share code
        if (!fetched) {
          const mappedId = await getGroupIdByShareCode(currentGroupId);
          if (mappedId) {
            resolvedId = mappedId;
            fetched = await getGroup(resolvedId);
          }
        }

        if (!isSubscribed) return;

        if (!fetched) {
          if (!localCached) {
            setGroupLoadError(`Could not find group with identifier: "${currentGroupId}".`);
          }
          setIsLoadingGroup(false);
          return;
        }

        // Successfully found group
        setActiveGroup(fetched);
        setActiveGroupId(fetched.id);
        setIsLoadingGroup(false);

        // Update local saved groups list
        setSavedGroups(prev => {
          const updated = [fetched!, ...prev.filter(g => g.id !== fetched!.id)];
          saveGroups(updated);
          return updated;
        });

        // Handle recovery token if provided in URL
        if (route.recoveryToken) {
          await recoverParticipantByToken(fetched.id, route.recoveryToken);
        }

        // Subscribe to real-time group changes
        unsubGroup = subscribeGroup(fetched.id, (updated) => {
          if (!isSubscribed) return;
          if (updated) {
            setActiveGroup(prev => {
              if (!prev) return null;
              return {
                ...prev,
                ...updated,
                participants: prev.participants,
              };
            });
          }
        });

        // Subscribe to real-time participants changes
        unsubParticipants = subscribeParticipants(fetched.id, (updatedParts) => {
          if (!isSubscribed) return;
          setActiveGroup(prev => {
            if (!prev) return null;
            return {
              ...prev,
              participants: updatedParts,
              participantCount: updatedParts.length,
            };
          });
        });
      } catch (err: any) {
        if (!isSubscribed) return;
        setIsLoadingGroup(false);
        if (!localCached) {
          setGroupLoadError(err.message || 'Failed to connect to group.');
        }
      }
    };

    loadRemoteGroup();

    return () => {
      isSubscribed = false;
      if (unsubGroup) unsubGroup();
      if (unsubParticipants) unsubParticipants();
    };
  }, [route.groupId, route.recoveryToken]);

  // 9. Recommendation Calculation
  const algorithmResult: AlgorithmResult = useMemo(() => {
    if (!activeGroup || !activeGroup.participants) {
      return calculateContributionRecommendation([]);
    }
    return calculateContributionRecommendation(activeGroup.participants);
  }, [activeGroup?.participants]);

  // Selected Option state
  const [selectedOption, setSelectedOption] = useState<GroupFitEvaluation | null>(null);

  useEffect(() => {
    if (algorithmResult?.recommended) {
      setSelectedOption(algorithmResult.recommended);
    }
  }, [algorithmResult]);

  // Current participant in active group
  const currentParticipant = useMemo(() => {
    if (!activeGroup) return null;
    const session = getParticipantSession(activeGroup.id);
    const currentUid = auth?.currentUser?.uid;

    if (session?.participantId) {
      const found = activeGroup.participants.find(p => p.id === session.participantId);
      if (found) return found;
    }

    if (currentUid) {
      const found = activeGroup.participants.find(p => p.id === currentUid);
      if (found) return found;
    }

    return null;
  }, [activeGroup]);

  const isCreator = useMemo(() => {
    if (!activeGroup) return false;
    if (activeGroup.id === INITIAL_DEMO_GROUP.id) return true;
    const session = getParticipantSession(activeGroup.id);
    const currentUid = auth?.currentUser?.uid;
    return Boolean(
      (activeGroup.createdBy && currentUid && activeGroup.createdBy === currentUid) ||
      session?.isCreator ||
      currentParticipant?.isCreator
    );
  }, [activeGroup, currentParticipant]);

  // 10. Group Creation Action
  const handleCreateGroup = async (input: CreateGroupInput) => {
    try {
      const newGroup = await createGroup(input);
      const updated = [newGroup, ...savedGroups.filter(g => g.id !== newGroup.id)];
      saveGroups(updated);
      setSavedGroups(updated);
      setActiveGroup(newGroup);
      setActiveGroupId(newGroup.id);

      navigateToView('group', newGroup.id);
      setIsShareOpen(true);
    } catch (err: any) {
      console.error('Failed to create group:', err);
      throw err;
    }
  };

  // 11. Join Group Action
  const handleJoinGroup = async (identifier: string) => {
    try {
      let targetId = identifier.trim();
      const mappedId = await getGroupIdByShareCode(targetId);
      if (mappedId) {
        targetId = mappedId;
      }

      navigateToView('group', targetId);
    } catch (err: any) {
      alert(`Could not join group: ${err.message || 'Unknown error'}`);
    }
  };

  // 12. Reset Demo Group
  const handleResetDemo = () => {
    const fresh = resetToDemoData();
    setSavedGroups(prev => [fresh, ...prev.filter(g => g.id !== fresh.id)]);
    setActiveGroup(fresh);
    navigateToView('group', fresh.id);
  };

  // 13. Save / Submit Budget (With Domain Separation & Psychological Framing)
  const handleSaveBudget = async (data: {
    name: string;
    couldDo: number;
    feelsRight: number;
    wouldStretchTo: number;
    priorityPreference: PriorityPreference;
    minAmount?: number;
    comfortableAmount?: number;
    maxAmount?: number;
  }) => {
    if (!activeGroup) return;

    setIsSubmittingBudget(true);

    try {
      // If Demo Mode
      if (activeGroup.id === INITIAL_DEMO_GROUP.id) {
        const existingIndex = activeGroup.participants.findIndex(
          p => p.id === currentParticipant?.id || p.name.toLowerCase() === data.name.toLowerCase()
        );

        let updatedParts = [...activeGroup.participants];
        if (existingIndex >= 0) {
          updatedParts[existingIndex] = {
            ...updatedParts[existingIndex],
            name: data.name,
            couldDo: data.couldDo,
            feelsRight: data.feelsRight,
            wouldStretchTo: data.wouldStretchTo,
            minAmount: data.couldDo,
            comfortableAmount: data.feelsRight,
            maxAmount: data.wouldStretchTo,
            submittedAt: new Date().toISOString(),
            hasSubmitted: true,
          };
        } else {
          updatedParts.push({
            id: `part-${Date.now()}`,
            name: data.name,
            displayName: data.name,
            couldDo: data.couldDo,
            feelsRight: data.feelsRight,
            wouldStretchTo: data.wouldStretchTo,
            minAmount: data.couldDo,
            comfortableAmount: data.feelsRight,
            maxAmount: data.wouldStretchTo,
            submittedAt: new Date().toISOString(),
            hasSubmitted: true,
            isCreator: false,
          });
        }

        const updatedGroup: GiftGroup = {
          ...activeGroup,
          participants: updatedParts,
          participantCount: updatedParts.length,
        };
        saveGroup(updatedGroup);
        setActiveGroup(updatedGroup);
        setIsSubmittingBudget(false);
        navigateToView('group');
        return;
      }

      // Live Firestore Group: Writes to private subcollection & calculates sanitized aggregate
      await submitBudget(activeGroup.id, {
        displayName: data.name,
        couldDo: data.couldDo,
        feelsRight: data.feelsRight,
        wouldStretchTo: data.wouldStretchTo,
        priorityPreference: data.priorityPreference,
        minAmount: data.couldDo,
        comfortableAmount: data.feelsRight,
        maxAmount: data.wouldStretchTo,
      });

      setIsSubmittingBudget(false);
      navigateToView('group');
    } catch (err: any) {
      setIsSubmittingBudget(false);
      throw err;
    }
  };

  // 14. Add Simulated Participant
  const handleAddSimulatedParticipant = async (data: {
    name: string;
    couldDo?: number;
    feelsRight?: number;
    wouldStretchTo?: number;
    minAmount: number;
    comfortableAmount: number;
    maxAmount: number;
  }) => {
    if (!activeGroup) return;

    if (activeGroup.id === INITIAL_DEMO_GROUP.id) {
      const newPart: Participant = {
        id: `sim-${Date.now()}`,
        name: data.name,
        displayName: data.name,
        couldDo: data.couldDo ?? data.minAmount,
        feelsRight: data.feelsRight ?? data.comfortableAmount,
        wouldStretchTo: data.wouldStretchTo ?? data.maxAmount,
        minAmount: data.minAmount,
        comfortableAmount: data.comfortableAmount,
        maxAmount: data.maxAmount,
        submittedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        hasSubmitted: true,
        isCreator: false,
      };
      const updated: GiftGroup = {
        ...activeGroup,
        participants: [...activeGroup.participants, newPart],
        participantCount: activeGroup.participants.length + 1,
      };
      saveGroup(updated);
      setActiveGroup(updated);
      return;
    }

    try {
      await joinGroup(activeGroup.id, data.name);
      await submitBudget(activeGroup.id, {
        displayName: data.name,
        couldDo: data.couldDo ?? data.minAmount,
        feelsRight: data.feelsRight ?? data.comfortableAmount,
        wouldStretchTo: data.wouldStretchTo ?? data.maxAmount,
        priorityPreference: 'balanced',
        minAmount: data.minAmount,
        comfortableAmount: data.comfortableAmount,
        maxAmount: data.maxAmount,
      });
    } catch (err) {
      console.warn('Simulation error:', err);
    }
  };

  // 15. Remove Participant
  const handleRemoveParticipant = (participantId: string) => {
    if (!activeGroup) return;
    const updated: GiftGroup = {
      ...activeGroup,
      participants: activeGroup.participants.filter(p => p.id !== participantId),
      participantCount: Math.max(0, activeGroup.participants.length - 1),
    };
    if (activeGroup.id === INITIAL_DEMO_GROUP.id) {
      saveGroup(updated);
    }
    setActiveGroup(updated);
  };

  // 16. Update Payment Info
  const handleUpdateGroupPaymentInfo = async (info: {
    targetContribution?: number;
    upiId?: string;
    paymentNotes?: string;
  }) => {
    if (!activeGroup) return;

    if (activeGroup.id === INITIAL_DEMO_GROUP.id) {
      const updated: GiftGroup = {
        ...activeGroup,
        targetContribution: info.targetContribution ?? activeGroup.targetContribution,
        upiId: info.upiId ?? activeGroup.upiId,
        paymentNotes: info.paymentNotes ?? activeGroup.paymentNotes,
      };
      saveGroup(updated);
      setActiveGroup(updated);
      return;
    }

    try {
      await updateGroupPaymentConfig(activeGroup.id, {
        targetContribution: info.targetContribution,
        upiId: info.upiId,
        paymentNotes: info.paymentNotes,
      });
    } catch (err) {
      console.error('Update payment info error:', err);
    }
  };

  // 17. Reveal Recommendation
  const handleRevealRecommendation = async () => {
    if (!activeGroup) return;

    if (activeGroup.id === INITIAL_DEMO_GROUP.id) {
      const updated: GiftGroup = {
        ...activeGroup,
        isRevealed: true,
        phase: 1,
      };
      saveGroup(updated);
      setActiveGroup(updated);
      navigateToView('results');
      return;
    }

    try {
      await revealRecommendation(activeGroup.id);
      navigateToView('results');
    } catch (err) {
      console.error('Reveal error:', err);
      navigateToView('results');
    }
  };

  // 18. Lock Consensus Amount & Transition to Choose Gift (Phase 2)
  const handleLockConsensusAmount = async (amount: number) => {
    if (!activeGroup) return;

    if (activeGroup.id === INITIAL_DEMO_GROUP.id) {
      const updated: GiftGroup = {
        ...activeGroup,
        targetContribution: amount,
        targetGiftAmount: amount * (activeGroup.participants.length || 8),
        phase: 2,
      };
      saveGroup(updated);
      setActiveGroup(updated);
      navigateToView('choose-gift');
      return;
    }

    try {
      await setAgreedContribution(activeGroup.id, amount);
      await setGroupPhase(activeGroup.id, 2);
      navigateToView('choose-gift');
    } catch (err) {
      console.error('Lock amount error:', err);
      navigateToView('choose-gift');
    }
  };

  // 19. Set Group Phase
  const handleSetPhase = async (phase: GroupPhase) => {
    if (!activeGroup) return;

    if (activeGroup.id === INITIAL_DEMO_GROUP.id) {
      const updated: GiftGroup = {
        ...activeGroup,
        phase,
      };
      saveGroup(updated);
      setActiveGroup(updated);
      return;
    }

    try {
      await setGroupPhase(activeGroup.id, phase);
    } catch (err) {
      console.warn('Set phase error:', err);
    }
  };

  const currentView = route.view;

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCFB] text-[#1A1A1A] selection:bg-[#2D3339] selection:text-white font-sans antialiased">
      {/* Top Header */}
      <Header
        currentView={currentView as any}
        activeGroup={activeGroup}
        currentUser={currentUser}
        onNavigate={(v) => navigateToView(v)}
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenPrivacyModal={() => setIsPrivacyOpen(true)}
        onResetDemo={handleResetDemo}
        onSignIn={signInWithGoogle}
        onSignOut={logOut}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Loading Spinner */}
        {isLoadingGroup && !activeGroup && (
          <div className="py-24 text-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#2D3339] animate-spin mx-auto" />
            <p className="text-sm font-serif italic text-[#6D6862]">
              Opening gift group...
            </p>
          </div>
        )}

        {/* Group Not Found State */}
        {groupLoadError && !activeGroup && (
          <div className="max-w-md mx-auto bg-white rounded-[36px] p-8 sm:p-10 border border-[#EEE7E1] shadow-xs text-center space-y-6 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-[#F8F6F3] border border-[#EEE7E1] flex items-center justify-center mx-auto text-[#8E8881]">
              <AlertCircle className="w-6 h-6 text-[#8E8881]" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8E8881]">
                Group Access
              </span>
              <h3 className="text-2xl font-serif text-[#2D3339] italic">
                Gift Group Not Found
              </h3>
              <p className="text-xs text-[#6D6862] leading-relaxed">
                {groupLoadError}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={() => setIsJoinOpen(true)}
                className="w-full py-3 px-5 rounded-full bg-[#2D3339] hover:bg-[#1E2328] text-white text-xs font-medium tracking-wide transition-all cursor-pointer"
              >
                Enter Another Code or Link
              </button>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="w-full py-3 px-5 rounded-full border border-[#E5E0DA] hover:bg-[#F5F2ED] text-[#2D3339] text-xs font-medium tracking-wide transition-all cursor-pointer"
              >
                Create a New Gift Group
              </button>
              <button
                onClick={handleResetDemo}
                className="text-xs text-[#8E8881] hover:text-[#2D3339] pt-2 underline cursor-pointer"
              >
                Or explore the 8-friend Demo Group
              </button>
            </div>
          </div>
        )}

        {/* View: Landing */}
        {currentView === 'landing' && (
          <LandingPage
            onCreateGroup={() => setIsCreateOpen(true)}
            onJoinGroup={() => setIsJoinOpen(true)}
            onOpenDemoGroup={() => {
              const demo = savedGroups.find(g => g.id === INITIAL_DEMO_GROUP.id) || INITIAL_DEMO_GROUP;
              setActiveGroup(demo as GiftGroup);
              navigateToView('group', demo.id);
            }}
            savedGroups={savedGroups}
            onSelectGroup={(gid) => navigateToView('group', gid)}
          />
        )}

        {/* View: Group Dashboard (Phase 01) */}
        {currentView === 'group' && activeGroup && (
          <GroupDashboard
            group={activeGroup}
            result={algorithmResult}
            onRevealRecommendation={handleRevealRecommendation}
            onOpenBudgetForm={() => navigateToView('budget-form')}
            onOpenShare={() => setIsShareOpen(true)}
            onGoToPayments={() => navigateToView('payments')}
            onGoToResults={() => navigateToView('results')}
            onGoToChooseGift={() => navigateToView('choose-gift')}
            onGoToCelebration={() => navigateToView('celebration')}
            onLockConsensusAmount={handleLockConsensusAmount}
            onSetPhase={handleSetPhase}
            onAddSimulatedParticipant={handleAddSimulatedParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            isCreator={isCreator}
          />
        )}

        {/* View: Budget Form */}
        {currentView === 'budget-form' && activeGroup && (
          <BudgetForm
            group={activeGroup}
            currentParticipant={currentParticipant}
            currentUser={currentUser}
            onSignIn={signInWithGoogle}
            onSave={handleSaveBudget}
            onCancel={() => navigateToView('group')}
            isSubmitting={isSubmittingBudget}
          />
        )}

        {/* View: Results & Recommendation Sweet Spot */}
        {currentView === 'results' && activeGroup && (
          <ResultsView
            group={activeGroup}
            result={algorithmResult}
            selectedOption={selectedOption || algorithmResult.recommended}
            onSelectOption={(opt) => {
              setSelectedOption(opt);
              handleUpdateGroupPaymentInfo({ targetContribution: opt.amount });
            }}
            onGoToPayments={() => navigateToView('payments')}
            onGoToChooseGift={() => navigateToView('choose-gift')}
            onOpenShare={() => setIsShareOpen(true)}
            onEditMyBudget={() => navigateToView('budget-form')}
            onLockAmount={handleLockConsensusAmount}
            isCreator={isCreator}
          />
        )}

        {/* View: Choose Gift (Phase 02) */}
        {currentView === 'choose-gift' && activeGroup && (
          <ChooseGiftView
            group={activeGroup}
            currentParticipant={currentParticipant}
            onBackToDashboard={() => navigateToView('group')}
            onGoToPayments={() => navigateToView('payments')}
            onOpenShare={() => setIsShareOpen(true)}
            isCreator={isCreator}
          />
        )}

        {/* View: Payment Tracker (Phase 03) */}
        {currentView === 'payments' && activeGroup && (
          <PaymentTracker
            group={activeGroup}
            currentParticipant={currentParticipant}
            onUpdateGroupPaymentInfo={handleUpdateGroupPaymentInfo}
            onBackToDashboard={() => navigateToView('group')}
            onAdvanceToPhase4={() => {
              handleSetPhase(4);
              navigateToView('celebration');
            }}
            isCreator={isCreator}
          />
        )}

        {/* View: Celebration & Digital Card (Phase 04) */}
        {currentView === 'celebration' && activeGroup && (
          <CelebrationView
            group={activeGroup}
            currentParticipant={currentParticipant}
            onBackToDashboard={() => navigateToView('group')}
            onOpenShare={() => setIsShareOpen(true)}
          />
        )}
      </main>

      {/* Mobile Navigation Bar */}
      {activeGroup && currentView !== 'landing' && (
        <div className="md:hidden sticky bottom-0 z-30 bg-[#FDFCFB]/95 backdrop-blur-md border-t border-[#EEE7E1] px-4 py-3 flex items-center justify-around text-[10px] font-bold uppercase tracking-[0.15em] text-[#8E8881]">
          <button
            onClick={() => navigateToView('group')}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${currentView === 'group' ? 'text-[#2D3339]' : 'hover:text-[#2D3339]'}`}
          >
            <span>01 Decide</span>
          </button>
          <button
            onClick={() => navigateToView('choose-gift')}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${currentView === 'choose-gift' ? 'text-[#2D3339]' : 'hover:text-[#2D3339]'}`}
          >
            <span>02 Choose</span>
          </button>
          <button
            onClick={() => navigateToView('payments')}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${currentView === 'payments' ? 'text-[#2D3339]' : 'hover:text-[#2D3339]'}`}
          >
            <span>03 Collect</span>
          </button>
          <button
            onClick={() => navigateToView('celebration')}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${currentView === 'celebration' ? 'text-[#2D3339]' : 'hover:text-[#2D3339]'}`}
          >
            <span>04 Done</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateGroup={handleCreateGroup}
        currentUser={currentUser}
        onSignIn={signInWithGoogle}
      />

      <JoinGroupModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoin={handleJoinGroup}
        availableGroups={savedGroups}
      />

      {activeGroup && (
        <ShareModal
          group={activeGroup}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      <PrivacyGuaranteeModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}
