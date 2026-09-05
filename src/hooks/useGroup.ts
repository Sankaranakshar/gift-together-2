import { useState, useEffect } from 'react';
import { GiftGroup } from '../types/group';
import { Participant } from '../types/participant';
import { subscribeGroup, getGroup, revealRecommendation, setAgreedContribution } from '../services/groupService';
import { subscribeParticipants, getParticipantSession } from '../services/participantService';
import { isFirebaseConfigured, auth } from '../services/firebase';
import { INITIAL_DEMO_GROUP } from '../utils/storage';

export function useGroup(groupId: string | null, isDemoMode = false) {
  const [group, setGroup] = useState<GiftGroup | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      setParticipants([]);
      setIsLoading(false);
      return;
    }

    if (isDemoMode || groupId.startsWith('demo-') || !isFirebaseConfigured) {
      // Use demo data
      setGroup(INITIAL_DEMO_GROUP as unknown as GiftGroup);
      setParticipants(INITIAL_DEMO_GROUP.participants as unknown as Participant[]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Initial fetch to immediately populate
    getGroup(groupId).then((g) => {
      if (!g) {
        setError('This gift group does not exist or has expired.');
        setIsLoading(false);
        return;
      }
      setGroup(g);
      setIsLoading(false);
    }).catch((err) => {
      setError(err.message || 'Failed to load group');
      setIsLoading(false);
    });

    // Real-time listener for group metadata & recommendations
    const unsubGroup = subscribeGroup(groupId, (updatedGroup) => {
      if (updatedGroup) {
        setGroup((prev) => ({
          ...(prev || {}),
          ...updatedGroup,
          participants: prev?.participants || [],
        } as GiftGroup));
      } else {
        setError('Group not found.');
      }
    });

    // Real-time listener for participants list
    const unsubParticipants = subscribeParticipants(groupId, (updatedParticipants) => {
      setParticipants(updatedParticipants);
      setGroup((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          participants: updatedParticipants,
          participantCount: Math.max(prev.participantCount || 0, updatedParticipants.length),
        };
      });
    });

    return () => {
      if (unsubGroup) unsubGroup();
      if (unsubParticipants) unsubParticipants();
    };
  }, [groupId, isDemoMode]);

  const currentUid = auth?.currentUser?.uid;
  const session = groupId ? getParticipantSession(groupId) : null;
  const isCreator = Boolean(
    (group?.createdBy && currentUid && group.createdBy === currentUid) ||
    session?.isCreator ||
    (isDemoMode && true)
  );

  const currentParticipant = participants.find(
    (p) => p.id === currentUid || p.id === session?.participantId
  ) || null;

  const handleReveal = async () => {
    if (!groupId || isDemoMode) return;
    await revealRecommendation(groupId);
  };

  const handleSetAgreed = async (amount: number) => {
    if (!groupId || isDemoMode) return;
    await setAgreedContribution(groupId, amount);
  };

  return {
    group,
    participants,
    isLoading,
    error,
    isCreator,
    currentParticipant,
    revealRecommendation: handleReveal,
    setAgreedContribution: handleSetAgreed,
  };
}
