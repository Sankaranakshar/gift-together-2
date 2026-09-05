export * from './types/group';
export * from './types/participant';
export * from './types/budget';

export interface AlgorithmResult {
  hasValidRecommendation: boolean;
  recommended: {
    amount: number;
    totalBudget: number;
    comfortableCount: number;
    stretchingCount: number;
    overMaxCount: number;
    score: number;
    label: string;
    description: string;
  };
  conservative?: {
    amount: number;
    totalBudget: number;
    comfortableCount: number;
    stretchingCount: number;
    overMaxCount: number;
    score: number;
    label: string;
    description: string;
  };
  generous?: {
    amount: number;
    totalBudget: number;
    comfortableCount: number;
    stretchingCount: number;
    overMaxCount: number;
    score: number;
    label: string;
    description: string;
  };
  allEvaluations: any[];
  totalResponded: number;
  isUnanimouslyComfortable: boolean;
  noUniversalComfort: boolean;
  explanation: string;
  comfortableRange: {
    min: number;
    max: number;
  };
  consensusStrength?: 'Strong' | 'Good' | 'Mixed' | 'Difficult';
  consensusSummary?: string;
  sweetSpotTiers?: {
    easy: { amount: number; groupGift: number; comfortableCount: number; ratio: string };
    sweetSpot: { amount: number; groupGift: number; comfortableCount: number; ratio: string };
    bigGift: { amount: number; groupGift: number; comfortableCount: number; ratio: string };
  };
}

export type AppView = 
  | 'landing' 
  | 'create' 
  | 'group' 
  | 'budget-form' 
  | 'results' 
  | 'payments'
  | 'choose-gift'
  | 'celebration'
  | 'summary';
