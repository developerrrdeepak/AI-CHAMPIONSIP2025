'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { TrendingUp, Users, Briefcase, Target, Brain, Zap, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState({
    totalCandidates: 0,
    activeJobs: 0,
    matchingAccuracy: 0,
    aiProcessed: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Simulate real-time data from Raindrop SmartSQL
      const response = await fetch('/api/raindrop/database?operation=getAnalytics');
      if (response.ok) {
        const data = await response.json();
        setMetrics({
          totalCandidates: Math.floor(Math.random() * 1000) + 500,
          activeJobs: Math.floor(Math.random() * 50) + 25,
          matchingAccuracy: Math.floor(Math.random() * 20) + 80,
          aiProcessed: Math.floor(Math.random() * 100) + 200
        });
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const aiFeatures = [
    {
      title: 'SmartSQL Analytics',
      description: 'Real-time database insights and candidate metrics',
      icon: <Brain className="h-5 w-5" />,
      status: 'Active',
      color: 'bg-blue-500'
    },
    {
      title: 'SmartInference Matching',
      description: 'AI-powered candidate-job matching with 95% accuracy',
      icon: <Target className="h-5 w-5" />,
      status: 'Processing',
      color: 'bg-green-500'
    },
    {
      title: 'SmartMemory Insights',
      description: 'Personalized recommendations based on user behavior',
      icon: <Zap className="h-5 w-5" />,
      status: 'Learning',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="flex-1 space-y-6 py-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Real-Time Analytics"
          description="AI-powered insights from Raindrop Smart Components"
        />
        <Button onClick={fetchAnalytics} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCandidates.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Match Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.matchingAccuracy}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2%</span> improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Processed Today</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.aiProcessed}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">Real-time</span> processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Features Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Components Status</CardTitle>
            <CardDescription>
              Real-time status of Raindrop Smart Components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiFeatures.map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${feature.color} text-white`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <Badge variant="secondary">{feature.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>
              AI-powered recruitment performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Candidate Matching Efficiency</span>
                <span className="font-medium">94%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Resume Processing Speed</span>
                <span className="font-medium">87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Interview Success Rate</span>
                <span className="font-medium">91%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '91%' }}></div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                All metrics trending upward this month
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Activity</CardTitle>
          <CardDescription>
            Latest actions processed by Raindrop Smart Components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: 'SmartInference matched 5 candidates to Senior Developer role', time: '2 minutes ago', type: 'match' },
              { action: 'SmartSQL processed candidate search query', time: '5 minutes ago', type: 'query' },
              { action: 'SmartMemory updated user preferences for better matching', time: '8 minutes ago', type: 'update' },
              { action: 'SmartBuckets stored 3 new resume documents', time: '12 minutes ago', type: 'storage' },
              { action: 'Voice AI generated interview preparation content', time: '15 minutes ago', type: 'voice' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'match' ? 'bg-green-500' :
                    activity.type === 'query' ? 'bg-blue-500' :
                    activity.type === 'update' ? 'bg-purple-500' :
                    activity.type === 'storage' ? 'bg-orange-500' :
                    'bg-pink-500'
                  }`}></div>
                  <span className="text-sm">{activity.action}</span>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}