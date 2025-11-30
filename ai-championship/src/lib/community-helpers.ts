import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion, arrayRemove, Timestamp, getDocs, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function createPost(firestore: any, storage: any, userId: string, userName: string, userAvatar: string, content: string, imageFile: File | null) {
  let imageUrl = null;
  
  if (imageFile) {
    const imageRef = ref(storage, `posts/${userId}/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    imageUrl = await getDownloadURL(imageRef);
  }

  const hashtags = content.match(/#\w+/g) || [];

  await addDoc(collection(firestore, 'posts'), {
    authorId: userId,
    authorName: userName,
    authorAvatar: userAvatar,
    authorUsername: userName.toLowerCase().replace(/\s/g, ''),
    content,
    imageUrl,
    hashtags,
    likes: 0,
    comments: 0,
    savedBy: [],
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

export async function getFollowingPosts(firestore: any, userId: string, following: string[], callback: (posts: any[]) => void) {
  if (following.length === 0) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(firestore, 'posts'),
    where('authorId', 'in', following),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(posts);
  });
}

export async function toggleLike(firestore: any, postId: string) {
  const postRef = doc(firestore, 'posts', postId);
  await updateDoc(postRef, {
    likes: increment(1)
  });
}

export async function savePost(firestore: any, postId: string, userId: string, isSaved: boolean) {
  const postRef = doc(firestore, 'posts', postId);
  await updateDoc(postRef, {
    savedBy: isSaved ? arrayRemove(userId) : arrayUnion(userId)
  });
}
