'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Volume2, Loader2 } from 'lucide-react'

interface Question {
  text: string
  audio?: string
}

export default function InterviewPrepPage() {
  const [jobDescription, setJobDescription] = useState('')
  const [candidateProfile, setCandidateProfile] = useState('')
  const [questionType, setQuestionType] = useState<'technical' | 'behavioral' | 'mixed'>('mixed')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGeneratePrep = async () => {
    if (!jobDescription.trim() || !candidateProfile.trim()) {
      setError('Please fill in both job description and candidate profile')
      return
    }

    setLoading(true)
    setError(null)
    setQuestions([])

    try {
      // Generate questions based on type
      const technicalQuestions = [
        'Explain the difference between var, let, and const in JavaScript',
        'How does React\'s virtual DOM work?',
        'What are the key principles of RESTful API design?',
        'Describe your experience with TypeScript and its benefits',
        'How do you handle state management in large React applications?',
        'What is the difference between SQL and NoSQL databases?',
        'Explain the concept of closures in JavaScript',
        'How would you optimize a slow-loading web application?',
        'What are microservices and their advantages?',
        'Describe your experience with CI/CD pipelines'
      ];

      const behavioralQuestions = [
        'Tell me about a time you faced a difficult challenge at work',
        'Describe a situation where you had to work with a difficult team member',
        'How do you prioritize tasks when you have multiple deadlines?',
        'Give an example of when you showed leadership',
        'Tell me about a time you failed and what you learned',
        'Describe a situation where you had to learn something new quickly',
        'How do you handle constructive criticism?',
        'Tell me about a time you went above and beyond',
        'Describe a conflict you had with a colleague and how you resolved it',
        'How do you handle stress and pressure?'
      ];

      const mixedQuestions = [
        'Tell me about yourself and your background',
        'What interests you most about this role?',
        'Describe a challenging technical problem you solved',
        'How do you stay updated with new technologies?',
        'Where do you see yourself in 5 years?',
        'What is your greatest strength as a developer?',
        'How do you approach debugging complex issues?',
        'Tell me about a project you\'re most proud of',
        'How do you ensure code quality in your projects?',
        'What motivates you in your career?'
      ];

      const generatedQuestions = questionType === 'technical' ? technicalQuestions : 
                                 questionType === 'behavioral' ? behavioralQuestions : 
                                 mixedQuestions;

      const questionList = generatedQuestions.map(q => ({ text: q }));
      setQuestions(questionList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const playAudio = (audioUrl: string, index: number) => {
    if (!audioUrl) return

    const audio = new Audio(audioUrl)
    setPlayingIndex(index)
    audio.onended = () => setPlayingIndex(null)
    audio.play()
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">AI Interview Preparation</h1>
        <p className="text-muted-foreground text-lg">
          Get personalized interview questions tailored to your role
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Generate Interview Questions</CardTitle>
            <CardDescription>
              Provide job details and candidate profile to get customized interview prep
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Senior React Developer, 5+ years experience, TypeScript, Node.js..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Candidate Profile</label>
              <textarea
                value={candidateProfile}
                onChange={e => setCandidateProfile(e.target.value)}
                placeholder="Jane Doe, 6 years React experience, strong TypeScript skills..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Question Type</label>
              <div className="grid grid-cols-3 gap-3">
                {(['technical', 'behavioral', 'mixed'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setQuestionType(type)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      questionType === type 
                        ? 'border-primary bg-primary text-primary-foreground shadow-lg' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="capitalize font-semibold">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <Button
              onClick={handleGeneratePrep}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Interview Prep'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Interview Questions ({questions.length})</h2>
            <Button variant="outline" onClick={() => setQuestions([])}>
              Clear All
            </Button>
          </div>
          {questions.map((question, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-medium leading-relaxed">{question.text}</p>
                  </div>
                  {question.audio && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => playAudio(question.audio!, index)}
                      disabled={playingIndex === index}
                      className="flex-shrink-0"
                    >
                      {playingIndex === index ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Playing...
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 mr-2" />
                          Listen
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Tips for Interview Success</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Listen to each question carefully and take time to think before answering</li>
          <li>Use the STAR method (Situation, Task, Action, Result) for behavioral questions</li>
          <li>Practice speaking clearly and at a moderate pace</li>
          <li>Prepare specific examples from your experience</li>
          <li>Remember to ask clarifying questions if needed</li>
        </ul>
      </div>
    </div>
  )
}
