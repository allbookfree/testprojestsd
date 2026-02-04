'use client';

import { GenerateImageMetadataOutput } from "@/ai/flows/generate-image-metadata";
import { Star, Copy } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "../ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

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
      <div className="space-y-1">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Title</p>
            <ViewDetailsDialog title="Full Title" content={metadata.title} copyText={metadata.title} />
        </div>
        <p className="text-sm font-semibold text-foreground/90 line-clamp-2" title={metadata.title}>
          {metadata.title}
        </p>
      </div>
      
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
