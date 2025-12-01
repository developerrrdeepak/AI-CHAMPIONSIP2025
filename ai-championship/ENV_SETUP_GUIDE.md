# 🔐 Environment Variables Setup Guide

## Required Environment Variables

### 1. Firebase Configuration (✅ Already Set)
```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-1555095820-f32c6
NEXT_PUBLIC_FIREBASE_APP_ID=1:817114304956:web:916bc1d8d4bb0df1551bb9
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAmUbAHWhTTJkW3hdmzUeZztv543A0spwI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-1555095820-f32c6.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-1555095820-f32c6.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=817114304956
```

**Status**: ✅ Working - Firebase Auth, Firestore, Storage configured

---

### 2. Raindrop Platform (Optional for Demo)
```env
NEXT_PUBLIC_RAINDROP_API_KEY=your_raindrop_api_key_here
RAINDROP_API_URL=https://api.raindrop.ai/v1
```

**How to Get**:
1. Sign up at https://raindrop.ai
2. Go to Dashboard → API Keys
3. Create new API key
4. Copy and paste in .env.local

**Used For**:
- SmartInference (AI candidate matching)
- SmartSQL (database queries)
- SmartMemory (context storage)
- SmartBuckets (file storage)

**Fallback**: App works without this - uses Google Genkit AI instead

---

### 3. Vultr Services (Optional for Demo)
```env
VULTR_API_KEY=your_vultr_api_key_here
VULTR_OBJECT_STORAGE_ACCESS_KEY=your_access_key_here
VULTR_OBJECT_STORAGE_SECRET_KEY=your_secret_key_here
```

**How to Get**:
1. Sign up at https://vultr.com
2. Go to Account → API → Generate API Key
3. For Object Storage: Products → Object Storage → Create Instance
4. Get Access Key and Secret Key

**Used For**:
- GPU compute for AI workloads
- Object storage for resumes/files
- CDN for fast delivery

**Fallback**: App uses Firebase Storage instead

---

### 4. ElevenLabs Voice AI (Optional for Demo)
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

**How to Get**:
1. Sign up at https://elevenlabs.io
2. Go to Profile → API Keys
3. Generate new API key
4. Copy voice ID from Voice Library

**Used For**:
- Voice interview feature
- Text-to-speech for notifications
- AI mock interviews

**Fallback**: App uses browser's built-in speech synthesis

---

### 5. Google AI (Genkit) - Required for AI Features
```env
GOOGLE_GENAI_API_KEY=your_google_ai_key_here
```

**How to Get**:
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Copy and paste

**Used For**:
- AI Assistant chat
- Resume analysis
- Job description improvement
- Interview question generation
- Skill extraction

**Status**: ⚠️ Required for AI features to work

---

### 6. Stripe Payment (Optional for Demo)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_...
```

**How to Get**:
1. Sign up at https://stripe.com
2. Go to Developers → API Keys
3. Copy Publishable and Secret keys
4. Create Products → Get Price IDs
5. Set up Webhook for local testing: `stripe listen --forward-to localhost:9002/api/webhooks/stripe`

**Used For**:
- Subscription management
- Payment processing
- Billing

**Fallback**: Billing page shows demo mode

---

### 7. Application Settings
```env
NEXT_PUBLIC_APP_URL=http://localhost:9002
NODE_ENV=development
```

**For Production (Netlify)**:
```env
NEXT_PUBLIC_APP_URL=https://hirevision.netlify.app
NODE_ENV=production
```

---

## Quick Setup Steps

### For Local Development:

1. **Copy example file**:
```bash
cp .env.example .env.local
```

2. **Minimum Required** (App will work):
```env
# Firebase (already set)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-1555095820-f32c6
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAmUbAHWhTTJkW3hdmzUeZztv543A0spwI
# ... other Firebase vars

# Google AI (for AI features)
GOOGLE_GENAI_API_KEY=your_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

3. **Optional Enhancements**:
- Add ElevenLabs for voice features
- Add Raindrop for advanced AI
- Add Vultr for production scaling
- Add Stripe for payments

### For Production (Netlify):

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add all variables from .env.production
3. Redeploy site

---

## Feature Availability Matrix

| Feature | Without Optional APIs | With All APIs |
|---------|----------------------|---------------|
| Authentication | ✅ Works | ✅ Works |
| Job Posting | ✅ Works | ✅ Works |
| Applications | ✅ Works | ✅ Works |
| Messaging | ✅ Works | ✅ Works |
| Connections | ✅ Works | ✅ Works |
| Community Feed | ✅ Works | ✅ Works |
| AI Assistant | ⚠️ Needs Google AI | ✅ Enhanced |
| Voice Interview | ⚠️ Browser TTS | ✅ ElevenLabs |
| Resume Analysis | ⚠️ Needs Google AI | ✅ Enhanced |
| AI Matching | ⚠️ Basic | ✅ Raindrop |
| File Storage | ✅ Firebase | ✅ Vultr |
| Payments | ⚠️ Demo Mode | ✅ Stripe |

---

## Testing Without API Keys

The app is designed to work without optional API keys:

1. **AI Features**: Will show "Configure API keys" message
2. **Voice Interview**: Falls back to browser speech synthesis
3. **File Storage**: Uses Firebase Storage
4. **Payments**: Shows demo/preview mode

---

## Security Notes

- Never commit .env.local to Git (already in .gitignore)
- Use different keys for development and production
- Rotate API keys regularly
- Set up proper CORS and rate limiting
- Use environment-specific Firebase projects

---

## Support

If you need help setting up:
1. Check Firebase Console for auth issues
2. Verify API keys are active
3. Check browser console for errors
4. Ensure all NEXT_PUBLIC_ vars are set for client-side access

---

**Built for AI Championship Hackathon**
**Powered by Raindrop, Vultr, ElevenLabs, and Claude Code**
