// ai-championship/src/app/api/ai/code-analysis/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Ensure the API key is loaded from environment variables
const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GOOGLE_GEMINI_API_KEY is not set.');
  // In a production app, you might want to throw an error or handle this more gracefully.
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
    const { codeSnippet, language } = await request.json();

    if (typeof codeSnippet !== 'string' || codeSnippet.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request: "codeSnippet" field is required and must be a non-empty string.' },
        { status: 400 }
      );
    }
    if (typeof language !== 'string' || language.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request: "language" field is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert code reviewer and assistant. Analyze the provided ${language} code snippet.
    Provide constructive feedback focusing on potential bugs, areas for improvement (e.g., efficiency, readability, best practices), and alternative approaches.
    Format your response as a JSON object with the following fields:
    - "analysisSummary": A brief overview of the code's quality (string).
    - "suggestions": An array of detailed suggestions for improvement (array of strings).
    - "potentialIssues": An array of identified problems (e.g., bugs, security vulnerabilities, performance bottlenecks) (array of strings).
    - "refactoredCode": (Optional) A slightly improved version of the code snippet (string, if applicable).

    Here is the ${language} code snippet:
    \`\`\`${language}
    ${codeSnippet}
    \`\`\`
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Attempt to parse the AI's response as JSON
    let aiResponseJson;
    try {
      // The model sometimes wraps JSON in markdown code blocks.
      const cleanedText = text.replace(/
```
json\s*|
```
\s*/g, '').trim();
      aiResponseJson = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI raw text response:', text);
      return NextResponse.json(
        { error: 'AI response was not in the expected JSON format.', rawResponse: text },
        { status: 500 }
      );
    }

    // Validate the structure of the AI's JSON response
    if (
      !aiResponseJson ||
      typeof aiResponseJson.analysisSummary !== 'string' ||
      !Array.isArray(aiResponseJson.suggestions) ||
      !Array.isArray(aiResponseJson.potentialIssues)
    ) {
      console.error('AI response JSON has unexpected structure:', aiResponseJson);
      return NextResponse.json(
        { error: 'AI response JSON has unexpected structure.', details: aiResponseJson },
        { status: 500 }
      );
    }


    return NextResponse.json({ success: true, ...aiResponseJson });
  } catch (error) {
    console.error('Error during code analysis:', error);
    return NextResponse.json(
      { error: 'Failed to perform code analysis.', details: (error as Error).message },
      { status: 500 }
    );
  }
}