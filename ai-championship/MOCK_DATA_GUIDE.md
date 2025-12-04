
# Mock Data Guide for HireVision

## Overview

This guide explains how to populate your HireVision app with realistic mock data for demos and testing, while maintaining full real-time functionality.

## Quick Start

```bash
# Navigate to scripts folder
cd scripts

# Install dependencies
npm install

# Copy environment variables
cp ../.env.local .env

# Run seeding script
npm run seed
```

## What Gets Created

### Organizations (10)
- TechCorp, InnovateLabs, DataDrive, CloudScale, AI Solutions
- DevHub, CodeCraft, FutureTech, SmartSystems, DigitalWave
- Each with logo, about, website, LinkedIn profile

### Users (30 total)

**Employers (10)**
- One per organization
- Email: employer0@techcorp.com, etc.
- Full profiles with avatars

**Candidates (20)**
- Diverse skill sets (React, TypeScript, Python, etc.)
- 80% public profiles, 20% private
- 1-10 years experience
- Locations: SF, NYC, Austin, Seattle, Remote, etc.
- Complete profiles with resume, LinkedIn, GitHub, portfolio

### Jobs (30)
- 3 jobs per organization
- Titles: Senior Engineer, Full Stack Dev, DevOps, Data Scientist, etc.
- Departments: Engineering, Product, Design, Data Science
- Employment types: Full-time, Part-time, Contract
- Salary ranges: $80k-$250k
- 75% open, 25% closed
- Requirements, responsibilities, benefits

### Applications (~150)
- 3-10 applicants per job
- Statuses: pending, reviewing, shortlisted, rejected, accepted
- Resume URLs and cover letters
- Applied dates from Jan 2024 to present

### Interviews (15)
- Types: phone, video, onsite, technical
- Scheduled 1-30 days in future
- Duration: 30-90 minutes
- Locations: Zoom, Google Meet, Office, Phone
- Statuses: scheduled, completed, cancelled

### Challenges (10)
- Types: hackathon, coding, design, case-study
- Titles: "Build Real-time Chat", "AI Resume Parser", etc.
- Rewards: $1k-$5k
- Deadlines: 10-70 days from now
- Active/expired status

### Community Posts (15)
- Types: achievement, project, job, article
- Titles: "Just landed my dream job!", "AWS Certification", etc.
- Random likes (0-10 per post)
- Dates from Jan 2024 to present

### Connections (20)
- Between candidates
- Statuses: pending, accepted, rejected
- Random pairings

### Conversations (10)
- Between random users
- 5 messages per conversation
- Read/unread status
- Timestamps from Jan 2024 to present

## Data Quality Features

✅ **Realistic Names**: Alex Smith, Jordan Garcia, Taylor Martinez, etc.
✅ **Valid Emails**: employer0@techcorp.com, candidate5@example.com
✅ **Proper Avatars**: UI Avatars API with initials
✅ **Sensible Skills**: React + TypeScript + Node.js (not random)
✅ **Logical Dates**: Applications after job postings
✅ **Varied Statuses**: Mix of pending/active/completed
✅ **Geographic Diversity**: US, Europe, Asia, Remote

## Real-Time Functionality

All mock data works with your existing real-time listeners:

- ✅ Dashboard counts update live
- ✅ Job applications appear instantly
- ✅ Interview schedules sync
- ✅ Community posts show up
- ✅ Messages deliver in real-time
- ✅ Connection requests notify

## Usage Scenarios

### Demo Preparation
```bash
npm run seed  # Run 1-2 days before demo
```

### Testing Features
- Test job matching with 20 candidates
- Test application workflow with 150+ applications
- Test messaging with 10 conversations
- Test community with 15 posts

### Development
- Populate local Firebase emulator
- Test UI with realistic data
- Verify real-time updates

## Customization

Edit `seed-mock-data.ts` to customize:

```typescript
// Change quantities
for (let i = 0; i < 20; i++) { // More/fewer items

// Modify data
const companies = ['YourCompany', ...]; // Your company names

// Adjust dates
randomDate(new Date(2024, 0, 1), new Date()) // Date range
```

## Clean Up Mock Data

### Option 1: Firebase Console
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Delete collections manually

### Option 2: Cleanup Script (TODO)
```bash
npm run cleanup  # Coming soon
```

### Option 3: Fresh Start
1. Create new Firebase project
2. Update .env with new credentials
3. Run seed script

## Best Practices

### For Demos
- ✅ Seed 1-2 days before
- ✅ Verify all pages load
- ✅ Test key workflows
- ✅ Check mobile responsiveness

### For Development
- ✅ Use Firebase emulator
- ✅ Seed locally
- ✅ Don't commit mock data

### For Production
- ❌ Never seed production database
- ✅ Use staging environment
- ✅ Test with real users

## Troubleshooting

### "Module not found" error
```bash
cd scripts
npm install
```

### "Firebase config not found"
```bash
# Copy from main project
cp ../.env.local .env
```

### "Permission denied"
- Check Firebase rules
- Verify API key is correct
- Ensure project ID matches

### Duplicate data
- Script creates new data each run
- Use unique timestamps in IDs
- Clean up before re-seeding

## Data Statistics

| Collection | Count | Subcollections |
|------------|-------|----------------|
| organizations | 10 | jobs, applications, interviews, challenges |
| users | 30 | - |
| jobs | 30 | (under organizations) |
| applications | ~150 | (under organizations) |
| interviews | 15 | (under organizations) |
| challenges | 10 | (under organizations) |
| posts | 15 | - |
| connections | 20 | - |
| conversations | 10 | messages |
| messages | 50 | (under conversations) |

**Total Documents**: ~300+

## Next Steps

1. ✅ Run seeding script
2. ✅ Verify data in Firebase Console
3. ✅ Test app with mock data
4. ✅ Prepare for demo
5. ✅ Switch to real data when ready

## Support

For issues or questions:
- Check Firebase Console for data
- Review script logs for errors
- Verify environment variables
- Test with smaller dataset first

---

**Remember**: Mock data is for demos and testing. Your app works with real-time data from day one!
