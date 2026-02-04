'use client';

import { useRef, useState, type DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface ImageUploaderProps {
  onFilesAdded: (files: File[]) => void;
}

export function ImageUploader({ onFilesAdded }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles && selectedFiles.length > 0) {
      const imageFiles = Array.from(selectedFiles).filter(file =>
        file.type.startsWith('image/')
      );
      if (imageFiles.length > 0) {
        onFilesAdded(imageFiles);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload only image files (e.g., JPG, PNG, WEBP).',
        });
      }
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div
      className={cn(
        'relative flex w-full flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center transition-all duration-300 shadow-sm',
        isDragging && 'border-primary ring-2 ring-primary ring-offset-2 bg-secondary'
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={cn('flex items-center justify-center h-16 w-16 rounded-full bg-secondary text-primary mb-4 transition-colors', isDragging && 'bg-primary/20')}>
        <UploadCloud className={cn('h-8 w-8 text-primary transition-transform', isDragging && 'scale-110')} />
      </div>
      <h3 className="mt-2 text-2xl font-semibold">Click to upload or drag & drop</h3>
      <p className="mt-2 text-sm text-muted-foreground">Supports JPG, PNG, WEBP, and more.</p>
       <Button
        variant="link"
        size="sm"
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-2"
      >
        Browse files
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </div>
  );
}
