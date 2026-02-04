'use client';

import { useRef, useState, type DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onFilesAdded: (files: File[]) => void;
}

export function ImageUploader({ onFilesAdded }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const imageFiles = Array.from(selectedFiles).filter(file =>
        file.type.startsWith('image/')
      );
      if (imageFiles.length > 0) {
        onFilesAdded(imageFiles);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload only image files (e.g., JPG, PNG).',
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
        'relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-12 text-center transition-all duration-300',
        isDragging && 'border-primary bg-secondary'
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <UploadCloud className={cn('h-12 w-12 text-muted-foreground transition-transform', isDragging && 'scale-110 text-primary')} />
      <h3 className="mt-4 text-xl font-semibold">Drag & drop images here</h3>
      <p className="mt-1 text-muted-foreground">or</p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
      >
        Click to browse
      </button>
      <p className="mt-2 text-xs text-muted-foreground">Supports: JPG, PNG, WEBP, etc.</p>
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
