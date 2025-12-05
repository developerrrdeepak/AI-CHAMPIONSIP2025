# Firebase App Hosting Setup Guide

## Quick Setup (5 minutes)

### Step 1: Open Firebase Console
```
https://console.firebase.google.com/project/studio-1555095820-f32c6/apphosting
```

### Step 2: Create Backend
1. Click **"Get Started"** or **"Add Backend"**
2. Connect GitHub repository: `developerrrdeepak/AI-CHAMPIONSIP2025`
3. Select branch: `main`
4. Root directory: `ai-championship`
5. Backend name: `hirevision-backend`
6. Click **"Next"**

### Step 3: Add Environment Variables
Click **"Add variable"** for each:

```
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = studio-1555095820-f32c6.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = studio-1555095820-f32c6
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = studio-1555095820-f32c6.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = XXXXXXXXXX
NEXT_PUBLIC_FIREBASE_APP_ID = 1:XXXXXXXXXX:web:XXXXXXXXXXXXXX
NEXT_PUBLIC_GEMINI_API_KEY = AIzaSyDCKcyhybchP32b7ZMbowQ_tbFiTyUPHdw
GOOGLE_GEMINI_API_KEY = AIzaSyDCKcyhybchP32b7ZMbowQ_tbFiTyUPHdw
```

### Step 4: Deploy
1. Click **"Roll out"**
2. Wait 5-10 minutes for build
3. Your app will be live at: `https://hirevision-backend-XXXXXXXX.web.app`

## Alternative: Use Firebase CLI

```bash
cd ai-championship

# Login to Firebase
firebase login

# Deploy
firebase apphosting:backends:create hirevision-backend \
  --location=us-central1 \
  --github-repo=developerrrdeepak/AI-CHAMPIONSIP2025 \
  --branch=main \
  --root-directory=ai-championship

# Set environment variables
firebase apphosting:secrets:set NEXT_PUBLIC_GEMINI_API_KEY --backend=hirevision-backend
firebase apphosting:secrets:set GOOGLE_GEMINI_API_KEY --backend=hirevision-backend
```

## Done! 🚀
Your app will auto-deploy on every push to main branch.
