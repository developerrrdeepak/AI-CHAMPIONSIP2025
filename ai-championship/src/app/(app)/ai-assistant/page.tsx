'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { Bot, Send, Mic, Volume2, User, Sparkles, Upload, FileText } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AIAssistantPage() {
  const { user, storage } = useFirebase() as any;
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI recruitment assistant powered by Raindrop SmartInference and ElevenLabs voice. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/google-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: currentInput, 
          context: 'recruitment_assistant',
          useRaindrop: true
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'API error');
      }
      
      const assistantMessage = {
        role: 'assistant',
        content: data.response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your API key configuration and try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    setIsListening(true);
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognition.start();
    } else {
      setIsListening(false);
      alert('Voice input not supported in your browser');
    }
  };

  const speakMessage = async (text: string) => {
    try {
      const response = await fetch('/api/elevenlabs/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        if (audioBlob.size > 0) {
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
        }
      }
    } catch (error) {
      console.error('Voice synthesis error:', error);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !storage) return;

    setResumeFile(file);
    setIsLoading(true);

    try {
      const resumeRef = ref(storage, `resumes/${user.uid}/${file.name}`);
      await uploadBytes(resumeRef, file);
      const url = await getDownloadURL(resumeRef);

      const assistantMessage = {
        role: 'assistant',
        content: `I've received your resume "${file.name}". I can help you analyze it, optimize it for ATS systems, or match it with relevant job openings. What would you like me to do?`
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Resume upload error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I had trouble uploading your resume. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 py-6">
      <PageHeader
        title="AI Recruitment Assistant"
        description="Powered by Raindrop SmartInference and ElevenLabs Voice AI"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Chat Assistant
                <Badge variant="secondary">Voice Enabled</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        {message.role === 'assistant' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-6 px-2"
                            onClick={() => speakMessage(message.content)}
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about candidates, jobs, or recruitment strategies..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleVoiceInput}
                    disabled={isListening || isLoading}
                  >
                    {isListening ? <Mic className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleResumeUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resume
                  </Button>
                  {resumeFile && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {resumeFile.name}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setInput('Find candidates with React and TypeScript skills')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Find Candidates
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setInput('Help me write a job description for a senior developer')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Write Job Description
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setInput('Generate interview questions for a product manager role')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Interview Questions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">SmartInference</Badge>
                <span className="text-xs text-muted-foreground">AI Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">SmartMemory</Badge>
                <span className="text-xs text-muted-foreground">Context Aware</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">ElevenLabs</Badge>
                <span className="text-xs text-muted-foreground">Voice Enabled</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}