'use client';

import { UniversalAIChat } from '@/components/universal-ai-chat';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap, Shield, Globe } from 'lucide-react';

export default function AIAssistantPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-12 h-12 text-purple-500" />
            <h1 className="text-4xl font-bold">Universal AI Assistant</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            हर सवाल का जवाब, बिना किसी रोक-टोक के। कुछ भी पूछें! 🚀
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4 text-center space-y-2">
            <Zap className="w-8 h-8 mx-auto text-yellow-500" />
            <h3 className="font-semibold">Instant Answers</h3>
            <p className="text-sm text-muted-foreground">तुरंत जवाब पाएं</p>
          </Card>
          <Card className="p-4 text-center space-y-2">
            <Globe className="w-8 h-8 mx-auto text-blue-500" />
            <h3 className="font-semibold">Any Topic</h3>
            <p className="text-sm text-muted-foreground">कोई भी विषय</p>
          </Card>
          <Card className="p-4 text-center space-y-2">
            <Shield className="w-8 h-8 mx-auto text-green-500" />
            <h3 className="font-semibold">No Restrictions</h3>
            <p className="text-sm text-muted-foreground">कोई पाबंदी नहीं</p>
          </Card>
          <Card className="p-4 text-center space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-purple-500" />
            <h3 className="font-semibold">Smart Context</h3>
            <p className="text-sm text-muted-foreground">समझदार जवाब</p>
          </Card>
        </div>

        <UniversalAIChat />

        <Card className="p-6 space-y-4">
          <h2 className="text-2xl font-bold">Features & Capabilities</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">💬 General Q&A</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>किसी भी topic पर सवाल पूछें</li>
                <li>Detailed और comprehensive answers</li>
                <li>Context-aware conversations</li>
                <li>Follow-up questions support</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">💻 Code Analysis</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Code review और improvements</li>
                <li>Security analysis</li>
                <li>Performance optimization tips</li>
                <li>Best practices recommendations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">🐛 Debugging Help</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Error analysis और solutions</li>
                <li>Root cause identification</li>
                <li>Step-by-step fixes</li>
                <li>Prevention strategies</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">💡 Brainstorming</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Creative ideas generation</li>
                <li>Problem-solving approaches</li>
                <li>Strategic thinking</li>
                <li>Innovation suggestions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">📚 Learning & Explanation</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Concept explanations</li>
                <li>Tutorial-style guidance</li>
                <li>Real-world examples</li>
                <li>Multiple difficulty levels</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">🎯 Problem Solving</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Multiple solution approaches</li>
                <li>Pros and cons analysis</li>
                <li>Implementation guidance</li>
                <li>Risk assessment</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <h2 className="text-2xl font-bold mb-4">Example Questions</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="font-semibold">Technical:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• "React में state management kaise karein?"</li>
                <li>• "API security best practices kya hain?"</li>
                <li>• "Database optimization tips dijiye"</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Creative:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• "Startup ideas for AI in education"</li>
                <li>• "Marketing strategy brainstorm karo"</li>
                <li>• "Product features suggest karo"</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Learning:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• "Machine learning explain karo"</li>
                <li>• "Blockchain technology kya hai?"</li>
                <li>• "Cloud computing basics sikhao"</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Problem Solving:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• "Scalability issues kaise solve karein?"</li>
                <li>• "Team productivity kaise badhayein?"</li>
                <li>• "Cost optimization strategies"</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
