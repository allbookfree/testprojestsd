'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { runGenerateImagePrompt } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, Wand2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSettings } from '@/hooks/use-settings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface GeneratedPrompt {
  prompt: string;
  negativePrompt?: string;
}

export default function PromptGeneratorPage() {
  const [idea, setIdea] = useState('random objects');
  const [count, setCount] = useState(10);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [settings] = useSettings();

  // Simplified controls for the new workflow
  const [imageStyle, setImageStyle] = useState<'photorealistic' | 'vector'>('photorealistic');
  const [generateNegativePrompts, setGenerateNegativePrompts] = useState(true);

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

    const result = await runGenerateImagePrompt(idea, count, settings, {
      imageStyle,
      generateNegativePrompts,
    });

    setIsLoading(false);

    if ('error' in result) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
    } else {
      setGeneratedPrompts(result.prompts || []);
      toast({ title: 'Prompts Generated!', description: `${result.prompts?.length || 0} new image prompts are ready.` });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Copied to clipboard!' });
    }).catch(err => {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy text.' });
    });
  };
  
  const handleDownloadCSV = () => {
    if (generatedPrompts.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,Serial,Prompt,Negative Prompt\r\n";
    generatedPrompts.forEach((p, index) => {
        const serial = index + 1;
        const escapedPrompt = `"${p.prompt.replace(/"/g, '""')}"`;
        const escapedNegativePrompt = p.negativePrompt ? `"${p.negativePrompt.replace(/"/g, '""')}"` : ''
        csvContent += `${serial},${escapedPrompt},${escapedNegativePrompt}\r\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'image-prompts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='flex h-full flex-col'>
      <PageHeader>
        <PageHeaderHeading>Advanced AI Image Prompt Generator</PageHeaderHeading>
        <PageHeaderDescription>
          Leverage a multi-step AI workflow (Research, Creative, Refine) to craft superior, commercially-viable image prompts for your portfolio.
        </PageHeaderDescription>
      </PageHeader>
      <div className='flex-1 overflow-auto p-6'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <div className='flex flex-col gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Start with a core idea and set your desired options.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='idea'>Your Core Idea</Label>
                  <Textarea
                    id='idea'
                    placeholder="e.g., 'futuristic cityscape' or 'minimalist coffee beans'"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    className='min-h-[80px] text-base'
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='count'>Number of Prompts</Label>
                    <Input id='count' type='number' value={count} onChange={(e) => setCount(parseInt(e.target.value, 10))} min='1' max='50' />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='image-style'>Image Style</Label>
                    <Select value={imageStyle} onValueChange={(v: any) => setImageStyle(v)}>
                      <SelectTrigger id='image-style'><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value='photorealistic'>Photorealistic</SelectItem>
                        <SelectItem value='vector'>Vector</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='flex items-center justify-between rounded-lg border p-4'>
                  <Label htmlFor='generate-negative' className='flex flex-col gap-1'>
                    <span>Generate Negative Prompts</span>
                    <span className='text-sm font-normal text-muted-foreground'>Helps avoid common image issues.</span>
                  </Label>
                  <Switch id='generate-negative' checked={generateNegativePrompts} onCheckedChange={setGenerateNegativePrompts} />
                </div>
              </CardContent>
            </Card>
             <div className='flex justify-end'>
                <Button onClick={handleGenerate} disabled={isLoading} className='w-full lg:w-auto'>
                    {isLoading ? <><Wand2 className='mr-2 h-4 w-4 animate-spin' /><span>Generating...</span></> : <><Wand2 className='mr-2 h-4 w-4' /><span>Generate Prompts</span></>}
                </Button>
            </div>
          </div>
          <div className='flex flex-col gap-6'>
            <Card className='flex-1'>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle>Generated Prompts</CardTitle>
                {generatedPrompts.length > 0 && <Button variant='ghost' size='sm' onClick={handleDownloadCSV}><Download className='mr-2 h-4 w-4' />Download CSV</Button>}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className='space-y-4 p-4'>
                    {[...Array(count)].map((_, i) => (
                      <div key={i} className='flex items-start gap-4'>
                         <div className="h-6 w-6 rounded-full bg-muted animate-pulse"></div>
                        <div className='flex-1 space-y-2'>
                          <Skeleton className='h-4 w-3/4' />
                          <Skeleton className='h-4 w-1/2' />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : generatedPrompts.length === 0 ? (
                  <div className='flex h-60 items-center justify-center rounded-lg border-2 border-dashed'>
                    <p className='text-center text-muted-foreground'>Your generated prompts will appear here.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Prompt</TableHead>{generateNegativePrompts && <TableHead>Negative</TableHead>}<TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {generatedPrompts.map((p, index) => (
                        <TableRow key={index}>
                          <TableCell className='w-12 font-medium'>{index + 1}</TableCell>
                          <TableCell>{p.prompt}</TableCell>
                          {generateNegativePrompts && <TableCell className='text-muted-foreground'>{p.negativePrompt}</TableCell>}
                          <TableCell className='text-right'>
                            <Button variant='ghost' size='icon' onClick={() => handleCopy(p.prompt)}><Copy className='h-4 w-4' /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
