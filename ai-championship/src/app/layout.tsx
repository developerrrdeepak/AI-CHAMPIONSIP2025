
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { PageLoader } from '@/components/page-loader';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'HireVision – AI Recruiting OS',
  description: 'The AI-Powered Operating System for Modern Recruiting Teams.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children:React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-sans antialiased bg-background text-foreground", inter.variable)}>
        <ThemeProvider storageKey="hirevision-theme" defaultTheme="light">
            <FirebaseClientProvider>
                <Suspense fallback={<PageLoader />}>
                    {children}
                </Suspense>
            </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
