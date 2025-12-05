# HireVision - AI-Powered Recruitment Platform

Modern recruitment platform with AI-powered candidate matching, interview automation, and smart hiring tools.

## 🚀 Features

### Core Features
- 🔐 Firebase Authentication (Email/Password, Google Sign-in)
- 💼 Job Management (Create, Edit, Search)
- 👥 Candidate Management & Search
- 📝 Application Pipeline
- 📅 Interview Scheduling
- 💬 Real-time Messaging
- 🌐 Community Feed

### AI Features
- 🤖 AI Resume Analysis (Gemini)
- 📊 Candidate Ranking & Scoring
- ✍️ Job Description Improvement
- ❓ Interview Questions Generator
- 🎤 AI Voice Interviewer
- 💡 Smart Insights & Recommendations

## 🛠️ Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Firebase Firestore
- **Auth:** Firebase Auth
- **Storage:** Firebase Storage, Vultr S3
- **AI:** Google Gemini, ElevenLabs
- **Deployment:** Netlify

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/developerrrdeepak/AI-CHAMPIONSIP2025.git
cd AI-CHAMPIONSIP2025/ai-championship

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Add your API keys

# Run development server
npm run dev
```

## 🔑 Environment Variables

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google AI
GOOGLE_GENAI_API_KEY=

# ElevenLabs (Voice)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=

# Vultr (Storage & Database)
VULTR_API_KEY=
VULTR_S3_ACCESS_KEY=
VULTR_S3_SECRET_KEY=
VULTR_S3_ENDPOINT=
VULTR_S3_REGION=
VULTR_POSTGRES_CONNECTION_STRING=

# WorkOS (Enterprise Auth)
WORKOS_API_KEY=
WORKOS_CLIENT_ID=
NEXT_PUBLIC_WORKOS_CLIENT_ID=
WORKOS_REDIRECT_URI=

# App Config
NEXT_PUBLIC_APP_URL=
```

## 🚀 Deployment

### Netlify
1. Connect GitHub repository
2. Set build command: `cd ai-championship && npm install && npm run build`
3. Set publish directory: `ai-championship/.next`
4. Add environment variables
5. Deploy

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Deepak Kumar

## 🔗 Links

- [Live Demo](https://darling-strudel-d604e0.netlify.app)
- [GitHub](https://github.com/developerrrdeepak/AI-CHAMPIONSIP2025)
