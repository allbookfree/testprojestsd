'use client';

import { useState } from 'react';
import { Header } from '@/components/app/header';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { runGenerateImagePrompt } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Copy, Wand2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PromptGeneratorPage() {
  const [idea, setIdea] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!idea.trim()) {
      toast({ variant: 'destructive', title: 'Idea is empty', description: 'Please enter an idea for your image.' });
      return;
    }
    setIsLoading(true);
    setGeneratedPrompt('');
    const result = await runGenerateImagePrompt(idea);
    setIsLoading(false);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
    } else {
      setGeneratedPrompt(result.prompt || '');
      toast({ title: 'Prompt Generated!', description: 'Your new image prompt is ready.' });
    }
  };

  const handleCopy = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    toast({ title: 'Copied to clipboard!' });
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Halal Image Prompt Generator
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Describe your idea, and our AI will craft a detailed, artistic, and permissible (halal) prompt for your image generation needs.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-24">
          <div className="mx-auto max-w-2xl space-y-8">
            <Card>
              <CardContent className="p-6">
                <div className="grid w-full gap-4">
                  <label htmlFor="idea-textarea" className="font-medium text-left">
                    Enter your image idea
                  </label>
                  <Textarea
                    id="idea-textarea"
                    placeholder="e.g., 'A serene mosque at sunset', 'Abstract Islamic geometric patterns', 'A person reading Quran from behind'"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    rows={4}
                    className="text-base"
                    disabled={isLoading}
                  />
                  <Button onClick={handleGenerate} disabled={isLoading} size="lg">
                    <Wand2 className="mr-2 h-5 w-5" />
                    {isLoading ? 'Generating...' : 'Generate Prompt'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isLoading && (
               <Card>
                 <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Generating...</h3>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                 </CardContent>
               </Card>
            )}

            {generatedPrompt && !isLoading && (
              <Card className="bg-secondary/50 border-dashed">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg">Generated Prompt</h3>
                      <Button variant="ghost" size="icon" onClick={handleCopy}>
                        <Copy className="h-5 w-5" />
                        <span className="sr-only">Copy Prompt</span>
                      </Button>
                    </div>
                    <p className="text-muted-foreground font-code text-base leading-relaxed">
                      {generatedPrompt}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ImageMeta Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
