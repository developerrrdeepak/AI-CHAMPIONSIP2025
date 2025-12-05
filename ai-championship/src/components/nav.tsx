
'use client';

import {
  Briefcase,
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  LineChart,
  Mail,
  List,
  UserCog,
  GraduationCap,
  Trophy,
  BarChart3,
  User,
  MessageSquare,
  Building,
  Zap,
  CreditCard,
  Cloud,
  Bot,
  Mic,
  Brain,
  Rocket,
  Heart,
  Sparkles,
  UserPlus,
  MessageCircle,
  Globe,
  HeartHandshake
} from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarGroup,
} from '@/components/ui/sidebar';
import { useFirebase } from '@/firebase';
import { useUserContext } from '@/app/(app)/layout';

type NavItem = {
    href: string;
    icon: React.ElementType;
    label: string;
    exact?: boolean;
};

type NavSection = {
    items: NavItem[];
};

const navConfig: Record<string, NavSection[]> = {
  'Owner': [
    {
      items: [
        { href: '/founder/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/jobs', icon: Briefcase, label: 'Jobs'}, 
        { href: '/candidates', icon: Users, label: 'Candidates' },
        { href: '/ai-hub', icon: Sparkles, label: 'AI Mentor' },
        { href: '/community', icon: Users, label: 'Community' },
        { href: '/connections', icon: UserPlus, label: 'Connections' },
        { href: '/messages', icon: MessageCircle, label: 'Messages' },
      ],
    },
    {
        items: [
            { href: '/analytics', icon: BarChart3, label: 'Analytics' },
            { href: '/settings', icon: Settings, label: 'Settings' },
        ]
    }
  ],
  'Recruiter': [
    {
      items: [
        { href: '/recruiter/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/jobs', icon: Briefcase, label: 'Jobs'},
        { href: '/candidates', icon: Users, label: 'Candidates' },
        { href: '/ai-hub', icon: Sparkles, label: 'AI Mentor' },
        { href: '/community', icon: Users, label: 'Community' },
        { href: '/connections', icon: UserPlus, label: 'Connections' },
        { href: '/messages', icon: MessageCircle, label: 'Messages' },
      ]
    },
    {
      items: [
        { href: '/settings', icon: Settings, label: 'Settings' },
      ]
    }
  ],
  'Hiring Manager': [
    {
      items: [
        { href: '/hiring-manager/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/jobs', icon: Briefcase, label: 'My Jobs' },
        { href: '/candidates', icon: Users, label: 'Talent Pool' },
        { href: '/interviews', icon: List, label: 'Interviews' },
      ]
    }
  ],
  'Interviewer': [
    {
      items: [
        { href: '/interviews', icon: List, label: 'My Interviews' },
      ]
    }
  ],
  'Candidate': [
    {
        items: [
            { href: '/candidate-portal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { href: '/jobs', icon: Briefcase, label: 'Jobs' },
            { href: '/ai-hub', icon: Sparkles, label: 'AI Mentor' },
            { href: '/challenges', icon: Trophy, label: 'Challenges' },
            { href: '/community', icon: Users, label: 'Community' },
            { href: '/connections', icon: UserPlus, label: 'Connections' },
            { href: '/messages', icon: MessageCircle, label: 'Messages' },
        ]
    },
    {
        items: [
            { href: '/profile/edit', icon: User, label: 'Profile' },
            { href: '/settings', icon: Settings, label: 'Settings' },
        ]
    }
  ],
};


function NavItem({ item }: { item: NavItem }) {
    const pathname = usePathname();
    const { user, role, organizationId } = useUserContext();
    
    const linkHref = `${item.href}?role=${role}`;

    let isActive;
    if (item.exact) {
        isActive = pathname === item.href;
    } else {
        isActive = pathname.startsWith(item.href);
    }
    
    if (item.href === '/settings' && (pathname === '/settings' || pathname.startsWith('/settings/'))) {
        isActive = true;
    }

    if (item.href === '/emails' && (pathname === '/emails' || pathname.startsWith('/emails/'))) {
        isActive = true;
    }

    if (item.href === '/organization') {
        if (!organizationId) return null;
        const orgPath = `/organization/${organizationId}`;
        isActive = pathname === orgPath;
        return (
            <Link href={`${orgPath}?role=${role}`}>
                 <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    variant="ghost"
                >
                    <item.icon className="h-5 w-5" />
                </SidebarMenuButton>
            </Link>
        )
    }



    return (
        <Link href={linkHref}>
            <SidebarMenuButton
                isActive={isActive}
                tooltip={item.label}
                variant="ghost"
            >
                <item.icon className="h-5 w-5" />
            </SidebarMenuButton>
        </Link>
    );
}

export function Nav({ role }: { role: string | null }) {
  const { isUserLoading } = useUserContext();
  
  const navSections = role ? navConfig[role as keyof typeof navConfig] || [] : [];

  if(!role || isUserLoading) {
      return null;
  };

  return (
    <SidebarMenu>
      {navSections.map((section, index) => (
        <SidebarGroup key={index} className={index > 0 ? 'mt-auto' : ''}>
            {section.items.map(item => (
                 <SidebarMenuItem key={item.href}>
                    <NavItem item={item} />
                </SidebarMenuItem>
            ))}
        </SidebarGroup>
      ))}
    </SidebarMenu>
  );
}
