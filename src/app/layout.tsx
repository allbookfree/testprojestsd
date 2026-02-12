import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';

const fontSans = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'ImageMeta Pro | AI-Powered SEO & Prompting',
  description: 'Instantly generate SEO-optimized titles, descriptions, keywords and creative prompts for your images with the power of AI. Save time and improve your creative workflow.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head />
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable, fontMono.variable)}>
        <Header />
        <div className="main-container">
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
