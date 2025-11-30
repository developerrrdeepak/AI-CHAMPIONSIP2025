
'use client';

import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
} from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import Link from 'next/link';
import { HireVisionLogo } from '@/components/icons';
import type { Organization } from '@/lib/definitions';
import Image from 'next/image';
import { UserNav } from '../user-nav';

interface AppShellProps {
    children: React.ReactNode;
    nav: React.ReactNode;
    homePath: string;
    organization: Organization | null;
}

function AppShellContent({ children, nav, homePath, organization }: AppShellProps) {
    return (
        <>
            <Sidebar>
                <SidebarHeader>
                    <Link
                        href={homePath}
                        className="flex items-center justify-center h-12 w-12"
                    >
                        {organization?.logoUrl ? (
                            <Image src={organization.logoUrl} alt={`${organization.name} Logo`} width={32} height={32} className="rounded-md object-contain" />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <HireVisionLogo className="h-6 w-6" />
                            </div>
                        )}
                    </Link>
                </SidebarHeader>
                
                <SidebarContent>
                  {nav}
                </SidebarContent>

                <SidebarFooter>
                     <UserNav />
                </SidebarFooter>
            </Sidebar>
            
            <div className="flex flex-col h-full w-full sm:pl-16">
                <Header />
                {children}
            </div>
        </>
    );
}

export function AppShell(props: AppShellProps) {
    return (
        <SidebarProvider>
            <AppShellContent {...props} />
        </SidebarProvider>
    );
}
