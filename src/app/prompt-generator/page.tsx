'use client';

import { useState } from 'react';
import { Header } from '@/components/app/header';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { runGenerateImagePrompt } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, Wand2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

export default function PromptGeneratorPage() {
  const [idea, setIdea] = useState('');
  const [count, setCount] = useState(10);
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!idea.trim()) {
      toast({ variant: 'destructive', title: 'Idea is empty', description: 'Please enter an idea for your image.' });
      return;
    }
    if (count <= 0) {
      toast({ variant: 'destructive', title: 'Invalid number', description: 'Please enter a number of prompts greater than 0.' });
      return;
    }
    setIsLoading(true);
    setGeneratedPrompts([]);
    const result = await runGenerateImagePrompt(idea, count);
    setIsLoading(false);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
    } else {
      setGeneratedPrompts(result.prompts || []);
      toast({ title: 'Prompts Generated!', description: `${result.prompts?.length || 0} new image prompts are ready.` });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };
  
  const handleDownloadCSV = () => {
    if (generatedPrompts.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Serial,Prompt\r\n"; // Header

    generatedPrompts.forEach((prompt, index) => {
        const serial = index + 1;
        const escapedPrompt = `"${prompt.replace(/"/g, '""')}"`; // Handle quotes
        const row = `${serial},${escapedPrompt}`;
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `halal_prompts_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Download Started!', description: 'Your CSV file is being downloaded.' });
  }

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
              Describe a basic idea, and our AI will craft numerous unique, detailed, and permissible (halal) prompts for your image generation needs.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-24">
          <div className="mx-auto max-w-4xl space-y-8">
            <Card>
              <CardContent className="p-6">
                <div className="grid w-full gap-4">
                  <div>
                    <Label htmlFor="idea-textarea" className="font-medium text-left">
                      Enter a general theme or concept
                    </Label>
                    <Textarea
                      id="idea-textarea"
                      placeholder="e.g., 'Modern technology', 'Minimalist office supplies', 'Abstract textures', or just 'Random objects'"
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      rows={3}
                      className="mt-2 text-base"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                     <Label htmlFor="prompt-count" className="font-medium text-left">
                        Number of prompts to generate
                     </Label>
                    <Input
                        id="prompt-count"
                        type="number"
                        value={count}
                        onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
                        className="mt-2"
                        min="1"
                        max="200"
                        disabled={isLoading}
                    />
                  </div>
                  <Button onClick={handleGenerate} disabled={isLoading} size="lg">
                    <Wand2 className="mr-2 h-5 w-5" />
                    {isLoading ? `Generating ${count} prompts...` : `Generate ${count} Prompts`}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isLoading && (
               <Card>
                 <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Generating your prompts...</h3>
                    <p className="text-sm text-muted-foreground">This may take a moment. Please wait.</p>
                    <div className="space-y-2 pt-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-4/5" />
                    </div>
                 </CardContent>
               </Card>
            )}

            {generatedPrompts.length > 0 && !isLoading && (
              <Card className="border-dashed">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg">Generated Prompts ({generatedPrompts.length})</h3>
                       <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                      </Button>
                    </div>
                    <Separator />
                    <div className="max-h-[500px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead>Prompt</TableHead>
                                    <TableHead className="text-right w-[60px]">Copy</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {generatedPrompts.map((prompt, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell className="font-code text-sm">{prompt}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleCopy(prompt)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
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
