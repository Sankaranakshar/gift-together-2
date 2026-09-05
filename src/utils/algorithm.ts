import { Participant, AlgorithmResult, SweetSpotRecommendation, ConsensusStrength } from '../types';

// Socially clean and conventional gift amounts in Rupees
export const STANDARD_CANDIDATES = [
  250, 500, 750, 1000, 1200, 1500, 1750, 2000, 2250, 2500, 
  3000, 3500, 4000, 4500, 5000, 6000, 7000, 7500, 8000, 10000, 
  12500, 15000, 20000, 25000, 30000, 40000, 50000
];

export interface ParticipantBudgetData {
  id: string;
  displayName?: string;
  couldDo: number;
  feelsRight: number;
  wouldStretchTo: number;
  priorityPreference?: 'easy' | 'balanced' | 'big';
}

export function extractBudgetData(p: Participant): ParticipantBudgetData | null {
  const feelsRight = p.feelsRight ?? p.comfortableAmount;
  if (feelsRight === undefined || feelsRight === null || isNaN(feelsRight) || feelsRight <= 0) {
    return null;
  }
  const couldDo = p.couldDo ?? p.minAmount ?? Math.max(100, Math.round(feelsRight * 0.75 / 50) * 50);
  const wouldStretchTo = p.wouldStretchTo ?? p.maxAmount ?? Math.round(feelsRight * 1.35 / 50) * 50;

  return {
    id: p.id,
    displayName: p.displayName || p.name,
    couldDo,
    feelsRight,
    wouldStretchTo: Math.max(wouldStretchTo, feelsRight),
    priorityPreference: (p as any).priorityPreference || 'balanced',
  };
}

export interface AmountEvaluation {
  amount: number;
  totalBudget: number;
  comfortableCount: number;
  stretchingCount: number;
  overMaxCount: number;
  score: number;
  label: string;
  description: string;
}

/**
 * Evaluates any arbitrary contribution amount against participant responses.
 * Perfect for the "What If?" simulation slider.
 */
export function evaluateCustomAmount(
  amount: number,
  participants: (Participant | ParticipantBudgetData)[]
): {
  amount: number;
  totalGroupGift: number;
  comfortableCount: number;
  stretchingCount: number;
  overMaxCount: number;
  totalResponded: number;
  percentageComfortable: number;
} {
  const validBudgets: ParticipantBudgetData[] = participants
    .map(p => ('feelsRight' in p && 'couldDo' in p ? (p as ParticipantBudgetData) : extractBudgetData(p as Participant)))
    .filter((b): b is ParticipantBudgetData => b !== null);

  const totalResponded = validBudgets.length;
  if (totalResponded === 0) {
    return {
      amount,
      totalGroupGift: 0,
      comfortableCount: 0,
      stretchingCount: 0,
      overMaxCount: 0,
      totalResponded: 0,
      percentageComfortable: 0,
    };
  }

  let comfortableCount = 0;
  let stretchingCount = 0;
  let overMaxCount = 0;

  for (const b of validBudgets) {
    if (amount > b.wouldStretchTo) {
      overMaxCount++;
    } else if (amount <= b.feelsRight) {
      comfortableCount++;
    } else {
      stretchingCount++;
    }
  }

  return {
    amount,
    totalGroupGift: amount * totalResponded,
    comfortableCount,
    stretchingCount,
    overMaxCount,
    totalResponded,
    percentageComfortable: Math.round((comfortableCount / totalResponded) * 100),
  };
}

/**
 * Calculates Consensus Strength and clustering summary without exposing individual budgets.
 */
export function calculateConsensusMetrics(budgets: ParticipantBudgetData[]): {
  strength: ConsensusStrength;
  summary: string;
  medianAmount: number;
  clusterMin: number;
  clusterMax: number;
} {
  if (budgets.length === 0) {
    return {
      strength: 'Good',
      summary: 'Awaiting group responses.',
      medianAmount: 0,
      clusterMin: 0,
      clusterMax: 0,
    };
  }

  const values = budgets.map(b => b.feelsRight).sort((a, b) => a - b);
  const n = values.length;
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  const medianAmount = n % 2 === 1 ? values[Math.floor(n / 2)] : Math.round((values[n / 2 - 1] + values[n / 2]) / 2);

  // Calculate standard deviation and coefficient of variation
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;

  // Interquartile cluster (25th to 75th percentile)
  const q1 = values[Math.floor(n * 0.25)] || values[0];
  const q3 = values[Math.min(n - 1, Math.floor(n * 0.75))] || values[n - 1];

  let strength: ConsensusStrength;
  if (cv <= 0.18 || (q3 - q1 <= 500 && mean < 4000)) {
    strength = 'Strong';
  } else if (cv <= 0.35) {
    strength = 'Good';
  } else if (cv <= 0.55) {
    strength = 'Mixed';
  } else {
    strength = 'Difficult';
  }

  const formatCluster = (num: number) => `₹${num.toLocaleString('en-IN')}`;
  let summary = '';
  if (strength === 'Strong') {
    summary = `Most people cluster tightly around ${formatCluster(q1)}–${formatCluster(q3)}.`;
  } else if (strength === 'Good') {
    summary = `The group is well aligned around ${formatCluster(q1)}–${formatCluster(q3)}.`;
  } else if (strength === 'Mixed') {
    summary = `Responses range moderately from ${formatCluster(values[0])} to ${formatCluster(values[n - 1])}.`;
  } else {
    summary = `Wide variation in comfort levels between ${formatCluster(values[0])} and ${formatCluster(values[n - 1])}.`;
  }

  return {
    strength,
    summary,
    medianAmount,
    clusterMin: q1,
    clusterMax: q3,
  };
}

