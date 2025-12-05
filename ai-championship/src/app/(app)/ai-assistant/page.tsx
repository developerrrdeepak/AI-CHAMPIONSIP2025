'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Define the structure for a chat message
interface ChatMessage {
  text: string;
  isUser: boolean;
}

export default function AIAssistantPage() {
  // State to hold the chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // State to hold the current user input
  const [input, setInput] = useState('');
  // State to track if the AI is typing
  const [isLoading, setIsLoading] = useState(false);
  // Ref to the chat container for scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (input.trim()) {
      const userMessage = { text: input, isUser: true };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/google-ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input, context: 'general_assistant' }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response.');
        }

        const data = await response.json();
        const aiMessage = { text: data.response, isUser: false };
        setMessages(prevMessages => [...prevMessages, aiMessage]);
      } catch (error) {
        const errorMessage = { text: 'Sorry, I am having trouble connecting. Please try again later.', isUser: false };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <PageHeader
        title="Universal AI Assistant"
        description="Your unrestricted AI partner for any task or question. Powered by Google Gemini."
      />
      
      {/* Chat container */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-lg ${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg bg-muted">
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
