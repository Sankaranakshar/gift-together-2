import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { calculateContributionRecommendation, ParticipantBudgetData } from './src/utils/algorithm';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side in-memory data store for authoritative calculation & recovery
// groupId -> (participantId -> budget)
const groupBudgetsStore = new Map<string, Map<string, ParticipantBudgetData & { giftAmbition?: string; submittedAt: string }>>();

// groupId -> (hashedToken -> { participantId, displayName, isCreator, expiresAt })
const groupRecoveryStore = new Map<string, Map<string, { participantId: string; displayName: string; isCreator: boolean; expiresAt: string }>>();

// groupId -> (participantId -> { vote: 'agree' | 'prefer_lower' | 'prefer_higher', participantName?: string, votedAt: string })
const groupProposalVotesStore = new Map<string, Map<string, { vote: 'agree' | 'prefer_lower' | 'prefer_higher'; participantName?: string; votedAt: string }>>();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

// 1. API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GiftTogether API' });
});

// 2. Server-side authoritative budget submission and recommendation calculation
app.post('/api/groups/:groupId/submit-budget', (req, res) => {
  try {
    const { groupId } = req.params;
    const { 
      participantId, 
      displayName, 
      couldDo, 
      feelsRight, 
      wouldStretchTo, 
      priorityPreference, 
      giftAmbition,
      recoveryToken 
    } = req.body;

    if (!participantId || typeof participantId !== 'string') {
      return res.status(400).json({ error: 'Valid participantId is required.' });
    }

    const cDo = Number(couldDo);
    const fRight = Number(feelsRight);
    const wStretch = Number(wouldStretchTo);

    if (isNaN(cDo) || isNaN(fRight) || isNaN(wStretch)) {
      return res.status(400).json({ error: 'All budget amounts must be valid numbers.' });
    }

    if (cDo < 0 || fRight < 0 || wStretch < 0) {
      return res.status(400).json({ error: 'Budget amounts cannot be negative.' });
    }

    if (cDo > fRight) {
      return res.status(400).json({ error: '"Could Do" baseline cannot exceed "Feels Right" amount.' });
    }

    if (fRight > wStretch) {
      return res.status(400).json({ error: '"Feels Right" amount cannot exceed "Would Stretch To" ceiling.' });
    }

    if (wStretch > 1000000) {
      return res.status(400).json({ error: 'Amount exceeds maximum permitted limit.' });
    }

    const safeName = (displayName || 'Friend').trim().slice(0, 60);
    const now = new Date().toISOString();

    // Get or initialize group budget map
    if (!groupBudgetsStore.has(groupId)) {
      groupBudgetsStore.set(groupId, new Map());
    }
    const budgetsMap = groupBudgetsStore.get(groupId)!;

    // Save/update this participant's private budget in server storage
    budgetsMap.set(participantId, {
      id: participantId,
      displayName: safeName,
      couldDo: cDo,
      feelsRight: fRight,
      wouldStretchTo: wStretch,
      priorityPreference: priorityPreference || 'balanced',
      giftAmbition: giftAmbition || 'make_it_special',
      submittedAt: now,
    });

    // Register recovery token if provided
    if (recoveryToken && typeof recoveryToken === 'string') {
      const tokenHash = hashToken(recoveryToken);
      if (!groupRecoveryStore.has(groupId)) {
        groupRecoveryStore.set(groupId, new Map());
      }
      const recoveryMap = groupRecoveryStore.get(groupId)!;
      recoveryMap.set(tokenHash, {
        participantId,
        displayName: safeName,
        isCreator: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Authoritative calculation across all submitted budgets in the group
    const participantBudgets: ParticipantBudgetData[] = Array.from(budgetsMap.values());
    const algoResult = calculateContributionRecommendation(participantBudgets as any);

    return res.json({
      success: true,
      responseCount: participantBudgets.length,
      recommendation: {
        amount: algoResult.recommended.amount,
        totalGroupGift: algoResult.recommended.totalBudget,
        comfortableCount: algoResult.recommended.comfortableCount,
        stretchingCount: algoResult.recommended.stretchingCount,
        overMaxCount: algoResult.recommended.overMaxCount,
        totalResponded: algoResult.totalResponded,
        consensusStrength: algoResult.consensusStrength,
        consensusSummary: algoResult.consensusSummary,
        explanation: algoResult.explanation,
        tiers: algoResult.sweetSpotTiers,
      },
      conservative: algoResult.conservative,
      generous: algoResult.generous,
    });
  } catch (error: any) {
    console.error('Server budget submission error:', error);
    return res.status(500).json({ error: error?.message || 'Server calculation failed.' });
  }
});

// 3. Server-side authoritative recalculate endpoint
app.post('/api/groups/:groupId/recalculate', (req, res) => {
  try {
    const { groupId } = req.params;
    const { budgets } = req.body;

    let budgetList: ParticipantBudgetData[] = [];

    if (Array.isArray(budgets) && budgets.length > 0) {
      budgetList = budgets;
    } else if (groupBudgetsStore.has(groupId)) {
      budgetList = Array.from(groupBudgetsStore.get(groupId)!.values());
    }

    const algoResult = calculateContributionRecommendation(budgetList as any);
    return res.json({
      success: true,
      responseCount: budgetList.length,
      recommendation: {
        amount: algoResult.recommended.amount,
        totalGroupGift: algoResult.recommended.totalBudget,
        comfortableCount: algoResult.recommended.comfortableCount,
        stretchingCount: algoResult.recommended.stretchingCount,
        overMaxCount: algoResult.recommended.overMaxCount,
        totalResponded: algoResult.totalResponded,
        consensusStrength: algoResult.consensusStrength,
        consensusSummary: algoResult.consensusSummary,
        explanation: algoResult.explanation,
        tiers: algoResult.sweetSpotTiers,
      },
      conservative: algoResult.conservative,
      generous: algoResult.generous,
    });
  } catch (error: any) {
    console.error('Server recalculate error:', error);
    return res.status(500).json({ error: error?.message || 'Recalculate failed.' });
  }
});

// 4. Server-side secure participant recovery (resolves hashed token, non-enumerable)
app.post('/api/groups/:groupId/recover-participant', (req, res) => {
  try {
    const { groupId } = req.params;
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Recovery token is required.' });
    }

    const tokenHash = hashToken(token);
    const recoveryMap = groupRecoveryStore.get(groupId);

    if (!recoveryMap || !recoveryMap.has(tokenHash)) {
      return res.status(404).json({ error: 'Invalid or unrecognized recovery token.' });
    }

    const session = recoveryMap.get(tokenHash)!;
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ error: 'Recovery token has expired.' });
    }

    return res.json({
      success: true,
      participant: {
        id: session.participantId,
        displayName: session.displayName,
        name: session.displayName,
        isCreator: session.isCreator,
      }
    });
  } catch (error: any) {
    console.error('Participant recovery error:', error);
    return res.status(500).json({ error: 'Recovery failed.' });
  }
});

