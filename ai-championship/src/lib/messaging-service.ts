import { collection, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export const sendMessage = async (
  firestore: Firestore,
  conversationId: string,
  senderId: string,
  senderName: string,
  senderRole: string,
  receiverId: string,
  text: string
) => {
  try {
    await addDoc(collection(firestore, 'conversations', conversationId, 'messages'), {
      conversationId,
      senderId,
      senderName,
      senderRole,
      receiverId,
      type: 'text',
      content: text,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(firestore, 'conversations', conversationId), {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`unreadCount.${receiverId}`]: (await getDoc(doc(firestore, 'conversations', conversationId))).data()?.unreadCount?.[receiverId] || 0 + 1,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const createConversation = async (
  firestore: Firestore,
  user1Id: string,
  user1Name: string,
  user1Role: string,
  user1Avatar: string,
  user2Id: string,
  user2Name: string,
  user2Role: string,
  user2Avatar: string
) => {
  try {
    const convRef = doc(collection(firestore, 'conversations'));
    await setDoc(convRef, {
      participants: [
        { id: user1Id, name: user1Name, role: user1Role, avatarUrl: user1Avatar },
        { id: user2Id, name: user2Name, role: user2Role, avatarUrl: user2Avatar }
      ],
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      unreadCount: { [user1Id]: 0, [user2Id]: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return convRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const subscribeToMessages = (
  firestore: Firestore,
  conversationId: string,
  callback: (messages: any[]) => void
) => {
  const q = query(
    collection(firestore, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));
    callback(messages);
  });
};
