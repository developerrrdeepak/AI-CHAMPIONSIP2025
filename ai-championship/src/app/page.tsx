
'use client';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Briefcase, BrainCircuit, GraduationCap, ChevronRight } from "lucide-react"
import Link from "next/link"
import { HireVisionLogo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { LoginDialog } from "@/components/login-dialog";

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <Card className="bg-card/30 dark:bg-card/60 backdrop-blur-sm text-center p-6 border-white/10 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
        <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                <Icon className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-semibold mb-2">{title}</CardTitle>
            <CardContent className="text-muted-foreground p-0">
                {description}
            </CardContent>
        </div>
    </Card>
  )
}

function LandingHeader() {
    return (
        <header className="sticky top-0 left-0 right-0 z-20 py-4 px-4 sm:px-6 lg:px-8 bg-background/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <HireVisionLogo className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold text-foreground">HireVision</span>
                </Link>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LoginDialog />
                    <div className="hidden sm:flex items-center gap-1">
                        <Separator orientation="vertical" className="h-6 mx-2"/>
                        <Button variant="outline" asChild className="hover:scale-[1.02] transition-all">
                            <Link href="/signup">For Employers <ChevronRight className="w-4 h-4 ml-1" /></Link>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}

const DYNAMIC_WORDS = ["Intelligent", "Efficient", "Collaborative", "Simplified", "Automated"];

export default function HomePage() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentWordIndex((prevIndex) => (prevIndex + 1) % DYNAMIC_WORDS.length);
        setIsFading(false);
      }, 500); // half a second for fade out
    }, 2500); // Change word every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-background text-foreground">
      <LandingHeader />
      <main className="flex flex-col items-center justify-center text-center px-4 overflow-hidden">
          <section id="home" className="max-w-4xl py-24 sm:py-32">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl animate-in fade-in slide-in-from-top-12 duration-1000">
              The Future of Hiring is{" "}
              <span className="relative inline-block text-primary">
                <span className={cn("transition-opacity duration-500", isFading ? "opacity-0" : "opacity-100")}>
                  {DYNAMIC_WORDS[currentWordIndex]}
                </span>
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground animate-in fade-in slide-in-from-top-12 duration-1000 delay-200">
              HireVision is an all-in-one platform that leverages AI to help you find the best talent, streamline your hiring process, and empower candidates to succeed.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-4 animate-in fade-in slide-in-from-top-12 duration-1000 delay-400">
              <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 transition-all hover:scale-[1.02]">
                <Link href="/login">
                    Find Your Next Role
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
          
          <section id="features" className="max-w-7xl w-full py-24 sm:py-32">
            <div className="max-w-2xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    A Platform for Everyone
                </h2>
                <p className="mt-4 text-muted-foreground">Whether you're sourcing talent or looking for your next role, HireVision has you covered.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={Briefcase}
                    title="For Recruiters"
                    description="Source, track, and manage candidates with powerful AI-driven tools that reduce time-to-hire."
                />
                <FeatureCard 
                    icon={BrainCircuit}
                    title="For Hiring Managers"
                    description="Get deep insights into candidate fit, review AI-summarized feedback, and make data-driven decisions."
                />
                <FeatureCard 
                    icon={GraduationCap}
                    title="For Candidates"
                    description="Prepare for interviews with AI coaching, get resume feedback, and find your dream job."
                />
            </div>
          </section>

          <section id="how-it-works" className="max-w-5xl w-full py-24 sm:py-32">
            <div className="max-w-2xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    How It Works
                </h2>
                <p className="mt-4 text-muted-foreground">Get up and running in minutes.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-left">
                <div className="p-6 bg-card/30 dark:bg-card/60 rounded-xl border hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                    <p className="text-lg font-semibold text-foreground mb-2">Step 1: Sign Up</p>
                    <p className="text-muted-foreground">Create your organization's account in seconds. No credit card required to get started.</p>
                </div>
                 <div className="p-6 bg-card/30 dark:bg-card/60 rounded-xl border hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                    <p className="text-lg font-semibold text-foreground mb-2">Step 2: Post a Job</p>
                    <p className="text-muted-foreground">Use our AI assistant to craft the perfect job description and define your ideal candidate.</p>
                </div>
                 <div className="p-6 bg-card/30 dark:bg-card/60 rounded-xl border hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                    <p className="text-lg font-semibold text-foreground mb-2">Step 3: Hire Smart</p>
                    <p className="text-muted-foreground">Watch as AI ranks candidates, summarizes profiles, and helps you make the best hiring decisions.</p>
                </div>
            </div>
          </section>

          <section id="faq" className="max-w-3xl w-full py-24 sm:py-32">
             <div className="max-w-2xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Frequently Asked Questions
                </h2>
            </div>
            <Accordion type="single" collapsible className="w-full text-left">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is there a free trial available?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can sign up for free to explore the core features of HireVision. Our free plan is generous and perfect for small teams.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How does the AI ensure fairness?</AccordionTrigger>
                <AccordionContent>
                  Our AI models are trained to focus on skills, experience, and qualifications, actively ignoring demographic information to reduce unconscious bias in the screening process.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Can I integrate HireVision with my existing HR systems?</AccordionTrigger>
                <AccordionContent>
                  Integrations with popular HRIS and ATS platforms are on our roadmap. Contact us to discuss your specific needs.
                </AccordionContent>
              </AccordionItem>
               <AccordionItem value="item-4">
                <AccordionTrigger>Is my data secure?</AccordionTrigger>
                <AccordionContent>
                  Absolutely. We use industry-leading encryption and security practices to ensure your organization's and candidates' data is always protected.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
      </main>
      <footer className="py-8 text-center text-muted-foreground text-sm border-t">
        <p>&copy; {new Date().getFullYear()} HireVision. All rights reserved.</p>
      </footer>
    </div>
  );
}
