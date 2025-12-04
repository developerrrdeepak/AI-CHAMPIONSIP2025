
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UniversalAIChat } from '@/components/universal-ai-chat';
import { PageHeader } from '@/components/page-header';

export default function AIAssistantPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Universal AI Assistant"
        description="Your unrestricted AI partner for any task or question. Powered by Google Gemini."
      />
      
      <UniversalAIChat />

      <Card>
        <CardHeader>
          <CardTitle>How it Works</CardTitle>
          <CardDescription>
            This AI assistant is designed to be fully comprehensive and helpful, without predefined rejections. Ask anything from coding problems to creative brainstorming.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            <li>Handles any topic, including technical, creative, and general knowledge.</li>
            <li>Maintains conversation history for contextual follow-up questions.</li>
            <li>Provides smart suggestions to guide your conversation.</li>
            <li>Supports multiple modes like code analysis, debugging, and brainstorming.</li>
            <li>Bilingual support for both English and Hindi.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
