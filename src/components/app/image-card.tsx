'use client';

import Image from 'next/image';
import type { GenerateImageMetadataOutput } from '@/ai/flows/generate-image-metadata';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { MetadataDisplay } from './metadata-display';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Sparkles, Loader2, Hourglass, X } from 'lucide-react';
import { Button } from '../ui/button';

type FileStatus = 'queued' | 'processing' | 'success' | 'error';

interface ImageCardProps {
  file: File;
  previewUrl: string;
  status: FileStatus;
  metadata?: GenerateImageMetadataOutput;
  error?: string;
  onRemove: (previewUrl: string) => void;
}

export function ImageCard({ file, previewUrl, status, metadata, error, onRemove }: ImageCardProps) {
  const renderContent = () => {
    switch (status) {
      case 'queued':
      case 'processing':
        return (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/4" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </div>
        );
      case 'success':
        return metadata ? <MetadataDisplay metadata={metadata} /> : null;
      case 'error':
        return (
          <CardContent className="flex items-center justify-center h-full p-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Processing Failed</AlertTitle>
              <AlertDescription className="text-xs">
                {error}
              </AlertDescription>
            </Alert>
          </CardContent>
        );
      default:
        return null;
    }
  };

  const renderOverlay = () => {
    switch(status) {
        case 'processing':
            return (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
            );
        case 'queued':
            return (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Hourglass className="h-8 w-8 text-white" />
                </div>
            );
        case 'success':
            return (
                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
                    <Sparkles className="h-3 w-3" />
                    <span>Done</span>
                </div>
            );
        default:
            return null;
    }
  }

  return (
    <Card className="overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 group/card">
      <div className="relative aspect-video">
        {previewUrl && (
          <Image src={previewUrl} alt={file.name} fill className="object-cover" />
        )}
        {renderOverlay()}
        <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
            onClick={() => onRemove(previewUrl)}
            title="Remove image"
        >
            <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        {renderContent()}
      </div>

       <CardFooter className="bg-secondary/50 p-3 mt-auto">
         <p className="truncate text-xs text-muted-foreground w-full" title={file.name}>{file.name}</p>
       </CardFooter>
    </Card>
  );
}
