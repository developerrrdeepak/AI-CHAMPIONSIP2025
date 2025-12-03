'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, Mic, Search, MoreVertical, Smile, Image, Phone, Video } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useUserContext } from '../layout';
import type { Conversation, Message } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { placeholderImages } from '@/lib/placeholder-images';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { mockConversations, mockMessages } from '@/lib/mock-messages';
import { sendMessage, subscribeToMessages } from '@/lib/messaging-service';

export default function MessagesPage() {
  const { firestore, storage } = useFirebase();
  const { userId, role, displayName } = useUserContext();
  const { toast } = useToast();
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'conversations'),
      orderBy('updatedAt', 'desc')
    );
  }, [firestore, userId]);

  const { data: allConversations } = useCollection<Conversation>(conversationsQuery);

  const conversations = useMemo(() => {
    if (!allConversations || !userId) return mockConversations;
    const filtered = allConversations.filter(conv => 
      conv.participants.some(p => p.id === userId)
    );
    return filtered.length > 0 ? filtered : mockConversations;
  }, [allConversations, userId]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedConversation) return null;
    return query(
      collection(firestore, `conversations/${selectedConversation.id}/messages`),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, selectedConversation]);

  const [realTimeMessages, setRealTimeMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    if (!firestore || !selectedConversation) {
      setRealTimeMessages([]);
      return;
    }
    
    const unsubscribe = subscribeToMessages(firestore, selectedConversation.id, (msgs) => {
      setRealTimeMessages(msgs);
    });
    
    return () => unsubscribe();
  }, [firestore, selectedConversation]);
  
  const displayMessages = useMemo(() => {
    if (realTimeMessages && realTimeMessages.length > 0) return realTimeMessages;
    if (selectedConversation) return mockMessages[selectedConversation.id] || [];
    return [];
  }, [realTimeMessages, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  useEffect(() => {
    if (selectedConversation && displayMessages && userId && firestore) {
      const unreadMessages = displayMessages.filter(m => m.receiverId === userId && !m.isRead);
      unreadMessages.forEach(async (msg) => {
        if (msg.id.startsWith('m')) return;
        await updateDoc(doc(firestore, `conversations/${selectedConversation.id}/messages`, msg.id), {
          isRead: true,
        });
      });
    }
  }, [displayMessages, selectedConversation, userId, firestore]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !userId || !firestore) return;

    try {
      const receiver = selectedConversation.participants.find(p => p.id !== userId);
      if (!receiver) return;

      await sendMessage(
        firestore,
        selectedConversation.id,
        userId,
        displayName || 'User',
        role || 'User',
        receiver.id,
        messageText
      );

      setMessageText('');
      
      toast({
        title: 'Message sent',
        description: 'Your message has been delivered.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message.',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation || !userId || !storage || !firestore) return;

    try {
      const storageRef = ref(storage, `messages/${selectedConversation.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const receiver = selectedConversation.participants.find(p => p.id !== userId);
      if (!receiver) return;

      await addDoc(collection(firestore, `conversations/${selectedConversation.id}/messages`), {
        conversationId: selectedConversation.id,
        senderId: userId,
        senderName: displayName,
        senderRole: role,
        receiverId: receiver.id,
        type: 'attachment',
        content: `Sent ${file.name}`,
        attachmentUrl: downloadURL,
        attachmentName: file.name,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      await updateDoc(doc(firestore, 'conversations', selectedConversation.id), {
        lastMessage: `📎 ${file.name}`,
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'File sent',
        description: 'Your file has been sent successfully.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload file.',
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start recording.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadVoiceMessage = async (audioBlob: Blob) => {
    if (!selectedConversation || !userId || !storage || !firestore) return;

    try {
      const storageRef = ref(storage, `voice-messages/${selectedConversation.id}/${Date.now()}.webm`);
      await uploadBytes(storageRef, audioBlob);
      const downloadURL = await getDownloadURL(storageRef);

      const receiver = selectedConversation.participants.find(p => p.id !== userId);
      if (!receiver) return;

      await addDoc(collection(firestore, `conversations/${selectedConversation.id}/messages`), {
        conversationId: selectedConversation.id,
        senderId: userId,
        senderName: displayName,
        senderRole: role,
        receiverId: receiver.id,
        type: 'voice',
        content: 'Voice message',
        voiceUrl: downloadURL,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      await updateDoc(doc(firestore, 'conversations', selectedConversation.id), {
        lastMessage: '🎤 Voice message',
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Voice message sent',
        description: 'Your voice message has been sent.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send voice message.',
      });
    }
  };

  const filteredConversations = conversations?.filter(conv => {
    const otherParticipant = conv.participants.find(p => p.id !== userId);
    return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const convId = params.get('convId');
    if (convId && conversations) {
      const conv = conversations.find(c => c.id === convId);
      if (conv) setSelectedConversation(conv);
    }
  }, [conversations]);

  return (
    <div className={`transform transition-all duration-300 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <PageHeader
        title="Messages"
        description="Connect with candidates and employers."
      />

      <div className="grid grid-cols-12 gap-6 mt-6 h-[calc(100vh-200px)]">
        <Card className="col-span-12 md:col-span-4 flex flex-col">
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredConversations?.map((conv) => {
                const otherParticipant = conv.participants.find(p => p.id !== userId);
                const unread = conv.unreadCount?.[userId!] || 0;
                return (
                  <div
                    key={conv.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <Avatar>
                      <AvatarImage src={otherParticipant?.avatarUrl || placeholderImages[0].imageUrl} />
                      <AvatarFallback>{otherParticipant?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">{otherParticipant?.name}</p>
                        {unread > 0 && <Badge variant="destructive" className="ml-2">{unread}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage || 'No messages yet'}</p>
                    </div>
                  </div>
                );
              })}
              {filteredConversations?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No conversations yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-8 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.participants.find(p => p.id !== userId)?.avatarUrl || placeholderImages[0].imageUrl} />
                    <AvatarFallback>{selectedConversation.participants.find(p => p.id !== userId)?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-base">{selectedConversation.participants.find(p => p.id !== userId)?.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      Online • {selectedConversation.participants.find(p => p.id !== userId)?.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('/chat-bg.png')] bg-repeat">
                {displayMessages?.map((msg) => {
                  const isSender = msg.senderId === userId;
                  return (
                    <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[70%] ${isSender ? 'bg-primary text-primary-foreground' : 'bg-white border'} rounded-2xl ${isSender ? 'rounded-br-sm' : 'rounded-bl-sm'} p-3 shadow-sm`}>
                        {msg.type === 'text' && <p className="text-sm leading-relaxed break-words">{msg.content}</p>}
                        {msg.type === 'attachment' && (
                          <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline">
                            <Paperclip className="h-4 w-4" />
                            {msg.attachmentName}
                          </a>
                        )}
                        {msg.type === 'voice' && (
                          <audio controls src={msg.voiceUrl} className="w-full max-w-xs" />
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <p className="text-[10px] opacity-60">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          {isSender && msg.isRead && <span className="text-[10px] opacity-60">✓✓</span>}
                          {isSender && !msg.isRead && <span className="text-[10px] opacity-60">✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 border-t bg-muted/30">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => fileInputRef.current?.click()}
                    className="hover:bg-primary/10"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="pr-10 rounded-full border-2 focus:border-primary"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-primary/10"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  {messageText.trim() ? (
                    <Button 
                      onClick={handleSendMessage} 
                      size="icon"
                      className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`rounded-full h-10 w-10 ${isRecording ? 'text-red-500 bg-red-50 animate-pulse' : 'hover:bg-primary/10'}`}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
