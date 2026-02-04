'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Image, Settings, Sparkles } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { SettingsDialog } from './settings-dialog';
import { Button } from '../ui/button';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-3">
            <Icons.logo className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight">
              ImageMeta Pro
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip={{ children: 'Metadata Generator' }}
              >
                <Link href="/">
                  <Image />
                  <span>Metadata Generator</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/prompt-generator'}
                tooltip={{ children: 'Prompt Generator' }}
              >
                <Link href="/prompt-generator">
                  <Sparkles />
                  <span>Prompt Generator</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-2">
          <SettingsDialog>
             <Button variant="ghost" className="w-full justify-start gap-2 p-2 text-sm">
                <Settings />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
             </Button>
          </SettingsDialog>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