/**
 * Finds the group sweet spot:
 * "We look for the amount that fits the most people comfortably, while keeping the group gift meaningful."
 */
export function calculateContributionRecommendation(participants: Participant[]): AlgorithmResult {
  const validBudgets = participants
    .map(extractBudgetData)
    .filter((b): b is ParticipantBudgetData => b !== null);

  const totalResponded = validBudgets.length;

  if (totalResponded === 0) {
    return {
      hasValidRecommendation: false,
      recommended: {
        amount: 0,
        totalBudget: 0,
        comfortableCount: 0,
        stretchingCount: 0,
        overMaxCount: 0,
        score: 0,
        label: 'Sweet Spot',
        description: 'Waiting for responses',
      },
      allEvaluations: [],
      totalResponded: 0,
      isUnanimouslyComfortable: false,
      noUniversalComfort: false,
      explanation: 'No participant responses submitted yet.',
      comfortableRange: { min: 0, max: 0 },
      consensusStrength: 'Good',
      consensusSummary: 'Waiting for participants to respond.',
      sweetSpotTiers: {
        easy: { amount: 0, groupGift: 0, comfortableCount: 0, ratio: '0/0' },
        sweetSpot: { amount: 0, groupGift: 0, comfortableCount: 0, ratio: '0/0' },
        bigGift: { amount: 0, groupGift: 0, comfortableCount: 0, ratio: '0/0' },
      },
    };
  }

  const consensus = calculateConsensusMetrics(validBudgets);

  // Calculate overall range
  const allMins = validBudgets.map(b => b.couldDo);
  const allComfs = validBudgets.map(b => b.feelsRight);
  const allMaxs = validBudgets.map(b => b.wouldStretchTo);

  const minComfortable = Math.min(...allComfs);
  const maxComfortable = Math.max(...allComfs);
  const absoluteLowestMin = Math.min(...allMins);
  const absoluteHighestMax = Math.max(...allMaxs);

  // Weight preference modifier: if participants lean "go big" or "keep it easy"
  let preferenceBonusFactor = 0;
  const bigCount = validBudgets.filter(b => b.priorityPreference === 'big').length;
  const easyCount = validBudgets.filter(b => b.priorityPreference === 'easy').length;
  if (bigCount > easyCount) preferenceBonusFactor = 0.08;
  else if (easyCount > bigCount) preferenceBonusFactor = -0.08;

  // Build candidate pool
  const candidateSet = new Set<number>();
  for (const c of STANDARD_CANDIDATES) {
    if (c >= Math.max(100, absoluteLowestMin * 0.7) && c <= absoluteHighestMax * 1.05) {
      candidateSet.add(c);
    }
  }

  validBudgets.forEach(b => {
    if (b.couldDo) candidateSet.add(Math.round(b.couldDo / 50) * 50);
    if (b.feelsRight) candidateSet.add(Math.round(b.feelsRight / 50) * 50);
    if (b.wouldStretchTo) candidateSet.add(Math.round(b.wouldStretchTo / 50) * 50);
  });
  candidateSet.add(minComfortable);
  candidateSet.add(consensus.medianAmount);

  const candidates = Array.from(candidateSet)
    .filter(a => a > 0)
    .sort((a, b) => a - b);

  // Evaluate candidates
  const evaluations: AmountEvaluation[] = candidates.map(candidate => {
    let comfortableCount = 0;
    let stretchingCount = 0;
    let overMaxCount = 0;
    let penalty = 0;
    let utility = 0;

    for (const b of validBudgets) {
      if (candidate > b.wouldStretchTo) {
        overMaxCount++;
        penalty += 10000 + (candidate - b.wouldStretchTo) * 12;
      } else if (candidate <= b.feelsRight) {
        comfortableCount++;
        // Base utility: rewards practical gift size up to comfortable
        utility += 100 + (candidate / b.feelsRight) * 25 * (1 + preferenceBonusFactor);
      } else {
        stretchingCount++;
        const stretchRatio = (candidate - b.feelsRight) / Math.max(1, b.wouldStretchTo - b.feelsRight);
        penalty += 90 * Math.pow(stretchRatio, 1.5) * (1 - preferenceBonusFactor);
        utility += 60;
      }
    }

    // Bonuses
    let unanimousBonus = 0;
    if (comfortableCount === totalResponded) {
      unanimousBonus = 400;
    } else if (overMaxCount === 0 && stretchingCount <= Math.max(1, Math.floor(totalResponded * 0.2))) {
      unanimousBonus = 200;
    }

    let roundBonus = 0;
    if (candidate % 1000 === 0) roundBonus = 40;
    else if (candidate % 500 === 0) roundBonus = 25;
    else if (candidate % 250 === 0) roundBonus = 10;

    const score = utility + unanimousBonus + roundBonus - penalty;

    return {
      amount: candidate,
      totalBudget: candidate * totalResponded,
      comfortableCount,
      stretchingCount,
      overMaxCount,
      score,
      label: 'Sweet Spot',
      description: `${comfortableCount} of ${totalResponded} comfortable`,
    };
  });

  // Filter 0 overMax first
  const zeroOverMax = evaluations.filter(e => e.overMaxCount === 0);
  const eligible = zeroOverMax.length > 0 ? zeroOverMax : evaluations;

  // Best Sweet Spot
  const sorted = [...eligible].sort((a, b) => {
    if (a.overMaxCount !== b.overMaxCount) return a.overMaxCount - b.overMaxCount;
    if (Math.abs(a.comfortableCount - b.comfortableCount) >= 2) {
      return b.comfortableCount - a.comfortableCount;
    }
    return b.score - a.score;
  });

  const sweetSpot = sorted[0] || evaluations[0];
  sweetSpot.label = 'Sweet Spot';

  // Easy Option (Conservative): lower amount, maximum comfort (ideally 100%)
  const easyCandidates = evaluations
    .filter(e => e.overMaxCount === 0 && e.amount < sweetSpot.amount)
    .sort((a, b) => {
      if (b.comfortableCount !== a.comfortableCount) return b.comfortableCount - a.comfortableCount;
      return b.amount - a.amount;
    });
  const easy = easyCandidates[0] || {
    amount: Math.max(100, Math.round((sweetSpot.amount * 0.75) / 50) * 50),
    totalBudget: Math.max(100, Math.round((sweetSpot.amount * 0.75) / 50) * 50) * totalResponded,
    comfortableCount: totalResponded,
    stretchingCount: 0,
    overMaxCount: 0,
    score: 100,
    label: 'Easy',
    description: `${totalResponded} of ${totalResponded} comfortable`,
  };
  easy.label = 'Easy';

  // Big Gift Option (Generous): higher amount, still 0 overMax if possible, provides larger group gift
  const bigCandidates = evaluations
    .filter(e => e.amount > sweetSpot.amount && e.overMaxCount === 0 && e.comfortableCount >= Math.ceil(totalResponded * 0.45))
    .sort((a, b) => a.amount - b.amount);
  const big = bigCandidates[0] || {
    amount: Math.round((sweetSpot.amount * 1.25) / 50) * 50,
    totalBudget: Math.round((sweetSpot.amount * 1.25) / 50) * 50 * totalResponded,
    comfortableCount: Math.max(1, totalResponded - 2),
    stretchingCount: 2,
    overMaxCount: 0,
    score: 80,
    label: 'Big Gift',
    description: 'Bigger gift with light stretch',
  };
  big.label = 'Big Gift';

  // Expressive text explanation
  let explanation = '';
  if (sweetSpot.comfortableCount === totalResponded) {
    explanation = `${totalResponded} of ${totalResponded} friends are completely comfortable. Zero stretching required.`;
  } else {
    explanation = `${sweetSpot.comfortableCount} of ${totalResponded} friends are comfortable${
      sweetSpot.stretchingCount > 0 
        ? `, ${sweetSpot.stretchingCount} friend${sweetSpot.stretchingCount > 1 ? 's are' : ' is'} stretching slightly` 
        : ''
    }, 0 friends exceed their limit.`;
  }

  const sweetSpotTiers = {
    easy: {
      amount: easy.amount,
      groupGift: easy.amount * totalResponded,
      comfortableCount: easy.comfortableCount,
      ratio: `${easy.comfortableCount}/${totalResponded}`,
    },
    sweetSpot: {
      amount: sweetSpot.amount,
      groupGift: sweetSpot.amount * totalResponded,
      comfortableCount: sweetSpot.comfortableCount,
      ratio: `${sweetSpot.comfortableCount}/${totalResponded}`,
    },
    bigGift: {
      amount: big.amount,
      groupGift: big.amount * totalResponded,
      comfortableCount: big.comfortableCount,
      ratio: `${big.comfortableCount}/${totalResponded}`,
    },
  };

  return {
    hasValidRecommendation: true,
    recommended: sweetSpot,
    conservative: easy,
    generous: big,
    allEvaluations: evaluations,
    totalResponded,
    isUnanimouslyComfortable: sweetSpot.comfortableCount === totalResponded,
    noUniversalComfort: !evaluations.some(e => e.comfortableCount === totalResponded && e.overMaxCount === 0),
    explanation,
    comfortableRange: { min: minComfortable, max: maxComfortable },
    consensusStrength: consensus.strength,
    consensusSummary: consensus.summary,
    sweetSpotTiers,
  };
}

