'use client';

import { GenerateImageMetadataOutput } from "@/ai/flows/generate-image-metadata";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import { Star, Copy } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";

interface MetadataDisplayProps {
  metadata: GenerateImageMetadataOutput;
}

function CopyWrapper({ label, textToCopy, children }: { label: string, textToCopy: string, children: React.ReactNode }) {
  const { toast } = useToast();

  const onCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: 'Copied to clipboard!',
      description: `${label} has been copied.`,
    });
  };
  
  return (
    <div className="group relative">
      {children}
      <Button variant="ghost" size="icon" onClick={onCopy} className="absolute top-0 right-0 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100">
        <Copy className="h-4 w-4" />
        <span className="sr-only">Copy {label}</span>
      </Button>
    </div>
  )
}

export function MetadataDisplay({ metadata }: MetadataDisplayProps) {
  const renderStars = () => {
    const stars = [];
    const rating = Math.round(metadata.rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-5 w-5 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
        />
      );
    }
    return stars;
  };

  return (
    <>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CopyWrapper label="Title" textToCopy={metadata.title}>
            <CardTitle className="text-lg pr-8">{metadata.title}</CardTitle>
          </CopyWrapper>
          <div className="flex items-center gap-1 flex-shrink-0" title={`Rating: ${metadata.rating} out of 5`}>
            {renderStars()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CopyWrapper label="Description" textToCopy={metadata.description}>
          <p className="text-sm text-muted-foreground pr-8">{metadata.description}</p>
        </CopyWrapper>
        
        <CopyWrapper label="Keywords" textToCopy={metadata.keywords}>
          <div>
            <h4 className="text-sm font-semibold mb-2">Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {metadata.keywords.split(',').map((kw, i) => (
                <Badge variant="secondary" key={`${kw.trim()}-${i}`} className="font-normal">
                  {kw.trim()}
                </Badge>
              ))}
            </div>
          </div>
        </CopyWrapper>
      </CardContent>
    </>
  );
}
