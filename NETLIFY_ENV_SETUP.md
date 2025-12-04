# Netlify Environment Variables Setup

Add these in Netlify Dashboard → Site settings → Environment variables:

## WorkOS Configuration
```
NEXT_PUBLIC_WORKOS_CLIENT_ID=your_workos_client_id
WORKOS_API_KEY=your_workos_api_key
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://hireviision.netlify.app/api/auth/workos/callback
```

## WorkOS Dashboard Setup
1. Go to WorkOS Dashboard → Redirects
2. Add redirect URL: `https://hireviision.netlify.app/api/auth/workos/callback`

## Firebase Configuration (if missing)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```
