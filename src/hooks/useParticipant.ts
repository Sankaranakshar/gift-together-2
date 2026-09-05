import { useState, useEffect, useCallback } from 'react';
import { Participant } from '../types/participant';
import {
  joinGroup,
  getParticipantSession,
  recoverParticipantByToken,
  ParticipantSession,
} from '../services/participantService';
import { auth, ensureAnonymousAuth } from '../services/firebase';

export function useParticipant(groupId: string | null, participants: Participant[] = []) {
  const [session, setSession] = useState<ParticipantSession | null>(null);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setSession(null);
      return;
    }
    const stored = getParticipantSession(groupId);
    setSession(stored);
  }, [groupId]);

  const currentUid = auth?.currentUser?.uid;
  const currentParticipant =
    participants.find(
      (p) => p.id === currentUid || (session && p.id === session.participantId)
    ) || null;

  const join = useCallback(
    async (displayName: string): Promise<Participant> => {
      if (!groupId) throw new Error('No active group');
      setIsJoining(true);
      setError(null);
      try {
        await ensureAnonymousAuth();
        const part = await joinGroup(groupId, displayName);
        const newSession = getParticipantSession(groupId);
        setSession(newSession);
        setIsJoining(false);
        return part;
      } catch (err: any) {
        setIsJoining(false);
        setError(err.message || 'Failed to join group');
        throw err;
      }
    },
    [groupId]
  );

  const recover = useCallback(
    async (token: string): Promise<boolean> => {
      if (!groupId) return false;
      try {
        const recovered = await recoverParticipantByToken(groupId, token);
        if (recovered) {
          const newSession = getParticipantSession(groupId);
          setSession(newSession);
          return true;
        }
        return false;
      } catch (err) {
        console.error('Recovery failed:', err);
        return false;
      }
    },
    [groupId]
  );

  return {
    currentParticipant,
    session,
    isJoining,
    error,
    join,
    recover,
  };
}
