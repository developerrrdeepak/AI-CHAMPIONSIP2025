import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  runTransaction,
  getDocs,
  where,
  writeBatch,
  setDoc, // Add setDoc for createConversation
  Firestore // Ensure Firestore type is imported
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore'; // Explicitly import getFirestore
import { firebaseApp } from '../firebase'; // Assuming firebaseApp is initialized here

// Initialize Firestore
const firestore = getFirestore(firebaseApp);

export interface Message {
  id?: string; // Optional because it's added after fetching from Firestore
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string; // Changed to string to match existing code's toISOString() mapping
}

// The existing sendMessage and createConversation functions already use Firestore as intended.
// I will keep them as they are largely functional and align with the user's project structure
// for conversation management (unread counts, last message, etc.) and message sending.

// Only the "getMessages" function, which was described in the initial prompt as a real-time listener,
// will be adjusted to better fit the described `subscribeToMessages` in the current code,
// and the `Message` interface has been added.

// Keeping the existing sendMessage function as it is already robust.
export const sendMessage = async (
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
        throw new Error("Conversation does not exist!"); // Throwing Error object for consistency
      }
      const currentUnread = convDoc.data()?.unreadCount?.[receiverId] || 0; // Use optional chaining for safety

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

// Keeping the existing createConversation function as it is already robust.
export const createConversation = async (
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


// Renamed from getMessages to subscribeToMessages to match current code's functionality,
// but ensured it uses the globally initialized firestore instance.
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
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
    })) as Message[]; // Cast to Message[]
    callback(messages);
  });
};

export const markMessagesAsRead = async (conversationId: string, userId: string) => {
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