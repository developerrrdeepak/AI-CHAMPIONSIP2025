'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PageHeader } from '@/components/page-header';
import { Video, Mic, MicOff, Volume2, Send, User, Bot, Sparkles } from 'lucide-react';

export default function VoiceInterviewPage() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([
    { role: 'assistant', content: 'Hello! I\'m your AI interviewer. What field or role would you like to practice for today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (videoRef.current && isInterviewStarted) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error('Camera error:', err));
    }
  }, [isInterviewStarted]);

  const handleStartListening = () => {
    setIsListening(true);
    // Web Speech API for voice input
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
    }
  };

  const speakMessage = async (text: string) => {
    setIsSpeaking(true);
    try {
      const voiceId = voiceGender === 'female' 
        ? 'EXAVITQu4vr4xnSDxMaL' // Female voice
        : '21m00Tcm4TlvDq8ikWAM'; // Male voice

      const response = await fetch('/api/elevenlabs/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        if (audioBlob.size > 0) {
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => {
            // Fallback to browser speech synthesis
            useBrowserSpeech(text);
          };
          await audio.play();
        } else {
          // Use browser speech synthesis as fallback
          useBrowserSpeech(text);
        }
      } else {
        useBrowserSpeech(text);
      }
    } catch (error) {
      console.error('Voice error:', error);
      useBrowserSpeech(text);
    }
  };

  const useBrowserSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = voiceGender === 'male' ? 0.8 : 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    if (!isInterviewStarted) {
      setIsInterviewStarted(true);
    }

    try {
      const response = await fetch('/api/voice-interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: currentInput,
          conversationHistory: messages
        })
      });

      if (!response.ok) throw new Error('API error');
      
      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-speak the response
      await speakMessage(data.response);
    } catch (error) {
      console.error('Interview error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, I had trouble processing that. Could you please repeat?'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([{ role: 'assistant', content: 'Hello! I\'m your AI interviewer. What field or role would you like to practice for today?' }]);
    setIsInterviewStarted(false);
    setInput('');
  };

  return (
    <div className="flex-1 space-y-6 py-6">
      <PageHeader
        title="Live AI Interview Practice"
        description="Practice with a live AI interviewer - like a real video call"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interview Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Call Interface */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 gap-0">
                {/* AI Interviewer */}
                <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 aspect-video flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Bot className="h-16 w-16" />
                    </div>
                    <p className="text-lg font-semibold">AI Interviewer</p>
                    <Badge variant="secondary" className="mt-2">
                      {voiceGender === 'female' ? '👩 Female Voice' : '👨 Male Voice'}
                    </Badge>
                    {isSpeaking && (
                      <div className="mt-4 flex items-center justify-center gap-1">
                        <div className="w-2 h-8 bg-white rounded animate-pulse" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-12 bg-white rounded animate-pulse" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-6 bg-white rounded animate-pulse" style={{animationDelay: '300ms'}}></div>
                        <div className="w-2 h-10 bg-white rounded animate-pulse" style={{animationDelay: '450ms'}}></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Your Video */}
                <div className="relative bg-gray-900 aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 text-white">
                    <Badge variant="secondary">You</Badge>
                  </div>
                  {isListening && (
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                        <Mic className="h-4 w-4 animate-pulse" />
                        <span className="text-sm">Listening...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Live Interview Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Messages */}
                <div className="h-[400px] overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-blue-500 text-white'
                        }`}>
                          {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`rounded-lg p-3 ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-blue-500 text-white'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-blue-500 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your answer or click mic to speak..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleStartListening}
                    disabled={isListening || isLoading}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Voice Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Interviewer Voice</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={voiceGender} onValueChange={(v) => setVoiceGender(v as 'male' | 'female')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="cursor-pointer">👩 Female Voice</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="cursor-pointer">👨 Male Voice</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
                🔄 Start New Interview
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setInput('Tell me about yourself')}>
                💼 Common Question
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setInput('What are my strengths?')}>
                💪 Get Feedback
              </Button>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Live Video</Badge>
                <span className="text-xs text-muted-foreground">Real-time</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Voice AI</Badge>
                <span className="text-xs text-muted-foreground">ElevenLabs</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Smart AI</Badge>
                <span className="text-xs text-muted-foreground">ChatGPT-like</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Any Field</Badge>
                <span className="text-xs text-muted-foreground">Custom</span>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Interview Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Speak naturally like a real interview</p>
              <p>• AI adapts to any field or role</p>
              <p>• Use voice or text input</p>
              <p>• Get instant feedback</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}