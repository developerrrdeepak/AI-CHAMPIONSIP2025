# HireVision - Deployment Guide

## ✅ Core Features Working

### 1. Authentication
- ✅ Firebase Authentication integrated
- ✅ Email/Password login
- ✅ Google Sign-in
- ✅ Role-based access (Employer, Candidate, Recruiter)

### 2. Job Management
- ✅ Create new jobs
- ✅ Edit existing jobs
- ✅ View all jobs
- ✅ Job status management (Open/Paused/Closed)
- ✅ Remote/On-site options
- ✅ Skills tagging
- ✅ Salary range

### 3. Candidate Management
- ✅ View all candidates
- ✅ Search candidates
- ✅ Filter by skills, experience, location
- ✅ Candidate profiles
- ✅ Resume upload

### 4. Applications
- ✅ Apply to jobs
- ✅ Track application status
- ✅ Application pipeline
- ✅ Stage management

### 5. Interviews
- ✅ Schedule interviews
- ✅ Interview calendar
- ✅ Interview feedback
- ✅ Video interview integration

## 🚀 Netlify Deployment

### Environment Variables Required

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google AI
GOOGLE_GENAI_API_KEY=your_key

# ElevenLabs (Voice)
ELEVENLABS_API_KEY=your_key
ELEVENLABS_VOICE_ID=your_voice_id
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=your_voice_id

# Vultr (Storage & Database)
VULTR_API_KEY=your_key
VULTR_S3_ACCESS_KEY=your_key
VULTR_S3_SECRET_KEY=your_secret
VULTR_S3_ENDPOINT=your_endpoint
VULTR_S3_REGION=your_region
VULTR_POSTGRES_CONNECTION_STRING=your_connection_string

# Raindrop (AI Matching)
RAINDROP_API_KEY=your_key

# WorkOS (Enterprise Auth)
WORKOS_API_KEY=your_key
WORKOS_CLIENT_ID=your_client_id
NEXT_PUBLIC_WORKOS_CLIENT_ID=your_client_id
WORKOS_REDIRECT_URI=https://your-domain.netlify.app/api/auth/callback

# App Config
NEXT_PUBLIC_APP_URL=https://your-domain.netlify.app
```

### Build Settings

```toml
[build]
  command = "cd ai-championship && npm install && npm run build"
  publish = "ai-championship/.next"

[build.environment]
  NODE_VERSION = "20"
  NEXT_PRIVATE_TARGET = "server"
```

## 🎯 Testing Checklist

### Before Deployment
- [ ] All environment variables set in Netlify
- [ ] Firebase project configured
- [ ] Firestore rules deployed
- [ ] Storage rules deployed

### After Deployment
- [ ] Landing page loads
- [ ] Login/Signup works
- [ ] Dashboard shows data
- [ ] Can create a job
- [ ] Can view candidates
- [ ] Can apply to jobs
- [ ] Can schedule interviews

## 🐛 Common Issues

### Issue: Black screen with "snapshot is not a function"
**Solution**: Ensure all Firebase environment variables are set correctly in Netlify

### Issue: Build fails with missing modules
**Solution**: Clear Netlify cache and redeploy

### Issue: Authentication not working
**Solution**: Check Firebase Auth domain in Netlify environment variables

## 📝 Next Steps

1. Set up Firestore security rules
2. Configure email templates
3. Set up analytics
4. Add monitoring
5. Configure CDN
