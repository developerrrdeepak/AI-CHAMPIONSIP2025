
'use client';
import { Loader2 } from 'lucide-react';
import { HireVisionLogo } from './icons';

export function PageLoader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-[100]">
        <div className="relative flex items-center justify-center h-24 w-24">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <HireVisionLogo className="h-8 w-8" />
                </div>
            </div>
            <Loader2 className="h-24 w-24 animate-spin text-primary/20" />
        </div>
      <p className="mt-4 text-sm text-muted-foreground">Loading HireVision...</p>
    </div>
  );
}
