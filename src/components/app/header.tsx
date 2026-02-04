'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { SettingsDialog } from "./settings-dialog";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <Icons.logo className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground hidden sm:block">ImageMeta Pro</h1>
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
             <Link href="/" className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === '/' ? 'text-primary' : 'text-muted-foreground')}>
                Metadata Generator
            </Link>
            <Link href="/prompt-generator" className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === '/prompt-generator' ? 'text-primary' : 'text-muted-foreground')}>
                Prompt Generator
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
            <SettingsDialog />
        </div>
      </div>
    </header>
  );
}
