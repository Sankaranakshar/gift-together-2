# GiftTogether 🎁

> **Find the wedding and group gift budget everyone feels good about.**
> Private individual budgets, fair group recommendations, and zero awkwardness.

GiftTogether is a privacy-first group gifting consensus engine and coordination hub designed to eliminate awkward group chat money discussions. Friends privately submit what feels comfortable for them, and an optimization algorithm finds the group's "Sweet Spot" amount without revealing anyone's private financial numbers.

---

## ✨ Key Features

### 1. 🔒 Privacy by Design
- **Zero Financial Exposure**: Individual numbers (*Could Do*, *Feels Right*, *Would Stretch To*) are kept strictly private in user-isolated Firestore subcollections (`/groups/{groupId}/budgets/{uid}`).
- **Sanitized Aggregation**: The group only ever sees aggregate metrics (e.g., number of responses, consensus strength) and candidate tiers.
- **No Public Shaming**: Individual payment verification is private between each contributor and the group organizer.

### 2. 🎯 4-Phase Gifting Workflow
1. **Phase 01 — Decide**: Collect private budgets, track response deadlines, and reveal mathematically optimized consensus tiers (*100% Ease*, *Sweet Spot*, *Elevated Gift*) with consensus strength scoring.
2. **Phase 02 — Choose Gift**: Propose gift ideas, view AI-suggested curated gifts based on the group brief, and vote collectively using real-time hearts.
3. **Phase 03 — Collect**: Track group collection progress with an aggregate progress meter, direct UPI / payment copying, and private verification.
4. **Phase 04 — Celebrate**: Digital card with personal congratulatory messages and celebration stats.

### 3. 🧠 Psychological Budget Framing
Replaces awkward min/max inquiries with 3 natural anchors:
- **Could Do** (baseline comfortable amount)
- **Feels Right** (ideal sweet spot)
- **Would Stretch To** (upper ceiling for something extraordinary)

### 4. 📲 WhatsApp-First Coordination
Instant, polite pre-formatted copy messages for:
- Private Budget Requests
- Gentle Response Nudges
- Gift Voting Announcements
- Payment Details & UPI ID Sharing

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons
- **Backend & APIs**: Express, Node.js (`server.ts`)
- **Database & Auth**: Firebase Firestore & Firebase Authentication
- **AI Intelligence**: Google Gemini API via `@google/genai` (Gift Brief Suggestions)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/Sankaranakshar/gifttogether.git
cd gifttogether

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run development server
npm run dev
```

The application runs on `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm start
```

---

## 📄 License
MIT License
