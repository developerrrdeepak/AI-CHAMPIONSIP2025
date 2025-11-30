
'use client';

import { Candidate } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { Star, Mail } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { placeholderImages } from '@/lib/placeholder-images';
import Link from "next/link";
import { cn } from "@/lib/utils";

type CandidateHeaderProps = {
    candidate: Candidate;
    hasStarred: boolean;
    onToggleStar: () => void;
    isCandidateViewing: boolean;
};

export function CandidateHeader({ candidate, hasStarred, onToggleStar, isCandidateViewing }: CandidateHeaderProps) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 md:py-6">
        <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
                <AvatarImage src={placeholderImages.find(p => p.id === 'avatar-2')?.imageUrl} data-ai-hint="person face" />
                <AvatarFallback className="text-2xl">{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
                <h1 className="text-2xl font-bold md:text-3xl">{candidate.name}</h1>
                <p className="text-muted-foreground">{candidate.currentRole}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {candidate.location && (
                        <>
                            <span>{candidate.location}</span>
                            <span className="text-xs">&bull;</span>
                        </>
                    )}
                     <a href={`mailto:${candidate.email}`} className="hover:text-primary">{candidate.email}</a>
                </div>
            </div>
        </div>
        {!isCandidateViewing && <div className="flex items-center gap-2">
            <Button variant={hasStarred ? "default" : "outline"} onClick={onToggleStar}>
                <Star className={cn("mr-2 h-4 w-4", hasStarred && "fill-current text-yellow-400")} />
                {hasStarred ? "Starred" : "Star"}
            </Button>
            <Button variant="outline" asChild>
                <Link href={`/emails?candidateId=${candidate.id}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Message
                </Link>
            </Button>
        </div>}
      </div>
    );
}
