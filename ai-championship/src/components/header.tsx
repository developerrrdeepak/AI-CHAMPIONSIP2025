
import { ThemeToggle } from "@/components/theme-toggle";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Notifications } from "./notifications";
import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="sm:hidden" />
        <Breadcrumbs />
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ai-assistant">
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">AI Chat</span>
          </Link>
        </Button>
        <ThemeToggle />
        <Notifications />
      </div>
    </header>
  );
}
