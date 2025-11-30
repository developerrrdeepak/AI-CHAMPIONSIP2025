
'use client';

import { useMemo } from 'react';
import { Candidate, Experience, Education, Link as LinkType } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, Link as LinkIcon, AlertTriangle, ShieldCheck } from "lucide-react";

type AIProfile = {
    summary: string;
    skills: string[];
    strengths: string[];
    risks: string[];
}

function ExperienceCard({ experience }: { experience?: Experience[] }) {
    if (!experience || experience.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Experience</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No experience listed.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader><CardTitle>Experience</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                {experience.map((exp, i) => (
                    <div key={i} className="flex gap-4">
                        <Briefcase className="h-6 w-6 text-muted-foreground mt-1 shrink-0" />
                        <div>
                            <h4 className="font-semibold">{exp.title}</h4>
                            <p className="text-sm">{exp.company}</p>
                            <p className="text-xs text-muted-foreground">{exp.startDate} - {exp.endDate || 'Present'}</p>
                            {exp.description && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{exp.description}</p>}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function EducationCard({ education }: { education?: Education[] }) {
     if (!education || education.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Education</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No education listed.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
         <Card>
            <CardHeader><CardTitle>Education</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {education.map((edu, i) => (
                    <div key={i} className="flex gap-4">
                        <GraduationCap className="h-6 w-6 text-muted-foreground mt-1 shrink-0" />
                        <div>
                            <h4 className="font-semibold">{edu.institution}</h4>
                            <p className="text-sm">{edu.degree}, {edu.fieldOfStudy}</p>
                            <p className="text-xs text-muted-foreground">{edu.startYear} - {edu.endYear}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
         </Card>
    );
}

function SkillsCard({ skills }: { skills?: string[] }) {
    if (!skills || skills.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No skills parsed.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                {skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
            </CardContent>
        </Card>
    );
}

function LinksCard({ links }: { links?: LinkType[] }) {
    if (!links || links.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Links</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No links provided.</p>
                </CardContent>
            </Card>
        );
    }
    return (
        <Card>
            <CardHeader><CardTitle>Links</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {links.map(link => (
                    <a href={link.url} key={link.name} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline truncate">
                        <LinkIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{link.name}</span>
                    </a>
                ))}
            </CardContent>
        </Card>
    );
}

function AIAnalysisCard({ aiProfile }: { aiProfile: AIProfile | null }) {
    if (!aiProfile) {
        return null;
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold text-sm mb-2">Strengths</h4>
                    <ul className="space-y-1">
                        {aiProfile.strengths.map((strength, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500"/>
                                <span>{strength}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold text-sm mb-2">Risks / Red Flags</h4>
                    <ul className="space-y-1">
                        {aiProfile.risks.map((risk, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500"/>
                                <span>{risk}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}

export function CandidateOverviewTab({ candidate }: { candidate: Candidate }) {
    
    const aiProfile = useMemo(() => {
        if (!candidate.aiProfileJson) return null;
        try {
            return JSON.parse(candidate.aiProfileJson) as AIProfile;
        } catch (e) {
            console.error("Failed to parse AI profile JSON", e);
            return null;
        }
    }, [candidate.aiProfileJson]);

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">{aiProfile?.summary || candidate.summary || "No summary available. Add resume text to generate one."}</p>
                    </CardContent>
                </Card>
                <ExperienceCard experience={candidate.experience} />
                <EducationCard education={candidate.education} />
            </div>
            <div className="space-y-6">
                <AIAnalysisCard aiProfile={aiProfile} />
                <SkillsCard skills={aiProfile?.skills || candidate.skills} />
                <LinksCard links={candidate.links} />
            </div>
        </div>
    );
}
