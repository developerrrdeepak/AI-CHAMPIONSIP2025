import { collection, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, onSnapshot, getDoc, runTransaction } from 'firebase/firestore';
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
    const conversationRef = doc(firestore, 'conversations', conversationId);

    await addDoc(collection(conversationRef, 'messages'), {
      senderId,
      senderName,
      senderRole,
      receiverId,
      type: 'text',
      content: text,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    await runTransaction(firestore, async (transaction) => {
      const convDoc = await transaction.get(conversationRef);
      if (!convDoc.exists()) {
        throw "Conversation does not exist!";
      }
      const currentUnread = convDoc.data().unreadCount?.[receiverId] || 0;
      
      transaction.update(conversationRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`unreadCount.${receiverId}`]: currentUnread + 1,
      });
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
      participantIds: [user1Id, user2Id],
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

export const markMessagesAsRead = async (firestore: Firestore, conversationId: string, userId: string) => {
    const q = query(
        collection(firestore, 'conversations', conversationId, 'messages'), 
        where('receiverId', '==', userId), 
        where('isRead', '==', false)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(firestore);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
    });

    const convRef = doc(firestore, 'conversations', conversationId);
    batch.update(convRef, { [`unreadCount.${userId}`]: 0 });

    await batch.commit();
};
