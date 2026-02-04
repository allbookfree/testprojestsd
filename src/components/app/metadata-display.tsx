'use client';

import { GenerateImageMetadataOutput } from "@/ai/flows/generate-image-metadata";
import { Star, Copy } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

// Helper for the 'Copy' button with a toast notification
function CopyableField({ label, textToCopy, children, className }: { label:string, textToCopy: string, children: React.ReactNode, className?: string }) {
  const { toast } = useToast();

  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: 'Copied to clipboard!',
      description: `${label} has been copied.`,
    });
  };
  
  return (
    <div className={cn("group relative", className)}>
      {children}
      <Button variant="ghost" size="icon" onClick={onCopy} className="absolute top-0 right-0 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100">
        <Copy className="h-3.5 w-3.5" />
        <span className="sr-only">Copy {label}</span>
      </Button>
    </div>
  )
}

// Helper for the 'View All' dialog
function ViewDetailsDialog({ title, content, copyText }: { title: string, content: React.ReactNode, copyText: string }) {
    const { toast } = useToast();

    const onCopy = () => {
        navigator.clipboard.writeText(copyText);
        toast({
          title: 'Copied to clipboard!',
          description: `${title} has been copied.`,
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 rounded-md px-2 text-xs font-medium">
                    View All
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-12 sm:pr-16">
                        <DialogTitle>{title}</DialogTitle>
                        <Button variant="outline" size="sm" onClick={onCopy}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                        </Button>
                    </div>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto pr-4 text-sm">
                  {typeof content === 'string' ? <p className="leading-relaxed">{content}</p> : content}
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface MetadataDisplayProps {
  metadata: GenerateImageMetadataOutput;
}

export function MetadataDisplay({ metadata }: MetadataDisplayProps) {
  const renderStars = () => {
    const stars = [];
    const rating = Math.round(metadata.rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-5 w-5 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <CopyableField label="Title" textToCopy={metadata.title}>
        <h3 className="font-semibold pr-8 text-base leading-tight line-clamp-2" title={metadata.title}>
          {metadata.title}
        </h3>
      </CopyableField>
      
      <div className="flex items-center justify-between" title={`Rating: ${metadata.rating} out of 5`}>
        <p className="text-sm font-medium text-muted-foreground">Rating</p>
        <div className="flex items-center gap-1">
          {renderStars()}
        </div>
      </div>

      <Separator />

      <div className="space-y-1">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <ViewDetailsDialog title="Full Description" content={metadata.description} copyText={metadata.description} />
        </div>
        <p className="text-sm text-foreground/80 line-clamp-3" title={metadata.description}>
          {metadata.description}
        </p>
      </div>
      
      <div className="space-y-2 flex-grow flex flex-col min-h-0">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Keywords</p>
            <ViewDetailsDialog 
                title="All Keywords" 
                copyText={metadata.keywords}
                content={
                    <div className="flex flex-wrap gap-2">
                        {metadata.keywords.split(',').map((kw, i) => (
                            <Badge variant="secondary" key={`${kw.trim()}-${i}`} className="font-normal">
                                {kw.trim()}
                            </Badge>
                        ))}
                    </div>
                } 
            />
        </div>
        <div className="overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-2">
            {metadata.keywords.split(',').slice(0, 15).map((kw, i) => (
                <Badge variant="secondary" key={`${kw.trim()}-${i}`} className="font-normal">
                {kw.trim()}
                </Badge>
            ))}
            {metadata.keywords.split(',').length > 15 && (
                <Badge variant="outline" className="font-medium">... and more</Badge>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}
