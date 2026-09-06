export type GroupStatus = 'collecting' | 'ready' | 'revealed' | 'agreed' | 'completed';
export type RecommendationStatus = 'pending' | 'ready' | 'revealed';

export type GroupPhase = 1 | 2 | 3 | 4; // 1: Decide, 2: Choose, 3: Collect, 4: Done

export type GroupOccasion = 
  | 'wedding' 
  | 'birthday' 
  | 'baby_shower' 
  | 'housewarming' 
  | 'farewell' 
  | 'anniversary' 
  | 'graduation' 
  | 'retirement' 
  | 'custom';

export type OccasionType = GroupOccasion;

export type ContributionMode = 'equal' | 'flexible';

export type ConsensusStrength = 'Strong' | 'Good' | 'Mixed' | 'Difficult';

export interface GroupFitEvaluation {
  amount: number;
  totalBudget: number;
  comfortableCount: number;
  stretchingCount: number;
  overMaxCount: number;
  score: number;
  label: string;
  description: string;
}

export interface GroupCandidateTally {
  comfortable: number;
  stretching: number;
  overMax: number;
}

export interface SweetSpotTier {
  label: 'Easy' | 'Sweet Spot' | 'Big Gift';
  amount: number;
  groupGift: number;
  comfortableCount: number;
  ratio: string;
}

export interface SweetSpotRecommendation {
  amount: number;
  totalGroupGift: number;
  totalBudget?: number;
  comfortableCount: number;
  stretchingCount: number;
  overMaxCount: number;
  totalResponded: number;
  consensusStrength: ConsensusStrength;
  consensusSummary: string;
  explanation: string;
  tiers: {
    easy: SweetSpotTier;
    sweetSpot: SweetSpotTier;
    bigGift: SweetSpotTier;
  };
  flexibleDistribution?: Array<{
    tierName: string;
    amount: number;
    count: number;
  }>;
}

export interface GiftBrief {
  targetCategory: string;
  notes: string;
  budgetRange: string;
  recipients: string;
  style: string;
  avoid: string;
  location: string;
}

export interface GiftOption {
  id: string;
  title: string;
  category: string;
  estimatedPrice: number;
  description: string;
  link?: string;
  voteCount: number;
  createdBy: string;
  createdAt?: string;
}

export interface AggregatePaymentSummary {
  paidCount: number;
  totalCollected: number;
  pendingCount: number;
}

export type ProposalVoteOption = 'agree' | 'prefer_lower' | 'prefer_higher';

export interface ProposalVote {
  participantId: string;
  vote: ProposalVoteOption;
  votedAt: string;
  participantName?: string;
}

export interface ProposalSummary {
  totalVotes: number;
  agreeCount: number;
  preferLowerCount: number;
  preferHigherCount: number;
  agreementRate: number; // 0 - 100
}

export interface GiftGroup {
  id: string;
  coupleName: string;
  coupleNames?: string;
  slug?: string;
  occasion?: GroupOccasion;
  weddingDate?: string; // Event date
  deadlineDate?: string; // Response deadline
  contributionMode?: ContributionMode;
  giftDescription?: string;
  creatorName: string;
  createdBy: string;
  createdAt: string;
  lastActivityAt?: string;
  status: GroupStatus;
  phase: GroupPhase;
  participantCount: number;
  responseCount: number;
  expectedParticipants?: number;
  isRevealed?: boolean;
  recommendationStatus: RecommendationStatus;
  
  // Consensus sweet spot
  recommendation?: SweetSpotRecommendation;
  recommendedAmount?: number;
  totalBudget?: number;
  comfortableCount?: number;
  stretchingCount?: number;
  conservativeAmount?: number;
  generousAmount?: number;
  consensusStrength?: ConsensusStrength;
  explanation?: string;

  // Decision state
  proposedAmount?: number; // Organizer suggestion
  agreedAmount?: number;   // Group consensus locked
  targetContribution?: number; // Target per person
  targetGiftAmount?: number; // Target total gift fund
  isBudgetLocked?: boolean;
  giftAmbition?: 'keep_it_simple' | 'make_it_special' | 'go_all_out';
  proposalSummary?: ProposalSummary;

  // Gift brief & voting
  giftBrief?: GiftBrief;
  selectedGiftId?: string;

  // Payment configuration & public aggregate
  createdShareCode: string;
  upiId?: string;
  paymentNotes?: string;
  aggregatePayments?: AggregatePaymentSummary;

  // Hydrated subcollections (in-memory for UI views)
  participants: any[];
  giftOptions?: GiftOption[];
}
