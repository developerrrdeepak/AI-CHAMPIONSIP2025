
'use client';

import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion, arrayRemove, Timestamp, getDocs, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendAIMessage, AI_CONTEXTS } from './ai-chat';

export async function createPost(firestore: any, storage: any, userId: string, userName: string, userAvatar: string, content: string, imageFile: File | null) {
  let imageUrl = null;
  
  if (imageFile) {
    const imageRef = ref(storage, `posts/${userId}/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    imageUrl = await getDownloadURL(imageRef);
  }

  // AI-powered content analysis for hashtags
  const aiPrompt = `Analyze the following post content and suggest 3-5 relevant hashtags. Return ONLY a comma-separated list of hashtags (e.g., #react,#typescript,#webdev):\n\n${content}`;
  const hashtagString = await sendAIMessage(aiPrompt, AI_CONTEXTS.COMMUNITY);
  const hashtags = hashtagString.split(',').map(h => h.trim()).filter(Boolean);

  await addDoc(collection(firestore, 'posts'), {
    authorId: userId,
    authorName: userName,
    authorAvatar: userAvatar,
    authorUsername: userName.toLowerCase().replace(/\s/g, ''),
    content,
    imageUrl,
    hashtags,
    likes: [], // Store liker UIDs
    comments: [], // Store comment objects
    createdAt: Timestamp.now(),
  });
}

export function getExplorePosts(firestore: any, callback: (posts: any[]) => void) {
  const q = query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(posts);
  });
}

export async function getFollowingPosts(firestore: any, userId: string, callback: (posts: any[]) => void) {
  const connectionsRef = collection(firestore, 'connections');
  const q = query(connectionsRef, where('requesterId', '==', userId), where('status', '==', 'accepted'));
  const followingSnapshot = await getDocs(q);
  const followingIds = followingSnapshot.docs.map(doc => doc.data().receiverId);

  if (followingIds.length === 0) {
    callback([]);
    return () => {};
  }

  const postsQuery = query(
    collection(firestore, 'posts'),
    where('authorId', 'in', followingIds),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(postsQuery, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(posts);
  });
}

export async function toggleLike(firestore: any, postId: string, userId: string) {
  const postRef = doc(firestore, 'posts', postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return;
  
  const post = postSnap.data();
  const isLiked = post.likes.includes(userId);

  await updateDoc(postRef, {
    likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
  });
}

export async function addComment(firestore: any, postId: string, userId: string, userName: string, commentText: string) {
  const postRef = doc(firestore, 'posts', postId);
  await updateDoc(postRef, {
    comments: arrayUnion({
      userId,
      userName,
      comment: commentText,
      createdAt: Timestamp.now()
    })
  });
}

export async function getAIConnectionSuggestion(candidateProfile: any) {
    const prompt = `Based on this candidate's profile, generate a personalized, short (1-2 sentences) icebreaker message for a recruiter to send:\n\nProfile: ${JSON.stringify(candidateProfile)}`;
    return await sendAIMessage(prompt, AI_CONTEXTS.RECRUITMENT);
}

export async function getAIConnectionSummary(profile1: any, profile2: any) {
    const prompt = `Briefly summarize why these two professionals might be a good connection:\n\nProfile 1: ${JSON.stringify(profile1)}\n\nProfile 2: ${JSON.stringify(profile2)}`;
    return await sendAIMessage(prompt, AI_CONTEXTS.GENERAL);
}
