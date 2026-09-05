import { useState, useEffect, useCallback } from 'react';
import { ParticipantBudget } from '../types/budget';
import {
  submitBudget,
  subscribePrivateBudget,
  getPrivateBudget,
  BudgetSubmissionInput,
} from '../services/budgetService';

export function useBudget(groupId: string | null) {
  const [myBudget, setMyBudget] = useState<ParticipantBudget | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setMyBudget(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Initial check from draft or fetch
    getPrivateBudget(groupId)
      .then((b) => {
        setMyBudget(b);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });

    // Real-time private listener for participant's own budget
    const unsub = subscribePrivateBudget(groupId, (budget) => {
      setMyBudget(budget);
      setIsLoading(false);
    });

    return () => {
      if (unsub) unsub();
    };
  }, [groupId]);

  const submit = useCallback(
    async (input: BudgetSubmissionInput) => {
      if (!groupId) throw new Error('No active group');
      setIsSubmitting(true);
      setError(null);
      try {
        await submitBudget(groupId, input);
        setIsSubmitting(false);
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err.message || 'Failed to submit budget');
        throw err;
      }
    },
    [groupId]
  );

  return {
    myBudget,
    isLoading,
    isSubmitting,
    error,
    submit,
  };
}