// 5. Server-side private group voting on recommended amount
app.post('/api/groups/:groupId/vote-proposal', (req, res) => {
  try {
    const { groupId } = req.params;
    const { participantId, vote, participantName } = req.body;

    if (!participantId || !vote || !['agree', 'prefer_lower', 'prefer_higher'].includes(vote)) {
      return res.status(400).json({ error: 'Valid participantId and vote are required.' });
    }

    if (!groupProposalVotesStore.has(groupId)) {
      groupProposalVotesStore.set(groupId, new Map());
    }
    const votesMap = groupProposalVotesStore.get(groupId)!;
    votesMap.set(participantId, {
      vote,
      participantName: participantName || 'Friend',
      votedAt: new Date().toISOString(),
    });

    const allVotes = Array.from(votesMap.values());
    const totalVotes = allVotes.length;
    const agreeCount = allVotes.filter(v => v.vote === 'agree').length;
    const preferLowerCount = allVotes.filter(v => v.vote === 'prefer_lower').length;
    const preferHigherCount = allVotes.filter(v => v.vote === 'prefer_higher').length;
    const agreementRate = totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 100) : 0;

    return res.json({
      success: true,
      myVote: vote,
      summary: {
        totalVotes,
        agreeCount,
        preferLowerCount,
        preferHigherCount,
        agreementRate,
      }
    });
  } catch (error: any) {
    console.error('Proposal vote error:', error);
    return res.status(500).json({ error: 'Proposal vote failed.' });
  }
});

