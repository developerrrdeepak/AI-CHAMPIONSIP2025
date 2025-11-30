
'use client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { placeholderImages } from "@/lib/placeholder-images";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { useUserContext } from "@/app/(app)/layout";

export function UserNav() {
  const { auth } = useFirebase();
  const { user } = useUserContext();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
        try {
            await signOut(auth);
            localStorage.clear();
            await fetch('/api/auth/logout');
            router.push('/login');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    } else {
        localStorage.clear();
        await fetch('/api/auth/logout');
        router.push('/login');
    }
  };
  
  if (!user) {
    return (
        <Button variant="outline" onClick={() => router.push('/login')}>
            Login
        </Button>
    )
  };

  const userInitial = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl || placeholderImages.find(p => p.id === 'avatar-1')?.imageUrl} alt={user.displayName || 'User'} data-ai-hint="person face" />
                        <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                    </p>
                </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
  )
}
