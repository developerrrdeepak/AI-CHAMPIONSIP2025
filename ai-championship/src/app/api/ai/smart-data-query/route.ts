import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Ensure the API key is loaded from environment variables
const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GOOGLE_GEMINI_API_KEY is not set.');
}

const genAI = new GoogleGenerativeAI(API_KEY || ''); // Pass a default empty string if not set

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: Google Gemini API key is missing.' },
      { status: 500 }
    );
  }

  try {
    const { naturalLanguageQuery } = await request.json();

    if (typeof naturalLanguageQuery !== 'string' || naturalLanguageQuery.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request: "naturalLanguageQuery" field is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a Data Analyst AI for a talent acquisition platform. Your task is to process a natural language query, simulate data retrieval, and then summarize that mock data.

The user's query is: "${naturalLanguageQuery}"

First, interpret the query and imagine what kind of data (e.g., candidate profiles, job applications, interview results, company stats) would be relevant.
Second, *simulate* fetching this data by generating a realistic, small JSON array of mock data. The mock data should directly relate to the user's query. For example, if the query is about 'candidates with Python skills', generate a few mock candidate objects that have Python skills. If it's about 'job applications in Q3', generate mock application records for that period. Make the mock data diverse enough to be interesting.
Third, provide a natural language summary of the *mock data you just generated*, highlighting key findings or directly answering the original query based on this mock data.

Your final output MUST be a JSON string with two fields:
- "summary": A natural language summary of the mock data you generated, answering the user's original query.
- "mockData": A JSON array representing the simulated data retrieval results.

Example output structure:
{
  "summary": "Here's a summary of the mock data related to your query...",
  "mockData": [
    { "id": "1", "name": "John Doe", "skills": ["Python", "AWS"] },
    { "id": "2", "name": "Jane Smith", "skills": ["Java", "Python"] }
  ]
}

Ensure the mockData is always a JSON array, even if it's empty.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Attempt to parse the AI's response as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // If AI didn't return valid JSON, try to salvage by putting raw text into summary
      return NextResponse.json(
        {
          success: true,
          summary: responseText, // Return raw text as summary
          mockData: [], // Default to empty array for mockData
          warning: "AI response was not valid JSON, returning raw text as summary."
        }
      );
    }

    // Validate the structure of the parsed response
    if (typeof parsedResponse.summary === 'string' && Array.isArray(parsedResponse.mockData)) {
      return NextResponse.json({
        success: true,
        summary: parsedResponse.summary,
        mockData: parsedResponse.mockData,
      });
    } else {
      console.error('AI response has unexpected structure:', parsedResponse);
      return NextResponse.json(
        { error: 'AI generated response in an unexpected format.', details: parsedResponse },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error during smart data querying:', error);
    return NextResponse.json(
      { error: 'Failed to process natural language query.', details: (error as Error).message },
      { status: 500 }
    );
  }
}