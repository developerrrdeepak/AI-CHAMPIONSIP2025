import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Ensure the API key is loaded from environment variables
const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY || ''); // Pass a default empty string if not set

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: Google Gemini API key is missing.' },
      { status: 500 }
    );
  }

  try {
    const { reportContext, reportType } = await req.json();

    if (
      typeof reportContext !== 'string' ||
      reportContext.trim() === '' ||
      typeof reportType !== 'string' ||
      reportType.trim() === ''
    ) {
      return NextResponse.json(
        { error: 'Invalid request: "reportContext" and "reportType" fields are required and must be non-empty strings.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert business analyst, specializing in recruitment and startup operations.
    Your task is to analyze the provided report context and generate a comprehensive, actionable report or summary.
    The report should include key findings, identified trends, potential risks, and clear recommendations.
    Format the output as a Markdown string suitable for display, with clear headings and bullet points.

    Report Type: ${reportType}
    Report Context: ${reportContext}

    Please provide the report in Markdown format.`;

    const result = await model.generateContent(prompt);
    const generatedReport = result.response.text();

    return NextResponse.json({ success: true, report: generatedReport });
  } catch (error) {
    console.error('Error during AI-powered report generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate report.', details: (error as Error).message },
      { status: 500 }
    );
  }
}