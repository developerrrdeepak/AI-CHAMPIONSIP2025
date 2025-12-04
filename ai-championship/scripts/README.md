
# Mock Data Seeding Scripts

## Setup

1. Install dependencies:
```bash
cd scripts
npm install
```

2. Copy your `.env.local` file from the main project or create a `.env` file with Firebase config:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Run Seeding

```bash
npm run seed
```

## What Gets Created

- **10 Organizations**: Tech companies with logos, about, website, LinkedIn
- **30 Users**: 10 employers + 20 candidates with profiles, skills, experience
- **30 Jobs**: 3 jobs per organization (open/closed status)
- **~150 Applications**: Multiple applicants per job with various statuses
- **15 Interviews**: Scheduled interviews with different types
- **10 Challenges**: Hackathons and coding challenges
- **15 Posts**: Community posts (achievements, projects, articles)
- **20 Connections**: User connections (pending/accepted)
- **10 Conversations**: Message threads with 5 messages each

## Data Characteristics

- Realistic names, emails, and company names
- Random but sensible skill combinations
- Varied locations (US, Europe, Asia, Remote)
- Date ranges from 2023 to present
- Mix of statuses (pending, active, completed, etc.)
- Profile visibility (80% public, 20% private)

## Clean Up

To remove all mock data, use Firebase Console or create a cleanup script.

## Notes

- Script uses real Firebase connection
- Data persists in Firestore
- Can be run multiple times (creates new data each time)
- All data uses real-time listeners in the app
