'use client';

import Image from 'next/image';
import type { GenerateImageMetadataOutput } from '@/ai/flows/generate-image-metadata';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { MetadataDisplay } from './metadata-display';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Sparkles, Loader2, Hourglass } from 'lucide-react';

type FileStatus = 'queued' | 'processing' | 'success' | 'error';

interface ImageCardProps {
  file: File;
  previewUrl: string;
  status: FileStatus;
  metadata?: GenerateImageMetadataOutput;
  error?: string;
}

export function ImageCard({ file, previewUrl, status, metadata, error }: ImageCardProps) {
  const renderContent = () => {
    switch (status) {
      case 'queued':
      case 'processing':
        return (
          <>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-5/6 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-8 w-full" />
               <Skeleton className="h-4 w-1/4 mt-4 mb-2" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardContent>
          </>
        );
      case 'success':
        return metadata ? <MetadataDisplay metadata={metadata} /> : null;
      case 'error':
        return (
          <CardContent>
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
    <Card className="overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
      <div className="relative aspect-video">
        {previewUrl && (
          <Image src={previewUrl} alt={file.name} fill className="object-cover" />
        )}
        {renderOverlay()}
      </div>
      <div className="flex-grow">
        {renderContent()}
      </div>
       <CardFooter className="bg-secondary p-3">
         <p className="truncate text-xs text-muted-foreground w-full" title={file.name}>{file.name}</p>
       </CardFooter>
    </Card>
  );
}
