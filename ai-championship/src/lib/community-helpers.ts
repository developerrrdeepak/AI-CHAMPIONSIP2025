'use client';

import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion, arrayRemove, Timestamp, getDocs, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendAIMessage } from './ai-chat'; // Import the AI chat helper

export async function createPost(firestore: any, storage: any, userId: string, userName: string, userAvatar: string, content: string, imageFile: File | null) {
  let imageUrl = null;
  
  if (imageFile) {
    const imageRef = ref(storage, `posts/${userId}/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    imageUrl = await getDownloadURL(imageRef);
  }

  // AI-powered content analysis for hashtags
  const aiPrompt = `Analyze the following post content and suggest 3-5 relevant hashtags. Return ONLY a comma-separated list of hashtags (e.g., #react,#typescript,#webdev):\n\n${content}`;
  const hashtagString = await sendAIMessage(aiPrompt, 'community_assistant');
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
  const post = (await getDocs(query(collection(firestore, 'posts'), where('__name__', '==', postId)))).docs[0].data();
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
