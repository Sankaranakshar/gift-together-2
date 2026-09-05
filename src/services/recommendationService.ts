import { GroupCandidateTally } from '../types/group';
import { GroupFitEvaluation } from '../types';

export const STANDARD_CANDIDATES = [
  250, 500, 750, 1000, 1200, 1250, 1500, 1750, 2000, 2250, 2500, 
  3000, 3500, 4000, 4500, 5000, 6000, 7000, 7500, 8000, 10000, 
  12500, 15000, 20000, 25000
];

export function evaluateUserForCandidates(
  min: number, 
  comf: number, 
  max: number
): Record<number, 'comfortable' | 'stretching' | 'overMax'> {
  const map: Record<number, 'comfortable' | 'stretching' | 'overMax'> = {};
  for (const c of STANDARD_CANDIDATES) {
    if (c > max) {
      map[c] = 'overMax';
    } else if (c <= comf) {
      map[c] = 'comfortable';
    } else {
      map[c] = 'stretching';
    }
  }
  return map;
}

export interface RecommendationSummary {
  recommendedAmount: number;
  totalBudget: number;
  comfortableCount: number;
  stretchingCount: number;
  stretchCount: number;
  conservativeAmount?: number;
  generousAmount?: number;
  explanation: string;
  isUnanimouslyComfortable: boolean;
}

export function computeAggregateRecommendation(
  candidateTallies: Record<string, GroupCandidateTally>,
  totalResponded: number
): RecommendationSummary {
  if (totalResponded <= 0) {
    return {
      recommendedAmount: 0,
      totalBudget: 0,
      comfortableCount: 0,
      stretchingCount: 0,
      stretchCount: 0,
      explanation: 'Waiting for participants to submit budgets.',
      isUnanimouslyComfortable: false,
    };
  }

  const evaluations: GroupFitEvaluation[] = STANDARD_CANDIDATES.map((candidate) => {
    const key = candidate.toString();
    const tally = candidateTallies[key] || { comfortable: 0, stretching: 0, overMax: 0 };
    const comfortableCount = tally.comfortable || 0;
    const stretchingCount = tally.stretching || 0;
    const overMaxCount = tally.overMax || 0;

    let totalPenalty = overMaxCount * 5000 + stretchingCount * 45;
    let totalUtility = comfortableCount * 120 + stretchingCount * 50;

    let unanimousBonus = 0;
    if (comfortableCount === totalResponded && totalResponded > 0) {
      unanimousBonus = 300;
    } else if (overMaxCount === 0 && stretchingCount <= Math.max(1, Math.floor(totalResponded * 0.2))) {
      unanimousBonus = 150;
    }

    let roundBonus = 0;
    if (candidate % 1000 === 0) roundBonus = 35;
    else if (candidate % 500 === 0) roundBonus = 25;
    else if (candidate % 250 === 0) roundBonus = 10;

    const score = totalUtility + unanimousBonus + roundBonus - totalPenalty;

    return {
      amount: candidate,
      totalBudget: candidate * totalResponded,
      comfortableCount,
      stretchingCount,
      overMaxCount,
      score,
      label: 'Recommended',
      description: `${comfortableCount} of ${totalResponded} comfortable`,
    };
  });

  const zeroOverMax = evaluations.filter((e) => e.overMaxCount === 0);
  const eligiblePool = zeroOverMax.length > 0 ? zeroOverMax : evaluations;

  const sorted = [...eligiblePool].sort((a, b) => {
    if (a.overMaxCount !== b.overMaxCount) return a.overMaxCount - b.overMaxCount;
    if (Math.abs(a.comfortableCount - b.comfortableCount) >= 2) {
      return b.comfortableCount - a.comfortableCount;
    }
    return b.score - a.score;
  });

  const best = sorted[0] || evaluations[0];

  // Conservative
  const conservativeCandidates = evaluations
    .filter((e) => e.overMaxCount === 0 && e.amount < best.amount)
    .sort((a, b) => {
      if (b.comfortableCount !== a.comfortableCount) return b.comfortableCount - a.comfortableCount;
      return b.amount - a.amount;
    });
  const conservative = conservativeCandidates[0];

  // Generous
  const generousCandidates = evaluations
    .filter((e) => e.overMaxCount === 0 && e.amount > best.amount)
    .sort((a, b) => {
      const aComfortRatio = a.comfortableCount / totalResponded;
      const bComfortRatio = b.comfortableCount / totalResponded;
      if (aComfortRatio >= 0.5 && bComfortRatio < 0.5) return -1;
      if (bComfortRatio >= 0.5 && aComfortRatio < 0.5) return 1;
      return a.amount - b.amount;
    });
  const generous = generousCandidates[0];

  const isUnanimouslyComfortable = best.comfortableCount === totalResponded;
  const noUniversalComfort = !evaluations.some(
    (e) => e.comfortableCount === totalResponded && e.overMaxCount === 0
  );

  let explanation = '';
  if (isUnanimouslyComfortable) {
    explanation = `Everyone in the group is completely comfortable contributing ₹${best.amount}. Zero stretching required.`;
  } else if (noUniversalComfort) {
    explanation = `There isn't one contribution that works comfortably for everyone. At ₹${best.amount}/person, ${best.comfortableCount} of ${totalResponded} friends contribute comfortably with minimal stretch.`;
  } else {
    explanation = `${best.comfortableCount} of ${totalResponded} friends are comfortable at this amount${
      best.stretchingCount > 0
        ? `, and ${best.stretchingCount} ${best.stretchingCount === 1 ? 'friend is' : 'friends are'} stretching slightly within their stated limit`
        : ''
    }.`;
  }

  return {
    recommendedAmount: best.amount,
    totalBudget: best.totalBudget,
    comfortableCount: best.comfortableCount,
    stretchingCount: best.stretchingCount,
    stretchCount: best.stretchingCount,
    conservativeAmount: conservative?.amount,
    generousAmount: generous?.amount,
    explanation,
    isUnanimouslyComfortable,
  };
}
