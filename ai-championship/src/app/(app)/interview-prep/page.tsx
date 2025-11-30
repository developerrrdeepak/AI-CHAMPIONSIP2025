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
      const response = await fetch('/api/elevenlabs/interview-prep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          candidateProfile,
          questionType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate interview prep')
      }

      const data = await response.json()
      const questionList = data.questions.map((q: string, idx: number) => ({
        text: q,
        audio: data.audioUrls[idx],
      }))
      setQuestions(questionList)
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Interview Preparation</h1>
        <p className="text-gray-600">
          Get personalized interview questions with voice guidance powered by ElevenLabs
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
              <div className="flex gap-3">
                {(['technical', 'behavioral', 'mixed'] as const).map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="radio"
                      value={type}
                      checked={questionType === type}
                      onChange={e => setQuestionType(e.target.value as typeof type)}
                      className="mr-2"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
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
          <h2 className="text-2xl font-bold mb-4">Interview Questions</h2>
          {questions.map((question, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-lg font-medium mb-2">{index + 1}. {question.text}</p>
                  </div>
                  {question.audio && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => playAudio(question.audio!, index)}
                      disabled={playingIndex === index}
                      className="ml-4 flex-shrink-0"
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
