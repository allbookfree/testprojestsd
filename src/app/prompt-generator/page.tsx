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
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useSettings } from '@/hooks/use-settings';

// This is the default system prompt that will be used as a fallback.
const DEFAULT_SYSTEM_PROMPT = `You are an autonomous Halal Stock Image Prompt Generator. Your mission is to create large sets of unique, commercially viable stock image prompts that are 100% halal-safe and feature only non-living subjects.

---
**Core Mission & Persona**
---
Think for yourself like an experienced creative director and stock photographer. The user provides a quantity and an optional starting idea; you are responsible for deciding all the specific subjects, scenes, compositions, and styles to ensure maximum variety and marketability. Your creativity and adherence to the rules are paramount.

---
**Hard Borders (Rules You Must Never Cross)**
---
*   **No Living Beings:** Absolutely no people, body parts (hands, etc.), silhouettes, or shadows that clearly suggest a human or animal form. No animals, insects, or any living creatures.
*   **Halal & Safe Content:** No nudity, romance, violence, horror, or any content that is Islamically doubtful or controversial.
*   **No IP/Branding:** No brands, logos, trademarks, or copyrighted characters.
*   **No Text:** No readable text or individual letters within the image.
*   **No Religious Symbols:** Avoid non-Islamic religious symbols. Islamic calligraphy and patterns are acceptable if used tastefully as art.

---
**Creative Scope (Your World of Subjects)**
---
Your domain is the entire non-living world. Explore it broadly. Examples include:
*   **Objects:** Tools, electronics, hardware, household items, kitchenware, craft supplies, office supplies, medical equipment, sports equipment.
*   **Technology:** Sleek modern tech devices, components, circuit boards, cables, data servers.
*   **Materials:** Textures of wood, metal, stone, fabric, glass, plastic. Sustainable and recycled materials.
*   **Scenes:** Minimalist office workspaces, modern kitchen counters, industrial workshops, science labs, construction sites (all without people).
*   **Abstract:** Geometric patterns, light refractions, liquid splashes, abstract 3D forms.

---
**Artistic Direction**
---
*   **Target Markets:** Constantly think about what a real client would buy for ads, websites, social media, or presentations in sectors like business, technology, healthcare, e-commerce, and manufacturing.
*   **Composition:** Rotate your shots. Use flat lays, hero shots (object centered), macro close-ups, environmental context, isolated plain backgrounds, dramatic angles, minimalist compositions with negative space, and repeating patterns.
*   **Visual Style:** Vary the mood. Mix bright and airy high-key lighting with dramatic low-key scenes. Use warm, inviting tones and cool, clinical color palettes. Alternate between sharp studio lighting and soft, diffused natural light.

---
**Execution & Output Requirements**
---
*   **Handling User Input:** The user will provide an 'idea'. Use this as a general theme or starting point. **Your primary goal is to generate {{{count}}} unique prompts.** If the user's idea is too narrow and will lead to repetition, you MUST branch out to other subjects within your creative scope to ensure variety. Your autonomy is key.
*   **Anti-Repetition:** This is critical. Each prompt must be significantly different from the one before it. Do not just change a color or a single object. Change the subject, the scene, the composition, AND the lighting.
*   **Prompt Format:** Each prompt must be a single, clear English sentence. It should include the subject, context, composition type, lighting, visual style, and quality keywords (e.g., "hyper-detailed," "photorealistic 8K," "professional stock photo").
*   **Output Format:** You must generate a JSON object with a single key "prompts", which contains an array of the generated prompt strings.`;


export default function PromptGeneratorPage() {
  const [idea, setIdea] = useState('random objects');
  const [count, setCount] = useState(10);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [settings] = useSettings();

  const handleGenerate = async () => {
    // If the user clears the system prompt, use the default one.
    const finalSystemPrompt = systemPrompt.trim() === '' ? DEFAULT_SYSTEM_PROMPT : systemPrompt;

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
    const result = await runGenerateImagePrompt(idea, count, finalSystemPrompt, settings);
    setIsLoading(false);

    if ('error' in result) {
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
    <>
      <PageHeader>
        <PageHeaderHeading>Halal Image Prompt Generator</PageHeaderHeading>
        <PageHeaderDescription>
          Describe a basic idea, and our AI will craft unique, detailed, and permissible prompts for your image generation needs.
        </PageHeaderDescription>
      </PageHeader>
      
       <div className="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Create Your Prompts</CardTitle>
            <CardDescription>
              Provide a central theme and let the AI generate a variety of unique prompts for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <Textarea
                placeholder="Describe your basic idea... e.g., 'random objects', 'modern kitchen appliances', 'abstract nature textures'"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={4}
                className="p-4 text-base"
                disabled={isLoading}
              />
              <Accordion type="single" collapsible className="w-full rounded-lg border">
                <AccordionItem value="item-1" className="border-none">
                  <AccordionTrigger className="py-2 px-4 text-base font-semibold">Advanced: Customize Master Prompt</AccordionTrigger>
                  <AccordionContent className="p-4 pt-2">
                    <p className="text-sm text-muted-foreground pb-2">
                      This is the core instruction for the AI. Edit it to change its behavior. If left empty, a powerful default prompt will be used automatically.
                    </p>
                    <Textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={15}
                      className="font-mono text-xs"
                      disabled={isLoading}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 flex flex-col space-y-4 rounded-lg border bg-card p-4 justify-between h-full">
            <div className="space-y-2 text-center">
                <Label htmlFor="prompt-count" className="font-semibold text-lg">Number of Prompts</Label>
                <Input
                id="prompt-count"
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
                min="1"
                max="200"
                disabled={isLoading}
                className="mx-auto h-24 w-48 text-center text-6xl font-bold"
                />
            </div>
            <Button onClick={handleGenerate} disabled={isLoading} size="lg" className="w-full">
                <Wand2 className="mr-2 h-5 w-5" />
                {isLoading ? `Generating ${count} prompts...` : `Generate ${count} Prompts`}
            </Button>
        </div>
      </div>
      
      <div className="mx-auto max-w-6xl mt-6 pb-24">
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
          <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <CardTitle>Generated Prompts ({generatedPrompts.length})</CardTitle>
                    <CardDescription>Click the copy icon or download the full list.</CardDescription>
                </div>
                 <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="self-end sm:self-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </CardHeader>
              <Separator/>
                <div className="max-h-[600px] overflow-y-auto">
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
                                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell className="font-mono text-sm">{prompt}</TableCell>
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
          </Card>
        )}
      </div>
    </>
  );
}
