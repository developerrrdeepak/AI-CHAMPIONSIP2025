
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Sparkles, Code, Bug, Lightbulb, Brain, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export function UniversalAIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'नमस्ते! मैं आपका Universal AI Mentor हूं। मुझसे कुछ भी पूछें - कोई भी सवाल, कोई भी टॉपिक। मैं हर सवाल का जवाब दूंगा! 🚀',
      timestamp: new Date(),
      suggestions: [
        'Code analyze करो',
        'Bug fix करने में help करो',
        'Koi concept explain करो',
        'Ideas brainstorm करो',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'code' | 'debug' | 'explain' | 'brainstorm'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const payload: any = {
        question: input,
        userId: 'user-' + Date.now(),
      };

      if (mode === 'code') {
        payload.action = 'analyze-code';
        payload.code = input;
        payload.language = 'javascript';
      } else if (mode === 'debug') {
        payload.action = 'debug';
        payload.error = input;
      } else if (mode === 'explain') {
        payload.action = 'explain';
        payload.concept = input;
        payload.level = 'intermediate';
      } else if (mode === 'brainstorm') {
        payload.action = 'brainstorm';
        payload.topic = input;
        payload.count = 10;
      }

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.data.answer,
          timestamp: new Date(),
          suggestions: data.data.suggestions,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `मुझे एक technical issue आया, लेकिन मैं फिर भी help करने की कोशिश करूंगा। कृपया अपना सवाल दोबारा पूछें या थोड़ा और context दें।`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const useSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold">Universal AI Mentor</h2>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === 'chat' ? 'default' : 'outline'}
              onClick={() => setMode('chat')}
            >
              <Brain className="w-4 h-4 mr-1" />
              Chat
            </Button>
            <Button
              size="sm"
              variant={mode === 'code' ? 'default' : 'outline'}
              onClick={() => setMode('code')}
            >
              <Code className="w-4 h-4 mr-1" />
              Code
            </Button>
            <Button
              size="sm"
              variant={mode === 'debug' ? 'default' : 'outline'}
              onClick={() => setMode('debug')}
            >
              <Bug className="w-4 h-4 mr-1" />
              Debug
            </Button>
            <Button
              size="sm"
              variant={mode === 'brainstorm' ? 'default' : 'outline'}
              onClick={() => setMode('brainstorm')}
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Ideas
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'} rounded-lg p-3`}>
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs opacity-70">Suggestions:</p>
                    {message.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant="outline"
                        className="w-full text-left justify-start text-xs"
                        onClick={() => useSuggestion(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}\
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              mode === 'chat' ? 'कुछ भी पूछें...' :
              mode === 'code' ? 'Code paste करें...' :
              mode === 'debug' ? 'Error describe करें...' :
              mode === 'brainstorm' ? 'Topic बताएं...' :
              'Type your message...'
            }
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
