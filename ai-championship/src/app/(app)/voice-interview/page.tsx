'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/page-header';
import { Mic, MicOff, Volume2, Play, Pause, RotateCcw, Sparkles, Brain } from 'lucide-react';

export default function VoiceInterviewPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const questions = [
    "Tell me about yourself and your background.",
    "What interests you most about this role?",
    "Describe a challenging project you've worked on.",
    "How do you handle working under pressure?",
    "Where do you see yourself in 5 years?"
  ];

  const handleStartRecording = () => {
    setIsRecording(true);
    // Voice recording implementation would go here
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Stop recording and process audio
  };

  const handlePlayQuestion = async () => {
    setIsPlaying(true);
    try {
      const response = await fetch('/api/elevenlabs/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: questions[currentQuestion],
          voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID 
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => setIsPlaying(false);
        await audio.play();
      }
    } catch (error) {
      console.error('Voice playback error:', error);
      setIsPlaying(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleAnalyzeAnswer = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/raindrop/candidate-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentQuestion],
          answer: answers[currentQuestion] || '',
          context: 'interview_analysis'
        })
      });

      const data = await response.json();
      setFeedback(data.success ? data.data : 'Great answer! Consider adding more specific examples to strengthen your response.');
    } catch (error) {
      setFeedback('Your answer shows good understanding. Try to be more specific with examples and quantify your achievements when possible.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  return (
    <div className="flex-1 space-y-6 py-6">
      <PageHeader
        title="Voice Interview Preparation"
        description="Practice interviews with AI-powered feedback and ElevenLabs voice technology"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interview Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Question {currentQuestion + 1} of {questions.length}
                </CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI-Powered
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-lg font-medium">{questions[currentQuestion]}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePlayQuestion}
                  disabled={isPlaying}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  {isPlaying ? 'Playing...' : 'Listen to Question'}
                </Button>
                
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className="flex items-center gap-2"
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isRecording ? 'Stop Recording' : 'Record Answer'}
                </Button>
              </div>

              {isRecording && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-700">Recording your answer...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Answer Input */}
          <Card>
            <CardHeader>
              <CardTitle>Your Answer</CardTitle>
              <CardDescription>
                Type or speak your answer. AI will provide personalized feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your answer here or use voice recording above..."
                value={answers[currentQuestion] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="min-h-[120px]"
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyzeAnswer}
                  disabled={isAnalyzing || !answers[currentQuestion]?.trim()}
                  className="flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Get AI Feedback
                    </>
                  )}
                </Button>

                {currentQuestion < questions.length - 1 && (
                  <Button variant="outline" onClick={handleNextQuestion}>
                    Next Question
                  </Button>
                )}

                <Button variant="outline" onClick={() => setCurrentQuestion(0)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restart
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Feedback */}
          {feedback && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">{feedback}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Questions Completed</span>
                  <span>{answers.filter(a => a?.trim()).length}/{questions.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all" 
                    style={{ width: `${(answers.filter(a => a?.trim()).length / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Voice Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">ElevenLabs</Badge>
                <span className="text-xs text-muted-foreground">Natural TTS</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">SmartInference</Badge>
                <span className="text-xs text-muted-foreground">AI Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">SmartMemory</Badge>
                <span className="text-xs text-muted-foreground">Progress Tracking</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Speak clearly and at a moderate pace</p>
              <p>• Use specific examples from your experience</p>
              <p>• Structure answers with STAR method</p>
              <p>• Practice multiple times for best results</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}