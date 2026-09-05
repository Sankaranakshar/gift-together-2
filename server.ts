import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GiftTogether API' });
});

// Gemini-powered Gift Assistant endpoint
app.post('/api/gift-brief/suggest', async (req, res) => {
  try {
    const { occasion, recipientNames, targetBudget, style, notes } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Graceful fallback with rich curated gift ideas if no API key is set
      return res.json({
        success: true,
        brief: {
          targetCategory: style || 'Home & Experiences',
          budgetRange: `₹${(targetBudget || 15000).toLocaleString('en-IN')}`,
          recipients: recipientNames || 'The Celebrants',
          style: 'Thoughtful, high-utility, aesthetic',
          avoid: 'Generic vouchers, duplicate kitchenware',
          notes: 'Curated by GiftTogether consensus engine'
        },
        ideas: [
          {
            title: 'Artisan Espresso Machine or Specialty Coffee Setup',
            category: 'Home & Kitchen',
            estimatedPrice: Math.round((targetBudget || 15000) * 0.95),
            description: 'A premium countertop coffee brewer that elevates morning routines with cafe-quality brews.',
          },
          {
            title: 'Weekend Luxury Heritage Resort Stay / Dining Experience',
            category: 'Experiences',
            estimatedPrice: Math.round(targetBudget || 15000),
            description: 'An unforgettable getaway voucher with fine dining and curated experiences.',
          },
          {
            title: 'Cordless Smart Vacuum or Premium Air Purifier',
            category: 'Smart Living',
            estimatedPrice: Math.round((targetBudget || 15000) * 1.05),
            description: 'A thoughtful, high-utility addition making everyday home living seamless.',
          },
          {
            title: 'Custom Cast Iron & Dutch Oven Gourmet Cookware Set',
            category: 'Culinary',
            estimatedPrice: Math.round((targetBudget || 15000) * 0.8),
            description: 'Heirloom-grade cookware built to last a lifetime for memorable dinner parties.',
          }
        ]
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an expert personal gift concierge for group gifts in India.
Generate a structured JSON gift brief and 4 creative, specific gift recommendations for the following details:
Occasion: ${occasion || 'Wedding'}
Recipient(s): ${recipientNames || 'The Couple'}
Target Total Group Gift Budget: ₹${(targetBudget || 15000).toLocaleString('en-IN')}
Preferred Style: ${style || 'Thoughtful & Memorable'}
Additional Context: ${notes || 'None provided'}

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
      model: 'gemini-3.8-flash',
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
