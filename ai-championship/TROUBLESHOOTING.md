# 🔧 Troubleshooting Guide

## Messages Tab Not Working

### Issue: "No conversations yet" showing

**Reason**: Firestore me abhi koi conversations nahi hai.

**Solution**:
1. Candidate search page pe jao (`/candidates`)
2. Kisi candidate card pe **Message button** (✉️) click karo
3. Automatically conversation create hoga
4. Messages tab me conversation dikhega

**OR** Manually test:
1. Browser console open karo (F12)
2. Ye code run karo:
```javascript
// Test conversation create karne ke liye
const testConv = {
  participants: [
    { id: 'user1', name: 'Test Employer', role: 'Owner' },
    { id: 'user2', name: 'Test Candidate', role: 'Candidate' }
  ],
  participantIds: ['user1', 'user2'],
  lastMessage: 'Hello!',
  lastMessageAt: new Date().toISOString(),
  unreadCount: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

---

## Connections Tab Not Working

### Issue: "No connections yet" showing

**Reason**: Firestore me abhi koi connections nahi hai.

**Solution**:
1. Candidate search page pe jao (`/candidates`)
2. Kisi candidate card pe **Connect button** (👤+) click karo
3. Connection request send hoga
4. Connections tab me "Pending" section me dikhega

**For Testing**:
- Employer account se candidate ko connect karo
- Candidate account se accept karo
- Dono ke Connections tab me dikhega

---

## Community Tab Not Working

### Issue: "No posts yet" showing

**Reason**: Firestore me abhi koi posts nahi hai.

**Solution**:
1. Community page pe jao
2. **Create Post** button click karo
3. Post type select karo (Achievement/Project/Job/Article)
4. Title aur content likho
5. **Publish** click karo
6. Post feed me dikhega

---

## Common Issues

### 1. Firebase Permission Denied

**Error**: `FirebaseError: Missing or insufficient permissions`

**Fix**: 
- Firebase Console → Firestore Database → Rules
- Ensure rules allow read/write:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. User Not Logged In

**Error**: `userId is null`

**Fix**:
- Sign in with Google
- Check Firebase Auth is working
- Verify user data in Firestore `/users/{userId}`

### 3. Organization Not Set

**Error**: `organizationId is undefined`

**Fix**:
- First time login: Create organization in settings
- Or join existing organization
- Check `/users/{userId}` has `organizationId` field

---

## Quick Test Data Creation

### Create Test Conversation:
```typescript
// In browser console on /messages page
const firestore = firebase.firestore();
await firestore.collection('conversations').add({
  participants: [
    { id: firebase.auth().currentUser.uid, name: 'You', role: 'Owner' },
    { id: 'test-user-123', name: 'Test User', role: 'Candidate' }
  ],
  participantIds: [firebase.auth().currentUser.uid, 'test-user-123'],
  lastMessage: 'Test message',
  lastMessageAt: new Date().toISOString(),
  unreadCount: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
```

### Create Test Connection:
```typescript
// In browser console on /connections page
const firestore = firebase.firestore();
await firestore.collection('connections').add({
  requesterId: 'test-user-123',
  requesterName: 'Test Candidate',
  requesterRole: 'Candidate',
  receiverId: firebase.auth().currentUser.uid,
  receiverName: 'You',
  receiverRole: 'Owner',
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
```

### Create Test Post:
```typescript
// In browser console on /community page
const firestore = firebase.firestore();
await firestore.collection('posts').add({
  authorId: firebase.auth().currentUser.uid,
  authorName: 'You',
  authorRole: 'Owner',
  type: 'article',
  title: 'Test Post',
  content: 'This is a test post to verify community feed is working.',
  likes: [],
  comments: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
```

---

## Verification Steps

### ✅ Messages Working:
1. Go to `/messages`
2. See conversations list on left
3. Click conversation
4. See messages on right
5. Type message and send
6. Message appears in chat

### ✅ Connections Working:
1. Go to `/connections`
2. See tabs: All, Followers, Following, Pending
3. Stats cards show counts
4. Can accept/reject pending requests
5. Can view all connections

### ✅ Community Working:
1. Go to `/community`
2. See tabs: All Posts, Following, Achievements, Projects, Jobs
3. Can create new post
4. Can like posts (heart icon)
5. Posts show author info and timestamp

---

## Still Not Working?

### Check Browser Console:
1. Press F12
2. Go to Console tab
3. Look for red errors
4. Share error message

### Check Network Tab:
1. Press F12
2. Go to Network tab
3. Look for failed requests (red)
4. Check Firestore requests

### Check Firestore:
1. Go to Firebase Console
2. Open Firestore Database
3. Check collections exist:
   - `conversations`
   - `connections`
   - `posts`
4. Check documents have correct structure

---

## Need Help?

**No API keys needed for these features!**

Messages, Connections, and Community only use:
- ✅ Firebase Auth (already working)
- ✅ Firestore Database (already configured)
- ✅ Real-time listeners (built-in)

If still not working, share:
1. Browser console errors
2. Which tab not working
3. What you see vs what expected