// 6. Get current proposal vote status
app.get('/api/groups/:groupId/proposal-votes', (req, res) => {
  const { groupId } = req.params;
  const votesMap = groupProposalVotesStore.get(groupId);

  if (!votesMap) {
    return res.json({
      summary: {
        totalVotes: 0,
        agreeCount: 0,
        preferLowerCount: 0,
        preferHigherCount: 0,
        agreementRate: 0,
      }
    });
  }

  const allVotes = Array.from(votesMap.values());
  const totalVotes = allVotes.length;
  const agreeCount = allVotes.filter(v => v.vote === 'agree').length;
  const preferLowerCount = allVotes.filter(v => v.vote === 'prefer_lower').length;
  const preferHigherCount = allVotes.filter(v => v.vote === 'prefer_higher').length;
  const agreementRate = totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 100) : 0;

  return res.json({
    summary: {
      totalVotes,
      agreeCount,
      preferLowerCount,
      preferHigherCount,
      agreementRate,
    }
  });
});

// 7. Gemini-powered Gift Assistant endpoint (Curated 3-5 options based on budget and ambition)
app.post('/api/gift-brief/suggest', async (req, res) => {
  try {
    const { occasion, recipientNames, targetBudget, style, notes, giftAmbition } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    let ambitionNote = 'Balanced & thoughtful';
    if (giftAmbition === 'keep_it_simple') {
      ambitionNote = 'Practical, high-utility, elegant everyday items without fuss or excess';
    } else if (giftAmbition === 'go_all_out') {
      ambitionNote = 'Luxury, heirloom, aspirational dream gifts or unforgettable boutique getaway experiences';
    } else if (giftAmbition === 'make_it_special') {
      ambitionNote = 'Meaningful, commemorative keepsake or fine experiential dining that will be remembered forever';
    }

    if (!apiKey) {
      // Curated fallback with 4 focused, high-relevance options
      const budget = targetBudget || 15000;
      return res.json({
        success: true,
        brief: {
          targetCategory: style || 'Home & Experiences',
          budgetRange: `₹${budget.toLocaleString('en-IN')}`,
          recipients: recipientNames || 'The Celebrants',
          style: ambitionNote,
          avoid: 'Generic vouchers, duplicate kitchenware',
          notes: 'Curated by GiftTogether consensus engine'
        },
        ideas: [
          {
            title: 'Artisan Espresso Machine or Specialty Coffee Setup',
            category: 'Home & Kitchen',
            estimatedPrice: Math.round(budget * 0.95),
            description: 'A countertop centerpiece elevating daily morning rituals with barista-grade coffee.',
          },
          {
            title: 'Weekend Luxury Boutique Resort Stay & Dining',
            category: 'Experiences',
            estimatedPrice: Math.round(budget),
            description: 'An unforgettable romantic getaway with fine dining, nature walks, and curated relaxation.',
          },
          {
            title: 'Cordless Smart Vacuum or Premium Air Purifier',
            category: 'Smart Living',
            estimatedPrice: Math.round(budget * 1.05),
            description: 'A thoughtful, ultra-practical lifestyle upgrade keeping the home pristine effortlessly.',
          },
          {
            title: 'Heirloom Dutch Oven & Cast Iron Culinary Set',
            category: 'Culinary',
            estimatedPrice: Math.round(budget * 0.85),
            description: 'Timeless cast iron designed to last decades for intimate dinners and gatherings.',
          }
        ]
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an expert personal gift concierge for group gifts in India.
Generate a structured JSON gift brief and strictly 3 to 4 distinct, highly curated gift recommendations for:
Occasion: ${occasion || 'Wedding'}
Recipient(s): ${recipientNames || 'The Couple'}
Target Total Group Gift Budget: ₹${(targetBudget || 15000).toLocaleString('en-IN')}
Group Gift Ambition: ${ambitionNote}
Preferred Style: ${style || 'Thoughtful & Memorable'}
Additional Context: ${notes || 'None provided'}

RULES:
- Provide strictly 3 or 4 options (no more, no less).
- Focus each option on a different category (e.g. Culinary, Experience, Home/Living, Travel/Wellness).
- Keep descriptions concise, evocative, and practical.
- Estimated price should be close to the target budget (within 20% range).

Provide output strictly in JSON with this exact structure:
{
  "brief": {
    "targetCategory": "string",
    "budgetRange": "string",
    "recipients": "string",
    "style": "string",
    "avoid": "string",
    "notes": "string"
  },
  "ideas": [
    {
      "title": "string",
      "category": "string",
      "estimatedPrice": number (in INR close to target budget),
      "description": "string"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Gemini gift suggestion error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate gift suggestions', 
      details: error?.message || error 
    });
  }
});

// Start server with Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GiftTogether full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
