'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { runGenerateImageMetadata } from '@/app/actions';
import type { GenerateImageMetadataOutput } from '@/ai/flows/generate-image-metadata';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { MetadataDisplay } from './metadata-display';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { Progress } from '../ui/progress';

interface ImageCardProps {
  file: File;
}

type Status = 'idle' | 'processing' | 'success' | 'error';

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageCard({ file }: ImageCardProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [metadata, setMetadata] = useState<GenerateImageMetadataOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    let progressInterval: NodeJS.Timeout | undefined;

    const processImage = async () => {
      setStatus('processing');
      
      progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 95));
      }, 300);

      try {
        const dataUrl = await fileToDataURL(file);
        const result = await runGenerateImageMetadata(dataUrl);

        clearInterval(progressInterval);
        setProgress(100);

        if ('error' in result) {
          throw new Error(result.error);
        }

        setMetadata(result);
        setStatus('success');
      } catch (e) {
        clearInterval(progressInterval);
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
        setStatus('error');
      }
    };

    processImage();

    return () => {
      URL.revokeObjectURL(objectUrl);
      clearInterval(progressInterval);
    };
  }, [file]);

  const renderContent = () => {
    switch (status) {
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

  return (
    <Card className="overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
      <div className="relative aspect-video">
        {previewUrl && (
          <Image src={previewUrl} alt={file.name} fill className="object-cover" />
        )}
        {status === 'processing' && (
           <div className="absolute bottom-0 w-full">
            <Progress value={progress} className="h-1 rounded-none" />
          </div>
        )}
         {status === 'success' && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary/80 px-2 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            <span>Done</span>
          </div>
        )}
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
